"use client";

import React, { useEffect } from "react";
import Button from "@/components/ui/Button";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("Dashboard Route Exception:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center mb-4">
        <svg
          className="w-7 h-7 text-red-600 dark:text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        Dashboard View Error
      </h2>

      <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mb-6">
        Failed to load dashboard components. This could be due to a temporary network issue.
      </p>

      <div className="flex gap-3">
        <Button onClick={() => reset()} variant="primary" size="md">
          Retry Dashboard
        </Button>
        <Button href="/dashboard" variant="outline" size="md">
          Refresh Page
        </Button>
      </div>
    </div>
  );
}
