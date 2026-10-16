import { Types } from "mongoose";
import DonorCertificate from "../models/DonorCertificate.js";
import { CertificateStatus } from "../types/donorCertificate.js";

export interface DonorCertificateEligibility {
  isEligible: boolean;
  status: CertificateStatus;
  reason: string;
}

/**
 * Checks whether the authenticated user has an APPROVED or VERIFIED medical certificate
 * required to accept blood donation requests in the simulated demo workflow.
 *
 * @param userId - The authenticated user's MongoDB ObjectId or string ID
 * @returns Eligibility details including boolean isEligible, status, and descriptive guidance
 */
export async function checkDonorCertificateEligibility(
  userId: string | Types.ObjectId
): Promise<DonorCertificateEligibility> {
  const certificate = await DonorCertificate.findOne({ userId }).sort({ createdAt: -1 });

  if (!certificate) {
    return {
      isEligible: false,
      status: "NOT_SUBMITTED",
      reason:
        "A verified medical certificate is required to accept blood donation requests. Please submit your medical certificate for demo verification.",
    };
  }

  // Check if expiry date has passed
  const isExpiredByDate = Boolean(
    certificate.expiryDate && new Date(certificate.expiryDate).getTime() <= Date.now()
  );

  const effectiveStatus: CertificateStatus =
    certificate.status === "EXPIRED" || isExpiredByDate
      ? "EXPIRED"
      : certificate.status;

  if (effectiveStatus === "APPROVED" || effectiveStatus === "VERIFIED") {
    return {
      isEligible: true,
      status: effectiveStatus,
      reason: "Medical certificate verified. Eligible to accept blood donation requests.",
    };
  }

  switch (effectiveStatus) {
    case "PENDING":
      return {
        isEligible: false,
        status: "PENDING",
        reason:
          "Your medical certificate is currently pending demo verification. You can accept donation requests once it has been reviewed and approved.",
      };
    case "NEEDS_INFORMATION":
    case "NEEDS_CLARIFICATION":
      return {
        isEligible: false,
        status: "NEEDS_CLARIFICATION",
        reason: certificate.feedbackMessage
          ? `Your medical certificate requires clarification from the reviewer: "${certificate.feedbackMessage}". Please review and update your certificate.`
          : "Your medical certificate requires clarification from the reviewer before you can accept donation requests. Please review and update your submission.",
      };
    case "REJECTED":
      return {
        isEligible: false,
        status: "REJECTED",
        reason: certificate.rejectionReason
          ? `Your medical certificate was rejected during demo verification: "${certificate.rejectionReason}". Please submit a valid certificate.`
          : "Your medical certificate was rejected during demo verification. Please submit a valid certificate to accept donation requests.",
      };
    case "EXPIRED":
      return {
        isEligible: false,
        status: "EXPIRED",
        reason:
          "Your medical certificate has expired. Please submit an updated medical certificate to accept donation requests.",
      };
    case "REVOKED":
      return {
        isEligible: false,
        status: "REVOKED",
        reason:
          "Your medical certificate has been revoked. Re-verification is required before you can accept donation requests.",
      };
    default:
      return {
        isEligible: false,
        status: "NOT_SUBMITTED",
        reason:
          "A verified medical certificate is required to accept blood donation requests. Please submit your medical certificate for demo verification.",
      };
  }
}
