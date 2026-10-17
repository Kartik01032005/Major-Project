"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiFileText,
  FiUploadCloud,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiXCircle,
  FiDownload,
  FiCalendar,
  FiInfo,
  FiRefreshCw,
  FiX,
  FiCheck,
  FiLoader,
  FiShield,
  FiPaperclip,
} from "react-icons/fi";
import { FaHospital } from "react-icons/fa6";
import { useAuth, useToast } from "@/context";
import { dashboardService } from "@/services";
import { DonorCertificate, CertificateStatus, Hospital } from "@/types";

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

const STATUS_CONFIG: Record<
  CertificateStatus,
  {
    label: string;
    badgeClass: string;
    icon: React.ReactNode;
    description: string;
  }
> = {
  NOT_SUBMITTED: {
    label: "Not Submitted",
    badgeClass:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    icon: <FiInfo className="w-3.5 h-3.5" />,
    description:
      "Upload a medical donor certificate issued by a recognized hospital to complete simulated donor verification.",
  },
  PENDING: {
    label: "Verification Pending",
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800/60",
    icon: <FiClock className="w-3.5 h-3.5 animate-pulse" />,
    description:
      "Your certificate has been securely submitted and is awaiting simulated verification. You can replace or update it if needed.",
  },
  VERIFIED: {
    label: "Certificate Verified",
    badgeClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60",
    icon: <FiCheckCircle className="w-3.5 h-3.5" />,
    description:
      "Your medical certificate has been verified for simulated donor participation. Clinical screening is still required before blood collection.",
  },
  APPROVED: {
    label: "Certificate Approved",
    badgeClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60",
    icon: <FiCheckCircle className="w-3.5 h-3.5" />,
    description:
      "Your medical certificate has been accepted and verified by the issuing hospital for the simulated donor verification workflow.",
  },
  NEEDS_INFORMATION: {
    label: "Clarification Needed",
    badgeClass:
      "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800/60",
    icon: <FiAlertTriangle className="w-3.5 h-3.5" />,
    description:
      "The reviewing institution requested clarification. Please review their feedback and upload an updated document.",
  },
  NEEDS_CLARIFICATION: {
    label: "Clarification Needed",
    badgeClass:
      "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800/60",
    icon: <FiAlertTriangle className="w-3.5 h-3.5" />,
    description:
      "The reviewing institution requested clarification. Please review their feedback and upload an updated document.",
  },
  REJECTED: {
    label: "Certificate Rejected",
    badgeClass:
      "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800/60",
    icon: <FiXCircle className="w-3.5 h-3.5" />,
    description:
      "Your certificate could not be verified. Please review the reason below and submit a valid hospital-issued certificate.",
  },
  EXPIRED: {
    label: "Certificate Expired",
    badgeClass:
      "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800/60",
    icon: <FiCalendar className="w-3.5 h-3.5" />,
    description:
      "Your submitted certificate has passed its validity period. Please upload an updated medical certificate.",
  },
  REVOKED: {
    label: "Certificate Revoked",
    badgeClass:
      "bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-900",
    icon: <FiXCircle className="w-3.5 h-3.5" />,
    description:
      "This certificate has been revoked. Please reach out or submit an up-to-date certificate.",
  },
};

