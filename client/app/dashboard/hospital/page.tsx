"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";
import HospitalVerificationQueue from "@/components/dashboard/hospital/HospitalVerificationQueue";

export default function HospitalDashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredRole="HOSPITAL">
      <div
        className="max-w-7xl mx-auto space-y-6 pb-8"
        role="region"
        aria-label="Hospital Certificate Verification Dashboard"
      >
        {/* Certificate Verification Queue as the primary, focused view */}
        <HospitalVerificationQueue />

        {/* Minimal Secondary Links */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-400">
            {user?.organizationName || user?.name || "Hospital Partner"} — Official Portal
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/requests"
              className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium inline-flex items-center gap-1"
            >
              <span>Emergency Requests</span>
              <span>→</span>
            </Link>
            <Link
              href="/dashboard/nearby"
              className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium inline-flex items-center gap-1"
            >
              <span>Nearby Blood Banks</span>
              <span>→</span>
            </Link>
            <Link
              href="/dashboard/profile"
              className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium"
            >
              Hospital Profile →
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

