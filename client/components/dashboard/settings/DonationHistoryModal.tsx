"use client";

import React from "react";
import { FiClock, FiCheckCircle, FiHeart, FiCalendar } from "react-icons/fi";
import SettingsModal from "./SettingsModal";
import { User, DonorProfileStats } from "@/types";

interface DonationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: (User & { donorStats?: DonorProfileStats }) | null;
}

export default function DonationHistoryModal({
  isOpen,
  onClose,
  user,
}: DonationHistoryModalProps) {
  const stats = user?.donorStats;
  const fulfilledCount = stats?.donationsCount ?? 0;
  const lastDonation = stats?.lastDonationDate;

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Donation History"
      description="Record of verified blood donations fulfilled through BloodLink."
      icon={<FiClock size={20} />}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Summary banner */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Fulfilled
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {fulfilledCount} <span className="text-xs font-normal text-slate-500">donations</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Last Verified Donation
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
              {lastDonation ? new Date(lastDonation).toLocaleDateString() : "No record"}
            </p>
          </div>
        </div>

        {/* Content list or honest empty state without fake data */}
        {fulfilledCount > 0 && lastDonation ? (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Verified Records
            </h4>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <FiCheckCircle size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    Emergency Blood Donation Fulfilled
                  </p>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <FiCalendar size={11} />
                    {new Date(lastDonation).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Blood Group: {user?.bloodGroup || "—"} · Status: Verified by Medical Center
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center mb-3">
              <FiHeart size={22} />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              No Past Donations Recorded Yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
              When you accept an emergency blood request and complete the donation at a verified hospital or blood bank, your record will automatically appear here.
            </p>
          </div>
        )}

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
