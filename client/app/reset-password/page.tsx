"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiLock, FiEye, FiEyeOff, FiCheckCircle, FiAlertTriangle, FiArrowLeft, FiActivity } from "react-icons/fi";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { authService } from "@/services/authService";

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs: { password?: string; confirmPassword?: string } = {};
    let isValid = true;

    if (!password) {
      errs.password = "Password is required.";
      isValid = false;
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters long.";
      isValid = false;
    }

    if (!confirmPassword) {
      errs.confirmPassword = "Please confirm your password.";
      isValid = false;
    } else if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
      isValid = false;
    }

    setErrors(errs);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!token) {
      setGeneralError("Reset token is missing. Please request a new password reset link.");
      return;
    }

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await authService.resetPassword(token, password);
      if (res.success) {
        setSuccess(true);
      } else {
        setGeneralError(res.message || "Failed to reset password.");
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setGeneralError(errorObj?.response?.data?.message || "Invalid or expired password reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Card padding="lg" className="w-full text-center py-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 text-amber-600 mb-4">
          <FiAlertTriangle size={24} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Invalid Reset Link
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          This password reset link is missing a security token or is invalid.
        </p>
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          >
            Request a new reset link &rarr;
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="w-full">
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 text-red-600 mb-4">
                <FiActivity size={22} className="animate-heartbeat" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Set new password
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Your new password must be at least 6 characters long
              </p>
            </div>

            {/* General Error Banner */}
            {generalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 text-xs font-medium text-red-700 dark:text-red-400">
                {generalError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="New password"
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

              <Input
                label="Confirm new password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                placeholder="••••••••"
                leftIcon={<FiLock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                }
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                fullWidth
                className="mt-6"
              >
                Reset password
              </Button>
            </form>

            {/* Back to sign in */}
            <div className="text-center mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
              >
                <FiArrowLeft size={13} />
                Back to sign in
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="text-center py-4"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 mb-4">
              <FiCheckCircle size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Password reset successful!
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Your password has been changed successfully. You can now sign in with your new credentials.
            </p>

            <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => router.push("/login")}
              >
                Proceed to Sign In
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

const ResetPasswordLoader = () => (
  <div className="flex flex-col items-center justify-center p-12">
    <div className="w-10 h-10 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
  </div>
);

export default function ResetPasswordPage() {
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
        <Suspense fallback={<ResetPasswordLoader />}>
          <ResetPasswordFormContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
