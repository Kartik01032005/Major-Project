"use client";

import React from "react";
import ProfileCard from "@/components/dashboard/user/ProfileCard";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";

export default function ProfilePage() {
  return (
    <ProtectedRoute requiredRole="user">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal information, contact details, and account settings.
          </p>
        </div>
        <ProfileCard />
      </div>
    </ProtectedRoute>
  );
}
