"use client";

import React, { useState } from "react";
import { FiMapPin, FiCheck, FiLoader } from "react-icons/fi";
import SettingsModal from "./SettingsModal";
import { UserSettings } from "@/types";
import { dashboardService } from "@/services";

interface AlertRadiusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRadius: 5 | 10 | 25 | 50;
  settings: UserSettings | null;
  onSuccess: (updated: UserSettings) => void;
}

const RADIUS_OPTIONS: { value: 5 | 10 | 25 | 50; label: string; desc: string }[] = [
  { value: 5, label: "5 km", desc: "Immediate neighborhood. Fastest response times (under 15 mins)." },
  { value: 10, label: "10 km", desc: "City zone. Covers central clinics and local community hospitals." },
  { value: 25, label: "25 km (Recommended)", desc: "Metropolitan radius. Balances reach across major blood banks." },
  { value: 50, label: "50 km", desc: "Regional radius. Covers peripheral districts and emergency trauma centers." },
];

export default function AlertRadiusModal({
  isOpen,
  onClose,
  currentRadius = 25,
  settings,
  onSuccess,
}: AlertRadiusModalProps) {
  const [selected, setSelected] = useState<5 | 10 | 25 | 50>(currentRadius);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (selected === currentRadius) {
      onClose();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await dashboardService.updateSettings({
        emergency: {
          alertRadiusKm: selected,
          emergencyContact: settings?.emergency?.emergencyContact,
        },
      });
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj.response?.data?.message || "Failed to update alert radius.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Emergency Alert Radius"
      description="Choose how far away emergency blood requests can be from your location."
      icon={<FiMapPin size={20} />}
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        <div className="space-y-2.5">
          {RADIUS_OPTIONS.map((opt) => {
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
                <span
                  className={[
                    "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors",
                    isSelected
                      ? "bg-red-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
                  ].join(" ")}
                >
                  {opt.value}k
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {opt.label}
                    </p>
                    {isSelected && <FiCheck className="text-red-600 dark:text-red-400" size={15} />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
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
            <span>Save Radius</span>
          </button>
        </div>
      </div>
    </SettingsModal>
  );
}
