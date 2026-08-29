"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiX, FiCheck, FiLoader } from "react-icons/fi";
import { useTranslation } from "@/context";
import { EmergencyRequest } from "@/types";

interface DonorAcceptanceModalProps {
  open: boolean;
  request: EmergencyRequest | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DonorAcceptanceModal({
  open,
  request,
  loading = false,
  error = null,
  onClose,
  onConfirm,
}: DonorAcceptanceModalProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {open && request && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm"
            onClick={loading ? undefined : onClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-auto">
            <motion.div
              key="modal-content"
              role="dialog"
              aria-modal="true"
              aria-labelledby="acceptance-modal-title"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                    <FiAlertTriangle size={18} />
                  </span>
                  <h3
                    id="acceptance-modal-title"
                    className="text-base font-bold text-slate-900 dark:text-white"
                  >
                    {t("donor_acceptance_modal_title")}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  aria-label="Close modal"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                {/* Request Highlight */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900 dark:text-white">{request.hospital}</span>
                    <span className="font-bold px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                      {request.bloodGroup}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 truncate">
                    {request.district}, {request.state}
                  </p>
                </div>

                {/* Notice text */}
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t("donor_acceptance_modal_message")}
                </p>

                {/* Confirmation question */}
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t("donor_acceptance_modal_question")}
                </p>

                {/* Error Banner */}
                {error && (
                  <div
                    className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2"
                    role="alert"
                  >
                    <FiAlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {t("donor_acceptance_cancel_btn")}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60 shadow-sm"
                >
                  {loading ? (
                    <>
                      <FiLoader size={13} className="animate-spin" />
                      {t("requests_accepting")}
                    </>
                  ) : (
                    <>
                      <FiCheck size={13} />
                      {t("donor_acceptance_confirm_btn")}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
