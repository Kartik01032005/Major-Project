"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiAlertCircle, FiClock, FiMapPin, FiPhone, FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";
import { useAuth, useDashboard, useTranslation } from "@/context";
import { RequestStatus } from "@/types";

const STATUS_ICONS: Record<RequestStatus, React.ReactNode> = {
  Pending:   <FiClock size={12} />,
  Approved:  <FiCheckCircle size={12} />,
  Rejected:  <FiXCircle size={12} />,
  Completed: <FiCheckCircle size={12} />,
  Cancelled: <FiXCircle size={12} />,
};

const STATUS_COLORS: Record<RequestStatus, string> = {
  Pending:   "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400",
  Approved:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Rejected:  "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400",
  Completed: "bg-slate-100  text-slate-700  dark:bg-slate-800     dark:text-slate-400",
  Cancelled: "bg-slate-100  text-slate-700  dark:bg-slate-800     dark:text-slate-400",
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

interface ActiveRequestsCardProps {
  onNewRequest: () => void;
}

export default function ActiveRequestsCard({ onNewRequest }: ActiveRequestsCardProps) {
  const { user } = useAuth();
  const { requests, refreshRequests, loadingRequests, cancelRequest } = useDashboard();
  const { t } = useTranslation();
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    refreshRequests();
  }, [refreshRequests]);

  const currentUserId = user?._id;

  const getStatusLabel = (status: RequestStatus) => {
    switch (status) {
      case "Pending": return t("requests_status_pending");
      case "Approved": return t("requests_status_approved");
      case "Rejected": return t("requests_status_rejected");
      case "Completed": return t("requests_status_completed");
      case "Cancelled": return t("requests_status_cancelled");
      default: return status;
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!window.confirm(t("requests_confirm_cancel"))) return;

    setCancelError(null);
    setCancelLoading(requestId);
    try {
      await cancelRequest(requestId);
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : "Failed to cancel request");
    } finally {
      setCancelLoading(null);
    }
  };

  // Show only this user's requests
  const myRequests = requests.filter((r) => {
    if (!currentUserId) return false;
    let reqUserId = "";
    if (typeof r.requestBy === "object" && r.requestBy !== null) {
      reqUserId = r.requestBy._id || "";
    } else if (typeof r.requestBy === "string") {
      reqUserId = r.requestBy;
    }
    return String(reqUserId) === String(currentUserId);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600">
            <FiAlertCircle size={15} />
          </span>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("requests_title")}</h3>
          {myRequests.length > 0 && (
            <span className="ml-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
              {myRequests.length}
            </span>
          )}
          {loadingRequests && (
            <FiLoader size={14} className="ml-2 text-slate-400 animate-spin" />
          )}
        </div>
        <button
          onClick={onNewRequest}
          className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
        >
          {t("requests_new")}
        </button>
      </div>

      {/* Content */}
      {myRequests.length === 0 ? (
        <div className="py-10 flex flex-col items-center text-center px-6">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <FiAlertCircle size={22} />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t("requests_empty_title")}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            {t("requests_empty_sub")}
          </p>
          <button
            onClick={onNewRequest}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            {t("requests_create_btn")}
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {cancelError && (
            <li className="px-5 py-3 text-xs text-red-600 dark:text-red-400" role="alert">
              {cancelError}
            </li>
          )}
          {myRequests.map((req, i) => {
            const statusLabel = getStatusLabel(req.status);
            const statusColor = STATUS_COLORS[req.status];
            const statusIcon = STATUS_ICONS[req.status];
            const bgColor = BLOOD_GROUP_COLORS[req.bloodGroup] ?? "";
            return (
              <motion.li
                key={req._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="px-5 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Blood group circle */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${bgColor}`}>
                      {req.bloodGroup}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{req.hospital}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <FiMapPin size={11} />
                        <span className="truncate">{req.district}, {req.state}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <FiPhone size={11} />
                        <span>{req.contactNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
                      {statusIcon} {statusLabel}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                {req.status === "Pending" && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleCancel(req._id)}
                      disabled={cancelLoading === req._id}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelLoading === req._id && <FiLoader size={12} className="animate-spin" />}
                      {cancelLoading === req._id ? t("requests_cancelling") : t("requests_cancel")}
                    </button>
                  </div>
                )}
              </motion.li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