export default function DonorCertificateCard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [cert, setCert] = useState<DonorCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  // Form Mode State
  const [showForm, setShowForm] = useState(false);
  const [selectedHospitalMode, setSelectedHospitalMode] = useState<"preset" | "manual">("preset");
  const [hospitalSelectValue, setHospitalSelectValue] = useState("");
  const [manualHospitalName, setManualHospitalName] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [downloadingFile, setDownloadingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Today's date in YYYY-MM-DD for issue date upper bound
  const todayIso = new Date().toISOString().split("T")[0];

  const fetchCertificateAndHospitals = async () => {
    setLoading(true);
    try {
      const [certData, hospitalList] = await Promise.allSettled([
        dashboardService.getMyCertificate(),
        dashboardService.getHospitals(),
      ]);

      if (certData.status === "fulfilled") {
        setCert(certData.value);
      }
      if (hospitalList.status === "fulfilled" && Array.isArray(hospitalList.value)) {
        setHospitals(hospitalList.value);
        if (hospitalList.value.length > 0 && !hospitalSelectValue) {
          setHospitalSelectValue(hospitalList.value[0].name);
        }
      }
    } catch (err) {
      console.error("Error loading certificate information:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificateAndHospitals();
  }, []);

  const handleOpenForm = () => {
    setFormError(null);
    setSelectedFile(null);
    setUploadProgress(null);
    setIssueDate("");
    setExpiryDate("");
    setSelectedHospitalMode("preset");
    setHospitalSelectValue(hospitals.length > 0 ? hospitals[0].name : "Apollo BGS Hospital Mysore");
    setManualHospitalName("");
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setFormError(null);
    setSelectedFile(null);
    setUploadProgress(null);
  };

  const handleFileChange = (file: File | null) => {
    setFormError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setFormError("Invalid file format. Only PDF, JPG, and PNG files are allowed.");
      setSelectedFile(null);
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFormError("File size exceeds 5MB limit. Please choose a smaller file.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const defaultHospital = hospitals.length > 0 ? hospitals[0].name : "Apollo BGS Hospital Mysore";
    const hospitalName =
      selectedHospitalMode === "preset"
        ? (hospitalSelectValue === "__manual__" ? "" : (hospitalSelectValue || defaultHospital)).trim()
        : manualHospitalName.trim();

    if (!hospitalName || hospitalName === "__manual__") {
      setFormError("Please select or specify the issuing hospital.");
      return;
    }

    if (!issueDate) {
      setFormError("Please provide the certificate issue date.");
      return;
    }

    if (new Date(issueDate) > new Date()) {
      setFormError("Certificate issue date cannot be in the future.");
      return;
    }

    if (expiryDate) {
      if (new Date(expiryDate) <= new Date(issueDate)) {
        setFormError("Expiry date must be strictly after the issue date.");
        return;
      }
    }

    if (!selectedFile) {
      setFormError("Please select a medical certificate document to upload.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("issuingHospital", hospitalName);
      formData.append("issueDate", issueDate);
      if (expiryDate) {
        formData.append("expiryDate", expiryDate);
      }
      formData.append("certificate", selectedFile);

      // Match hospital against registered facilities (preset or manually typed)
      const matched = hospitals.find(
        (h) => h.name.trim().toLowerCase() === hospitalName.trim().toLowerCase()
      );
      if (matched?._id) {
        formData.append("issuingHospitalId", matched._id);
      }
      if (matched?.district) {
        formData.append("hospitalDistrict", matched.district);
      }
      if (matched?.state) {
        formData.append("hospitalState", matched.state);
      }

      const updated = await dashboardService.submitCertificate(
        formData,
        (percent) => {
          setUploadProgress(percent);
        }
      );

      setCert(updated);
      setShowForm(false);
      setSelectedFile(null);
      setUploadProgress(null);
      toast.success("Medical certificate submitted successfully for simulated verification.");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("certificate_updated", { detail: updated }));
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to upload certificate. Please check file format and try again.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadFile = async () => {
    if (downloadingFile) return;
    setDownloadingFile(true);
    try {
      const blob = await dashboardService.downloadCertificateFile();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = cert?.file?.originalName || "donor_certificate.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      toast.error("Failed to download certificate document.");
    } finally {
      setDownloadingFile(false);
    }
  };

  const currentStatus: CertificateStatus = cert?.status || "NOT_SUBMITTED";
  const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.NOT_SUBMITTED;

  // Medical donor certificate submission is strictly for individual donors, not institutional accounts
  const userRole = (user?.role || "").toUpperCase();
  if (user && (userRole === "BLOOD_BANK" || userRole === "ADMIN" || userRole === "HOSPITAL")) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      id="donor-certificate"
      role="region"
      aria-label="Donor Certificate Verification"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <FiFileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Medical Donor Certificate
                </h2>
                <span
                  data-testid="certificate-status-badge"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeClass}`}
                >
                  {config.icon}
                  {config.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Simulated donor verification workflow & clinical credential management
              </p>
            </div>
          </div>

          {!showForm && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleOpenForm}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs"
              >
                {currentStatus === "NOT_SUBMITTED" ? (
                  <>
                    <FiUploadCloud size={14} /> Submit Certificate
                  </>
                ) : (
                  <>
                    <FiRefreshCw size={14} /> Resubmit / Update
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Demo Notice / Disclaimer Banner ── */}
        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
          <FiShield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Demonstration Notice:</span> Verification is simulated for this
            college major project using demo data only. Certificate authenticity does not guarantee
            donor medical fitness or replace mandatory clinical testing at an authorized blood bank.
          </div>
        </div>
      </div>

      {/* ── Body Content ── */}
      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
            <FiLoader size={24} className="animate-spin text-red-600" />
            <p className="text-xs">Loading certificate status...</p>
          </div>
        ) : showForm ? (
          /* ── Submission / Resubmission Form ── */
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FiUploadCloud className="text-red-600" />
                {currentStatus === "NOT_SUBMITTED"
                  ? "Upload Medical Certificate"
                  : "Resubmit / Replace Certificate"}
              </h3>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1"
              >
                <FiX size={14} /> Cancel
              </button>
            </div>

            {formError && (
              <div
                data-testid="certificate-form-error"
                className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900/50 flex items-center gap-2"
              >
                <FiAlertTriangle className="shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Issuing Hospital Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Issuing Hospital <span className="text-red-500">*</span>
              </label>

              {/* Toggle preset demo vs manual input */}
              <div className="flex items-center gap-4 mb-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="hospitalMode"
                    value="preset"
                    checked={selectedHospitalMode === "preset"}
                    onChange={() => setSelectedHospitalMode("preset")}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>Select demo hospital</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="hospitalMode"
                    value="manual"
                    checked={selectedHospitalMode === "manual"}
                    onChange={() => setSelectedHospitalMode("manual")}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>Enter other hospital name</span>
                </label>
              </div>

              {selectedHospitalMode === "preset" ? (
                <div className="space-y-1.5">
                  <div className="relative">
                    <select
                      value={hospitalSelectValue}
                      onChange={(e) => {
                        if (e.target.value === "__manual__") {
                          setSelectedHospitalMode("manual");
                          setManualHospitalName("");
                        } else {
                          setHospitalSelectValue(e.target.value);
                        }
                      }}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    >
                      {hospitals.map((h) => (
                        <option key={h._id || h.name} value={h.name}>
                          {h.name} — {h.district}, {h.state}
                        </option>
                      ))}
                      {hospitals.length === 0 && (
                        <option value="Apollo BGS Hospital Mysore">
                          Apollo BGS Hospital Mysore
                        </option>
                      )}
                      <option value="__manual__" className="font-semibold text-red-600">
                        ➕ Other hospital (type manually)...
                      </option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
                    <span>Can&apos;t find your hospital in the list?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHospitalMode("manual");
                        setManualHospitalName("");
                      }}
                      className="text-red-600 dark:text-red-400 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Type name manually →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type="text"
                      list="hospitals-datalist"
                      placeholder="e.g., Manju Hospital, City General Hospital"
                      value={manualHospitalName}
                      onChange={(e) => setManualHospitalName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      autoFocus
                    />
                    <datalist id="hospitals-datalist">
                      {hospitals.map((h) => (
                        <option key={h._id || h.name} value={h.name}>
                          {h.name} ({h.district}, {h.state})
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
                    <span>Type any custom hospital name or select suggestion</span>
                    <button
                      type="button"
                      onClick={() => setSelectedHospitalMode("preset")}
                      className="text-red-600 dark:text-red-400 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      ← Back to dropdown list
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Date Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Certificate Issue Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  max={todayIso}
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Cannot be in the future</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Expiry Date <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="date"
                  min={issueDate || undefined}
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Must be after issue date if specified
                </span>
              </div>
            </div>

            {/* File Upload Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Certificate Document <span className="text-red-500">*</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="certificate-file-input"
              />

              {!selectedFile ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? "border-red-500 bg-red-50/50 dark:bg-red-950/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-700 bg-slate-50/50 dark:bg-slate-800/30"
                  }`}
                >
                  <FiUploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Click to browse or drag and drop your document
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports PDF, JPG, or PNG (maximum file size 5MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                      <FiPaperclip size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Upload Progress Bar */}
            {uploadProgress !== null && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Uploading securely...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit & Cancel Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelForm}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="animate-spin w-3.5 h-3.5" /> Submitting...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-3.5 h-3.5" /> Submit for Verification
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* ── Current Certificate Status & Details ── */
          <div className="space-y-4">
            {/* Status Information Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {config.description}
            </div>

            {/* Feedback / Rejection Note Banner (if present) */}
            {cert?.feedbackMessage && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <FiAlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Reviewer Clarification Request:
                </div>
                <p>{cert.feedbackMessage}</p>
              </div>
            )}

            {cert?.rejectionReason && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-800 dark:text-red-300">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <FiXCircle className="w-3.5 h-3.5 text-red-600" />
                  Reason for Rejection:
                </div>
                <p>{cert.rejectionReason}</p>
              </div>
            )}

            {currentStatus === "NOT_SUBMITTED" ? (
              /* Empty state prompt */
              <div className="text-center py-6 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto mb-3">
                  <FiUploadCloud size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  No Certificate Uploaded Yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                  Please upload a medical certificate issued by a recognized hospital. This will
                  associate your blood donor account with verified credential records.
                </p>
                <button
                  type="button"
                  onClick={handleOpenForm}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs"
                >
                  <FiUploadCloud size={14} /> Submit Certificate
                </button>
              </div>
            ) : (
              /* Submitted Details Grid */
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Issuing Hospital */}
                  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Issuing Hospital
                    </span>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                      <FaHospital className="text-red-500 shrink-0" size={13} />
                      <span className="truncate">{cert?.issuingHospital || "Not specified"}</span>
                    </p>
                  </div>

                  {/* Issue Date */}
                  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Certificate Issue Date
                    </span>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FiCalendar className="text-emerald-500 shrink-0" size={13} />
                      <span>{formatDateSafe(cert?.issueDate)}</span>
                    </p>
                  </div>

                  {/* Expiry Date */}
                  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Expiry Date
                    </span>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FiCalendar className="text-slate-400 shrink-0" size={13} />
                      <span>{cert?.expiryDate ? formatDateSafe(cert.expiryDate) : "Does not expire"}</span>
                    </p>
                  </div>

                  {/* Verification Routing & Facility Badge */}
                  {cert?.isUnregisteredHospital && (
                    <div className="col-span-full p-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 text-xs text-blue-800 dark:text-blue-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-medium flex items-center gap-1.5">
                        <FiShield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        Unregistered Issuing Hospital — Universal Demo Verification Assigned
                      </span>
                      {cert.assignedBloodBank && (
                        <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/40 px-2 py-0.5 rounded-md">
                          Reviewer: {cert.assignedBloodBank}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Uploaded File Reference & Secure Download */}
                {cert?.file && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                        <FiPaperclip size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {cert.file.originalName}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>{formatFileSize(cert.file.size)}</span>
                          <span>•</span>
                          <span>Submitted: {formatDateSafe(cert.submittedAt)}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadFile}
                      disabled={downloadingFile}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                    >
                      {downloadingFile ? (
                        <>
                          <FiLoader className="animate-spin w-3.5 h-3.5 text-red-600" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <FiDownload size={13} className="text-red-600" />
                          <span>View / Download Document</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
