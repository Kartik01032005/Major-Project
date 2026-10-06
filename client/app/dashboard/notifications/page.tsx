"use client";

import React from "react";
import NotificationsPanel from "@/components/dashboard/user/NotificationsPanel";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";

export default function NotificationsPage() {
  return (
    <ProtectedRoute requiredRole="user">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="sr-only">Notifications</h1>
        <NotificationsPanel />
      </div>
    </ProtectedRoute>
  );
}
