"use client";

import React from "react";
import BloodInventoryTable from "@/components/dashboard/admin/BloodInventoryTable";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";

export default function InventoryPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Blood Inventory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track and update your blood bank&apos;s stock levels for all blood groups.
          </p>
        </div>
        <BloodInventoryTable />
      </div>
    </ProtectedRoute>
  );
}
