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
        {/* Blood Inventory (with Bulk Upload) & Emergency Requests — Top Priority (No scroll needed) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <BloodInventoryTable />
          <EmergencyRequestsTable />
        </div>

        {/* Stats Cards */}
        <AdminStatsCards />

        {/* Hospital Management */}
        <HospitalManagement />
      </div>
    </ProtectedRoute>
  );
}
