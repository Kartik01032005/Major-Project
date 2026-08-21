"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSliders, FiCheck, FiX, FiInfo } from "react-icons/fi";
import { useDashboard } from "@/context";
import { AvailabilityThresholds } from "@/types";

interface StockThresholdsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_THRESHOLDS: AvailabilityThresholds = {
  highlyAvailable: 200,
  veryHigh: 150,
  high: 100,
  good: 70,
  available: 50,
  moderate: 30,
  low: 15,
  veryLow: 10,
  critical: 5,
  almostEmpty: 0,
};

export default function StockThresholdsModal({ isOpen, onClose }: StockThresholdsModalProps) {
  const { thresholds, updateThresholds } = useDashboard();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<AvailabilityThresholds>(thresholds ?? DEFAULT_THRESHOLDS);

  if (!isOpen) return null;

  const handleChange = (key: keyof AvailabilityThresholds, val: number) => {
    setForm((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateThresholds(form);
      onClose();
    } catch (err) {
      console.error("Failed to save thresholds:", err);
    } finally {
      setSaving(false);
    }
  };

  const levelsConfig: Array<{ key: keyof AvailabilityThresholds; label: string; desc: string; color: string }> = [
    { key: "highlyAvailable", label: "1. Highly Available", desc: "Highest stock reserve level", color: "border-emerald-500 text-emerald-600" },
    { key: "veryHigh", label: "2. Very High", desc: "Abundant stock availability", color: "border-emerald-400 text-emerald-500" },
    { key: "high", label: "3. High", desc: "Strong inventory level", color: "border-teal-500 text-teal-600" },
    { key: "good", label: "4. Good", desc: "Healthy blood stock", color: "border-blue-500 text-blue-600" },
    { key: "available", label: "5. Available", desc: "Adequate stock for routine requests", color: "border-blue-400 text-blue-500" },
    { key: "moderate", label: "6. Moderate", desc: "Average stock level", color: "border-indigo-500 text-indigo-600" },
    { key: "low", label: "7. Low", desc: "Attention required", color: "border-amber-500 text-amber-600" },
    { key: "veryLow", label: "8. Very Low", desc: "Low reserve warning", color: "border-orange-500 text-orange-600" },
    { key: "critical", label: "9. Critical", desc: "Triggers automated alert notification", color: "border-red-500 text-red-600" },
    { key: "almostEmpty", label: "10. Almost Empty", desc: "Zero or near empty stock cutoff", color: "border-rose-600 text-rose-600" },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                <FiSliders size={20} />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Configure 10-Level Availability Thresholds
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Customize minimum unit thresholds for inventory status indicators
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-start gap-2.5 text-xs text-blue-700 dark:text-blue-400">
              <FiInfo size={16} className="mt-0.5 shrink-0" />
              <span>
                Enter the minimum unit count required for each level. The inventory indicator automatically matches the highest valid cutoff.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {levelsConfig.map(({ key, label, desc, color }) => (
                <div
                  key={key}
                  className={`p-3 rounded-xl border ${color} bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between`}
                >
                  <div>
                    <span className="text-xs font-bold block">{label}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{desc}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Min Units:</span>
                    <input
                      type="number"
                      min={0}
                      value={form[key] ?? 0}
                      onChange={(e) => handleChange(key, parseInt(e.target.value) || 0)}
                      className="w-20 h-8 px-2 text-right text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <FiCheck size={14} />
              {saving ? "Saving..." : "Save Thresholds"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
