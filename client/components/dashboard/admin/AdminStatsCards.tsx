"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiPackage, FiAlertCircle, FiCrosshair, FiClock } from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useDashboard } from "@/context";

export default function AdminStatsCards() {
  const { inventory, requests, hospitals } = useDashboard();

  const totalUnits = inventory.reduce((sum, item) => sum + item.units, 0);
  const activeRequests = requests.filter((r) => r.status === "Pending").length;
  const pendingApprovals = requests.filter((r) => r.status === "Pending").length;

  const stats = [
    {
      id: "total-units",
      label: "Total Blood Units",
      value: totalUnits,
      suffix: "units",
      icon: <FaDroplet size={20} />,
      color: "bg-red-100 dark:bg-red-950/40 text-red-600",
      trend: "+12 this week",
      trendColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      id: "active-requests",
      label: "Active Requests",
      value: activeRequests,
      suffix: "pending",
      icon: <FiAlertCircle size={20} />,
      color: "bg-amber-100 dark:bg-amber-950/40 text-amber-600",
      trend: "Needs attention",
      trendColor: "text-amber-600 dark:text-amber-400",
    },
    {
      id: "hospitals",
      label: "Hospitals Managed",
      value: hospitals.length,
      suffix: "registered",
      icon: <FiCrosshair size={20} />,
      color: "bg-blue-100 dark:bg-blue-950/40 text-blue-600",
      trend: "Active network",
      trendColor: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "pending-approvals",
      label: "Pending Approvals",
      value: pendingApprovals,
      suffix: "to review",
      icon: <FiClock size={20} />,
      color: "bg-purple-100 dark:bg-purple-950/40 text-purple-600",
      trend: "Act fast",
      trendColor: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.35 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08 + 0.2 }}
              className="text-3xl font-bold text-slate-900 dark:text-white"
            >
              {stat.value}
            </motion.span>
            <span className="text-xs text-slate-400">{stat.suffix}</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
          <p className={`text-[11px] font-semibold mt-2 ${stat.trendColor}`}>{stat.trend}</p>
        </motion.div>
      ))}
    </div>
  );
}
