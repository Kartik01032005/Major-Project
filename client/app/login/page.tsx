"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiEye, FiEyeOff, FiActivity, FiUser } from "react-icons/fi";
import { FaHospital, FaClinicMedical } from "react-icons/fa";
import { useAuth, useTranslation, useToast } from "@/context";
import { UserRole } from "@/types";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

function LoginFormContent() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialRoleParam = searchParams.get("role");
  const getInitialRole = (): "USER" | "BLOOD_BANK" | "HOSPITAL" => {
    if (!initialRoleParam) return "USER";
    const upper = initialRoleParam.toUpperCase();
    if (upper === "BLOOD_BANK" || upper === "ADMIN") return "BLOOD_BANK";
    if (upper === "HOSPITAL") return "HOSPITAL";
    return "USER";
  };

  // Selected Role tab for Portal Context
  const [selectedRole, setSelectedRole] = useState<"USER" | "BLOOD_BANK" | "HOSPITAL">(getInitialRole());

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Field validation states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const validate = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    if (!email) {
      setEmailError(t("login_err_email_required"));
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError(t("login_err_email_invalid"));
      isValid = false;
    }

    if (!password) {
      setPasswordError(t("login_err_password_required"));
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError(t("login_err_password_length"));
      isValid = false;
    }

    return isValid;
  };

  const getDestinationRoute = (user: { role?: UserRole; approvalStatus?: string }) => {
    const roleUpper = (user.role || "").toUpperCase();
    if (roleUpper === "BLOOD_BANK" || user.role === "admin") {
      return "/dashboard/admin";
    }
    if (roleUpper === "HOSPITAL") {
      return "/dashboard/hospital";
    }
    return "/dashboard";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await login(email, password, selectedRole);
      if (response.success && response.data) {
        toast.success("Welcome back! Logged in successfully.");
        const dest = getDestinationRoute(response.data.user);
        router.push(dest);
      } else {
        setGeneralError(response.message);
        toast.error(response.message || "Invalid email or password.");
      }
    } catch {
      setGeneralError(t("login_err_generic"));
      toast.error("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="lg" className="w-full">
      {/* Header/Logo */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 text-red-600 mb-4">
          <FiActivity size={22} className="animate-heartbeat" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t("login_title")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {selectedRole === "HOSPITAL"
            ? "Sign in to access the Hospital Partner Portal"
            : selectedRole === "BLOOD_BANK"
            ? "Sign in to access Blood Bank Inventory & Operations"
            : t("login_subtitle")}
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div
        className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-6 border border-slate-200/50 dark:border-slate-800"
        role="tablist"
        aria-label="Account Role Selector"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedRole === "USER"}
          onClick={() => {
            setSelectedRole("USER");
            setGeneralError("");
          }}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            selectedRole === "USER"
              ? "bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FiUser size={13} />
          <span>User</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={selectedRole === "BLOOD_BANK"}
          onClick={() => {
            setSelectedRole("BLOOD_BANK");
            setGeneralError("");
          }}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            selectedRole === "BLOOD_BANK"
              ? "bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FaClinicMedical size={12} />
          <span>Blood Bank</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={selectedRole === "HOSPITAL"}
          onClick={() => {
            setSelectedRole("HOSPITAL");
            setGeneralError("");
          }}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            selectedRole === "HOSPITAL"
              ? "bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FaHospital size={12} />
          <span>Hospital</span>
        </button>
      </div>

      {/* Error Alert Box */}
      {generalError && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 text-xs font-medium text-red-700 dark:text-red-400">
          {generalError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label={
            selectedRole === "HOSPITAL"
              ? "Official Hospital Email"
              : selectedRole === "BLOOD_BANK"
              ? "Blood Bank Official Email"
              : t("login_email")
          }
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          placeholder={
            selectedRole === "HOSPITAL"
              ? "hospital.admin@hospital.org"
              : selectedRole === "BLOOD_BANK"
              ? "bloodbank@bloodlink.org"
              : t("login_email_placeholder")
          }
          leftIcon={<FiMail size={16} />}
          required
        />

        <div className="relative">
          <Input
            label={t("login_password")}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            placeholder={t("login_password_placeholder")}
            leftIcon={<FiLock size={16} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none"
                aria-label={showPassword ? t("login_hide_password") : t("login_show_password")}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            }
            required
          />
        </div>

        {/* Forgot password link */}
        <div className="flex items-center justify-end text-xs">
          <Link
            href="/forgot-password"
            className="font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          >
            {t("login_forgot")}
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          fullWidth
          className="mt-6"
        >
          {selectedRole === "HOSPITAL"
            ? "Sign in to Hospital Portal"
            : selectedRole === "BLOOD_BANK"
            ? "Sign in to Blood Bank Portal"
            : t("login_submit")}
        </Button>
      </form>

      {/* Footer link */}
      <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        {t("login_no_account")}{" "}
        <Link
          href={`/register?role=${selectedRole.toLowerCase()}`}
          className="font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
        >
          {t("login_register_link")}
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
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
        className="w-full max-w-md relative z-10"
      >
        <Suspense fallback={<Card padding="lg" className="w-full h-96 animate-pulse"><div /></Card>}>
          <LoginFormContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
