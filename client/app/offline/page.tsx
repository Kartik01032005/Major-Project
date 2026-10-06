"use client";

import React from "react";
import Link from "next/link";
import { FiWifiOff, FiRefreshCw, FiPhone, FiHome } from "react-icons/fi";
import { BiSolidDroplet } from "react-icons/bi";

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl text-center">
        {/* Blood drop with offline indicator */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mb-6 border border-red-100 dark:border-red-900/50">
          <BiSolidDroplet className="w-8 h-8 text-red-600" aria-hidden="true" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center shadow">
            <FiWifiOff className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          You are currently offline
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          BloodLink could not connect to the network. Please check your internet or Wi-Fi connection and try again.
        </p>

        {/* Emergency contact callout */}
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/40 text-left mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">
            <FiPhone className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Emergency Blood Helpline</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            For critical life-saving emergencies, dial the national blood toll-free helpline directly:
          </p>
          <a
            href="tel:104"
            className="inline-block mt-2 font-bold text-red-600 dark:text-red-400 text-sm hover:underline"
          >
            📞 Dial 104 (National Blood Helpline)
          </a>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleRetry}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-700 text-white shadow-md transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <FiRefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Retry Connection</span>
          </button>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <FiHome className="w-4 h-4" aria-hidden="true" />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
