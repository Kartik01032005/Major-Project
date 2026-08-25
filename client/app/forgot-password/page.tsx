"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiArrowLeft, FiCheckCircle, FiActivity } from "react-icons/fi";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { authService } from "@/services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    setEmailError("");
    setGeneralError("");
    if (!email) {
      setEmailError("Email address is required.");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setGeneralError("");
    try {
      const res = await authService.forgotPassword(email);
      if (res.success) {
        if (res.data?.resetUrl) {
          setDevResetUrl(res.data.resetUrl);
        }
        setSubmitted(true);
      } else {
        setGeneralError(res.message || "Failed to process password reset request.");
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setGeneralError(errorObj?.response?.data?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        <Card padding="lg" className="w-full">
          <AnimatePresence mode="wait">
            {!submitted ? (
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
                    Reset your password
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    We&apos;ll email you instructions to reset your password
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
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={emailError}
                    placeholder="name@example.com"
                    leftIcon={<FiMail size={16} />}
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
                    Send reset link
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
                  Check your inbox
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                  If an account exists for <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>,
                  we have sent password reset instructions with your reset link.
                </p>

                {devResetUrl && (
                  <div className="mt-5 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-left">
                    <p className="text-xs font-bold text-blue-900 dark:text-blue-200 mb-1">
                      🛠️ Development Quick Link:
                    </p>
                    <Link
                      href={devResetUrl}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 underline break-all font-mono"
                    >
                      {devResetUrl}
                    </Link>
                  </div>
                )}

                <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    <FiArrowLeft size={13} />
                    Return to sign in
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}
