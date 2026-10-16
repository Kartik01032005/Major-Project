"use client";

import React from "react";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";
import HospitalVerificationQueue from "@/components/dashboard/hospital/HospitalVerificationQueue";

export default function HospitalVerificationPage() {
  return (
    <ProtectedRoute requiredRole="HOSPITAL">
      <div className="max-w-7xl mx-auto space-y-6 pb-8" role="region" aria-label="Certificate Verification Queue">
        <HospitalVerificationQueue />
      </div>
    </ProtectedRoute>
  );
}
