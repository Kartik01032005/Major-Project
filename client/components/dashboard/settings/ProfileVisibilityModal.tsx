"use client";

import React, { useState } from "react";
import { FiEye, FiCheck, FiLoader } from "react-icons/fi";
import SettingsModal from "./SettingsModal";
import { UserSettings } from "@/types";
import { dashboardService } from "@/services";

interface ProfileVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentValue: "matching" | "hidden";
  settings: UserSettings | null;
  onSuccess: (updated: UserSettings) => void;
}

const OPTIONS: { value: "matching" | "hidden"; title: string; desc: string }[] = [
  {
    value: "matching",
    title: "Visible to matching blood requests",
    desc: "Nearby patients and blood banks can identify your blood type and dispatch emergency donor requests.",
  },
  {
    value: "hidden",
    title: "Hidden",
    desc: "Your profile is masked from discovery. You will not appear in search results or public donor rosters.",
  },
];

export default function ProfileVisibilityModal({
  isOpen,
  onClose,
  currentValue = "matching",
  settings,
  onSuccess,
}: ProfileVisibilityModalProps) {
  const [selected, setSelected] = useState<"matching" | "hidden">(currentValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (selected === currentValue) {
      onClose();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await dashboardService.updateSettings({
        privacy: {
          locationSharing: settings?.privacy?.locationSharing ?? true,
          profileVisibility: selected,
          phoneNumberPrivacy: settings?.privacy?.phoneNumberPrivacy ?? "on_request",
        },
      });
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj.response?.data?.message || "Failed to update profile visibility.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Profile Visibility"
      description="Control who can see your donor profile on the platform."
      icon={<FiEye size={20} />}
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        <div className="space-y-2.5">
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(opt.value)}
                className={[
                  "w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-red-600 bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-200 ring-2 ring-red-500/30"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900",
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {opt.title}
                    </p>
                    {isSelected && <FiCheck className="text-red-600 dark:text-red-400" size={15} />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />}
            <span>Save Preference</span>
          </button>
        </div>
      </div>
    </SettingsModal>
  );
}
