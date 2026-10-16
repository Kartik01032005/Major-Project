"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ActiveRequestsCard from "@/components/dashboard/user/ActiveRequestsCard";
import ProtectedRoute, { normalizeUserRole } from "@/components/dashboard/ProtectedRoute";
import { useAuth } from "@/context";

export default function MyRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const normRole = normalizeUserRole(user?.role);
  const isHospital = normRole === "HOSPITAL";

  return (
    <ProtectedRoute requiredRole={["user", "USER", "HOSPITAL"]}>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="sr-only">My Requests</h1>
        <ActiveRequestsCard
          onNewRequest={isHospital ? undefined : () => router.push("/dashboard/emergency")}
        />
      </div>
    </ProtectedRoute>
  );
}
