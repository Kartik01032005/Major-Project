"use client";

import React, { useState } from "react";
import { useAuth } from "@/context";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";
import WelcomeBanner from "@/components/dashboard/user/WelcomeBanner";
import DonorProfileCard from "@/components/dashboard/user/DonorProfileCard";
import DonorCertificateCard from "@/components/dashboard/user/DonorCertificateCard";
import ActiveRequestsCard from "@/components/dashboard/user/ActiveRequestsCard";
import NotificationsPanel from "@/components/dashboard/user/NotificationsPanel";
import NearbyBloodBanksCard from "@/components/dashboard/user/NearbyBloodBanksCard";
import EmergencyRequestModal from "@/components/dashboard/user/EmergencyRequestModal";

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  // Institutional users go directly to their specialized dashboards
  if (user) {
    const roleUpper = (user.role || "").toUpperCase();
    if (roleUpper === "BLOOD_BANK" || user.role === "admin") {
      if (typeof window !== "undefined") window.location.replace("/dashboard/admin");
      return null;
    }
    if (roleUpper === "HOSPITAL") {
      if (typeof window !== "undefined") window.location.replace("/dashboard/hospital");
      return null;
    }
  }

  return (
    <ProtectedRoute requiredRole={["USER", "user"]}>
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
        {/* Welcome Banner */}
        <WelcomeBanner onEmergencyClick={() => setModalOpen(true)} />

        {/* Responsive Dashboard Grid (stacked on mobile, 2-column on desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Column 1: Donor Profile, Certificate Verification & Emergency Requests */}
          <div className="space-y-6">
            <DonorProfileCard />
            <DonorCertificateCard />
            <ActiveRequestsCard onNewRequest={() => setModalOpen(true)} />
          </div>

          {/* Column 2: Notifications & Nearby Facilities (Map) */}
          <div className="space-y-6">
            <NotificationsPanel />
            <NearbyBloodBanksCard />
          </div>
        </div>
      </div>

      {/* Emergency Request Modal */}
      <EmergencyRequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </ProtectedRoute>
  );
}
