"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiAlertCircle, FiFilter, FiCheckCircle, FiXCircle, FiClock, FiMapPin, FiPhone, FiUser } from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useDashboard } from "@/context";
import { RequestStatus, EmergencyRequest } from "@/types";

const STATUS_CONFIG: Record<RequestStatus, { label: string; badge: string; icon: React.ReactNode }> = {
  pending:  { label: "Pending",  badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",  icon: <FiClock size={12} /> },
  approved: { label: "Approved", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <FiCheckCircle size={12} /> },
  rejected: { label: "Rejected", badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: <FiXCircle size={12} /> },
};

const BLOOD_GROUP_COLORS: Record<string, string> = {
  "A+": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "A-": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "B+": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "B-": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "AB+": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "AB-": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "O+": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "O-": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

type FilterType = "all" | RequestStatus;

export default function EmergencyRequestsTable() {
  const { requests, updateRequestStatus } = useDashboard();
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "pending", label: `Pending (${counts.pending})` },
    { key: "approved", label: `Approved (${counts.approved})` },
    { key: "rejected", label: `Rejected (${counts.rejected})` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600">
            <FiAlertCircle size={15} />
          </span>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Emergency Requests</h3>
          {counts.pending > 0 && (
            <span className="ml-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-red-600 text-white">
              {counts.pending}
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={[
                "text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all",
                filter === f.key
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests list */}
      {filtered.length === 0 ? (
        <div className="py-12 flex flex-col items-center text-center px-6">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <FiAlertCircle size={22} />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No {filter !== "all" ? filter : ""} requests</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((req, i) => {
            const status = STATUS_CONFIG[req.status];
            const bgColor = BLOOD_GROUP_COLORS[req.bloodGroup] ?? "";
            const isExpanded = expandedId === req._id;
            return (
              <motion.li
                key={req._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                {/* Summary row */}
                <button
                  className="w-full text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : req._id)}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Blood group */}
                      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${bgColor}`}>
                        {req.bloodGroup}
                      </div>
                      {/* Info */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{req.hospitalName}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <FiUser size={11} /> {req.userName} ·
                          <FiMapPin size={11} /> {req.district}, {req.state}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.badge}`}>
                        {status.icon} {status.label}
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        {new Date(req.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expanded detail + actions */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 mb-4">
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <FiMapPin size={13} className="text-slate-400" />
                            <span><strong>Address:</strong> {req.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <FiPhone size={13} className="text-slate-400" />
                            <span><strong>Contact:</strong> {req.contactNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <FaDroplet size={11} className="text-red-400" />
                            <span><strong>Blood Group:</strong> {req.bloodGroup}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <FiClock size={13} className="text-slate-400" />
                            <span><strong>Submitted:</strong> {new Date(req.createdAt).toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        {/* Action buttons (only for pending) */}
                        {req.status === "pending" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { updateRequestStatus(req._id, "approved"); setExpandedId(null); }}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                            >
                              <FiCheckCircle size={13} /> Approve Request
                            </button>
                            <button
                              onClick={() => { updateRequestStatus(req._id, "rejected"); setExpandedId(null); }}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/60 transition-colors"
                            >
                              <FiXCircle size={13} /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
