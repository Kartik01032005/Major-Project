"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiAlertTriangle, FiTrash2, FiLoader } from "react-icons/fi";
import SettingsModal from "./SettingsModal";
import { useAuth } from "@/context";
import { dashboardService } from "@/services";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
}: DeleteAccountModalProps) {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setConfirmText("");
    setError(null);
    onClose();
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.trim() !== "DELETE") {
      setError("Please type DELETE to confirm account removal.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await dashboardService.deleteAccount();
      logout();
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      } else {
        router.push("/login");
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj.response?.data?.message || "Failed to delete account. Please try again later.");
      setLoading(false);
    }
  };

  const isConfirmed = confirmText.trim() === "DELETE";

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete BloodLink Account"
      description="Permanent, irreversible removal of your account and donor records."
      icon={<FiTrash2 size={20} className="text-red-600 dark:text-red-400" />}
      maxWidth="md"
    >
      <form onSubmit={handleDelete} className="space-y-4">
        {/* Destructive Warning Box */}
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-900 dark:text-red-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-red-700 dark:text-red-400">
            <FiAlertTriangle size={16} className="flex-shrink-0" />
            <span>Warning: This action cannot be undone</span>
          </div>
          <p className="leading-relaxed">
            Deleting your account will permanently delete:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
            <li>Your donor profile ({user?.name || "User"} · {user?.bloodGroup || "Donor"})</li>
            <li>All emergency blood dispatch requests created by you</li>
            <li>All pending notifications and hospital responses</li>
            <li>Verified donor badges and response statistics</li>
          </ul>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-xl font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            To proceed, type <span className="font-mono text-red-600 dark:text-red-400 font-bold">DELETE</span> below:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            required
            autoComplete="off"
            className="w-full px-3.5 py-2.5 rounded-xl border border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-950/20 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="DELETE"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="confirm-delete-btn"
            disabled={!isConfirmed || loading}
            className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-950 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? <FiLoader className="animate-spin" size={14} /> : <FiTrash2 size={14} />}
            <span>Permanently Delete</span>
          </button>
        </div>
      </form>
    </SettingsModal>
  );
}
