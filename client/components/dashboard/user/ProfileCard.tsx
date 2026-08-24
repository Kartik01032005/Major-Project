"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiPhone, FiMapPin, FiCalendar, FiEdit3, FiCheck, FiX } from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useAuth, useTranslation } from "@/context";
import { authService } from "@/services";

const BLOOD_GROUP_COLORS: Record<string, string> = {
  "A+": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "A-": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "B+": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "B-": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "AB+": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "AB-": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "O+": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "O-": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-400 dark:text-slate-500 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function ProfileCard() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await authService.deleteAccount();
      if (res.success) {
        logout();
        if (typeof window !== "undefined") {
          window.location.replace("/login");
        }
      } else {
        setDeleteError(res.message || "Failed to delete account.");
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const errMsg = errorObj.response?.data?.message || errorObj.message || "An error occurred during account deletion.";
      setDeleteError(errMsg);
    } finally {
      setDeleting(false);
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const bloodGroupClass = BLOOD_GROUP_COLORS[user?.bloodGroup ?? "O+"] ?? "";

  const handleSave = () => {
    // In production this would call an API — for now we just show feedback
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
    >
      {/* Header strip */}
      <div className="h-20 bg-gradient-to-r from-red-600 to-red-700 relative">
        <div className="absolute -bottom-8 left-5">
          <div className="w-16 h-16 rounded-2xl bg-red-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {initials}
          </div>
        </div>
        <div className="absolute top-3 right-4 flex items-center gap-1.5">
          <span className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1.5 ${bloodGroupClass}`}>
            <FaDroplet size={11} /> {user?.bloodGroup}
          </span>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-white/20 text-white capitalize">
            {user?.role}
          </span>
        </div>
      </div>

      <div className="pt-12 px-5 pb-5">
        {/* Name + edit */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</h3>
            <p className="text-xs text-slate-400">{t("profile_member_since")} {user?.createdAt ? new Date(user.createdAt).getFullYear() : "—"}</p>
          </div>
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
              >
                <FiCheck size={14} /> {t("profile_saved")}
              </motion.span>
            ) : editing ? (
              <motion.div key="editing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  <FiCheck size={13} /> {t("profile_save")}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <FiX size={13} /> {t("profile_cancel")}
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <FiEdit3 size={13} /> {t("profile_edit")}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={<FiMail size={15} />} label={t("profile_email")} value={user?.email ?? ""} />
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-slate-400 dark:text-slate-500 flex-shrink-0"><FiPhone size={15} /></span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{t("profile_phone")}</p>
              {editing ? (
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                  className="w-full text-sm font-medium bg-transparent border-b border-red-500 text-slate-800 dark:text-slate-200 outline-none py-0.5"
                  aria-label="Edit phone number"
                />
              ) : (
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{phone || "—"}</p>
              )}
            </div>
          </div>
          <InfoRow
            icon={<FiMapPin size={15} />}
            label={t("profile_location")}
            value={user?.location ? `${user.location.district}, ${user.location.state}` : t("profile_not_set")}
          />
          <InfoRow
            icon={<FiCalendar size={15} />}
            label={t("profile_joined")}
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—"}
          />
        </div>

        {/* Divider */}
        <hr className="my-5 border-slate-200 dark:border-slate-800" />

        {/* Delete Account Section */}
        <div className="rounded-xl border border-red-200 dark:border-red-950/40 bg-red-50/30 dark:bg-red-950/10 p-4">
          <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">{t("profile_delete_title")}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            {t("profile_delete_description")}
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
          >
            {t("profile_delete_btn")}
          </button>
        </div>
      </div>

      {/* Deletion Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            {/* Modal Overlay */}
            <motion.div
              key="delete-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => !deleting && setShowDeleteModal(false)}
            />

            {/* Modal Box */}
            <motion.div
              key="delete-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Confirm Account Deletion"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={[
                "fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                "w-full max-w-md p-6 mx-4",
                "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl",
                "border border-slate-200 dark:border-slate-800",
              ].join(" ")}
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                {t("profile_delete_confirm_title")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                {t("profile_delete_confirm_description")}
              </p>

              {deleteError && (
                <div className="mb-4 text-xs font-semibold text-red-600 dark:text-red-400">
                  {deleteError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors"
                >
                  {t("profile_delete_cancel_btn")}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t("profile_deleting")}
                    </>
                  ) : (
                    t("profile_delete_confirm_btn")
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
