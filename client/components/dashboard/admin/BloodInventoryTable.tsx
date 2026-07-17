"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiPackage, FiPlus, FiMinus, FiEdit3, FiCheck, FiX } from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useDashboard } from "@/context";
import { BloodInventoryItem } from "@/types";

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

function StockLevel({ units }: { units: number }) {
  const level = units === 0 ? "critical" : units < 5 ? "low" : units < 15 ? "moderate" : "good";
  const config = {
    critical: { label: "Critical", color: "bg-red-500",    width: "5%",   text: "text-red-600 dark:text-red-400" },
    low:      { label: "Low",      color: "bg-amber-500",  width: `${Math.min(100, units * 5)}%`, text: "text-amber-600 dark:text-amber-400" },
    moderate: { label: "Moderate", color: "bg-blue-500",   width: `${Math.min(100, units * 3)}%`, text: "text-blue-600 dark:text-blue-400" },
    good:     { label: "Good",     color: "bg-emerald-500",width: `${Math.min(100, units * 2)}%`, text: "text-emerald-600 dark:text-emerald-400" },
  }[level];

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden min-w-[60px]">
        <div className={`h-full rounded-full ${config.color} transition-all duration-500`} style={{ width: config.width }} />
      </div>
      <span className={`text-[10px] font-semibold whitespace-nowrap ${config.text}`}>{config.label}</span>
    </div>
  );
}

interface EditingRow { id: string; value: number }

export default function BloodInventoryTable() {
  const { inventory, updateInventory } = useDashboard();
  const [editing, setEditing] = useState<EditingRow | null>(null);

  const startEdit = (item: BloodInventoryItem) => {
    setEditing({ id: item._id, value: item.units });
  };

  const saveEdit = () => {
    if (!editing) return;
    updateInventory(editing.id, editing.value);
    setEditing(null);
  };

  const cancelEdit = () => setEditing(null);

  const adjust = (item: BloodInventoryItem, delta: number) => {
    updateInventory(item._id, Math.max(0, item.units + delta));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <span className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600">
          <FiPackage size={15} />
        </span>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Blood Inventory</h3>
        <span className="ml-auto text-[11px] text-slate-400">
          Last updated {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" role="grid" aria-label="Blood inventory table">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Blood Group</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Units</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Stock Level</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Last Updated</th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {inventory.map((item, i) => {
              const colors = BLOOD_GROUP_COLORS[item.bloodGroup] ?? { bg: "", text: "", badge: "" };
              const isEditing = editing?.id === item._id;
              return (
                <motion.tr
                  key={item._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${isEditing ? "bg-red-50/30 dark:bg-red-950/10" : ""}`}
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
                        {item.units}
                      </span>
                    )}
                  </td>

                  {/* Stock Level bar */}
                  <td className="px-4 py-3.5 hidden sm:table-cell min-w-[140px]">
                    <StockLevel units={item.units} />
                  </td>

                  {/* Last Updated */}
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-xs text-slate-400">
                      {new Date(item.lastUpdated).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {isEditing ? (
                        <>
                          <button
                            onClick={saveEdit}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors"
                            aria-label="Save"
                          >
                            <FiCheck size={13} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            aria-label="Cancel"
                          >
                            <FiX size={13} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => adjust(item, -1)}
                            disabled={item.units === 0}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            aria-label={`Decrease ${item.bloodGroup} units`}
                          >
                            <FiMinus size={13} />
                          </button>
                          <button
                            onClick={() => adjust(item, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            aria-label={`Increase ${item.bloodGroup} units`}
                          >
                            <FiPlus size={13} />
                          </button>
                          <button
                            onClick={() => startEdit(item)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            aria-label={`Edit ${item.bloodGroup} units`}
                          >
                            <FiEdit3 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
