"use client";

import { useAuth } from "@/context";
import ProfileCard from "@/components/dashboard/user/ProfileCard";
import HospitalProfileCard from "@/components/dashboard/hospital/HospitalProfileCard";
import DonorCertificateCard from "@/components/dashboard/user/DonorCertificateCard";
import ProtectedRoute, { normalizeUserRole } from "@/components/dashboard/ProtectedRoute";

export default function ProfilePage() {
  const { user } = useAuth();
  const normRole = normalizeUserRole(user?.role);

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="sr-only">
          {normRole === "HOSPITAL" ? "Hospital Profile" : "Profile"}
        </h1>
        {normRole === "HOSPITAL" ? (
          <HospitalProfileCard />
        ) : (
          <>
            <ProfileCard />
            <DonorCertificateCard />
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
