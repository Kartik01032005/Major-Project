"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEdit3,
  FiCheck,
  FiX,
  FiMapPin,
  FiCalendar,
  FiAlertCircle,
  FiLoader,
  FiBookOpen,
} from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useAuth, useTranslation } from "@/context";
import { dashboardService } from "@/services/dashboardService";
import { DonorProfileStats } from "@/types";

function formatDateSafe(dateVal: string | null | undefined): string {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function DonorProfileCard() {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();

  const [stats, setStats] = useState<DonorProfileStats | null>(user?.donorStats ?? null);
  const [loading, setLoading] = useState<boolean>(!user?.donorStats);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [editAvailability, setEditAvailability] = useState<boolean>(user?.isAvailableDonor ?? true);
  const [editDistrict, setEditDistrict] = useState(user?.location?.district ?? "");
  const [editState, setEditState] = useState(user?.location?.state ?? "");

  const handleRetry = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const profile = await dashboardService.getProfile();
      if (profile) {
        if (profile.donorStats) {
          setStats(profile.donorStats);
        }
        updateUser(profile);
      }
    } catch (err: unknown) {
      console.error("Failed to load donor profile stats:", err);
      if (!user?.donorStats) {
        setLoadError(t("donor_profile_error"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;
    dashboardService
      .getProfile()
      .then((profile) => {
        if (!isCurrent || !profile) return;
        if (profile.donorStats) {
          setStats(profile.donorStats);
        }
        updateUser(profile);
      })
      .catch((err) => {
        if (!isCurrent) return;
        console.error("Failed to load donor profile stats:", err);
        if (!user?.donorStats) {
          setLoadError(t("donor_profile_error"));
        }
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartEdit = () => {
    setEditAvailability(user?.isAvailableDonor ?? true);
    setEditDistrict(user?.location?.district ?? "");
    setEditState(user?.location?.state ?? "");
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const updatePayload: {
        isAvailableDonor: boolean;
        location?: {
          state: string;
          district: string;
          latitude?: number;
          longitude?: number;
        };
      } = {
        isAvailableDonor: editAvailability,
      };

      if (editDistrict || editState) {
        updatePayload.location = {
          state: editState || user?.location?.state || "",
          district: editDistrict || user?.location?.district || "",
          latitude: user?.location?.latitude,
          longitude: user?.location?.longitude,
        };
      }

      const updated = await dashboardService.updateProfile(updatePayload);
      if (updated) {
        updateUser(updated);
        if (updated.donorStats) {
          setStats(updated.donorStats);
        }
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = errorObj.response?.data?.message || errorObj.message || t("donor_profile_error");
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Availability styling
  const isAvailable = user?.isAvailableDonor ?? true;
  const availabilityBadge = isAvailable ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      {t("donor_profile_available")}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
      <span className="w-2 h-2 rounded-full bg-amber-500" />
      {t("donor_profile_unavailable")}
    </span>
  );

  // Location representation (safe approximate / district-level)
  const locationString = user?.location?.district && user?.location?.state
    ? `${user.location.district}, ${user.location.state}`
    : user?.location?.district || user?.location?.state || t("donor_profile_location_unavailable");

  // Formatted last donation date
  const lastDonationFormatted = formatDateSafe(stats?.lastDonationDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
    >
      {/* ── Card Header ── */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0 shadow-sm">
            <FaDroplet size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t("donor_profile_title")}
              </h2>
              {loading && <FiLoader size={13} className="text-slate-400 animate-spin" />}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("donor_profile_subtitle")}
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {saveSuccess ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60"
              >
                <FiCheck size={14} /> {t("donor_profile_saved")}
              </motion.span>
            ) : isEditing ? (
              <motion.div
                key="editing-actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? (
                    <FiLoader size={13} className="animate-spin" />
                  ) : (
                    <FiCheck size={13} />
                  )}
                  {saving ? t("donor_profile_saving") : t("donor_profile_save")}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <FiX size={13} /> {t("donor_profile_cancel")}
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="edit-btn"
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <FiEdit3 size={13} /> {t("donor_profile_edit")}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Error Banner if fetch failed ── */}
      {loadError && (
        <div className="px-5 py-3 bg-red-50 dark:bg-red-950/30 border-b border-red-100 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FiAlertCircle size={14} className="flex-shrink-0" />
            {loadError}
          </span>
          <button
            onClick={handleRetry}
            className="font-semibold underline ml-2 hover:opacity-80"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Save Error Banner ── */}
      {saveError && (
        <div className="px-5 py-3 bg-red-50 dark:bg-red-950/30 border-b border-red-100 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <FiAlertCircle size={14} className="flex-shrink-0" />
          {saveError}
        </div>
      )}

      {/* ── Body: Profile Information & Real Stats ── */}
      <div className="p-5">
        {isEditing ? (
          /* ── EDIT FORM ── */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Availability Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("donor_profile_availability")}
                </label>
                <button
                  type="button"
                  onClick={() => setEditAvailability((p) => !p)}
                  className={[
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium border transition-colors",
                    editAvailability
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                      : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300",
                  ].join(" ")}
                  aria-pressed={editAvailability}
                >
                  <span>
                    {editAvailability
                      ? `🟢 ${t("donor_profile_available")}`
                      : `🟡 ${t("donor_profile_unavailable")}`}
                  </span>
                  <span className="text-xs font-semibold underline">Toggle</span>
                </button>
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  District
                </label>
                <input
                  type="text"
                  value={editDistrict}
                  onChange={(e) => setEditDistrict(e.target.value)}
                  placeholder="e.g. Mysore"
                  className="w-full text-sm font-medium px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                  placeholder="e.g. Karnataka"
                  className="w-full text-sm font-medium px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              * Note: Calculated statistics (verified donations, response rate, last donation date) are computed server-side from authentic database records and cannot be edited manually.
            </p>
          </div>
        ) : (
          /* ── DISPLAY GRID ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 1. Availability */}
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                {t("donor_profile_availability")}
              </span>
              <div className="flex items-center gap-2">
                {availabilityBadge}
              </div>
            </div>

            {/* 2. Donations Count */}
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                {t("donor_profile_donations")}
              </span>
              {loading && !stats ? (
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              ) : stats ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {stats.donationsCount}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {stats.donationsCount === 1
                      ? "donation"
                      : t("donor_profile_donations_count_suffix")}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 italic">
                  {t("donor_profile_donations_unavailable")}
                </span>
              )}
            </div>

            {/* 3. Response Rate */}
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                {t("donor_profile_response_rate")}
              </span>
              {loading && !stats ? (
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              ) : stats && stats.responseRate !== null ? (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {stats.responseRate}%
                  </span>
                  <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, stats.responseRate)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t("donor_profile_not_enough_data")}
                </span>
              )}
            </div>

            {/* 4. Location (spans 2 columns on lg for ample room) */}
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 sm:col-span-1 lg:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                {t("donor_profile_location")}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <FiMapPin size={13} className="text-red-500 flex-shrink-0" />
                <span className="truncate">{locationString}</span>
              </div>
            </div>

            {/* 5. Last Donation Date (spans 1 column) */}
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                {t("donor_profile_last_donation")}
              </span>
              {loading && !stats ? (
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              ) : lastDonationFormatted ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                  <FiCalendar size={13} className="text-emerald-500 flex-shrink-0" />
                  <span>{lastDonationFormatted}</span>
                </div>
              ) : (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t("donor_profile_last_donation_unavailable")}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Donation Eligibility (Requirement 12: strictly informational, separate from profile stats) ── */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-red-500">
              <FiBookOpen size={15} />
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t("donor_profile_eligibility_notice")}
            </span>
          </div>

          <Link
            href="/#eligibility"
            onClick={(event) => {
              event.preventDefault();
              window.location.assign("/#eligibility");
            }}
            className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
          >
            <span>{t("donor_profile_eligibility_link")}</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
