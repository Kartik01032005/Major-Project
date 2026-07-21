"use client";

import React from "react";
import NotificationsPanel from "@/components/dashboard/user/NotificationsPanel";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";

export default function NotificationsPage() {
  return (
    <ProtectedRoute requiredRole="user">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay updated with alerts and messages regarding your requests.
          </p>
        </div>
        <NotificationsPanel />
      </div>
    </ProtectedRoute>
  );
}
