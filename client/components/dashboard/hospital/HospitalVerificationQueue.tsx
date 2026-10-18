"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiXCircle,
  FiDownload,
  FiCalendar,
  FiPaperclip,
  FiEye,
  FiX,
  FiCheck,
  FiLoader,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
} from "react-icons/fi";
import { FaHospital, FaDroplet } from "react-icons/fa6";
import { useToast, useAuth } from "@/context";
import { useBodyScrollLock } from "@/hooks";
import { dashboardService } from "@/services";
import {
  HospitalQueueSubmission,
  HospitalQueueStats,
  CertificateStatus,
} from "@/types";

function formatDateSafe(dateVal: string | null | undefined): string {
  if (!dateVal) return "Not provided";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "Not provided";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Not provided";
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 KB";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getStatusBadge(status: CertificateStatus) {
  switch (status) {
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pending Review
        </span>
      );
    case "APPROVED":
    case "VERIFIED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
          <FiCheckCircle className="w-3.5 h-3.5" />
          Approved
        </span>
      );
    case "NEEDS_INFORMATION":
    case "NEEDS_CLARIFICATION":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300 dark:border-orange-800/60">
          <FiAlertTriangle className="w-3.5 h-3.5" />
          Clarification Needed
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800/60">
          <FiXCircle className="w-3.5 h-3.5" />
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {status}
        </span>
      );
  }
}

