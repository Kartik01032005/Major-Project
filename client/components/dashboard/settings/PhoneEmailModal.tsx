"use client";

import React, { useState } from "react";
import { FiPhone, FiMail, FiLoader, FiCheck, FiShield } from "react-icons/fi";
import SettingsModal from "./SettingsModal";
import { User } from "@/types";
import { dashboardService } from "@/services";

interface PhoneEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: (updated: User) => void;
}

export default function PhoneEmailModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: PhoneEmailModalProps) {
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError("Please provide a valid 10-digit mobile phone number");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await dashboardService.updateProfile({ phone: cleanPhone });
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj.response?.data?.message || "Failed to update phone number");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Phone & Email"
      description="Manage your primary communication and account verification channels."
      icon={<FiPhone size={20} />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        {/* Email - Read-only with explanation */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FiMail size={13} className="text-slate-400" />
              <span>Email Address</span>
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <FiCheck size={11} /> Verified
            </span>
          </label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
          />
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <FiShield size={12} className="text-slate-400 flex-shrink-0" />
            <span>Primary email is locked to protect identity authentication and emergency records.</span>
          </div>
        </div>

        {/* Phone number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FiPhone size={13} className="text-slate-400" />
            <span>Mobile Phone Number</span>
          </label>
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus-within:ring-2 focus-within:ring-red-500 overflow-hidden">
            <span className="px-3 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 border-r border-slate-200 dark:border-slate-700 select-none">
              +91
            </span>
            <input
              type="tel"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              required
              className="w-full px-3 py-2.5 text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none"
              placeholder="9876543210"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Used for emergency SMS coordination and hospital dispatch communication.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={loading || phone === user?.phone}
            className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />}
            <span>Update Phone</span>
          </button>
        </div>
      </form>
    </SettingsModal>
  );
}
