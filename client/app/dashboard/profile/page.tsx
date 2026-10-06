"use client";

import React from "react";
import ProfileCard from "@/components/dashboard/user/ProfileCard";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";

export default function ProfilePage() {
  return (
    <ProtectedRoute requiredRole="user">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="sr-only">Profile</h1>
        <ProfileCard />
      </div>
    </ProtectedRoute>
  );
}
