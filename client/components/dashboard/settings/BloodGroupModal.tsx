"use client";

import React, { useState } from "react";
import { FiDroplet, FiLoader, FiCheck } from "react-icons/fi";
import SettingsModal from "./SettingsModal";
import { BloodGroup } from "@/types";
import { dashboardService } from "@/services";

interface BloodGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGroup: BloodGroup | undefined;
  onSuccess: (newGroup: BloodGroup) => void;
}

const BLOOD_GROUPS: { group: BloodGroup; label: string; desc: string }[] = [
  { group: "A+", label: "A Positive", desc: "Can receive A+, A-, O+, O-" },
  { group: "A-", label: "A Negative", desc: "Can receive A-, O-" },
  { group: "B+", label: "B Positive", desc: "Can receive B+, B-, O+, O-" },
  { group: "B-", label: "B Negative", desc: "Can receive B-, O-" },
  { group: "AB+", label: "AB Positive", desc: "Universal plasma donor / universal red cell recipient" },
  { group: "AB-", label: "AB Negative", desc: "Can receive A-, B-, AB-, O-" },
  { group: "O+", label: "O Positive", desc: "Most commonly needed blood group" },
  { group: "O-", label: "O Negative", desc: "Universal red blood cell donor" },
];

export default function BloodGroupModal({
  isOpen,
  onClose,
  currentGroup = "O+",
  onSuccess,
}: BloodGroupModalProps) {
  const [selected, setSelected] = useState<BloodGroup>(currentGroup);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (selected === currentGroup) {
      onClose();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.updateProfile({ bloodGroup: selected });
      onSuccess(res.bloodGroup || selected);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj.response?.data?.message || "Failed to update blood group.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Blood Group"
      description="Select your biological blood type. Used for emergency donor matching."
      icon={<FiDroplet size={20} />}
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {BLOOD_GROUPS.map((item) => {
            const isSelected = selected === item.group;
            return (
              <button
                key={item.group}
                type="button"
                onClick={() => setSelected(item.group)}
                className={[
                  "flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-red-600 bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-200 ring-2 ring-red-500/30"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors",
                    isSelected
                      ? "bg-red-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
                  ].join(" ")}
                >
                  {item.group}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {item.label}
                    </p>
                    {isSelected && <FiCheck className="text-red-600 dark:text-red-400" size={14} />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                    {item.desc}
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
            <span>Save Blood Group</span>
          </button>
        </div>
      </div>
    </SettingsModal>
  );
}
