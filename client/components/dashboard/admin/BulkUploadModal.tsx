"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUploadCloud, FiFileText, FiCheckCircle, FiAlertCircle,
  FiX, FiRefreshCw, FiCheck, FiLayers, FiAlertTriangle
} from "react-icons/fi";
import { useDashboard } from "@/context";
import { UploadSummary } from "@/types";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkUploadModal({ isOpen, onClose }: BulkUploadModalProps) {
  const { uploadInventoryFile } = useDashboard();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const validExts = [".xlsx", ".xls", ".csv", ".pdf"];
    if (!validExts.includes(ext)) {
      setErrorMsg("Invalid file extension. Only .xlsx, .xls, .csv, and .pdf files are supported.");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File size exceeds 10MB limit.");
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setSummary(null);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setSummary(null);
      }
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(20);
    setErrorMsg("");

    try {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 150);

      const resSummary = await uploadInventoryFile(selectedFile, mode);
      clearInterval(interval);
      setProgress(100);
      setSummary(resSummary);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message || error.message || "Failed to process inventory upload.";
      setErrorMsg(msg);
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setSummary(null);
    setErrorMsg("");
    setProgress(0);
    setUploading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600">
                <FiUploadCloud size={20} />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bulk Blood Inventory Upload
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload Excel (.xlsx, .xls), CSV, or PDF inventory files
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6">

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-400 text-xs">
                <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Upload Error</p>
                  <p className="mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {!summary ? (
              <>
                {/* Upload Mode Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Select Update Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMode("merge")}
                      className={[
                        "p-3.5 rounded-xl border text-left transition-all flex items-start gap-3",
                        mode === "merge"
                          ? "border-red-500 bg-red-50/40 dark:bg-red-950/20 text-slate-900 dark:text-white ring-1 ring-red-500/30"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                      ].join(" ")}
                    >
                      <FiLayers size={18} className="mt-0.5 text-red-600 shrink-0" />
                      <div>
                        <span className="block text-xs font-bold">Merge / Add to Stock</span>
                        <span className="text-[11px] opacity-80 block mt-0.5">
                          Increments current inventory with units extracted from file.
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("replace")}
                      className={[
                        "p-3.5 rounded-xl border text-left transition-all flex items-start gap-3",
                        mode === "replace"
                          ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-slate-900 dark:text-white ring-1 ring-amber-500/30"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                      ].join(" ")}
                    >
                      <FiRefreshCw size={18} className="mt-0.5 text-amber-600 shrink-0" />
                      <div>
                        <span className="block text-xs font-bold">Replace All Inventory</span>
                        <span className="text-[11px] opacity-80 block mt-0.5">
                          Resets existing inventory and sets exact stock counts from file.
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={[
                    "relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3",
                    dragActive
                      ? "border-red-500 bg-red-50/30 dark:bg-red-950/20 scale-[0.99]"
                      : "border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-800 bg-slate-50/50 dark:bg-slate-900/50"
                  ].join(" ")}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <FiFileText size={24} className="text-red-600" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[300px]">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600">
                        <FiUploadCloud size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Click to upload or drag & drop file
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Supported formats: Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf) up to 10MB
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span>Parsing & Validating Inventory Data...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600 transition-all duration-300 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Validation Results Display */
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-3">
                  <FiCheckCircle size={24} className="text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                      File Upload Processed Successfully!
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Updated inventory in <strong className="uppercase">{mode}</strong> mode.
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total Rows</span>
                    <span className="block text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {summary.totalParsed}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                    <span className="text-xs text-emerald-700 dark:text-emerald-400">Valid Records</span>
                    <span className="block text-lg font-bold text-emerald-600 mt-0.5">
                      {summary.validRecords}
                    </span>
                  </div>
                  <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30 text-center">
                    <span className="text-xs text-amber-700 dark:text-amber-400">Invalid / Warnings</span>
                    <span className="block text-lg font-bold text-amber-600 mt-0.5">
                      {summary.invalidRecords}
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30 text-center">
                    <span className="text-xs text-blue-700 dark:text-blue-400">Units Added</span>
                    <span className="block text-lg font-bold text-blue-600 mt-0.5">
                      +{summary.unitsAdded}
                    </span>
                  </div>
                </div>

                {/* Parsed Units Breakdown */}
                <div>
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Extracted Blood Group Units
                  </h5>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(summary.unitsByGroup).map(([bg, count]) => (
                      <div key={bg} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-center">
                        <span className="text-[11px] font-bold text-red-600 dark:text-red-400 block">{bg}</span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {count} units
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Errors & Skipped Rows Accordion */}
                {summary.errors && summary.errors.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                      <FiAlertTriangle size={14} /> Validation Warnings / Invalid Rows ({summary.errors.length})
                    </h5>
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 p-3 space-y-1.5 text-xs text-slate-700 dark:text-slate-300 divide-y divide-amber-100 dark:divide-amber-900/30">
                      {summary.errors.map((err, idx) => (
                        <div key={idx} className="pt-1.5 first:pt-0 flex items-start gap-2">
                          <span className="font-semibold text-amber-600 shrink-0">
                            {err.row ? `Row ${err.row}:` : "Notice:"}
                          </span>
                          <span>{err.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            {!summary ? (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedFile || uploading}
                  onClick={handleUploadSubmit}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                  {uploading ? (
                    <>
                      <FiRefreshCw size={14} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiCheck size={14} />
                      Upload & Update Inventory
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
              >
                Done & Return to Table
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