export default function HospitalVerificationQueue() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HospitalQueueStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    needsClarification: 0,
  });
  const [submissions, setSubmissions] = useState<HospitalQueueSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected Submission for Review Modal
  const [selectedSubmission, setSelectedSubmission] =
    useState<HospitalQueueSubmission | null>(null);
  const [reviewAction, setReviewAction] = useState<
    "APPROVE" | "REJECT" | "REQUEST_CLARIFICATION" | null
  >(null);
  const [reviewReason, setReviewReason] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  let user: any = null;
  try {
    const auth = useAuth();
    user = auth?.user;
  } catch {
    // Isolated test environment fallback
  }

  const roleUpper = (user?.role || "").toUpperCase();
  const isAuthorized = !user || roleUpper === "HOSPITAL";

  const fetchQueue = async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      const res = await dashboardService.getHospitalCertificateQueue({
        search: searchQuery || undefined,
        status: statusFilter,
        page,
        limit: 10,
      });

      if (res) {
        if (res.stats) setStats(res.stats);
        if (Array.isArray(res.submissions)) setSubmissions(res.submissions);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        return;
      }
      console.error("Failed to load hospital verification queue:", err);
      toast.error("Failed to load verification queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchQueue();
    }
  }, [statusFilter, page, isAuthorized]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQueue();
  };

  const handleOpenReview = (submission: HospitalQueueSubmission) => {
    setSelectedSubmission(submission);
    setReviewAction(null);
    setReviewReason("");
    setModalError(null);
  };

  const handleCloseReview = () => {
    setSelectedSubmission(null);
    setReviewAction(null);
    setReviewReason("");
    setModalError(null);
  };

  useBodyScrollLock(Boolean(selectedSubmission));

  useEffect(() => {
    if (!selectedSubmission) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseReview();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSubmission]);

  const handleDownloadDoc = async (id: string, originalName?: string) => {
    setDownloadingDocId(id);
    try {
      const blob = await dashboardService.downloadCertificateById(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalName || "donor_certificate.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      toast.error("Failed to download certificate document.");
    } finally {
      setDownloadingDocId(null);
    }
  };

  const displayedSubmissions = submissions.filter((sub) => {
    if (statusFilter !== "ALL") {
      if (statusFilter === "NEEDS_INFORMATION") {
        if (sub.status !== "NEEDS_INFORMATION" && sub.status !== "NEEDS_CLARIFICATION") return false;
      } else if (sub.status !== statusFilter) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const donorMatch = sub.donor?.name?.toLowerCase().includes(q);
      const refMatch = sub.referenceId?.toLowerCase().includes(q) || sub.id?.toLowerCase().includes(q);
      const hospMatch = sub.issuingHospital?.toLowerCase().includes(q);
      if (!donorMatch && !refMatch && !hospMatch) return false;
    }
    return true;
  });

  const handleSubmitReviewDecision = async () => {
    if (!selectedSubmission || !reviewAction) return;

    setModalError(null);

    if (
      (reviewAction === "REJECT" || reviewAction === "REQUEST_CLARIFICATION") &&
      !reviewReason.trim()
    ) {
      setModalError(
        reviewAction === "REJECT"
          ? "Please specify a clear institutional reason for rejection."
          : "Please specify the instructions or clarification required from the donor."
      );
      return;
    }

    setSubmittingReview(true);
    try {
      await dashboardService.reviewCertificate(selectedSubmission.id, {
        action: reviewAction,
        reason: reviewReason.trim() || undefined,
      });

      toast.success(
        reviewAction === "APPROVE"
          ? "Certificate approved successfully."
          : reviewAction === "REJECT"
          ? "Certificate marked as rejected."
          : "Clarification request sent to donor."
      );

      handleCloseReview();
      fetchQueue();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit review decision.";
      setModalError(msg);
      toast.error(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Hospital Certificate Review Dashboard"
      className="space-y-6"
    >
      {/* ── Summary Statistics Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Assigned */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Assigned</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <FiShield size={14} />
            </div>
          </div>
          <p data-testid="stat-total" className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.total}
          </p>
          <span className="text-[11px] text-slate-400 mt-1">
            Institutional Queue
          </span>
        </div>

        {/* Pending Review */}
        <div className="p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 mb-2">
            <span className="text-xs font-semibold">Pending Review</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <FiClock size={14} className="animate-pulse" />
            </div>
          </div>
          <p data-testid="stat-pending" className="text-2xl font-black text-amber-900 dark:text-amber-200">
            {stats.pending}
          </p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
            Requires Decision
          </span>
        </div>

        {/* Approved */}
        <div className="p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 mb-2">
            <span className="text-xs font-semibold">Approved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <FiCheckCircle size={14} />
            </div>
          </div>
          <p data-testid="stat-approved" className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
            {stats.approved}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
            Simulated Verified
          </span>
        </div>

        {/* Needs Clarification */}
        <div className="p-4 rounded-2xl border border-orange-200/80 dark:border-orange-900/50 bg-orange-50/30 dark:bg-orange-950/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-orange-800 dark:text-orange-300 mb-2">
            <span className="text-xs font-semibold">Clarification</span>
            <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 flex items-center justify-center">
              <FiAlertTriangle size={14} />
            </div>
          </div>
          <p data-testid="stat-clarification" className="text-2xl font-black text-orange-900 dark:text-orange-200">
            {stats.needsClarification}
          </p>
          <span className="text-[11px] text-orange-600 dark:text-orange-400 mt-1">
            Awaiting Donor Info
          </span>
        </div>

        {/* Rejected */}
        <div className="p-4 rounded-2xl border border-red-200/80 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-red-800 dark:text-red-300 mb-2">
            <span className="text-xs font-semibold">Rejected</span>
            <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 flex items-center justify-center">
              <FiXCircle size={14} />
            </div>
          </div>
          <p data-testid="stat-rejected" className="text-2xl font-black text-red-900 dark:text-red-200">
            {stats.rejected}
          </p>
          <span className="text-[11px] text-red-600 dark:text-red-400 mt-1">
            Non-compliant / Invalid
          </span>
        </div>
      </div>

      {/* ── Demo Notice & Section Header ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">
                Certificate Verification Queue
              </h2>
              <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-950/70 text-red-400 border border-red-800/60 uppercase tracking-wider">
                DEMO VERIFICATION WORKFLOW
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Review and verify medical certificates issued by this hospital for simulated donor credentialing.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchQueue}
            disabled={loading}
            className="self-start md:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <FiRefreshCw
              size={13}
              className={loading ? "animate-spin text-red-600" : "text-slate-400"}
            />
            <span>Refresh</span>
          </button>
        </div>

        {/* ── Search & Filter Bar ── */}
        <div className="p-4 sm:p-5 pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search by donor name, certificate ID, or hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                  fetchQueue();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <FiX size={14} />
              </button>
            )}
          </form>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "ALL", label: "All" },
              { id: "PENDING", label: "Pending" },
              { id: "APPROVED", label: "Approved" },
              { id: "NEEDS_INFORMATION", label: "Clarification" },
              { id: "REJECTED", label: "Rejected" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setStatusFilter(f.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === f.id
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Submissions Table ── */}
        <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-800/80">
          {loading ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <FiLoader size={26} className="animate-spin text-red-600 mx-auto" />
              <p className="text-xs">Loading hospital review queue...</p>
            </div>
          ) : displayedSubmissions.length === 0 ? (
            <div className="py-20 sm:py-24 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 text-slate-400 flex items-center justify-center mx-auto mb-4">
                <FiShield size={24} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                No Submissions Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1.5">
                {statusFilter === "ALL" && !searchQuery
                  ? "There are currently no donor certificate submissions assigned to this hospital."
                  : "No submissions match your search or filter criteria."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-3 px-4">Reference ID</th>
                  <th className="py-3 px-4">Donor Name</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedSubmissions.map((sub, idx) => (
                  <tr
                    key={sub.id || (sub as any)._id || sub.referenceId || idx}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {sub.referenceId}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {sub.donor?.name || "Donor"}
                        </span>
                        {sub.donor?.bloodGroup && sub.donor.bloodGroup !== "Not specified" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                            <FaDroplet size={8} /> {sub.donor.bloodGroup}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {formatDateSafe(sub.issueDate)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {sub.expiryDate ? formatDateSafe(sub.expiryDate) : "Does not expire"}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDateSafe(sub.submittedAt)}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(sub.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenReview(sub)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 transition-colors"
                      >
                        <FiEye size={13} />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination Footer ── */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <FiChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Review Modal ── */}
      <AnimatePresence>
        {selectedSubmission && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 md:p-6 flex min-h-full items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
            onClick={handleCloseReview}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <FiShield size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        id="review-modal-title"
                        className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight"
                      >
                        Certificate Verification Review
                      </h3>
                      <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {selectedSubmission.referenceId}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Verify institutional medical issuance for simulated donor acceptance
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseReview}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-3.5 sm:p-5 space-y-2.5 overflow-y-auto min-h-0 flex-1">
                {modalError && (
                  <div className="p-2.5 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900/50 flex items-center gap-2">
                    <FiAlertTriangle className="shrink-0 text-red-600" size={14} />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Details Grid: 4 columns on sm+ for maximum vertical compactness */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 sm:p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Donor Identity
                    </span>
                    <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1 truncate">
                      <span className="truncate">{selectedSubmission.donor?.name}</span>
                      {selectedSubmission.donor?.bloodGroup && (
                        <span className="px-1 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 shrink-0">
                          {selectedSubmission.donor.bloodGroup}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Current Verification Status
                    </span>
                    <div>{getStatusBadge(selectedSubmission.status)}</div>
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Issuing Hospital Stated
                    </span>
                    <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1 text-[11px] truncate">
                      <FaHospital className="text-red-500 shrink-0" size={11} />
                      <span className="truncate">{selectedSubmission.issuingHospital}</span>
                    </p>
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Validity Dates
                    </span>
                    <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1 text-[11px] truncate">
                      <FiCalendar className="text-emerald-500 shrink-0" size={11} />
                      <span className="truncate">
                        {formatDateSafe(selectedSubmission.issueDate)}
                        {selectedSubmission.expiryDate
                          ? ` – ${formatDateSafe(selectedSubmission.expiryDate)}`
                          : ""}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Uploaded Document Reference & Secure Download */}
                {selectedSubmission.file && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                        <FiPaperclip size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {selectedSubmission.file.originalName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatFileSize(selectedSubmission.file.size)} • Submitted:{" "}
                          {formatDateSafe(selectedSubmission.submittedAt)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadDoc(
                          selectedSubmission.id,
                          selectedSubmission.file?.originalName
                        )
                      }
                      disabled={downloadingDocId === selectedSubmission.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 shadow-xs"
                    >
                      {downloadingDocId === selectedSubmission.id ? (
                        <>
                          <FiLoader className="animate-spin text-red-600" size={12} />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <FiDownload size={12} className="text-red-600" />
                          <span>View Document</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Previous Review Feedback or Rejection Note */}
                {selectedSubmission.feedbackMessage && (
                  <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-800 dark:text-orange-300">
                    <span className="font-bold block mb-0.5 text-[11px]">Clarification Message Sent:</span>
                    <p className="text-xs">{selectedSubmission.feedbackMessage}</p>
                  </div>
                )}

                {selectedSubmission.rejectionReason && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-800 dark:text-red-300">
                    <span className="font-bold block mb-0.5 text-[11px]">Rejection Reason:</span>
                    <p className="text-xs">{selectedSubmission.rejectionReason}</p>
                  </div>
                )}

                {/* Decision History: Compact list */}
                {selectedSubmission.history && selectedSubmission.history.length > 0 && (
                  <div className="space-y-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Decision History ({selectedSubmission.history.length})
                    </h4>
                    <div className="space-y-1 text-xs max-h-24 overflow-y-auto pr-1">
                      {selectedSubmission.history.map((log, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                              {log.action}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500 text-[11px] truncate">
                              by {log.reviewerHospital || log.reviewerName || "Hospital Staff"}
                            </span>
                            {log.reason && (
                              <span className="text-[10px] text-slate-400 italic truncate max-w-[200px]">
                                — &ldquo;{log.reason}&rdquo;
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatDateSafe(log.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Review Action Controls ── */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Submit Verification Action
                  </h4>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setReviewAction("APPROVE");
                        setReviewReason("");
                        setModalError(null);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        reviewAction === "APPROVE"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      <FiCheck size={13} /> Approve Certificate
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReviewAction("REQUEST_CLARIFICATION");
                        setReviewReason("");
                        setModalError(null);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        reviewAction === "REQUEST_CLARIFICATION"
                          ? "bg-orange-600 text-white shadow-xs"
                          : "bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 hover:bg-orange-100"
                      }`}
                    >
                      <FiAlertTriangle size={13} /> Request Clarification
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReviewAction("REJECT");
                        setReviewReason("");
                        setModalError(null);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        reviewAction === "REJECT"
                          ? "bg-red-600 text-white shadow-xs"
                          : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-100"
                      }`}
                    >
                      <FiXCircle size={13} /> Reject Certificate
                    </button>
                  </div>

                  {/* Clarification or Rejection Reason Input */}
                  {(reviewAction === "REJECT" ||
                    reviewAction === "REQUEST_CLARIFICATION") && (
                    <div className="space-y-1 pt-1">
                      <label htmlFor="reviewReasonInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {reviewAction === "REJECT"
                          ? "Specific Institutional Rejection Reason"
                          : "Instructions / Clarification Required from Donor"}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="reviewReasonInput"
                        rows={2}
                        value={reviewReason}
                        onChange={(e) => setReviewReason(e.target.value)}
                        placeholder={
                          reviewAction === "REJECT"
                            ? "e.g., Certificate serial number does not match institutional issuance records."
                            : "e.g., Physician signature is blurry. Please provide a clear scan."
                        }
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                  )}

                  {/* Demonstration Notice in Modal */}
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <FiInfo className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Demo Verification Workflow: Approving a certificate simulates institutional
                      acceptance for demonstration purposes. It does not certify medical fitness or
                      replace required clinical screening.
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/80 dark:bg-slate-800/40 backdrop-blur-xs shrink-0">
                <button
                  type="button"
                  onClick={handleCloseReview}
                  disabled={submittingReview}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>

                {reviewAction && (
                  <button
                    type="button"
                    onClick={handleSubmitReviewDecision}
                    disabled={submittingReview}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs disabled:opacity-60"
                  >
                    {submittingReview ? (
                      <>
                        <FiLoader className="animate-spin" size={12} />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <FiCheck size={13} />
                        <span>Confirm Decision</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
