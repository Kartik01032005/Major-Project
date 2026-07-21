"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ActiveRequestsCard from "@/components/dashboard/user/ActiveRequestsCard";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";

export default function MyRequestsPage() {
  const router = useRouter();

  return (
    <ProtectedRoute requiredRole="user">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Requests</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View status and manage all your emergency blood requests.
          </p>
        </div>
        <ActiveRequestsCard onNewRequest={() => router.push("/dashboard/emergency")} />
      </div>
    </ProtectedRoute>
  );
}
