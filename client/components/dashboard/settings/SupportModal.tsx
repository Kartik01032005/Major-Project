"use client";

import React from "react";
import { FiHelpCircle, FiPhone, FiMail, FiHeart } from "react-icons/fi";
import SettingsModal from "./SettingsModal";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Help & Support"
      description="Connect with BloodLink emergency operations and support services."
      icon={<FiHelpCircle size={20} />}
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
        {/* Urgent Alert Banner */}
        <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-3 text-red-900 dark:text-red-200">
          <FiHeart className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" size={16} />
          <div>
            <p className="font-bold">Life-Threatening Medical Emergency?</p>
            <p className="mt-0.5 text-[11px] leading-relaxed">
              If a patient requires immediate trauma stabilization, call national emergency response (108 / 112) immediately while broadcasting on BloodLink.
            </p>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
            Direct Helplines
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <FiPhone className="text-red-600" size={14} />
                <span>National Blood Helpline</span>
              </div>
              <p className="text-sm font-bold text-red-600 dark:text-red-400 mt-1">104 / 1910</p>
              <p className="text-[10px] text-slate-400 mt-0.5">24x7 Government Blood Services</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <FiMail className="text-blue-600" size={14} />
                <span>Support Team</span>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">support@bloodlink.org</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Inquiries & verification assistance</p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
            Donor FAQs
          </h4>
          <div className="space-y-2">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <p className="font-semibold text-slate-900 dark:text-white">How often can I donate whole blood?</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Every 90 days (3 months) for men and 120 days (4 months) for women to maintain safe hemoglobin levels.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <p className="font-semibold text-slate-900 dark:text-white">Are emergency requests pre-screened?</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Requests verified by hospital coordinators or authenticated doctors display a verified badge.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </SettingsModal>
  );
}
