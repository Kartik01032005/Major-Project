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
  FiPhone,
  FiMail,
  FiMapPin,
  FiUserCheck,
  FiFileText,
  FiPlus,
} from "react-icons/fi";
import { FaHospital, FaDroplet } from "react-icons/fa6";
import { useToast } from "@/context";
import { dashboardService } from "@/services";
import {
  BloodBankQueueSubmission,
  BloodBankQueueStats,
  CertificateStatus,
  ContactAttempt,
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
          Approved / Confirmed
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
          Unable to Verify / Rejected
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

export default function BloodBankVerificationQueue() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BloodBankQueueStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    needsClarification: 0,
  });
  const [submissions, setSubmissions] = useState<BloodBankQueueSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal & Review states
  const [selectedSubmission, setSelectedSubmission] =
    useState<BloodBankQueueSubmission | null>(null);
  const [reviewAction, setReviewAction] = useState<
    "APPROVE" | "REJECT" | "REQUEST_CLARIFICATION" | null
  >(null);
  const [reviewReason, setReviewReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState(false);

  // Contact Attempt Log form states
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMethod, setContactMethod] = useState("Phone Call");
  const [contactNotes, setContactNotes] = useState("");
  const [contactOutcome, setContactOutcome] = useState("Hospital Contacted");
  const [contactLoading, setContactLoading] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getBloodBankCertificateQueue({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: searchQuery.trim() || undefined,
        page,
        limit: 10,
      });

      if (res) {
        setStats(res.stats);
        setSubmissions(res.submissions || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch Blood Bank certificate queue:", err);
      toast.error(
        err?.response?.data?.message ||
          "Could not load verification queue. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQueue();
  };

  // Open / Download certificate file securely
  const handleDownloadCertificate = async (submission: BloodBankQueueSubmission) => {
    try {
      setDownloadingFile(true);
      const blob = await dashboardService.downloadCertificateById(submission.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = submission.file?.originalName || `Certificate_${submission.referenceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Certificate file downloaded successfully.");
    } catch (err: any) {
      console.error("Failed to download certificate file:", err);
      toast.error(
        err?.response?.data?.message ||
          "Failed to access certificate file. Make sure you are authorized."
      );
    } finally {
      setDownloadingFile(false);
    }
  };

  // Record contact attempt
  const handleSaveContactAttempt = async () => {
    if (!selectedSubmission) return;
    if (!contactNotes.trim() || contactNotes.trim().length < 5) {
      toast.error("Please enter descriptive notes regarding the contact attempt (at least 5 characters).");
      return;
    }

    try {
      setContactLoading(true);
      const result = await dashboardService.recordCertificateContactAttempt(
        selectedSubmission.id,
        {
          contactMethod,
          notes: contactNotes.trim(),
          outcome: contactOutcome,
        }
      );

      toast.success("Contact attempt recorded in audit log.");
      setContactNotes("");
      setShowContactForm(false);

      // Update selected submission locally
      setSelectedSubmission({
        ...selectedSubmission,
        contactAttempts: result.contactAttempts,
        history: result.history,
      });

      // Refresh list
      fetchQueue();
    } catch (err: any) {
      console.error("Failed to log contact attempt:", err);
      toast.error(
        err?.response?.data?.message ||
          "Failed to record contact attempt. Please try again."
      );
    } finally {
      setContactLoading(false);
    }
  };

  // Submit Verification Decision
  const handleSubmitReview = async () => {
    if (!selectedSubmission || !reviewAction) return;

    if (
      (reviewAction === "REJECT" || reviewAction === "REQUEST_CLARIFICATION") &&
      !reviewReason.trim()
    ) {
      toast.error(
        reviewAction === "REJECT"
          ? "Please provide a reason why verification was unsuccessful."
          : "Please specify what clarification or additional documentation is needed."
      );
      return;
    }

    try {
      setActionLoading(true);
      const res = await dashboardService.reviewCertificate(selectedSubmission.id, {
        action: reviewAction,
        reason: reviewReason.trim() || undefined,
      });

      toast.success(res.message || "Certificate review recorded successfully.");
      setSelectedSubmission(null);
      setReviewAction(null);
      setReviewReason("");
      fetchQueue();
    } catch (err: any) {
      console.error("Review action failed:", err);
      toast.error(
        err?.response?.data?.message ||
          "Failed to submit verification decision. Please check authorization."
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
      {/* Header and Demo Disclaimer */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                <FiShield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  External Certificate Verification Queue
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300 border border-red-200 dark:border-red-800">
                    Task 4 Demo
                  </span>
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Review and verify medical certificates assigned to this Blood Bank for issuing hospitals without active accounts.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchQueue}
            disabled={loading}
            className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Demo Disclaimer Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
          <FiInfo className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <p>
            <strong>Fictional College Demo Workflow:</strong> Verification actions performed here simulate cross-institution validation. This workflow does not contact real hospital departments or certify actual donor clinical fitness.
          </p>
        </div>
      </div>

      {/* Actual Database Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Assigned</span>
            <FiFileText className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {stats.total}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">All time submissions</p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-medium">
            <span>Pending Review</span>
            <FiClock className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-300">
            {stats.pending}
          </div>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70 mt-0.5">Requires action</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-medium">
            <span>Confirmed</span>
            <FiCheckCircle className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {stats.approved}
          </div>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">Approved certificates</p>
        </div>

        <div className="p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-800/40">
          <div className="flex items-center justify-between text-orange-700 dark:text-orange-400 text-xs font-medium">
            <span>Clarification</span>
            <FiAlertTriangle className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-orange-700 dark:text-orange-300">
            {stats.needsClarification}
          </div>
          <p className="text-[11px] text-orange-600/80 dark:text-orange-400/70 mt-0.5">Awaiting donor reply</p>
        </div>

        <div className="p-4 rounded-xl bg-red-50/70 dark:bg-red-950/20 border border-red-200/80 dark:border-red-800/40 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-red-700 dark:text-red-400 text-xs font-medium">
            <span>Unable to Verify</span>
            <FiXCircle className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-700 dark:text-red-300">
            {stats.rejected}
          </div>
          <p className="text-[11px] text-red-600/80 dark:text-red-400/70 mt-0.5">Rejected submissions</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl overflow-x-auto">
          {[
            { id: "ALL", label: "All" },
            { id: "PENDING", label: "Pending" },
            { id: "APPROVED", label: "Approved" },
            { id: "NEEDS_INFORMATION", label: "Clarification" },
            { id: "REJECTED", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 md:max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference, donor, hospital..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
          <FiSearch className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>
      </div>

      {/* Submissions Table / Empty State */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
            <FiLoader className="w-7 h-7 animate-spin text-red-500" />
            <p className="text-sm font-medium">Loading certificate verification queue...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <FiCheckCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No Submissions Assigned
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              There are currently no donor certificate submissions assigned to your blood bank matching the selected filters.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Donor</th>
                <th className="py-3 px-4">Stated Issuing Hospital</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {submissions.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                >
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-900 dark:text-slate-200">
                    {sub.referenceId}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {sub.donor?.name || "Anonymous Donor"}
                    </div>
                    <div className="inline-flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-semibold mt-0.5">
                      <FaDroplet className="w-2.5 h-2.5" />
                      {sub.donor?.bloodGroup || "Unknown"}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                      <FaHospital className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sub.issuingHospital}</span>
                    </div>
                    {sub.issuingHospitalContact?.phone && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <FiPhone className="w-3 h-3 text-slate-400" />
                        <span>{sub.issuingHospitalContact.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    <div>Issued: {formatDateSafe(sub.issueDate)}</div>
                    <div className="text-[11px] text-slate-400">
                      Submitted: {formatDateSafe(sub.submittedAt)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(sub.status)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedSubmission(sub);
                        setReviewAction(null);
                        setReviewReason("");
                        setShowContactForm(false);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                      Review & Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Review & Verification Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Certificate Review:</span>
                    <span className="font-mono text-red-600 dark:text-red-400">
                      {selectedSubmission.referenceId}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Assigned for external verification by your Blood Bank facility
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
                {/* Demo Notice */}
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
                  <FiInfo className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                  <div>
                    <span className="font-semibold">Simulated Verification:</span> This action records a demo verification outcome for academic presentation. It does not contact real hospital staff or medical boards.
                  </div>
                </div>

                {/* Grid: Donor & Certificate Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Donor Submission Info
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 pt-1">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Donor Name:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {selectedSubmission.donor?.name || "Anonymous Donor"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Blood Group:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          {selectedSubmission.donor?.bloodGroup || "Not specified"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Issue Date:</span>
                        <span>{formatDateSafe(selectedSubmission.issueDate)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Expiry Date:</span>
                        <span>{formatDateSafe(selectedSubmission.expiryDate)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[11px]">Current Status:</span>
                        <div className="mt-1">{getStatusBadge(selectedSubmission.status)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Issuing Hospital Contact Info Card */}
                  <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40 space-y-2">
                    <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FaHospital className="w-3.5 h-3.5 text-blue-600" />
                      Issuing Hospital Contact
                    </h4>
                    <div className="space-y-1.5 text-slate-700 dark:text-slate-300 pt-1">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between gap-2">
                        <span>{selectedSubmission.issuingHospital}</span>
                        {selectedSubmission.isUnregisteredHospital && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 shrink-0">
                            Unregistered Facility
                          </span>
                        )}
                      </div>

                      {selectedSubmission.issuingHospitalContact?.phone ? (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <FiPhone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>{selectedSubmission.issuingHospitalContact.phone}</span>
                        </div>
                      ) : (
                        <div className="text-slate-400 italic">No direct phone listed</div>
                      )}

                      {selectedSubmission.issuingHospitalContact?.email && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <FiMail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>{selectedSubmission.issuingHospitalContact.email}</span>
                        </div>
                      )}

                      {selectedSubmission.issuingHospitalContact?.address && (
                        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                          <FiMapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <span>
                            {selectedSubmission.issuingHospitalContact.address}
                            {selectedSubmission.issuingHospitalContact.district &&
                              `, ${selectedSubmission.issuingHospitalContact.district}`}
                            {selectedSubmission.issuingHospitalContact.state &&
                              `, ${selectedSubmission.issuingHospitalContact.state}`}
                          </span>
                        </div>
                      )}

                      {selectedSubmission.issuingHospitalContact?.medicalRecordsDesk && (
                        <div className="text-[11px] text-blue-700 dark:text-blue-300 pt-1 border-t border-blue-200/50 dark:border-blue-800/40">
                          Desk: {selectedSubmission.issuingHospitalContact.medicalRecordsDesk}
                        </div>
                      )}

                      {selectedSubmission.issuingHospitalContact?.notes && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-0.5">
                          {selectedSubmission.issuingHospitalContact.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Uploaded Certificate Document Access */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                      <FiPaperclip className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {selectedSubmission.file?.originalName || "Uploaded Certificate File"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatFileSize(selectedSubmission.file?.size)} • {selectedSubmission.file?.mimeType || "PDF Document"}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadCertificate(selectedSubmission)}
                    disabled={downloadingFile}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm transition"
                  >
                    {downloadingFile ? (
                      <FiLoader className="w-4 h-4 animate-spin text-red-500" />
                    ) : (
                      <FiDownload className="w-4 h-4 text-red-500" />
                    )}
                    <span>Download / View File</span>
                  </button>
                </div>

                {/* Hospital Contact Attempts Section */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <FiPhone className="w-3.5 h-3.5 text-red-500" />
                        Hospital Contact Attempts & Verification Notes
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Log calls, emails, or queries made to the issuing institution.
                      </p>
                    </div>

                    {!showContactForm && (
                      <button
                        onClick={() => setShowContactForm(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition"
                      >
                        <FiPlus className="w-3.5 h-3.5" />
                        Log Contact Attempt
                      </button>
                    )}
                  </div>

                  {/* Form to log a contact attempt */}
                  {showContactForm && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Contact Method
                          </label>
                          <select
                            value={contactMethod}
                            onChange={(e) => setContactMethod(e.target.value)}
                            className="w-full py-1.5 px-2.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                          >
                            <option value="Phone Call">Phone Call (Hospital Desk)</option>
                            <option value="Email Query">Email Query</option>
                            <option value="Official Portal">Hospital Verification Portal</option>
                            <option value="In-Person / Fax">Direct / Fax Query</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Outcome
                          </label>
                          <select
                            value={contactOutcome}
                            onChange={(e) => setContactOutcome(e.target.value)}
                            className="w-full py-1.5 px-2.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                          >
                            <option value="Hospital Contacted">Hospital Contacted (In Progress)</option>
                            <option value="Record Confirmed">Record Confirmed by Hospital</option>
                            <option value="No Answer / Busy">No Answer / Line Busy</option>
                            <option value="Record Not Found">Record Not Found in System</option>
                            <option value="Requires Formal Request">Requires Formal Request</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Findings & Notes <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={contactNotes}
                          onChange={(e) => setContactNotes(e.target.value)}
                          placeholder="e.g. Spoke with Medical Records Department Dr. Sharma; serial number verified."
                          className="w-full p-2.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowContactForm(false);
                            setContactNotes("");
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveContactAttempt}
                          disabled={contactLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition disabled:opacity-50"
                        >
                          {contactLoading ? (
                            <FiLoader className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FiCheck className="w-3.5 h-3.5" />
                          )}
                          Save Contact Log
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of past contact attempts */}
                  {selectedSubmission.contactAttempts && selectedSubmission.contactAttempts.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {selectedSubmission.contactAttempts.map((att, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {att.contactMethod}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {att.outcome || "Follow-up"}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 mt-1">
                              {att.notes}
                            </p>
                          </div>
                          <div className="text-right text-[10px] text-slate-400 flex-shrink-0">
                            <div>{formatDateSafe(att.contactDate)}</div>
                            <div>{att.staffName || "Staff"}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic text-[11px] py-1">
                      No hospital contact attempts logged yet for this submission.
                    </div>
                  )}
                </div>

                {/* Review Decision Controls */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Submit Verification Decision
                  </h4>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setReviewAction("APPROVE");
                        setReviewReason("");
                      }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition ${
                        reviewAction === "APPROVE"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      }`}
                    >
                      <FiCheckCircle className="w-4 h-4" />
                      Confirm & Approve
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReviewAction("REQUEST_CLARIFICATION");
                        setReviewReason("");
                      }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition ${
                        reviewAction === "REQUEST_CLARIFICATION"
                          ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                          : "bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                      }`}
                    >
                      <FiAlertTriangle className="w-4 h-4" />
                      Request Clarification
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReviewAction("REJECT");
                        setReviewReason("");
                      }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition ${
                        reviewAction === "REJECT"
                          ? "bg-red-600 text-white border-red-600 shadow-sm"
                          : "bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40"
                      }`}
                    >
                      <FiXCircle className="w-4 h-4" />
                      Unable to Verify / Reject
                    </button>
                  </div>

                  {/* Decision Reason Inputs */}
                  {reviewAction && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>
                          {reviewAction === "APPROVE" && "Approve Verification Notes (Optional)"}
                          {reviewAction === "REQUEST_CLARIFICATION" && "Clarification Required for Donor"}
                          {reviewAction === "REJECT" && "Reason for Rejection (Required)"}
                        </span>
                        {reviewAction !== "APPROVE" && (
                          <span className="text-red-500 font-bold">* Required</span>
                        )}
                      </div>

                      <textarea
                        rows={3}
                        value={reviewReason}
                        onChange={(e) => setReviewReason(e.target.value)}
                        placeholder={
                          reviewAction === "APPROVE"
                            ? "e.g. Serial verified with hospital administration desk."
                            : reviewAction === "REQUEST_CLARIFICATION"
                            ? "Specify missing or unreadable information (e.g. doctor's seal missing)."
                            : "State the reason verification could not be established."
                        }
                        className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setReviewAction(null);
                            setReviewReason("");
                          }}
                          className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitReview}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition disabled:opacity-50"
                        >
                          {actionLoading && <FiLoader className="w-3.5 h-3.5 animate-spin" />}
                          Confirm Decision
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Audit Trail Timeline */}
                {selectedSubmission.history && selectedSubmission.history.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Audit Trail & Status History
                    </h4>
                    <div className="space-y-2">
                      {selectedSubmission.history.map((log, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-[11px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              Action: {log.action} ({log.previousStatus} → {log.newStatus})
                            </span>
                            <span className="text-slate-400">{formatDateSafe(log.timestamp)}</span>
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 mt-1">
                            Reviewer: {log.reviewerName || "Authorized Reviewer"} (
                            {log.reviewerBloodBank || log.reviewerHospital || log.reviewerRole || "Staff"})
                          </div>
                          {log.reason && (
                            <div className="mt-1 text-slate-700 dark:text-slate-300 italic">
                              "{log.reason}"
                            </div>
                          )}
                          {log.contactNotes && (
                            <div className="mt-1 text-slate-600 dark:text-slate-400">
                              Contact Note: {log.contactNotes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
