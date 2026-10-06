"use client";

import React from "react";
import { FiInfo, FiHeart, FiShield, FiUsers } from "react-icons/fi";
import SettingsModal from "./SettingsModal";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="About BloodLink"
      description="Smart blood donor matching and emergency health platform."
      icon={<FiInfo size={20} />}
    >
      <div className="space-y-4 text-center">
        {/* App Logo & Version */}
        <div className="pt-2">
          <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center mx-auto shadow-md">
            <FiHeart size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
            BloodLink
          </h3>
          <p className="text-xs font-semibold text-red-600 dark:text-red-400">
            Version 2.4.0 (Production Release)
          </p>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed text-left sm:text-center">
          BloodLink is a mission-critical platform engineered to bridge the gap between critical blood requirements and volunteer donors. By connecting nearby donors, hospitals, and blood banks in real time, BloodLink accelerates emergency response to save lives.
        </p>

        <div className="grid grid-cols-2 gap-2 text-left pt-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
              <FiShield size={14} className="text-emerald-500" />
              <span>Verified Donors</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Strict identity and blood-group verification.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
              <FiUsers size={14} className="text-blue-500" />
              <span>Real-Time Dispatch</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Geospatial radius alerts within minutes.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} BloodLink Healthcare Systems. All rights reserved.
          </p>
        </div>

        <div className="flex justify-end pt-1">
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
