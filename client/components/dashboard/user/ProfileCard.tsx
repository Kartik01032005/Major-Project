"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiEdit3,
  FiCheck,
  FiX,
  FiLoader,
  FiBookOpen,
} from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useAuth, useTranslation } from "@/context";
import { dashboardService } from "@/services";
import { DonorProfileStats, User } from "@/types";

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

export default function ProfileCard() {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();

  const [stats, setStats] = useState<DonorProfileStats | null>(user?.donorStats ?? null);
  const [loadingStats, setLoadingStats] = useState<boolean>(!user?.donorStats);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editPhone, setEditPhone] = useState(user?.phone ?? "");
  const [editDistrict, setEditDistrict] = useState(user?.location?.district ?? "");
  const [editState, setEditState] = useState(user?.location?.state ?? "");
  const [editAvailability, setEditAvailability] = useState(user?.isAvailableDonor ?? true);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch updated profile and donor stats on mount
  useEffect(() => {
    let mounted = true;
    dashboardService
      .getProfile()
      .then((profile) => {
        if (!mounted || !profile) return;
        if (profile.donorStats) {
          setStats(profile.donorStats);
        }
        updateUser(profile);
      })
      .catch((err) => {
        console.error("Failed to load donor stats:", err);
      })
      .finally(() => {
        if (mounted) setLoadingStats(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleStartEdit = () => {
    setEditName(user?.name ?? "");
    setEditPhone(user?.phone ?? "");
    setEditDistrict(user?.location?.district ?? "");
    setEditState(user?.location?.state ?? "");
    setEditAvailability(user?.isAvailableDonor ?? true);
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setSaveError("Full Name is required.");
      return;
    }
    const cleanPhone = editPhone.trim().replace(/\D/g, "");
    if (cleanPhone && cleanPhone.length !== 10) {
      setSaveError("Please enter a valid 10-digit mobile phone number.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const updated = await dashboardService.updateProfile({
        name: editName.trim(),
        phone: cleanPhone || undefined,
        isAvailableDonor: editAvailability,
        location: {
          district: editDistrict.trim() || undefined,
          state: editState.trim() || undefined,
          latitude: user?.location?.latitude,
          longitude: user?.location?.longitude,
        },
      });

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
      setSaveError(errorObj.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name
    ? (() => {
        const parts = user.name.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return "U";
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      })()
    : "U";

  const memberSinceYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : "2026";
  const joinedDateFormatted = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const locationString =
    user?.location?.district && user?.location?.state
      ? `${user.location.district}, ${user.location.state}`
      : user?.location?.district || user?.location?.state || "Not specified";

  const isAvailable = user?.isAvailableDonor ?? true;
  const lastDonationFormatted = formatDateSafe(stats?.lastDonationDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      {/* ── TOP SECTION: User Account Identity ── */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Avatar + Name Details */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-md ring-2 ring-red-500/20">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {user?.name || "Blood Donor"}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {user?.role || "user"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Member since {memberSinceYear}
              </p>
            </div>
          </div>

          {/* Edit Profile Action */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <AnimatePresence mode="wait">
              {saveSuccess ? (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60"
                >
                  <FiCheck size={14} /> Profile updated
                </motion.span>
              ) : !isEditing ? (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                >
                  <FiEdit3 size={13} /> Edit Profile
                </button>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* Edit Form or Read-only Info Grid */}
        <div className="mt-5">
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              {saveError && (
                <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900/50">
                  {saveError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Full Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    District / City
                  </label>
                  <input
                    type="text"
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="e.g. Uttara Kannada"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="e.g. Karnataka"
                  />
                </div>
              </div>

              {/* Donor Availability toggle within edit form */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Donor Availability Status
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Control whether you receive emergency blood matches
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditAvailability(!editAvailability)}
                  className={[
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                    editAvailability
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
                  ].join(" ")}
                >
                  {editAvailability ? "Available" : "Unavailable"}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? <FiLoader size={13} className="animate-spin" /> : <FiCheck size={13} />}
                  <span>{saving ? "Saving…" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Email */}
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-2.5 min-w-0">
                <span className="mt-0.5 text-slate-400 dark:text-slate-500 flex-shrink-0">
                  <FiMail size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Email
                  </p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {user?.email || "—"}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-2.5 min-w-0">
                <span className="mt-0.5 text-slate-400 dark:text-slate-500 flex-shrink-0">
                  <FiPhone size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Phone
                  </p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {user?.phone ? `+91 ${user.phone}` : "—"}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-2.5 min-w-0">
                <span className="mt-0.5 text-slate-400 dark:text-slate-500 flex-shrink-0">
                  <FiMapPin size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Location
                  </p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {locationString}
                  </p>
                </div>
              </div>

              {/* Joined */}
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-2.5 min-w-0">
                <span className="mt-0.5 text-slate-400 dark:text-slate-500 flex-shrink-0">
                  <FiCalendar size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Joined
                  </p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {joinedDateFormatted}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION DIVIDER ── */}
      <div className="border-t border-slate-100 dark:border-slate-800/80" />

      {/* ── BOTTOM SECTION: Donor Profile & Verified Activity (Merged Below) ── */}
      <div className="p-5 sm:p-6 bg-slate-50/40 dark:bg-slate-900/60">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
              <FaDroplet size={14} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Donor Profile
                </h3>
                {loadingStats && <FiLoader size={12} className="text-slate-400 animate-spin" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Your verified blood donation activity and status
              </p>
            </div>
          </div>

          {/* Availability Status Badge */}
          <div>
            {isAvailable ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Temporarily unavailable
              </span>
            )}
          </div>
        </div>

        {/* Compact Donor Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Availability Status */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Availability
            </span>
            <div className="flex items-center gap-2">
              <span
                className={[
                  "text-xs font-bold",
                  isAvailable
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400",
                ].join(" ")}
              >
                {isAvailable ? "Ready to Donate" : "Paused"}
              </span>
            </div>
          </div>

          {/* 2. Donations Count */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Donations
            </span>
            {loadingStats && !stats ? (
              <div className="h-6 w-14 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {stats?.donationsCount ?? 0}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  verified donations
                </span>
              </div>
            )}
          </div>

          {/* 3. Last Donation */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Last Donation
            </span>
            {loadingStats && !stats ? (
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : lastDonationFormatted ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <FiCalendar size={13} className="text-emerald-500 flex-shrink-0" />
                <span>{lastDonationFormatted}</span>
              </div>
            ) : (
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 italic">
                No record yet
              </span>
            )}
          </div>

          {/* 4. Response Rate */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Response Rate
            </span>
            {loadingStats && !stats ? (
              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
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
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 italic">
                Not enough data
              </span>
            )}
          </div>
        </div>

        {/* Guidance Footer Notice */}
        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <FiBookOpen className="text-red-500 flex-shrink-0" size={13} />
            <span className="text-[11px] leading-relaxed">
              General medical guidance only. Professional clinical screening is required before every blood donation.
            </span>
          </div>
          <Link
            href="/dashboard/emergency"
            className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex-shrink-0"
          >
            View Official Eligibility Criteria →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
