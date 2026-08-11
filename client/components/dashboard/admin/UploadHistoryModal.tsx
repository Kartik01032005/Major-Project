"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiClock, FiFileText, FiX, FiLayers, FiRefreshCw, FiAlertTriangle, FiCheck } from "react-icons/fi";
import { useDashboard } from "@/context";
import { InventoryUploadLogItem } from "@/types";

interface UploadHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadHistoryModal({ isOpen, onClose }: UploadHistoryModalProps) {
  const { uploadHistory } = useDashboard();
  const [selectedLog, setSelectedLog] = useState<InventoryUploadLogItem | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                <FiClock size={20} />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bulk Upload History
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Audit log of past blood inventory file uploads
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
            {uploadHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FiFileText size={36} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">No upload history records found.</p>
                <p className="text-[11px] mt-1">Uploaded files will be logged here automatically.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      <th className="pb-3 px-3">File Name</th>
                      <th className="pb-3 px-3">Mode</th>
                      <th className="pb-3 px-3">Date</th>
                      <th className="pb-3 px-3 text-center">Valid / Total</th>
                      <th className="pb-3 px-3 text-right">Units Added</th>
                      <th className="pb-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {uploadHistory.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <FiFileText size={15} className="text-red-500 shrink-0" />
                            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">
                              {log.fileName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={[
                              "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                              log.mode === "replace"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                            ].join(" ")}
                          >
                            {log.mode === "replace" ? <FiRefreshCw size={9} /> : <FiLayers size={9} />}
                            {log.mode}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-slate-700 dark:text-slate-300">
                          <span className="text-emerald-600 font-bold">{log.summary.validRecords}</span> / {log.summary.totalParsed}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                          +{log.summary.unitsAdded}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedLog(selectedLog?._id === log._id ? null : log)}
                            className="px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                          >
                            {selectedLog?._id === log._id ? "Hide Details" : "View Breakdown"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Log Details Modal / Expanded Card */}
            {selectedLog && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Parsed Units Breakdown for {selectedLog.fileName}
                  </h4>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(selectedLog.summary.unitsByGroup || {}).map(([bg, count]) => (
                    <div key={bg} className="p-2 rounded-lg bg-white dark:bg-slate-900 text-center border border-slate-200/50 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-red-600 block">{bg}</span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {count} units
                      </span>
                    </div>
                  ))}
                </div>

                {selectedLog.summary.errors && selectedLog.summary.errors.length > 0 && (
                  <div className="mt-2">
                    <h5 className="text-[11px] font-bold text-amber-600 flex items-center gap-1 mb-1">
                      <FiAlertTriangle size={12} /> Logged Validation Errors ({selectedLog.summary.errors.length})
                    </h5>
                    <div className="max-h-28 overflow-y-auto text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                      {selectedLog.summary.errors.map((err, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <span className="font-semibold text-amber-600">{err.row ? `Row ${err.row}:` : "Info:"}</span>
                          <span>{err.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
