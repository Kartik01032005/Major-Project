"use client";

import React from "react";
import EmergencyRequestsTable from "@/components/dashboard/admin/EmergencyRequestsTable";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";

export default function AdminEmergencyRequestsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Emergency Requests</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review, approve, or reject emergency blood requests submitted by users.
          </p>
        </div>
        <EmergencyRequestsTable />
      </div>
    </ProtectedRoute>
  );
}
