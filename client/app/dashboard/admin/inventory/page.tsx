"use client";

import React from "react";
import BloodInventoryTable from "@/components/dashboard/admin/BloodInventoryTable";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";

export default function InventoryPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <h1 className="sr-only">Blood Inventory</h1>
        <BloodInventoryTable />
      </div>
    </ProtectedRoute>
  );
}
