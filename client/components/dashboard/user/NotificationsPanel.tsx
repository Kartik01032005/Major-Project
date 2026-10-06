"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiBell, FiCheck, FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo, FiPackage } from "react-icons/fi";
import { useDashboard, useTranslation } from "@/context";
import { NotificationType } from "@/types";

const TYPE_CONFIG: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  Emergency:  { icon: <FiAlertCircle size={16} />,  color: "text-amber-400 bg-amber-500/10 border border-amber-500/20" },
  Approval:   { icon: <FiCheckCircle size={16} />,  color: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" },
  Rejection:  { icon: <FiXCircle size={16} />,      color: "text-red-400 bg-red-500/10 border border-red-500/20" },
  Inventory:  { icon: <FiPackage size={16} />,      color: "text-blue-400 bg-blue-500/10 border border-blue-500/20" },
  System:     { icon: <FiInfo size={16} />,         color: "text-slate-400 bg-slate-500/10 border border-slate-500/20" },
};

export default function NotificationsPanel() {
  const { notifications, unreadCount, markAllRead, markRead } = useDashboard();
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setCurrentTime(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function timeAgo(date: string): string {
    const diff = currentTime - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("common_just_now");
    if (mins < 60) return `${mins}${t("common_ago_minutes")}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}${t("common_ago_hours")}`;
    return `${Math.floor(hrs / 24)}${t("common_ago_days")}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-red-500/10 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400">
            <FiBell size={16} />
          </span>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t("notifications_title")}</h3>
            {unreadCount > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
                {unreadCount} {t("notifications_new")}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <FiCheck size={12} /> {t("notifications_mark_all")}
            </button>
          )}
          <Link
            href="/dashboard/notifications"
            className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 hover:underline"
          >
            View All
          </Link>
        </div>
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="py-10 flex flex-col items-center text-center px-6">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <FiBell size={22} />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("notifications_empty_title")}</p>
          <p className="text-xs text-slate-400 mt-1">{t("notifications_empty_sub")}</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
          {notifications.map((n, i) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.System;
            return (
              <motion.li
                key={n._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={[
                  "flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors",
                  n.isRead
                    ? "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    : "bg-red-50/40 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20",
                ].join(" ")}
                onClick={() => markRead(n._id)}
                role="listitem"
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.color}`}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.isRead ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white"}`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                </div>

                {/* Unread dot */}
                {!n.isRead && (
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" aria-label={t("notifications_unread")} />
                )}
              </motion.li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
