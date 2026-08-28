"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiAlertCircle, FiClock, FiMapPin, FiPhone, FiCheckCircle, FiXCircle, FiLoader, FiCheck, FiNavigation, FiHeart, FiX, FiTrash2 } from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useAuth, useDashboard, useTranslation } from "@/context";
import { RequestStatus, EmergencyRequest } from "@/types";
import DonorAcceptanceModal from "./DonorAcceptanceModal";

const STATUS_ICONS: Record<RequestStatus, React.ReactNode> = {
  Pending:   <FiClock size={12} />,
  Approved:  <FiCheckCircle size={12} />,
  Rejected:  <FiXCircle size={12} />,
  Completed: <FiCheckCircle size={12} />,
  Cancelled: <FiXCircle size={12} />,
};

const STATUS_COLORS: Record<RequestStatus, string> = {
  Pending:   "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400",
  Approved:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Rejected:  "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400",
  Completed: "bg-slate-100  text-slate-700  dark:bg-slate-800     dark:text-slate-400",
  Cancelled: "bg-slate-100  text-slate-700  dark:bg-slate-800     dark:text-slate-400",
};

const BLOOD_GROUP_COLORS: Record<string, string> = {
  "A+": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "A-": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "B+": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "B-": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "AB+": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "AB-": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "O+": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "O-": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

interface ActiveRequestsCardProps {
  onNewRequest: () => void;
}

export default function ActiveRequestsCard({ onNewRequest }: ActiveRequestsCardProps) {
  const { user } = useAuth();
  const { requests, refreshRequests, loadingRequests, cancelRequest, acceptRequest, reportDonation, confirmDonation, withdrawAcceptance } = useDashboard();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"my" | "donate">("my");
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [selectedRequestForAcceptance, setSelectedRequestForAcceptance] = useState<EmergencyRequest | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [navLoadingId, setNavLoadingId] = useState<string | null>(null);
  const [navErrorId, setNavErrorId] = useState<{ id: string; message: string } | null>(null);

  // Clear Requests View State (Donor/User View Dismissal)
  const [clearedRequestIds, setClearedRequestIds] = useState<string[]>([]);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  const handleConfirmClearRequests = () => {
    if (activeTab === "donate") {
      const donateIdsToClear = donateRequests.map((r) => r._id);
      setClearedRequestIds((prev) => Array.from(new Set([...prev, ...donateIdsToClear])));
    } else {
      const myIdsToClear = myRequests.map((r) => r._id);
      setClearedRequestIds((prev) => Array.from(new Set([...prev, ...myIdsToClear])));
    }
    setShowClearConfirmModal(false);
  };

  // Fulfillment & Withdrawal Modals State
  const [donatedReportModalReq, setDonatedReportModalReq] = useState<EmergencyRequest | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [requesterConfirmModalReq, setRequesterConfirmModalReq] = useState<EmergencyRequest | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [withdrawModalReq, setWithdrawModalReq] = useState<EmergencyRequest | null>(null);
  const [withdrawReasonPreset, setWithdrawReasonPreset] = useState<string>("Medically unfit");
  const [withdrawReasonOther, setWithdrawReasonOther] = useState<string>("");
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const handleConfirmReportDonation = async () => {
    if (!donatedReportModalReq) return;
    setReportLoading(true);
    try {
      await reportDonation(donatedReportModalReq._id);
      setDonatedReportModalReq(null);
    } catch (err: unknown) {
      console.error("Failed to report donation:", err);
    } finally {
      setReportLoading(false);
    }
  };

  const handleConfirmRequesterFulfillment = async () => {
    if (!requesterConfirmModalReq) return;
    setConfirmLoading(true);
    try {
      await confirmDonation(requesterConfirmModalReq._id);
      setRequesterConfirmModalReq(null);
    } catch (err: unknown) {
      console.error("Failed to confirm donation fulfillment:", err);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleConfirmWithdrawal = async () => {
    if (!withdrawModalReq) return;
    setWithdrawError(null);

    const finalReason = withdrawReasonPreset === "Other"
      ? withdrawReasonOther.trim()
      : withdrawReasonPreset.trim();

    if (!finalReason) {
      setWithdrawError(t("donor_withdraw_reason_required_err"));
      return;
    }

    setWithdrawLoading(true);
    try {
      await withdrawAcceptance(withdrawModalReq._id, finalReason);
      setWithdrawModalReq(null);
      setWithdrawReasonOther("");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      console.error("Failed to withdraw acceptance:", err);
      setWithdrawError(errorObj.response?.data?.message || t("donor_nav_err_generic"));
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleGetLocation = (req: EmergencyRequest) => {
    setNavErrorId(null);

    if (typeof window === "undefined" || !navigator.geolocation) {
      setNavErrorId({ id: req._id, message: t("donor_nav_err_unsupported") });
      return;
    }

    setNavLoadingId(req._id);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNavLoadingId(null);
        const { latitude: userLat, longitude: userLng } = pos.coords;

        let destParam = "";
        if (
          req.location &&
          typeof req.location.latitude === "number" &&
          typeof req.location.longitude === "number" &&
          (req.location.latitude !== 0 || req.location.longitude !== 0)
        ) {
          destParam = `${req.location.latitude},${req.location.longitude}`;
        } else if (req.hospital || req.address) {
          const parts = [req.hospital, req.address, req.district, req.state].filter(Boolean);
          destParam = encodeURIComponent(parts.join(", "));
        }

        if (!destParam) {
          setNavErrorId({ id: req._id, message: t("donor_nav_err_invalid_dest") });
          return;
        }

        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destParam}`;
        window.open(mapsUrl, "_blank", "noopener,noreferrer");
      },
      (geoErr) => {
        setNavLoadingId(null);
        let msg = t("donor_nav_err_generic");
        switch (geoErr.code) {
          case geoErr.PERMISSION_DENIED:
            msg = t("donor_nav_err_denied");
            break;
          case geoErr.POSITION_UNAVAILABLE:
            msg = t("donor_nav_err_unavailable");
            break;
          case geoErr.TIMEOUT:
            msg = t("donor_nav_err_timeout");
            break;
        }
        setNavErrorId({ id: req._id, message: msg });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    refreshRequests();
  }, [refreshRequests]);

  const currentUserId = user?._id;

  const getStatusLabel = (status: RequestStatus) => {
    switch (status) {
      case "Pending": return t("requests_status_pending");
      case "Approved": return t("requests_status_approved");
      case "Rejected": return t("requests_status_rejected");
      case "Completed": return t("requests_status_completed");
      case "Cancelled": return t("requests_status_cancelled");
      default: return status;
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!window.confirm(t("requests_confirm_cancel"))) return;

    setCancelError(null);
    setCancelLoading(requestId);
    try {
      await cancelRequest(requestId);
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : "Failed to cancel request");
    } finally {
      setCancelLoading(null);
    }
  };

  const handleConfirmAccept = async () => {
    if (!selectedRequestForAcceptance) return;
    const targetId = selectedRequestForAcceptance._id;
    setAcceptError(null);
    setAcceptingId(targetId);
    try {
      await acceptRequest(targetId);
      setSelectedRequestForAcceptance(null);
    } catch (error: unknown) {
      const errorObj = error as { response?: { data?: { message?: string } }; message?: string };
      setAcceptError(errorObj.response?.data?.message || errorObj.message || "Failed to accept request");
    } finally {
      setAcceptingId(null);
    }
  };

  // User's own requests
  const myRequests = requests.filter((r) => {
    if (!currentUserId) return false;
    if (clearedRequestIds.includes(r._id)) return false;
    let reqUserId = "";
    if (typeof r.requestBy === "object" && r.requestBy !== null) {
      reqUserId = r.requestBy._id || "";
    } else if (typeof r.requestBy === "string") {
      reqUserId = r.requestBy;
    }
    return String(reqUserId) === String(currentUserId);
  });

  // Requests from other users available to donate (Pending or Approved)
  const donateRequests = requests.filter((r) => {
    if (!currentUserId) return false;
    if (clearedRequestIds.includes(r._id)) return false;
    let reqUserId = "";
    if (typeof r.requestBy === "object" && r.requestBy !== null) {
      reqUserId = r.requestBy._id || "";
    } else if (typeof r.requestBy === "string") {
      reqUserId = r.requestBy;
    }
    const isOwnRequest = String(reqUserId) === String(currentUserId);
    const isOpenStatus = r.status === "Pending" || r.status === "Approved";
    return !isOwnRequest && isOpenStatus;
  });

  const displayedRequests = activeTab === "my" ? myRequests : donateRequests;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600">
                <FiAlertCircle size={15} />
              </span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("requests_title")}</h3>
              {loadingRequests && (
                <FiLoader size={14} className="ml-2 text-slate-400 animate-spin" />
              )}
            </div>
            <button
              onClick={onNewRequest}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
            >
              {t("requests_new")}
            </button>
          </div>

          {/* Tabs & Clear Requests Button */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("my")}
                className={[
                  "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                  activeTab === "my"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
                ].join(" ")}
              >
                <span>{t("requests_tab_my_requests")}</span>
                {myRequests.length > 0 && (
                  <span
                    className={[
                      "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                      activeTab === "my" ? "bg-white/20 text-white" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
                    ].join(" ")}
                  >
                    {myRequests.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("donate")}
                className={[
                  "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                  activeTab === "donate"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
                ].join(" ")}
              >
                <span>{t("requests_tab_donate_requests")}</span>
                {donateRequests.length > 0 && (
                  <span
                    className={[
                      "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                      activeTab === "donate" ? "bg-white/20 text-white" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
                    ].join(" ")}
                  >
                    {donateRequests.length}
                  </span>
                )}
              </button>
            </div>

            {displayedRequests.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto"
              >
                <FiTrash2 size={12} />
                <span>{t("requests_clear_btn")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {displayedRequests.length === 0 ? (
          <div className="py-10 flex flex-col items-center text-center px-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <FiAlertCircle size={22} />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              {activeTab === "my" ? t("requests_empty_title") : t("requests_donate_empty_title")}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 max-w-sm">
              {activeTab === "my" ? t("requests_empty_sub") : t("requests_donate_empty_sub")}
            </p>
            {activeTab === "my" && (
              <button
                onClick={onNewRequest}
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                {t("requests_create_btn")}
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {cancelError && (
              <li className="px-5 py-3 text-xs text-red-600 dark:text-red-400" role="alert">
                {cancelError}
              </li>
            )}
            {acceptError && (
              <li className="px-5 py-3 text-xs text-red-600 dark:text-red-400" role="alert">
                {acceptError}
              </li>
            )}
            {displayedRequests.map((req, i) => {
              const statusLabel = getStatusLabel(req.status);
              const statusColor = STATUS_COLORS[req.status];
              const statusIcon = STATUS_ICONS[req.status];
              const bgColor = BLOOD_GROUP_COLORS[req.bloodGroup] ?? "";
              const hasAccepted = (req.acceptedBy ?? []).some(
                (id) => String(id) === String(currentUserId)
              );
              const hasWithdrawn = (req.withdrawnBy ?? []).some(
                (entry) => String(entry.donor) === String(currentUserId)
              );

              return (
                <motion.li
                  key={req._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Blood group circle */}
                      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${bgColor}`}>
                        {req.bloodGroup}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{req.hospital}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <FiMapPin size={11} />
                          <span className="truncate">{req.district}, {req.state}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <FiPhone size={11} />
                          <span>{req.contactNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
                        {statusIcon} {statusLabel}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {t("requests_requested_label")}: {new Date(req.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Actions for user's own requests */}
                  {activeTab === "my" && (
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
                      <div>
                        {req.status === "Completed" && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            {t("requester_fulfilled_badge")}
                          </span>
                        )}
                        {req.donationReportedBy && req.donationReportedBy.length > 0 && req.status !== "Completed" && (
                          <button
                            type="button"
                            onClick={() => setRequesterConfirmModalReq(req)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm animate-pulse"
                          >
                            <FiCheck size={13} /> {t("requester_confirm_donation_btn")}
                          </button>
                        )}
                      </div>

                      {req.status === "Pending" && (
                        <button
                          type="button"
                          onClick={() => handleCancel(req._id)}
                          disabled={cancelLoading === req._id}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancelLoading === req._id && <FiLoader size={12} className="animate-spin" />}
                          {cancelLoading === req._id ? t("requests_cancelling") : t("requests_cancel")}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Actions for donate requests */}
                  {activeTab === "donate" && (
                    <div className="mt-3 space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <FaDroplet size={10} className="text-red-500" />
                          {req.unitsRequired ? `${req.unitsRequired} ${t("admin_stat_units")}` : req.bloodGroup}
                        </span>

                        {hasAccepted ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <FiCheck size={13} /> {t("requests_accepted_badge")}
                          </span>
                        ) : hasWithdrawn ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <FiAlertCircle size={13} /> {t("requests_previously_approached_badge")}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedRequestForAcceptance(req)}
                            disabled={acceptingId === req._id}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors shadow-sm"
                          >
                            {acceptingId === req._id && <FiLoader size={12} className="animate-spin" />}
                            {acceptingId === req._id ? t("requests_accepting") : t("requests_accept_btn")}
                          </button>
                        )}
                      </div>

                      {/* Actions for Accepted Requests (Navigation, Donated Report, Withdrawal) */}
                      {hasAccepted && (
                        <div className="space-y-2">
                          {/* Navigation Control */}
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                                  <FiNavigation size={13} />
                                </span>
                                <div>
                                  <p className="font-semibold text-slate-900 dark:text-white leading-tight truncate">
                                    {t("donor_nav_title")}
                                  </p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    {t("donor_nav_sub")}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleGetLocation(req)}
                                disabled={navLoadingId === req._id}
                                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors shadow-sm"
                              >
                                {navLoadingId === req._id ? (
                                  <>
                                    <FiLoader size={12} className="animate-spin" />
                                    {t("donor_nav_loading")}
                                  </>
                                ) : (
                                  <>
                                    <FiNavigation size={12} />
                                    {t("donor_nav_btn")}
                                  </>
                                )}
                              </button>
                            </div>

                            {navErrorId?.id === req._id && (
                              <div className="flex items-start gap-1.5 text-[11px] text-red-600 dark:text-red-400 pt-1">
                                <FiAlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                                <span>{navErrorId.message}</span>
                              </div>
                            )}
                          </div>

                          {/* Fulfillment & Withdrawal Action Buttons */}
                          <div className="flex items-center justify-between gap-2 pt-1">
                            {req.donationReportedBy && req.donationReportedBy.includes(user?._id || "") ? (
                              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <FiClock size={12} /> {t("donor_donated_reported_badge")}
                              </span>
                            ) : req.status !== "Completed" ? (
                              <button
                                type="button"
                                onClick={() => setDonatedReportModalReq(req)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
                              >
                                <FiHeart size={12} /> {t("donor_donated_btn")}
                              </button>
                            ) : null}

                            {req.status !== "Completed" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setWithdrawModalReq(req);
                                  setWithdrawReasonPreset("Medically unfit");
                                  setWithdrawReasonOther("");
                                  setWithdrawError(null);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              >
                                <FiAlertCircle size={12} /> {t("donor_withdraw_btn")}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.li>
              );
            })}
          </ul>
        )}
      </motion.div>

      {/* Confirmation Modal */}
      <DonorAcceptanceModal
        open={Boolean(selectedRequestForAcceptance)}
        request={selectedRequestForAcceptance}
        loading={Boolean(selectedRequestForAcceptance && acceptingId === selectedRequestForAcceptance._id)}
        onClose={() => setSelectedRequestForAcceptance(null)}
        onConfirm={handleConfirmAccept}
      />

      {/* Donor "I Donated Blood" Modal */}
      {donatedReportModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm pointer-events-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                  <FiHeart size={18} />
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t("donor_donated_modal_title")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDonatedReportModalReq(null)}
                disabled={reportLoading}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("donor_donated_modal_message")}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDonatedReportModalReq(null)}
                disabled={reportLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t("donor_acceptance_cancel_btn")}
              </button>
              <button
                type="button"
                onClick={handleConfirmReportDonation}
                disabled={reportLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {reportLoading && <FiLoader size={12} className="animate-spin" />}
                {t("donor_donated_confirm_btn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requester Confirm Donation Modal */}
      {requesterConfirmModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm pointer-events-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <FiCheckCircle size={18} />
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t("requester_confirm_modal_title")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRequesterConfirmModalReq(null)}
                disabled={confirmLoading}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("requester_confirm_modal_message")}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRequesterConfirmModalReq(null)}
                disabled={confirmLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t("donor_acceptance_cancel_btn")}
              </button>
              <button
                type="button"
                onClick={handleConfirmRequesterFulfillment}
                disabled={confirmLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {confirmLoading && <FiLoader size={12} className="animate-spin" />}
                {t("requester_confirm_action_btn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donor Withdrawal Modal */}
      {withdrawModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm pointer-events-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                  <FiAlertCircle size={18} />
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t("donor_withdraw_modal_title")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setWithdrawModalReq(null)}
                disabled={withdrawLoading}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("donor_withdraw_modal_message")}
              </p>

              <div className="space-y-2">
                {[
                  { key: "Medically unfit", label: t("donor_withdraw_reason_fit") },
                  { key: "Did not pass medical screening", label: t("donor_withdraw_reason_screening") },
                  { key: "Health issue", label: t("donor_withdraw_reason_health") },
                  { key: "Unable to reach the destination", label: t("donor_withdraw_reason_destination") },
                  { key: "Personal/emergency issue", label: t("donor_withdraw_reason_emergency") },
                  { key: "Other", label: t("donor_withdraw_reason_other") },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="withdrawReason"
                      value={item.key}
                      checked={withdrawReasonPreset === item.key}
                      onChange={() => setWithdrawReasonPreset(item.key)}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              {withdrawReasonPreset === "Other" && (
                <div>
                  <textarea
                    rows={2}
                    placeholder={t("donor_withdraw_other_ph")}
                    value={withdrawReasonOther}
                    onChange={(e) => setWithdrawReasonOther(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  />
                </div>
              )}

              {withdrawError && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {withdrawError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setWithdrawModalReq(null)}
                disabled={withdrawLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t("donor_acceptance_cancel_btn")}
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdrawal}
                disabled={withdrawLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {withdrawLoading && <FiLoader size={12} className="animate-spin" />}
                {t("donor_withdraw_confirm_btn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Requests Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm pointer-events-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
                  <FiTrash2 size={18} />
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t("requests_clear_modal_title")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("requests_clear_modal_msg")}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t("donor_acceptance_cancel_btn")}
              </button>
              <button
                type="button"
                onClick={handleConfirmClearRequests}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
              >
                <FiTrash2 size={12} />
                {t("requests_clear_confirm_btn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

