"use client";

import React, { useState } from "react";
import { useAuth } from "@/context";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";
import WelcomeBanner from "@/components/dashboard/user/WelcomeBanner";
import ProfileCard from "@/components/dashboard/user/ProfileCard";
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

        {/* Two-column grid (lg+) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — 2/3 width on lg */}
          <div className="lg:col-span-2 space-y-6">
            <ProfileCard />
            <ActiveRequestsCard onNewRequest={() => setModalOpen(true)} />
            <NearbyBloodBanksCard />
          </div>

          {/* Right column — 1/3 width on lg */}
          <div className="space-y-6">
            <NotificationsPanel />
          </div>
        </div>
      </div>

      {/* Emergency Request Modal */}
      <EmergencyRequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </ProtectedRoute>
  );
}
