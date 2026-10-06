"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiAlertCircle, FiActivity, FiToggleLeft, FiToggleRight, FiBookOpen } from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useAuth, useTranslation, useToast } from "@/context";
import { dashboardService } from "@/services/dashboardService";

interface WelcomeBannerProps {
  onEmergencyClick: () => void;
}

export default function WelcomeBanner({ onEmergencyClick }: WelcomeBannerProps) {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const isDonorAvailable = user?.isAvailableDonor ?? true;

  const handleToggleAvailability = async () => {
    const nextState = !isDonorAvailable;
    updateUser({ isAvailableDonor: nextState });
    try {
      await dashboardService.updateProfile({ isAvailableDonor: nextState });
      toast.success(
        nextState
          ? "You are now marked available for donations"
          : "You are now marked unavailable for donations"
      );
    } catch (e) {
      console.error("Failed to update donor availability:", e);
      updateUser({ isAvailableDonor: !nextState });
      toast.error("Failed to update availability. Please try again.");
    }
  };

  const greetHour = new Date().getHours();
  const greeting =
    greetHour < 12 ? t("banner_good_morning") : greetHour < 17 ? t("banner_good_afternoon") : t("banner_good_evening");

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-5 sm:p-7 text-white"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="absolute right-4 top-4 sm:right-10 sm:top-8 text-white/10"
        >
          <FaDroplet size={70} />
        </motion.div>
      </div>

      <div className="relative z-10">
        {/* Mobile Layout (<sm): Side-by-side greeting & compact CTA */}
        <div className="block sm:hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <FiActivity size={14} className="animate-heartbeat text-red-200" />
                <span className="text-red-200 text-xs font-medium">{greeting}</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-1 text-white">
                {greeting}, {firstName}! 👋
              </h2>
              <p className="text-red-100 text-xs leading-snug">
                Your donation can save up to 3 lives.
                <br />
                Thank you for being a donor.
              </p>
            </div>

            {/* Mobile Emergency CTA */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <button
                id="emergency-request-btn-mobile"
                onClick={onEmergencyClick}
                className={[
                  "flex items-center gap-2 px-3 py-2 rounded-2xl font-bold text-xs text-left",
                  "bg-white text-red-700 hover:bg-red-50",
                  "shadow-md hover:shadow-lg",
                  "transition-all duration-200 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                ].join(" ")}
              >
                <FiAlertCircle size={18} className="text-red-600 shrink-0" />
                <span className="leading-tight">
                  Emergency<br />Blood Request
                </span>
              </button>
              <p className="text-[10px] text-red-200 mt-1.5 text-center leading-tight">
                Notifies nearby<br className="min-[380px]:hidden" /> donors instantly
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button
              onClick={handleToggleAvailability}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                isDonorAvailable
                  ? "bg-emerald-400/20 border-emerald-400/40 text-emerald-100 hover:bg-emerald-400/30"
                  : "bg-white/10 border-white/20 text-red-100 hover:bg-white/15",
              ].join(" ")}
              aria-pressed={isDonorAvailable}
              aria-label={t("banner_donor_available_label")}
            >
              {isDonorAvailable ? (
                <><FiToggleRight size={16} /> {t("banner_available")}</>
              ) : (
                <><FiToggleLeft size={16} /> {t("banner_not_available")}</>
              )}
            </button>
            <Link
              href="/#eligibility"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
              title="View official blood donation eligibility requirements"
            >
              <FiBookOpen size={13} />
              <span>{t("eligibility_cta")}</span>
            </Link>
          </div>
        </div>

        {/* Desktop Web Layout (sm+): Spacious side-by-side with original desktop CTA & styling */}
        <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div className="max-w-xl">
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

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={handleToggleAvailability}
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
              <Link
                href="/#eligibility"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/15"
                title="View official blood donation eligibility requirements"
              >
                <FiBookOpen size={13} />
                <span>{t("eligibility_cta")}</span>
              </Link>
            </div>
          </div>

          <div className="flex-shrink-0 text-center">
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
      </div>
    </motion.div>
  );
}
