"use client";

import React from "react";
import EmergencyRequestsTable from "@/components/dashboard/admin/EmergencyRequestsTable";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";

export default function AdminEmergencyRequestsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <h1 className="sr-only">Emergency Requests</h1>
        <EmergencyRequestsTable />
      </div>
    </ProtectedRoute>
  );
}
