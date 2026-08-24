"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiAlertCircle, FiActivity, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useAuth, useTranslation } from "@/context";

interface WelcomeBannerProps {
  onEmergencyClick: () => void;
}

export default function WelcomeBanner({ onEmergencyClick }: WelcomeBannerProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isDonorAvailable, setIsDonorAvailable] = useState(user?.isAvailableDonor ?? true);

  const greetHour = new Date().getHours();
  const greeting =
    greetHour < 12 ? t("banner_good_morning") : greetHour < 17 ? t("banner_good_afternoon") : t("banner_good_evening");

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-6 sm:p-8 text-white"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="absolute right-6 top-6 sm:right-10 sm:top-8 text-white/10"
        >
          <FaDroplet size={80} />
        </motion.div>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        {/* Left — greeting + info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FiActivity size={16} className="animate-heartbeat text-red-200" />
            <span className="text-red-200 text-sm font-medium">{greeting}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-1">
            {greeting}, {firstName}! 👋
          </h2>
          <p className="text-red-100 text-sm">
            {t("banner_subtitle")}
          </p>

          {/* Blood group + donor toggle */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {/* Blood group badge */}
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold">
              <FaDroplet size={13} />
              {t("banner_blood_group")} {user?.bloodGroup ?? "—"}
            </div>

            {/* Donor availability toggle */}
            <button
              onClick={() => setIsDonorAvailable((p) => !p)}
              className={[
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                isDonorAvailable
                  ? "bg-emerald-400/25 text-emerald-100 hover:bg-emerald-400/35"
                  : "bg-white/10 text-red-200 hover:bg-white/15",
              ].join(" ")}
              aria-pressed={isDonorAvailable}
              aria-label={t("banner_donor_available_label")}
            >
              {isDonorAvailable ? (
                <><FiToggleRight size={18} /> {t("banner_available")}</>
              ) : (
                <><FiToggleLeft size={18} /> {t("banner_not_available")}</>
              )}
            </button>
          </div>
        </div>

        {/* Right — Emergency CTA */}
        <div className="flex-shrink-0">
          <button
            id="emergency-request-btn"
            onClick={onEmergencyClick}
            className={[
              "flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm",
              "bg-white text-red-700 hover:bg-red-50",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-200 hover:scale-105 active:scale-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-red-600",
            ].join(" ")}
          >
            <FiAlertCircle size={17} className="animate-heartbeat" />
            {t("banner_emergency_btn")}
          </button>
          <p className="text-[11px] text-red-200 mt-2 text-center">
            {t("banner_emergency_note")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
