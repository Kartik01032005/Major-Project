"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPackage, FiPlus, FiMinus, FiEdit3, FiCheck, FiX,
  FiUploadCloud, FiSliders, FiClock, FiRefreshCw,
} from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useDashboard } from "@/context";
import { BloodInventoryItem, AvailabilityThresholds } from "@/types";
import BulkUploadModal from "./BulkUploadModal";
import StockThresholdsModal from "./StockThresholdsModal";
import UploadHistoryModal from "./UploadHistoryModal";

const BLOOD_GROUP_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  "A+":  { bg: "bg-red-50 dark:bg-red-950/20",    text: "text-red-700 dark:text-red-300",    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  "A-":  { bg: "bg-red-50 dark:bg-red-950/20",    text: "text-red-700 dark:text-red-300",    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  "B+":  { bg: "bg-blue-50 dark:bg-blue-950/20",  text: "text-blue-700 dark:text-blue-300",  badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  "B-":  { bg: "bg-blue-50 dark:bg-blue-950/20",  text: "text-blue-700 dark:text-blue-300",  badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  "AB+": { bg: "bg-purple-50 dark:bg-purple-950/20", text: "text-purple-700 dark:text-purple-300", badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  "AB-": { bg: "bg-purple-50 dark:bg-purple-950/20", text: "text-purple-700 dark:text-purple-300", badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  "O+":  { bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-300", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  "O-":  { bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-300", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
};

function get10LevelStockConfig(units: number, thresholds: AvailabilityThresholds | null) {
  const t = thresholds ?? {
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

  if (units >= t.highlyAvailable) return { label: "1. Highly Available", color: "bg-emerald-600", text: "text-emerald-700 dark:text-emerald-300 font-bold", width: "100%" };
  if (units >= t.veryHigh) return { label: "2. Very High", color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400 font-semibold", width: "90%" };
  if (units >= t.high) return { label: "3. High", color: "bg-teal-500", text: "text-teal-600 dark:text-teal-400 font-semibold", width: "80%" };
  if (units >= t.good) return { label: "4. Good", color: "bg-blue-600", text: "text-blue-700 dark:text-blue-300 font-semibold", width: "70%" };
  if (units >= t.available) return { label: "5. Available", color: "bg-blue-500", text: "text-blue-600 dark:text-blue-400 font-semibold", width: "60%" };
  if (units >= t.moderate) return { label: "6. Moderate", color: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400 font-semibold", width: "50%" };
  if (units >= t.low) return { label: "7. Low", color: "bg-amber-500", text: "text-amber-600 dark:text-amber-400 font-semibold", width: "35%" };
  if (units >= t.veryLow) return { label: "8. Very Low", color: "bg-orange-500", text: "text-orange-600 dark:text-orange-400 font-semibold", width: "20%" };
  if (units >= t.critical) return { label: "9. Critical", color: "bg-red-500 animate-pulse", text: "text-red-600 dark:text-red-400 font-bold", width: "10%" };
  return { label: "10. Almost Empty", color: "bg-rose-600 animate-pulse", text: "text-rose-600 dark:text-rose-400 font-bold", width: "5%" };
}

function StockLevel({ units, thresholds }: { units: number; thresholds: AvailabilityThresholds | null }) {
  const config = get10LevelStockConfig(units, thresholds);
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden min-w-[70px]">
        <div className={`h-full rounded-full ${config.color} transition-all duration-500`} style={{ width: config.width }} />
      </div>
      <span className={`text-[10px] whitespace-nowrap ${config.text}`}>{config.label}</span>
    </div>
  );
}

// ─── Inline delta action panel ────────────────────────────────────────────────
type AdjustMode = "add" | "remove";

interface AdjustPanel {
  id: string;
  mode: AdjustMode;
  value: number;
}

interface EditingRow { id: string; value: number }

export default function BloodInventoryTable() {
  const { inventory, thresholds, updateInventory, adjustInventory, syncInventoryFromUpload } = useDashboard();

  const [editing, setEditing] = useState<EditingRow | null>(null);
  const [adjustPanel, setAdjustPanel] = useState<AdjustPanel | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isThresholdsOpen, setIsThresholdsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // ── Direct edit ──────────────────────────────────────────────────────────────
  const startEdit = (item: BloodInventoryItem) => {
    setAdjustPanel(null);
    setEditing({ id: item._id, value: item.units });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusy(true);
    try { await updateInventory(editing.id, editing.value); }
    finally { setBusy(false); setEditing(null); }
  };

  const cancelEdit = () => setEditing(null);

  // ── Adjust panel ─────────────────────────────────────────────────────────────
  const openAdjust = (item: BloodInventoryItem, mode: AdjustMode) => {
    setEditing(null);
    if (adjustPanel?.id === item._id && adjustPanel.mode === mode) {
      setAdjustPanel(null);
      return;
    }
    setAdjustPanel({ id: item._id, mode, value: 1 });
  };

  const applyAdjust = async () => {
    if (!adjustPanel) return;
    const delta = adjustPanel.mode === "add" ? adjustPanel.value : -adjustPanel.value;
    setBusy(true);
    try { await adjustInventory(adjustPanel.id, delta); }
    finally { setBusy(false); setAdjustPanel(null); }
  };

  // ── Sync ─────────────────────────────────────────────────────────────────────
  const handleSync = async (item: BloodInventoryItem) => {
    setEditing(null);
    setAdjustPanel(null);
    setSyncingId(item._id);
    try { await syncInventoryFromUpload(item._id); }
    catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message ?? "Sync failed. Please upload a file first.");
    }
    finally { setSyncingId(null); }
  };

  const totalStockUnits = inventory.reduce((sum, item) => sum + item.units, 0);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
      >
        {/* Top Header Bar with Action Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600">
              <FiPackage size={17} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Blood Bank Inventory</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {totalStockUnits} Total Units
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Last updated {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <FiUploadCloud size={14} />
              Bulk Upload File
            </button>
            <button
              onClick={() => setIsThresholdsOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <FiSliders size={13} />
              Levels &amp; Cutoffs
            </button>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <FiClock size={13} />
              Upload History
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="overflow-x-auto">
          <table className="w-full" role="grid" aria-label="Blood inventory table">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Blood Group</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Units</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">10-Level Availability Indicator</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Last Updated</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {inventory.map((item, i) => {
                const colors = BLOOD_GROUP_COLORS[item.bloodGroup] ?? { bg: "", text: "", badge: "" };
                const isEditing = editing?.id === item._id;
                const isAdjusting = adjustPanel?.id === item._id;
                const isSyncing = syncingId === item._id;

                return (
                  <React.Fragment key={item._id}>
                    <motion.tr
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isEditing ? "bg-red-50/30 dark:bg-red-950/10" :
                        isAdjusting ? "bg-blue-50/30 dark:bg-blue-950/10" : ""
                      }`}
                    >
                      {/* Blood Group */}
                      <td className="px-5 py-3.5">
                        <div className={`inline-flex items-center gap-1.5 text-sm font-bold px-2.5 py-1 rounded-lg ${colors.badge}`}>
                          <FaDroplet size={11} /> {item.bloodGroup}
                        </div>
                      </td>

                      {/* Units */}
                      <td className="px-4 py-3.5">
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-20 h-8 px-2 text-sm font-semibold rounded-lg border border-red-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                            autoFocus
                            aria-label={`Edit units for ${item.bloodGroup}`}
                          />
                        ) : (
                          <span className={`text-lg font-bold ${item.units === 0 ? "text-red-600" : "text-slate-900 dark:text-white"}`}>
                            {item.units} <span className="text-xs font-normal text-slate-400">units</span>
                          </span>
                        )}
                      </td>

                      {/* Stock Level bar */}
                      <td className="px-4 py-3.5 hidden sm:table-cell min-w-[200px]">
                        <StockLevel units={item.units} thresholds={thresholds} />
                      </td>

                      {/* Last Updated */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-slate-400">
                          {new Date(item.updatedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {isEditing ? (
                            <>
                              <button
                                onClick={saveEdit}
                                disabled={busy}
                                className="h-7 px-2.5 flex items-center gap-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 text-xs font-semibold transition-colors disabled:opacity-50"
                                aria-label="Save"
                              >
                                <FiCheck size={12} /> Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="h-7 px-2.5 flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-colors"
                                aria-label="Cancel"
                              >
                                <FiX size={12} /> Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Add Units */}
                              <button
                                onClick={() => openAdjust(item, "add")}
                                className={`h-7 px-2.5 flex items-center gap-1 rounded-lg text-xs font-semibold transition-all ${
                                  isAdjusting && adjustPanel?.mode === "add"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                                }`}
                                aria-label={`Add units for ${item.bloodGroup}`}
                                id={`add-units-${item.bloodGroup.replace("+", "pos").replace("-", "neg")}`}
                              >
                                <FiPlus size={12} /> Add
                              </button>

                              {/* Remove Units */}
                              <button
                                onClick={() => openAdjust(item, "remove")}
                                disabled={item.units === 0}
                                className={`h-7 px-2.5 flex items-center gap-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                  isAdjusting && adjustPanel?.mode === "remove"
                                    ? "bg-amber-500 text-white"
                                    : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                                }`}
                                aria-label={`Remove units for ${item.bloodGroup}`}
                                id={`remove-units-${item.bloodGroup.replace("+", "pos").replace("-", "neg")}`}
                              >
                                <FiMinus size={12} /> Remove
                              </button>

                              {/* Sync with Uploaded File */}
                              <button
                                onClick={() => handleSync(item)}
                                disabled={isSyncing}
                                className="h-7 px-2.5 flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-semibold transition-all disabled:opacity-50"
                                aria-label={`Sync ${item.bloodGroup} with uploaded file`}
                                id={`sync-units-${item.bloodGroup.replace("+", "pos").replace("-", "neg")}`}
                              >
                                <FiRefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                                {isSyncing ? "Syncing…" : "Sync"}
                              </button>

                              {/* Direct edit (set exact number) */}
                              <button
                                onClick={() => startEdit(item)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                aria-label={`Edit ${item.bloodGroup} units directly`}
                                id={`edit-units-${item.bloodGroup.replace("+", "pos").replace("-", "neg")}`}
                              >
                                <FiEdit3 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>

                    {/* Inline Adjust Panel – expands below the row */}
                    <AnimatePresence>
                      {isAdjusting && (
                        <motion.tr
                          key={`adjust-${item._id}`}
                          initial={{ opacity: 0, scaleY: 0.8 }}
                          animate={{ opacity: 1, scaleY: 1 }}
                          exit={{ opacity: 0, scaleY: 0.8 }}
                          transition={{ duration: 0.18 }}
                          style={{ originY: 0 }}
                        >
                          <td colSpan={5} className="px-5 pb-3 pt-0">
                            <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                              adjustPanel?.mode === "add"
                                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                                : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                            }`}>
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {adjustPanel?.mode === "add" ? "➕ Units to add:" : "➖ Units to remove:"}
                              </span>
                              <input
                                type="number"
                                min={1}
                                max={adjustPanel?.mode === "remove" ? item.units : undefined}
                                value={adjustPanel?.value ?? 1}
                                onChange={(e) =>
                                  setAdjustPanel((prev) =>
                                    prev ? { ...prev, value: Math.max(1, parseInt(e.target.value) || 1) } : prev
                                  )
                                }
                                className="w-24 h-8 px-2 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                                autoFocus
                                aria-label={`Amount to ${adjustPanel?.mode}`}
                              />
                              <span className="text-xs text-slate-400">units</span>
                              <button
                                onClick={applyAdjust}
                                disabled={busy}
                                className={`h-8 px-4 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50 ${
                                  adjustPanel?.mode === "add"
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-amber-500 hover:bg-amber-600"
                                }`}
                              >
                                {busy ? "Saving…" : adjustPanel?.mode === "add" ? "Add Units" : "Remove Units"}
                              </button>
                              <button
                                onClick={() => setAdjustPanel(null)}
                                className="h-8 px-3 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modals */}
      <BulkUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <StockThresholdsModal
        key={thresholds ? JSON.stringify(thresholds) : "default"}
        isOpen={isThresholdsOpen}
        onClose={() => setIsThresholdsOpen(false)}
      />
      <UploadHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </>
  );
}
