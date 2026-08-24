"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { useTranslation } from "@/context";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Animated Drop / Pulse Graphic */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center animate-pulse">
            <svg
              className="w-12 h-12 text-red-600 dark:text-red-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs shadow-md">
            404
          </span>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t("notfound_title")}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            {t("notfound_description")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button href="/" variant="primary" size="md" fullWidth className="sm:w-auto">
            {t("notfound_home")}
          </Button>
          <Button href="/dashboard" variant="outline" size="md" fullWidth className="sm:w-auto">
            {t("notfound_dashboard")}
          </Button>
        </div>

        {/* Brand Footer */}
        <p className="text-xs text-slate-400 dark:text-slate-600 pt-4">
          BloodLink &bull; Smart Blood Donor Finder
        </p>
      </div>
    </div>
  );
}
