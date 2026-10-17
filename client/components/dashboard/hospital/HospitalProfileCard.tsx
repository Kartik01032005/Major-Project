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
  FiFileText,
  FiCheckCircle,
  FiActivity,
  FiClock,
  FiShield,
  FiExternalLink,
  FiAlertCircle,
  FiMap,
  FiGrid,
  FiUsers,
} from "react-icons/fi";
import { FaHospital } from "react-icons/fa";
import { useAuth, useToast } from "@/context";
import { dashboardService } from "@/services";
import { User, HospitalProfileStats } from "@/types";

function formatDateSafe(dateVal: string | null | undefined): string {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function HospitalProfileCard() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [loadingProfile, setLoadingProfile] = useState<boolean>(!user);
  const [stats, setStats] = useState<HospitalProfileStats | null>(user?.hospitalStats ?? null);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editOrgName, setEditOrgName] = useState(user?.organizationName ?? "");
  const [editPhone, setEditPhone] = useState(user?.phone ?? "");
  const [editAddress, setEditAddress] = useState(user?.address ?? "");
  const [editDistrict, setEditDistrict] = useState(user?.location?.district ?? "");
  const [editState, setEditState] = useState(user?.location?.state ?? "");
  const [editRegNum, setEditRegNum] = useState(user?.registrationNumber ?? "");
  const [editHospitalType, setEditHospitalType] = useState(user?.hospitalType ?? "");
  const [editOperatingHours, setEditOperatingHours] = useState(user?.operatingHours ?? "");
  const [editEmergencyPhone, setEditEmergencyPhone] = useState(user?.emergencyContactPhone ?? "");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch fresh profile with hospital statistics on mount
  useEffect(() => {
    let mounted = true;
    dashboardService
      .getProfile()
      .then((profile) => {
        if (!mounted || !profile) return;
        if (profile.hospitalStats) {
          setStats(profile.hospitalStats);
        }
        updateUser(profile);
      })
      .catch((err) => {
        console.error("Failed to load hospital profile:", err);
      })
      .finally(() => {
        if (mounted) setLoadingProfile(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleStartEdit = () => {
    setEditName(user?.name ?? "");
    setEditOrgName(user?.organizationName ?? "");
    setEditPhone(user?.phone ?? "");
    setEditAddress(user?.address ?? "");
    setEditDistrict(user?.location?.district ?? "");
    setEditState(user?.location?.state ?? "");
    setEditRegNum(user?.registrationNumber ?? "");
    setEditHospitalType(user?.hospitalType ?? "");
    setEditOperatingHours(user?.operatingHours ?? "");
    setEditEmergencyPhone(user?.emergencyContactPhone ?? "");
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
      setSaveError("Contact representative name cannot be empty.");
      return;
    }
    if (!editOrgName.trim()) {
      setSaveError("Hospital organization name cannot be empty.");
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
        organizationName: editOrgName.trim(),
        phone: cleanPhone || undefined,
        address: editAddress.trim() || undefined,
        registrationNumber: editRegNum.trim() || undefined,
        hospitalType: editHospitalType.trim() || undefined,
        operatingHours: editOperatingHours.trim() || undefined,
        emergencyContactPhone: editEmergencyPhone.trim() || undefined,
        location: {
          district: editDistrict.trim() || undefined,
          state: editState.trim() || undefined,
          latitude: user?.location?.latitude,
          longitude: user?.location?.longitude,
        },
      });

      if (updated) {
        updateUser(updated);
        if (updated.hospitalStats) {
          setStats(updated.hospitalStats);
        }
        setIsEditing(false);
        setSaveSuccess(true);
        toast.success("Hospital profile updated successfully");
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const errMsg = errorObj.response?.data?.message || "Failed to update hospital profile. Please try again.";
      setSaveError(errMsg);
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const hospitalDisplayName = user?.organizationName || user?.name || "Hospital Partner";
  const memberSinceYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : "2026";
  const joinedDateFormatted = formatDateSafe(user?.createdAt);

  const locationString =
    user?.location?.district && user?.location?.state
      ? `${user.location.district}, ${user.location.state}`
      : user?.location?.district || user?.location?.state || "Not specified";

  const completionPct = stats?.profileCompletion ?? 80;

  return (
    <div className="space-y-6" role="region" aria-label="Hospital Profile">
      {/* ── 1. HEADER CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        <div className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            {/* Hospital Icon + Identity */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 flex items-center justify-center text-white text-2xl flex-shrink-0 shadow-lg ring-2 ring-red-500/20">
                <FaHospital />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    {hospitalDisplayName}
                  </h1>
                  <span
                    data-testid="hospital-role-badge"
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/50 uppercase tracking-wider"
                  >
                    <FaHospital size={11} /> HOSPITAL
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span>Registered: {joinedDateFormatted}</span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span>Member since {memberSinceYear}</span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span>Demo Institutional Account</span>
                </p>
              </div>
            </div>

            {/* Edit Profile Button */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <AnimatePresence mode="wait">
                {saveSuccess ? (
                  <motion.span
                    key="saved"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60"
                  >
                    <FiCheck size={14} /> Profile updated
                  </motion.span>
                ) : !isEditing ? (
                  <button
                    type="button"
                    data-testid="header-edit-profile-btn"
                    onClick={handleStartEdit}
                    className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                  >
                    <FiEdit3 size={14} className="text-red-500" /> Edit Profile
                  </button>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          {/* Edit Form or Read-Only Info */}
          <div className="mt-6 border-t border-slate-100 dark:border-slate-800/80 pt-6">
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FiEdit3 className="text-red-600" /> Edit Hospital Profile
                  </h3>
                  <span className="text-xs text-slate-500">All changes persist to MongoDB</span>
                </div>

                {saveError && (
                  <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900/50">
                    {saveError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Hospital / Institution Name *
                    </label>
                    <input
                      type="text"
                      value={editOrgName}
                      onChange={(e) => setEditOrgName(e.target.value)}
                      required
                      placeholder="e.g. City General Hospital"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Contact Representative Name *
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      placeholder="e.g. Dr. Jane Smith"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Contact Phone (10 digits) *
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      required
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Accreditation / License Ref
                    </label>
                    <input
                      type="text"
                      value={editRegNum}
                      onChange={(e) => setEditRegNum(e.target.value)}
                      placeholder="e.g. HSP-KA-2026-901"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Hospital Facility Type
                    </label>
                    <input
                      type="text"
                      value={editHospitalType}
                      onChange={(e) => setEditHospitalType(e.target.value)}
                      placeholder="e.g. Multispecialty Hospital / Trauma Center"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Operating Hours
                    </label>
                    <input
                      type="text"
                      value={editOperatingHours}
                      onChange={(e) => setEditOperatingHours(e.target.value)}
                      placeholder="e.g. 24/7 Emergency & Inpatient Services"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Emergency Contact Helpline
                    </label>
                    <input
                      type="tel"
                      value={editEmergencyPhone}
                      onChange={(e) => setEditEmergencyPhone(e.target.value)}
                      placeholder="e.g. 080-25024444"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="e.g. 123 Medical Enclave, MG Road"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      District
                    </label>
                    <input
                      type="text"
                      value={editDistrict}
                      onChange={(e) => setEditDistrict(e.target.value)}
                      placeholder="e.g. Mysore"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
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
                      placeholder="e.g. Karnataka"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {saving ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />}
                    {saving ? "Saving Changes..." : "Save Hospital Profile"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
                  >
                    <FiX size={14} /> Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FiMail size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Official Demo Email</p>
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{user?.email || "—"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FiPhone size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Primary Contact Phone</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{user?.phone || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FiMapPin size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Location</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{locationString}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FiFileText size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">License / Accreditation ID</p>
                    <p className="font-mono font-semibold text-slate-900 dark:text-white">
                      {user?.registrationNumber || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FaHospital size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hospital Facility Type</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {user?.hospitalType || "General Hospital"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FiClock size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Operating Hours</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {user?.operatingHours || "24/7 Emergency & Inpatient"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── 2. HOSPITAL OVERVIEW (STATISTICS CARDS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profile Completion */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
              <span>Profile Completion</span>
              <span className="font-bold text-slate-900 dark:text-white">{completionPct}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-red-600 to-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            {completionPct === 100 ? "All institutional fields complete" : "Add details to reach 100%"}
          </p>
        </div>

        {/* Requests Broadcasted */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center text-xl shrink-0">
            <FiActivity />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Blood Requests</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {stats?.totalRequests !== undefined && stats.totalRequests > 0 ? stats.totalRequests : "0"}
            </p>
            <p className="text-[11px] text-slate-500">
              {stats?.totalRequests ? "Total broadcasted" : "No records yet"}
            </p>
          </div>
        </div>

        {/* Active Emergency Requests */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
            <FiAlertCircle />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Requests</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {stats?.activeRequests !== undefined && stats.activeRequests > 0 ? stats.activeRequests : "0"}
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              {stats?.activeRequests ? "Awaiting donors" : "No records yet"}
            </p>
          </div>
        </div>

        {/* Donors Responded / Fulfilled */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
            <FiUsers />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Donors Responded</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {stats?.totalDonorsResponded !== undefined && stats.totalDonorsResponded > 0
                ? stats.totalDonorsResponded
                : "0"}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
              {stats?.totalDonorsResponded ? "Verified donor responses" : "No records yet"}
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. DETAILED FACILITY & CLINICAL INFORMATION CARD ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiShield className="text-red-600" />
            Institutional Credentials & Facility Details
          </h2>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            ✓ Verified Facility
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Registered Address</p>
            <p className="text-slate-900 dark:text-white font-medium">
              {user?.address || "Address not provided in initial setup"}
            </p>
            <p className="text-xs text-slate-500">{locationString}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Emergency Helpline Contact</p>
            <p className="text-slate-900 dark:text-white font-medium">
              {user?.emergencyContactPhone || user?.phone || "Not provided"}
            </p>
            <p className="text-xs text-slate-500">Dedicated emergency dispatch line</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Clinical Department Reference</p>
            <p className="text-slate-900 dark:text-white font-medium">
              {user?.hospitalType || "General & Specialized Inpatient"}
            </p>
            <p className="text-xs text-slate-500">Accredited Health Services Partner</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Accreditation ID</p>
            <p className="font-mono text-slate-900 dark:text-white font-medium">
              {user?.registrationNumber || "Not provided"}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Institutional validation active</p>
          </div>
        </div>
      </div>

      {/* ── 4. HOSPITAL QUICK ACTIONS ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FiActivity className="text-red-600" />
          Hospital Operations & Actions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <Link
            href="/dashboard/hospital"
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800 bg-white dark:bg-slate-900 hover:bg-red-50/40 dark:hover:bg-red-950/20 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 flex items-center justify-center">
                <FiGrid size={16} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Hospital Portal</p>
                <p className="text-xs text-slate-500">Go to main overview</p>
              </div>
            </div>
            <FiExternalLink className="text-slate-400 group-hover:text-red-600" size={14} />
          </Link>

          <button
            type="button"
            onClick={handleStartEdit}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800 bg-white dark:bg-slate-900 hover:bg-red-50/40 dark:hover:bg-red-950/20 transition-all flex items-center justify-between group text-left w-full"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center">
                <FiEdit3 size={16} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Edit Profile</p>
                <p className="text-xs text-slate-500">Update facility details</p>
              </div>
            </div>
            <FiEdit3 className="text-slate-400 group-hover:text-red-600" size={14} />
          </button>

          <Link
            href="/dashboard/requests"
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800 bg-white dark:bg-slate-900 hover:bg-red-50/40 dark:hover:bg-red-950/20 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
                <FiAlertCircle size={16} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Emergency Requests</p>
                <p className="text-xs text-slate-500">View emergency requests</p>
              </div>
            </div>
            <FiExternalLink className="text-slate-400 group-hover:text-red-600" size={14} />
          </Link>

          <Link
            href="/dashboard/nearby"
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800 bg-white dark:bg-slate-900 hover:bg-red-50/40 dark:hover:bg-red-950/20 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
                <FiMap size={16} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Nearby Blood Banks</p>
                <p className="text-xs text-slate-500">Locate blood stock</p>
              </div>
            </div>
            <FiExternalLink className="text-slate-400 group-hover:text-red-600" size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
