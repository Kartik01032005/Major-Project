"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiMenu, FiCheck } from "react-icons/fi";
import { useAuth } from "@/context";
import { useDashboard } from "@/context";
import ThemeToggle from "@/components/ui/ThemeToggle";

// ─── Page title map ───────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  "/dashboard":                   "Overview",
  "/dashboard/profile":           "My Profile",
  "/dashboard/emergency":         "Emergency Request",
  "/dashboard/requests":          "My Requests",
  "/dashboard/notifications":     "Notifications",
  "/dashboard/nearby":            "Nearby Blood Banks",
  "/dashboard/admin":             "Admin Overview",
  "/dashboard/admin/inventory":   "Blood Inventory",
  "/dashboard/admin/hospitals":   "Hospital Management",
  "/dashboard/admin/requests":    "Emergency Requests",
};

interface DashboardTopbarProps {
  onMenuClick: () => void;
}

export default function DashboardTopbar({ onMenuClick }: DashboardTopbarProps) {
  const { user } = useAuth();
  const { notifications, unreadCount, markAllRead, markRead } = useDashboard();
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const pageTitle = PAGE_TITLES[pathname] ?? "Dashboard";

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const recentNotifs = notifications.slice(0, 6);

  return (
    <header className="h-16 flex-shrink-0 flex items-center gap-3 px-4 sm:px-6 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      {/* Hamburger (mobile only) */}
      <button
        id="dashboard-menu-btn"
        className={[
          "md:hidden w-9 h-9 flex items-center justify-center rounded-lg",
          "text-slate-500 hover:text-slate-900 hover:bg-slate-100",
          "dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
        ].join(" ")}
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <FiMenu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-900 dark:text-white truncate">{pageTitle}</h1>
        {user && (
          <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
            {user.role === "admin" ? "Administrator" : "Donor Account"} · {user.email}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            id="notif-bell-btn"
            className={[
              "relative w-9 h-9 flex items-center justify-center rounded-lg",
              "text-slate-500 hover:text-slate-900 hover:bg-slate-100",
              "dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
            ].join(" ")}
            onClick={() => setNotifOpen((p) => !p)}
            aria-label={`Notifications (${unreadCount} unread)`}
            aria-haspopup="true"
            aria-expanded={notifOpen}
          >
            <FiBell size={18} />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className={[
                  "absolute right-0 top-12 z-50 w-80 sm:w-96",
                  "bg-white dark:bg-slate-900 rounded-2xl shadow-xl",
                  "border border-slate-200 dark:border-slate-800",
                  "overflow-hidden",
                ].join(" ")}
                role="dialog"
                aria-label="Notifications"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
                    >
                      <FiCheck size={12} /> Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {recentNotifs.length === 0 ? (
                    <div className="py-10 text-center text-sm text-slate-400">No notifications yet</div>
                  ) : (
                    recentNotifs.map((n) => (
                      <button
                        key={n._id}
                        className={[
                          "w-full text-left px-4 py-3 transition-colors",
                          n.isRead
                            ? "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                            : "bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30",
                        ].join(" ")}
                        onClick={() => { markRead(n._id); }}
                      >
                        <div className="flex items-start gap-2">
                          {!n.isRead && (
                            <span className="mt-1.5 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" aria-hidden="true" />
                          )}
                          <div className={!n.isRead ? "" : "pl-4"}>
                            <p className="text-xs font-semibold text-slate-900 dark:text-white">{n.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(n.createdAt).toLocaleString("en-IN", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar */}
        <div className="hidden sm:flex w-9 h-9 rounded-xl bg-red-600 items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?"}
        </div>
      </div>
    </header>
  );
}
