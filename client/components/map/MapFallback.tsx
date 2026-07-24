"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiAlertTriangle, FiKey } from "react-icons/fi";

interface MapFallbackProps {
  reason?: "no-key" | "load-error";
  height?: string;
}

export default function MapFallback({
  reason = "no-key",
  height = "h-72",
}: MapFallbackProps) {
  return (
    <div
      className={`relative ${height} rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center`}
      role="img"
      aria-label="Map unavailable"
    >
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-grid opacity-60 dark:opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-100 dark:to-slate-800 pointer-events-none" />

      {/* Decorative fake pin markers */}
      {[
        { top: "28%", left: "22%", color: "bg-red-500" },
        { top: "45%", left: "60%", color: "bg-blue-500" },
        { top: "60%", left: "35%", color: "bg-emerald-500" },
      ].map((pin, i) => (
        <motion.div
          key={i}
          initial={{ y: -4 }}
          animate={{ y: 4 }}
          transition={{ repeat: Infinity, repeatType: "mirror", duration: 1.8 + i * 0.4, ease: "easeInOut" }}
          className={`absolute w-5 h-5 rounded-full ${pin.color} border-2 border-white dark:border-slate-700 shadow-lg`}
          style={{ top: pin.top, left: pin.left }}
          aria-hidden="true"
        />
      ))}

      {/* Message */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div className={[
          "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-sm",
          reason === "no-key"
            ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600"
            : "bg-red-100 dark:bg-red-950/40 text-red-600",
        ].join(" ")}>
          {reason === "no-key" ? <FiKey size={22} /> : <FiAlertTriangle size={22} />}
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {reason === "no-key" ? "Google Maps not configured" : "Map failed to load"}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
          {reason === "no-key"
            ? "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file to enable the interactive map."
            : "Unable to load Google Maps. Please check your API key and network connection."}
        </p>
        {reason === "no-key" && (
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
          >
            <FiKey size={11} /> Get API Key →
          </a>
        )}
      </div>
    </div>
  );
}
