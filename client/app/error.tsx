"use client";

import React, { useEffect } from "react";
import Button from "@/components/ui/Button";
import { useTranslation } from "@/context";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const { t } = useTranslation();

  useEffect(() => {
    // Log exception for telemetry / diagnostics
    console.error("Unhandled Application Exception:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
        {/* Error Warning Badge */}
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-amber-600 dark:text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t("error_title")}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            {t("error_description")}
          </p>
          {error?.message && (
            <p className="mt-2 text-xs font-mono bg-slate-100 dark:bg-slate-950 p-2.5 rounded-lg text-slate-700 dark:text-slate-300 break-words text-left">
              {error.message}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button onClick={() => reset()} variant="primary" size="md" fullWidth className="sm:w-auto">
            {t("error_retry")}
          </Button>
          <Button href="/" variant="outline" size="md" fullWidth className="sm:w-auto">
            {t("error_home")}
          </Button>
        </div>
      </div>
    </div>
  );
}
