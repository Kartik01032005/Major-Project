"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome, FiUser, FiAlertCircle, FiBell, FiMap,
  FiPackage, FiCrosshair, FiList, FiLogOut, FiX,
  FiChevronLeft, FiChevronRight,
} from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useAuth } from "@/context";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const USER_NAV: NavItem[] = [
  { label: "Overview",         href: "/dashboard",                  icon: <FiHome size={18} /> },
  { label: "My Profile",       href: "/dashboard/profile",          icon: <FiUser size={18} /> },
  { label: "Emergency Request",href: "/dashboard/emergency",        icon: <FiAlertCircle size={18} /> },
  { label: "My Requests",      href: "/dashboard/requests",         icon: <FiList size={18} /> },
  { label: "Notifications",    href: "/dashboard/notifications",    icon: <FiBell size={18} /> },
  { label: "Nearby Banks",     href: "/dashboard/nearby",           icon: <FiMap size={18} /> },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Overview",         href: "/dashboard/admin",            icon: <FiHome size={18} /> },
  { label: "Blood Inventory",  href: "/dashboard/admin/inventory",  icon: <FiPackage size={18} /> },
  { label: "Hospitals",        href: "/dashboard/admin/hospitals",  icon: <FiCrosshair size={18} /> },
  { label: "Emergency Requests",href: "/dashboard/admin/requests",  icon: <FiAlertCircle size={18} /> },
];

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

interface DashboardSidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export default function DashboardSidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: DashboardSidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const nav = user?.role === "admin" ? ADMIN_NAV : USER_NAV;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const renderSidebarContent = (mobile = false) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={[
        "flex items-center h-16 border-b border-slate-200 dark:border-slate-800 flex-shrink-0",
        collapsed && !mobile ? "justify-center px-4" : "px-5 gap-2.5",
      ].join(" ")}>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-red-600 flex-shrink-0"
        >
          <FaDroplet size={20} />
        </motion.div>
        {(!collapsed || mobile) && (
          <span className="text-[16px] font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            Blood<span className="text-red-600">Link</span>
          </span>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label="Dashboard navigation">
        {nav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/dashboard/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => mobile && setMobileOpen(false)}
              title={collapsed && !mobile ? item.label : undefined}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all duration-150 group outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                collapsed && !mobile ? "justify-center" : "",
                isActive
                  ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
              ].join(" ")}
            >
              <span className={["flex-shrink-0 transition-colors", isActive ? "text-red-600 dark:text-red-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"].join(" ")}>
                {item.icon}
              </span>
              {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Card */}
      <div className={[
        "border-t border-slate-200 dark:border-slate-800 p-3 flex-shrink-0",
        collapsed && !mobile ? "flex flex-col items-center gap-2" : "flex items-center gap-3",
      ].join(" ")}>
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {initials}
        </div>

        {(!collapsed || mobile) && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={[
                "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                BLOOD_GROUP_COLORS[user?.bloodGroup ?? "O+"] ?? "bg-slate-100 text-slate-600",
              ].join(" ")}>
                {user?.bloodGroup}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">{user?.role}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title="Sign out"
          className={[
            "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg",
            "text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
          ].join(" ")}
          aria-label="Sign out"
        >
          <FiLogOut size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ───────────────────────────────────────────────── */}
      <aside
        className={[
          "hidden md:flex flex-col relative h-full",
          "bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800",
          "transition-all duration-300 ease-in-out flex-shrink-0",
          collapsed ? "w-[68px]" : "w-64",
        ].join(" ")}
      >
        {renderSidebarContent(false)}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={[
            "absolute -right-3 top-20 z-10",
            "w-6 h-6 rounded-full bg-white dark:bg-slate-800",
            "border border-slate-200 dark:border-slate-700",
            "flex items-center justify-center shadow-sm",
            "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
            "transition-colors hover:bg-slate-50 dark:hover:bg-slate-700",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
          ].join(" ")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <FiChevronRight size={13} /> : <FiChevronLeft size={13} />}
        </button>
      </aside>

      {/* ── Mobile Overlay + Drawer ───────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className={[
                "fixed top-0 left-0 bottom-0 z-50 w-72",
                "bg-white dark:bg-slate-950",
                "border-r border-slate-200 dark:border-slate-800",
                "flex flex-col shadow-2xl md:hidden",
              ].join(" ")}
            >
              <button
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
              >
                <FiX size={18} />
              </button>
              {renderSidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
