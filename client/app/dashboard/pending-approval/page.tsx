"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiClock,
  FiXCircle,
  FiRefreshCw,
  FiLogOut,
  FiShield,
  FiMapPin,
  FiMail,
  FiPhone,
  FiFileText,
  FiCheckCircle,
  FiAlertTriangle,
  FiHelpCircle,
} from "react-icons/fi";
import { FaHospital, FaClinicMedical } from "react-icons/fa";
import { useAuth, useToast } from "@/context";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function PendingApprovalPage() {
  const { user, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const roleUpper = (user?.role || "").toUpperCase();
  const isHospital = roleUpper === "HOSPITAL";
  const isBloodBank = roleUpper === "BLOOD_BANK" || user?.role === "admin";
  const roleLabel = isHospital ? "Hospital" : isBloodBank ? "Blood Bank" : "Institutional Partner";

  const isRejected = user?.approvalStatus === "REJECTED";

  React.useEffect(() => {
    if (user && !isRejected) {
      router.replace(isHospital ? "/dashboard/hospital" : isBloodBank ? "/dashboard/admin" : "/dashboard");
    }
  }, [user, isRejected, isHospital, isBloodBank, router]);

  const handleRefresh = async () => {
    setChecking(true);
    try {
      await refreshUser();
      toast.success("Account is active in demo mode.");
      router.replace(isHospital ? "/dashboard/hospital" : "/dashboard/admin");
    } catch {
      toast.error("Failed to refresh status. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-8" role="region" aria-label="Account Verification Status">
      {/* Top Banner */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card padding="lg" className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                  isRejected
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40"
                    : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40"
                }`}
              >
                {isRejected ? <FiXCircle size={30} /> : <FiClock size={30} className="animate-spin-slow" />}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {user?.organizationName || user?.name || "Institution Account"}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${
                      isRejected
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse"
                    }`}
                  >
                    {isRejected ? <FiXCircle size={13} /> : <FiClock size={13} />}
                    {isRejected ? "Registration Rejected" : "Pending Administrator Approval"}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2">
                  {isHospital ? <FaHospital className="text-red-600" /> : <FaClinicMedical className="text-red-600" />}
                  <span>{roleLabel} Registration</span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span>Submitted on {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recent"}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                loading={checking}
                icon={<FiRefreshCw size={14} className={checking ? "animate-spin" : ""} />}
                className="flex-1 md:flex-initial"
              >
                Refresh Status
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                icon={<FiLogOut size={14} />}
                className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
              >
                Sign Out
              </Button>
            </div>
          </div>

          {/* Status Message Body */}
          <div className="pt-6 space-y-4">
            {isRejected ? (
              <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-sm">
                <div className="flex items-start gap-3">
                  <FiAlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={18} />
                  <div className="space-y-1">
                    <p className="font-semibold text-rose-900 dark:text-rose-300">
                      Application could not be approved
                    </p>
                    <p className="text-rose-700 dark:text-rose-400">
                      Reason: {user?.rejectionReason || "Institutional credentials could not be verified by the administrator."}
                    </p>
                    <p className="text-xs text-rose-600 dark:text-rose-400/80 pt-1">
                      If you believe this is an error or would like to submit updated institutional accreditation, please contact BloodLink support.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-sm space-y-2">
                <div className="flex items-start gap-3">
                  <FiShield className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-900 dark:text-amber-300">
                      Security & Healthcare Compliance Verification
                    </p>
                    <p className="text-amber-800/90 dark:text-amber-300/80">
                      To ensure patient safety and authenticate legitimate healthcare facilities, all {roleLabel.toLowerCase()} accounts are verified by authorized administrators before access to institutional features is granted.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Grid: Submitted Details & Verification Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Submitted Information Card */}
        <Card padding="md" className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FiFileText className="text-red-600" />
            Submitted Institutional Information
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Organization Name</p>
              <p className="text-slate-900 dark:text-white font-semibold">
                {user?.organizationName || user?.name}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Contact Person</p>
              <p className="text-slate-900 dark:text-white font-medium">{user?.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <FiMail size={12} /> Official Email
                </p>
                <p className="text-slate-900 dark:text-white truncate font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <FiPhone size={12} /> Phone
                </p>
                <p className="text-slate-900 dark:text-white font-medium">{user?.phone}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <FiMapPin size={12} /> Location
              </p>
              <p className="text-slate-900 dark:text-white font-medium">
                {user?.address ? `${user.address}, ` : ""}
                {user?.location?.district}, {user?.location?.state}
              </p>
            </div>

            {user?.registrationNumber && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Accreditation / License No.
                </p>
                <p className="font-mono text-xs text-slate-900 dark:text-white font-semibold bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded inline-block">
                  {user.registrationNumber}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Verification Progress Workflow */}
        <Card padding="md" className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FiShield className="text-red-600" />
            Verification Steps
          </h2>

          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <FiCheckCircle size={14} />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">1. Account Application Received</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Account profile and contact details safely registered in BloodLink.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isRejected
                    ? "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                    : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 animate-pulse"
                }`}
              >
                {isRejected ? <FiXCircle size={14} /> : <FiClock size={14} />}
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  2. Administrative Review & Credential Check
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isRejected
                    ? "Review concluded. The application was rejected."
                    : "Our compliance team validates facility licenses, phone verification, and medical accreditation."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                <FiCheckCircle size={14} />
              </div>
              <div>
                <p className="font-medium text-slate-500 dark:text-slate-400">
                  3. Dashboard & Facility Tools Unlocked
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Once approved, your account immediately gains full access to institutional dashboards.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <FiHelpCircle /> Need urgent assistance?
            </span>
            <span className="font-semibold text-red-600 dark:text-red-400">National Helpline: 104</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
