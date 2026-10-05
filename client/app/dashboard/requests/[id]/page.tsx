"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiMapPin,
  FiPhone,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiLoader,
  FiNavigation,
  FiMap,
} from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useAuth } from "@/context";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";
import LiveRequestTrackingCard from "@/components/dashboard/user/LiveRequestTrackingCard";
import { EmergencyRequest } from "@/types";
import api from "@/services/api";
import { getGoogleMapsLocationUrl, getGoogleMapsDirectionsUrl } from "@/services/locationService";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RequestDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const requestId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();

  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ success: boolean; data: EmergencyRequest }>(`/emergency/${requestId}`);
      setRequest(res.data.data);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj.response?.data?.message || errorObj.message || "Failed to load request details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) {
      fetchRequest();
    }
  }, [requestId]);

  const currentUserId = user?._id;
  const creatorId =
    request && typeof request.requestBy === "object" && request.requestBy !== null
      ? (request.requestBy as any)._id
      : request?.requestBy;

  const isOwner = Boolean(currentUserId && creatorId && String(currentUserId) === String(creatorId));

  const hospitalLat = request?.hospitalLatitude ?? request?.location?.latitude;
  const hospitalLng = request?.hospitalLongitude ?? request?.location?.longitude;
  const openMapUrl = getGoogleMapsLocationUrl(hospitalLat, hospitalLng, request?.hospital);

  return (
    <ProtectedRoute requiredRole="user">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/requests"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <FiArrowLeft size={14} />
            <span>Back to My Requests</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <FiLoader size={28} className="animate-spin text-red-500" />
            <p className="text-sm font-medium">Loading request information...</p>
          </div>
        ) : error || !request ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/40 shadow-sm max-w-md mx-auto">
            <FiAlertCircle size={32} className="mx-auto text-red-500 mb-2" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Unable to Load Request</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{error || "Request not found"}</p>
            <button
              onClick={() => router.push("/dashboard/requests")}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Return to Requests
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-black text-sm">
                  {request.bloodGroup}
                </span>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    Emergency Blood Request: {request.hospital}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Created on {new Date(request.createdAt).toLocaleString([], { dateStyle: "long", timeStyle: "short" })}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid Layout: Request Information Card & Live Tracking Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Card 1: Basic Request Information */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Request Details</h2>
                  {request.status === "Expired" ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                      <FiClock size={12} /> Expired
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {request.status}
                    </span>
                  )}
                </div>

                {request.status === "Expired" && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-bold flex items-center gap-1.5 mb-0.5">
                      <FiAlertCircle size={14} /> Request Expired
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      This emergency blood request is no longer active.
                    </p>
                  </div>
                )}

                <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FaDroplet size={11} />
                    </span>
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Blood Group Required</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {request.bloodGroup} {request.unitsRequired ? `(${request.unitsRequired} Units)` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FiMapPin size={12} />
                    </span>
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Hospital & Location</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{request.hospital}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        {request.address}, {request.district}, {request.state}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FiPhone size={12} />
                    </span>
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Contact Number</p>
                      <a
                        href={`tel:${request.contactNumber}`}
                        className="font-semibold text-red-600 hover:underline inline-block mt-0.5"
                      >
                        {request.contactNumber}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FiClock size={12} />
                    </span>
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Timestamp</p>
                      <p className="text-slate-700 dark:text-slate-300">
                        {new Date(request.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>

                  {request.expiresAt && (
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FiClock size={12} />
                      </span>
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">Expires At</p>
                        <p className="text-slate-700 dark:text-slate-300">
                          {new Date(request.expiresAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Map Action Button */}
                {openMapUrl && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href={openMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                    >
                      <FiMap size={13} className="text-red-500" />
                      <span>Open Facility Map Pin (Google Maps)</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Card 2: Live Request Tracking Card (Separate Section) */}
              <div>
                {isOwner || user?.role === "admin" ? (
                  <LiveRequestTrackingCard
                    requestId={request._id}
                    onRefreshParent={fetchRequest}
                  />
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm text-center">
                    <FiAlertCircle size={24} className="mx-auto text-amber-500 mb-2" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      Donor View
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Detailed tracking is reserved for the request owner.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
