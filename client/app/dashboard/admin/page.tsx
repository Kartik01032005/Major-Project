"use client";

import React from "react";
import { motion } from "framer-motion";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";
import AdminStatsCards from "@/components/dashboard/admin/AdminStatsCards";
import BloodInventoryTable from "@/components/dashboard/admin/BloodInventoryTable";
import EmergencyRequestsTable from "@/components/dashboard/admin/EmergencyRequestsTable";
import HospitalManagement from "@/components/dashboard/admin/HospitalManagement";

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Admin welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 dark:from-slate-900 dark:to-slate-950 p-6 sm:p-8 text-white"
        >
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-red-600/10" />
            <div className="absolute -bottom-8 left-1/3 w-64 h-32 rounded-full bg-red-600/5" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-600/20 text-red-300 border border-red-500/20">
                Admin Panel
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Admin Dashboard</h2>
            <p className="text-slate-300 text-sm">
              Manage blood inventory, review emergency requests, and maintain hospital records.
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <AdminStatsCards />

        {/* Two-column grid: inventory + requests */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <BloodInventoryTable />
          <EmergencyRequestsTable />
        </div>

        {/* Hospital Management */}
        <HospitalManagement />
      </div>
    </ProtectedRoute>
  );
}
