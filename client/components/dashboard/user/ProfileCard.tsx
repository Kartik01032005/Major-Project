"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiEdit3, FiCheck, FiX } from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useAuth } from "@/context";

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
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [phone, setPhone] = useState(user?.phone ?? "");

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
            <p className="text-xs text-slate-400">Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : "—"}</p>
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
                <FiCheck size={14} /> Saved
              </motion.span>
            ) : editing ? (
              <motion.div key="editing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  <FiCheck size={13} /> Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <FiX size={13} /> Cancel
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
                <FiEdit3 size={13} /> Edit Profile
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={<FiMail size={15} />} label="Email" value={user?.email ?? ""} />
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-slate-400 dark:text-slate-500 flex-shrink-0"><FiPhone size={15} /></span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Phone</p>
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
            label="Location"
            value={user?.location ? `${user.location.district}, ${user.location.state}` : "Not set"}
          />
          <InfoRow
            icon={<FiCalendar size={15} />}
            label="Joined"
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—"}
          />
        </div>
      </div>
    </motion.div>
  );
}
