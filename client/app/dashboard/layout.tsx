"use client";

import React, { useState } from "react";
import { DashboardProvider } from "@/context";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ProtectedRoute>
      <DashboardProvider>
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950">
          {/* Sidebar */}
          <DashboardSidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />

          {/* Main content column */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {/* Topbar */}
            <DashboardTopbar onMenuClick={() => setMobileOpen(true)} />

            {/* Scrollable page content */}
            <main
              id="dashboard-content"
              className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
            >
              {children}
            </main>
          </div>
        </div>
      </DashboardProvider>
    </ProtectedRoute>
  );
}
