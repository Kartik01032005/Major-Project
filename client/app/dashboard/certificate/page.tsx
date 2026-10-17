"use client";

import React from "react";
import DonorCertificateCard from "@/components/dashboard/user/DonorCertificateCard";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";

export default function MedicalCertificatePage() {
  return (
    <ProtectedRoute requiredRole={["user", "USER"]}>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="sr-only">Medical Donor Certificate</h1>
        <DonorCertificateCard />
      </div>
    </ProtectedRoute>
  );
}
