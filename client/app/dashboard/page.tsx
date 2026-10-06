"use client";

import React, { useState } from "react";
import { useAuth } from "@/context";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";
import WelcomeBanner from "@/components/dashboard/user/WelcomeBanner";
import DonorProfileCard from "@/components/dashboard/user/DonorProfileCard";
import ActiveRequestsCard from "@/components/dashboard/user/ActiveRequestsCard";
import NotificationsPanel from "@/components/dashboard/user/NotificationsPanel";
import NearbyBloodBanksCard from "@/components/dashboard/user/NearbyBloodBanksCard";
import EmergencyRequestModal from "@/components/dashboard/user/EmergencyRequestModal";

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  // Admin users go to their own dashboard
  if (user?.role === "admin") {
    if (typeof window !== "undefined") window.location.replace("/dashboard/admin");
    return null;
  }

  return (
    <ProtectedRoute requiredRole="user">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Banner (full width) */}
        <WelcomeBanner onEmergencyClick={() => setModalOpen(true)} />

        {/* Balanced 2-Column Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Donor Activity & Emergency Requests */}
          <div className="space-y-6">
            <DonorProfileCard />
            <ActiveRequestsCard onNewRequest={() => setModalOpen(true)} />
          </div>

          {/* Right Column: Notifications & Nearby Facilities */}
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
