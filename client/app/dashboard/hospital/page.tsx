"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiCheckCircle,
  FiShield,
  FiMapPin,
  FiPhone,
  FiMail,
  FiFileText,
  FiAlertCircle,
  FiActivity,
  FiSettings,
  FiExternalLink,
} from "react-icons/fi";
import { FaHospital } from "react-icons/fa";
import { useAuth } from "@/context";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import HospitalVerificationQueue from "@/components/dashboard/hospital/HospitalVerificationQueue";

export default function HospitalDashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredRole="HOSPITAL">
      <div className="max-w-7xl mx-auto space-y-6 pb-8" role="region" aria-label="Hospital Dashboard">
        {/* Hospital Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
              <FaHospital size={260} />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
                  <FiCheckCircle size={13} className="text-emerald-300" />
                  Verified Hospital Partner
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {user?.organizationName || user?.name || "Hospital Partner Portal"}
                </h1>
                <p className="text-red-100 text-sm max-w-xl">
                  Official BloodLink hospital portal for managing institutional credentials, certificate verifications, and healthcare network participation.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  href="/dashboard/profile"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
                  icon={<FiShield size={14} />}
                >
                  Hospital Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  href="/dashboard/settings"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
                  icon={<FiSettings size={14} />}
                >
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md" className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
              <FiCheckCircle />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Account Status</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">Approved</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Institutional Access Active</p>
            </div>
          </Card>

          <Card padding="md" className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center text-xl shrink-0">
              <FaHospital />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Institution Type</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">Hospital</p>
              <p className="text-[11px] text-slate-500">{user?.location?.district || "Mysore"}, {user?.location?.state || "Karnataka"}</p>
            </div>
          </Card>

          <Card padding="md" className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0">
              <FiFileText />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Accreditation ID</p>
              <p className="text-base font-mono font-bold text-slate-900 dark:text-white truncate">
                {user?.registrationNumber || "Verified Facility"}
              </p>
              <p className="text-[11px] text-blue-600 dark:text-blue-400">Compliance Verified</p>
            </div>
          </Card>

          <Card padding="md" className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl shrink-0">
              <FiActivity />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Network Link</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">Active</p>
              <p className="text-[11px] text-purple-600 dark:text-purple-400">Connected to BloodLink</p>
            </div>
          </Card>
        </div>

        {/* Task 3: Hospital Certificate Review Queue */}
        <HospitalVerificationQueue />

        {/* Secondary Hospital Operations & Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card padding="md" className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FiActivity className="text-red-600" />
                Quick Hospital Operations
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <Link
                  href="/dashboard/requests"
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800 bg-white dark:bg-slate-900 hover:bg-red-50/40 dark:hover:bg-red-950/20 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
                      <FiActivity size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Blood Requests</p>
                      <p className="text-xs text-slate-500">View and track hospital broadcasts</p>
                    </div>
                  </div>
                  <FiExternalLink className="text-slate-400 group-hover:text-red-600" size={14} />
                </Link>

                <Link
                  href="/dashboard/nearby"
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800 bg-white dark:bg-slate-900 hover:bg-red-50/40 dark:hover:bg-red-950/20 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
                      <FiMapPin size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Nearby Blood Banks</p>
                      <p className="text-xs text-slate-500">Locate available blood units</p>
                    </div>
                  </div>
                  <FiExternalLink className="text-slate-400 group-hover:text-red-600" size={14} />
                </Link>
              </div>
            </Card>
          </div>

          {/* Hospital Profile Sidebar */}
          <div>
            <Card padding="md" className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <FaHospital className="text-red-600" />
                Hospital Profile Details
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Hospital Legal Name</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {user?.organizationName || user?.name}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400">Contact Person / Superintendent</span>
                  <p className="font-medium text-slate-900 dark:text-white mt-0.5">{user?.name}</p>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400">Official Email</span>
                  <p className="font-medium text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                    <FiMail size={11} className="text-slate-400" />
                    {user?.email}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400">Contact Number</span>
                  <p className="font-medium text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                    <FiPhone size={11} className="text-slate-400" />
                    {user?.phone}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400">Official Address</span>
                  <p className="font-medium text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                    <FiMapPin size={11} className="text-slate-400" />
                    {user?.address ? `${user.address}, ` : ""}
                    {user?.location?.district}, {user?.location?.state}
                  </p>
                </div>

                {user?.registrationNumber && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Registration / License</span>
                    <p className="font-mono text-[11px] font-semibold text-slate-900 dark:text-white mt-0.5 bg-slate-100 dark:bg-slate-900 p-1 rounded inline-block">
                      {user.registrationNumber}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
