"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff,
  FiMapPin, FiActivity, FiUserCheck, FiHeart
} from "react-icons/fi";
import { useAuth } from "@/context";
import { UserRole } from "@/types";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

function RegisterFormContent() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role");

  // Active role tab ("user" = Individual Donor, "admin" = Blood Bank / Admin)
  const [role, setRole] = useState<UserRole>(
    initialRole === "admin" || initialRole === "user" ? initialRole : "user"
  );

  // Form Field States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Admin-specific fields
  const [organizationName, setOrganizationName] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");

  // Loading/Error states
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    let isValid = true;

    if (!name) {
      tempErrors.name = role === "user" ? "Full name is required." : "Contact person name is required.";
      isValid = false;
    }

    if (role === "admin" && !organizationName) {
      tempErrors.organizationName = "Hospital or Blood Bank name is required.";
      isValid = false;
    }

    if (!email) {
      tempErrors.email = "Email address is required.";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = "Please enter a valid email address.";
      isValid = false;
    }

    if (!phone) {
      tempErrors.phone = "Phone number is required.";
      isValid = false;
    } else if (!/^\d{10}$/.test(phone)) {
      tempErrors.phone = "Please enter a valid 10-digit phone number.";
      isValid = false;
    }

    if (!password) {
      tempErrors.password = "Password is required.";
      isValid = false;
    } else if (password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters.";
      isValid = false;
    }

    if (!state) {
      tempErrors.state = "State is required.";
      isValid = false;
    }
    if (!district) {
      tempErrors.district = "District is required.";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name,
        ...(role === "admin" && { organizationName }),
        email,
        phone,
        password,
        role,
        location: {
          state,
          district,
          latitude: 12.305, // Default mock locations
          longitude: 76.645,
        }
      };

      const response = await register(payload);
      if (response.success) {
        // Automatically redirects to home or dashboard after signup in context
        router.push("/");
      } else {
        setGeneralError(response.message);
      }
    } catch {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="lg" className="w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 text-red-600 mb-4">
          <FiActivity size={22} className="animate-heartbeat" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Join our network to donate or request blood in real time
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-6 border border-slate-200/50 dark:border-slate-800">
        <button
          type="button"
          onClick={() => { setRole("user"); setErrors({}); setGeneralError(""); }}
          className={[
            "flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all",
            role === "user"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          ].join(" ")}
        >
          <FiUser size={13} />
          Individual Donor
        </button>
        <button
          type="button"
          onClick={() => { setRole("admin"); setErrors({}); setGeneralError(""); }}
          className={[
            "flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all",
            role === "admin"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          ].join(" ")}
        >
          <FiUserCheck size={13} />
          Blood Bank / Admin
        </button>
      </div>

      {/* General Error */}
      {generalError && (
        <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 text-xs font-medium text-red-700 dark:text-red-400">
          {generalError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AnimatePresence mode="wait">
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {role === "user" ? (
              // Individual fields
              <>
                <Input
                  label="Full name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                  placeholder="John Doe"
                  leftIcon={<FiUser size={16} />}
                  required
                />
              </>
            ) : (
              // Admin/Hospital fields
              <>
                <Input
                  label="Blood Bank / Hospital name"
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  error={errors.organizationName}
                  placeholder="City General Blood Bank"
                  leftIcon={<FiHeart size={16} />}
                  required
                />
                <Input
                  label="Contact person name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                  placeholder="Dr. Sarah Johnson"
                  leftIcon={<FiUser size={16} />}
                  required
                />
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="name@example.com"
                leftIcon={<FiMail size={16} />}
                required
              />
              <Input
                label="Phone number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
                placeholder="10-digit number"
                leftIcon={<FiPhone size={16} />}
                required
              />
            </div>

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="••••••••"
              leftIcon={<FiLock size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              }
              required
            />

            {/* Address fields for both */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="State"
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                error={errors.state}
                placeholder="Karnataka"
                leftIcon={<FiMapPin size={16} />}
                required
              />
              <Input
                label="District"
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                error={errors.district}
                placeholder="Mysore"
                leftIcon={<FiMapPin size={16} />}
                required
              />
            </div>
          </motion.div>
        </AnimatePresence>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          fullWidth
          className="mt-6"
        >
          Create account
        </Button>
      </form>

      {/* Footer Link */}
      <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </Card>
  );
}

// Fallback loader for search param parsing
const FormLoader = () => (
  <div className="flex flex-col items-center justify-center p-12">
    <div className="w-10 h-10 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
  </div>
);

export default function RegisterPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white dark:from-slate-950 dark:via-transparent dark:to-slate-950 pointer-events-none" />

      {/* Decorative gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-red-500/5 blur-3xl pointer-events-none" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="w-full max-w-xl relative z-10"
      >
        <Suspense fallback={<FormLoader />}>
          <RegisterFormContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
