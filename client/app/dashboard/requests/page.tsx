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
        <h1 className="sr-only">My Requests</h1>
        <ActiveRequestsCard onNewRequest={() => router.push("/dashboard/emergency")} />
      </div>
    </ProtectedRoute>
  );
}
