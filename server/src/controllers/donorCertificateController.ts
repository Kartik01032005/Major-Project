import { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import DonorCertificate from "../models/DonorCertificate.js";
import User from "../models/User.js";
import Hospital from "../models/Hospital.js";
import Notification from "../models/Notification.js";
import { CertificateStatus } from "../types/donorCertificate.js";

function cleanupUploadedFile(filePath?: string) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignore file deletion errors
    }
  }
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds the MongoDB query condition to match submissions assigned to a specific hospital user.
 */
async function buildHospitalMatchQuery(hospitalUser: any) {
  const orConditions: any[] = [{ issuingHospitalId: hospitalUser._id }];

  if (hospitalUser.organizationName) {
    const escapedOrg = escapeRegex(hospitalUser.organizationName.trim());
    orConditions.push({ issuingHospital: new RegExp(`^${escapedOrg}$`, "i") });

    // Also check if there's a Hospital collection document matching this organization name
    const hospDoc = await Hospital.findOne({
      name: new RegExp(`^${escapedOrg}$`, "i"),
    });
    if (hospDoc) {
      orConditions.push({ issuingHospitalId: hospDoc._id });
    }
  }

  if (hospitalUser.name) {
    const escapedName = escapeRegex(hospitalUser.name.trim());
    orConditions.push({ issuingHospital: new RegExp(`^${escapedName}$`, "i") });
  }

  return { $or: orConditions };
}

/**
 * Checks whether a certificate document belongs to the specified hospital user.
 */
function isCertificateAssignedToHospital(cert: any, hospitalUser: any): boolean {
  if (cert.issuingHospitalId && cert.issuingHospitalId.toString() === hospitalUser._id.toString()) {
    return true;
  }

  const certHosp = (cert.issuingHospital || "").trim().toLowerCase();
  const userOrg = (hospitalUser.organizationName || "").trim().toLowerCase();
  const userName = (hospitalUser.name || "").trim().toLowerCase();

  if (userOrg && certHosp === userOrg) return true;
  if (userName && certHosp === userName) return true;

  return false;
}

/**
 * @desc    Get authenticated user's current certificate status & details
 * @route   GET /api/certificates/my-certificate
 * @access  Private (Donor / User)
 */
export const getMyCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    const certificate = await DonorCertificate.findOne({ userId }).sort({ createdAt: -1 });

    if (!certificate) {
      res.status(200).json({
        success: true,
        data: {
          status: "NOT_SUBMITTED",
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: certificate._id,
        status: certificate.status,
        issuingHospital: certificate.issuingHospital,
        issuingHospitalId: certificate.issuingHospitalId,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        rejectionReason: certificate.rejectionReason,
        feedbackMessage: certificate.feedbackMessage,
        submittedAt: certificate.submittedAt,
        reviewedAt: certificate.reviewedAt,
        file: {
          originalName: certificate.file.originalName,
          mimeType: certificate.file.mimeType,
          size: certificate.file.size,
        },
        history: certificate.history || [],
      },
    });
  } catch (error: any) {
    console.error("❌ Get my certificate error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving donor certificate status",
    });
  }
};

/**
 * @desc    Submit or replace donor medical certificate
 * @route   POST /api/certificates
 * @access  Private (Donor / User)
 */
export const submitCertificate = async (req: Request, res: Response): Promise<void> => {
  const file = req.file;

  try {
    const userId = (req as any).user?._id;
    if (!userId) {
      cleanupUploadedFile(file?.path);
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { issuingHospital, issueDate, expiryDate, issuingHospitalId } = req.body;

    // Validate issuing hospital
    if (!issuingHospital || typeof issuingHospital !== "string" || !issuingHospital.trim()) {
      cleanupUploadedFile(file?.path);
      res.status(400).json({
        success: false,
        message: "Issuing hospital name is required.",
      });
      return;
    }

    // Validate issue date
    if (!issueDate) {
      cleanupUploadedFile(file?.path);
      res.status(400).json({
        success: false,
        message: "Certificate issue date is required.",
      });
      return;
    }

    const parsedIssueDate = new Date(issueDate);
    if (isNaN(parsedIssueDate.getTime())) {
      cleanupUploadedFile(file?.path);
      res.status(400).json({
        success: false,
        message: "Invalid certificate issue date format.",
      });
      return;
    }

    // Issue date cannot be in the future (allow a small 5 minute clock skew)
    const now = new Date(Date.now() + 5 * 60 * 1000);
    if (parsedIssueDate > now) {
      cleanupUploadedFile(file?.path);
      res.status(400).json({
        success: false,
        message: "Certificate issue date cannot be in the future.",
      });
      return;
    }

    // Validate optional expiry date
    let parsedExpiryDate: Date | undefined;
    if (expiryDate && typeof expiryDate === "string" && expiryDate.trim()) {
      parsedExpiryDate = new Date(expiryDate);
      if (isNaN(parsedExpiryDate.getTime())) {
        cleanupUploadedFile(file?.path);
        res.status(400).json({
          success: false,
          message: "Invalid certificate expiry date format.",
        });
        return;
      }

      if (parsedExpiryDate <= parsedIssueDate) {
        cleanupUploadedFile(file?.path);
        res.status(400).json({
          success: false,
          message: "Certificate expiry date must be strictly after the issue date.",
        });
        return;
      }
    }

    // Validate file
    if (!file) {
      res.status(400).json({
        success: false,
        message: "Please attach a valid certificate document (PDF, JPG, or PNG).",
      });
      return;
    }

    // Resolve issuingHospitalId if not explicitly passed
    let resolvedHospitalId = issuingHospitalId;
    if (!resolvedHospitalId) {
      const trimmedHosp = issuingHospital.trim();
      const escapedHosp = escapeRegex(trimmedHosp);
      const hospitalUser = await User.findOne({
        role: "HOSPITAL",
        $or: [
          { organizationName: new RegExp(`^${escapedHosp}$`, "i") },
          { name: new RegExp(`^${escapedHosp}$`, "i") },
        ],
      });
      if (hospitalUser) {
        resolvedHospitalId = hospitalUser._id;
      }
    }

    // Check for existing certificate to clean up previous file
    const existingCert = await DonorCertificate.findOne({ userId }).sort({ createdAt: -1 });
    if (existingCert && existingCert.file?.path && existingCert.file.path !== file.path) {
      cleanupUploadedFile(existingCert.file.path);
    }

    const newFileData = {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
    };

    let certificate;
    if (existingCert) {
      // Update existing submission with new document, strictly resetting to PENDING
      existingCert.issuingHospital = issuingHospital.trim();
      existingCert.issuingHospitalId = resolvedHospitalId || undefined;
      existingCert.issueDate = parsedIssueDate;
      existingCert.expiryDate = parsedExpiryDate;
      existingCert.file = newFileData;
      existingCert.status = "PENDING";
      existingCert.submittedAt = new Date();
      existingCert.rejectionReason = undefined;
      existingCert.feedbackMessage = undefined;
      existingCert.reviewedAt = undefined;
      existingCert.reviewedBy = undefined;

      certificate = await existingCert.save();
    } else {
      // Create fresh certificate submission, unconditionally starting with PENDING
      certificate = await DonorCertificate.create({
        userId,
        issuingHospital: issuingHospital.trim(),
        issuingHospitalId: resolvedHospitalId || undefined,
        issueDate: parsedIssueDate,
        expiryDate: parsedExpiryDate,
        file: newFileData,
        status: "PENDING",
        submittedAt: new Date(),
      });
    }

    res.status(201).json({
      success: true,
      message: "Certificate submitted successfully for simulated donor verification.",
      data: {
        id: certificate._id,
        status: certificate.status,
        issuingHospital: certificate.issuingHospital,
        issuingHospitalId: certificate.issuingHospitalId,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        submittedAt: certificate.submittedAt,
        file: {
          originalName: certificate.file.originalName,
          mimeType: certificate.file.mimeType,
          size: certificate.file.size,
        },
      },
    });
  } catch (error: any) {
    cleanupUploadedFile(file?.path);
    console.error("❌ Submit certificate error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit certificate due to a server error.",
    });
  }
};

/**
 * @desc    Securely download/view the authenticated user's uploaded certificate file
 * @route   GET /api/certificates/my-certificate/file
 * @access  Private (Owner only)
 */
export const downloadMyCertificateFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const certificate = await DonorCertificate.findOne({ userId }).sort({ createdAt: -1 });

    if (!certificate || !certificate.file?.path) {
      res.status(404).json({
        success: false,
        message: "No certificate file found for this account.",
      });
      return;
    }

    const resolvedPath = path.resolve(certificate.file.path);
    if (!fs.existsSync(resolvedPath)) {
      res.status(404).json({
        success: false,
        message: "Certificate file could not be found in storage.",
      });
      return;
    }

    res.setHeader("Content-Type", certificate.file.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(certificate.file.originalName)}"`
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");

    const stream = fs.createReadStream(resolvedPath);
    stream.on("error", (err) => {
      console.error("Stream error while reading certificate file:", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Error reading certificate file" });
      }
    });
    stream.pipe(res);
  } catch (error: any) {
    console.error("❌ Download certificate error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while reading certificate file",
    });
  }
};

/**
 * @desc    Securely download/view a certificate file by ID (Authorized to owner, assigned hospital, or admin)
 * @route   GET /api/certificates/:id/file
 * @access  Private (Owner, Assigned Hospital, or Admin)
 */
export const downloadCertificateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?._id) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { id } = req.params;
    const certificate = await DonorCertificate.findById(id);

    if (!certificate || !certificate.file?.path) {
      res.status(404).json({
        success: false,
        message: "Certificate not found.",
      });
      return;
    }

    // Cross-user and cross-institution authorization check
    const isOwner = certificate.userId.toString() === user._id.toString();
    const isAdmin = user.role === "admin" || user.role === "BLOOD_BANK";
    const isAssignedHospital =
      user.role === "HOSPITAL" && isCertificateAssignedToHospital(certificate, user);

    if (!isOwner && !isAdmin && !isAssignedHospital) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to access this certificate document.",
      });
      return;
    }

    const resolvedPath = path.resolve(certificate.file.path);
    if (!fs.existsSync(resolvedPath)) {
      res.status(404).json({
        success: false,
        message: "Certificate file could not be found in storage.",
      });
      return;
    }

    res.setHeader("Content-Type", certificate.file.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(certificate.file.originalName)}"`
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");

    const stream = fs.createReadStream(resolvedPath);
    stream.on("error", (err) => {
      console.error("Stream error while reading certificate file by id:", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Error reading certificate file" });
      }
    });
    stream.pipe(res);
  } catch (error: any) {
    console.error("❌ Download certificate by id error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while reading certificate file",
    });
  }
};

/**
 * @desc    Get hospital certificate verification queue with real-time counters and filtering
 * @route   GET /api/certificates/hospital-queue
 * @access  Private (HOSPITAL only)
 */
export const getHospitalCertificateQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?._id) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const hospitalMatch = await buildHospitalMatchQuery(user);

    // Compute genuine summary statistics for this hospital
    const allMatching = await DonorCertificate.find(hospitalMatch).select("status");

    const stats = {
      total: allMatching.length,
      pending: allMatching.filter((c) => c.status === "PENDING").length,
      approved: allMatching.filter((c) => c.status === "APPROVED" || c.status === "VERIFIED").length,
      rejected: allMatching.filter((c) => c.status === "REJECTED").length,
      needsClarification: allMatching.filter(
        (c) => c.status === "NEEDS_INFORMATION" || c.status === "NEEDS_CLARIFICATION"
      ).length,
    };

    // Filter criteria
    const { status, search, page = "1", limit = "10" } = req.query;

    const queryFilters: any = { ...hospitalMatch };

    if (status && typeof status === "string" && status.toUpperCase() !== "ALL") {
      const statusUpper = status.toUpperCase();
      if (statusUpper === "APPROVED" || statusUpper === "VERIFIED") {
        queryFilters.status = { $in: ["APPROVED", "VERIFIED"] };
      } else if (statusUpper === "NEEDS_INFORMATION" || statusUpper === "NEEDS_CLARIFICATION") {
        queryFilters.status = { $in: ["NEEDS_INFORMATION", "NEEDS_CLARIFICATION"] };
      } else {
        queryFilters.status = statusUpper;
      }
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Fetch matching certificates with populated safe donor details
    let query = DonorCertificate.find(queryFilters)
      .populate("userId", "name bloodGroup")
      .sort({ createdAt: -1 });

    const [rawSubmissions, totalFilteredCount] = await Promise.all([
      query.skip(skip).limit(limitNum),
      DonorCertificate.countDocuments(queryFilters),
    ]);

    // Apply search filter in-memory if search query provided
    let submissions = rawSubmissions;
    if (search && typeof search === "string" && search.trim()) {
      const searchLower = search.trim().toLowerCase();
      submissions = submissions.filter((cert) => {
        const donorName = (cert.userId as any)?.name?.toLowerCase() || "";
        const refId = `CERT-${cert._id.toString().slice(-6).toUpperCase()}`.toLowerCase();
        const hospital = cert.issuingHospital.toLowerCase();
        return (
          donorName.includes(searchLower) ||
          refId.includes(searchLower) ||
          hospital.includes(searchLower)
        );
      });
    }

    const sanitizedSubmissions = submissions.map((cert) => ({
      id: cert._id,
      referenceId: `CERT-${cert._id.toString().slice(-6).toUpperCase()}`,
      donor: {
        id: (cert.userId as any)?._id || cert.userId,
        name: (cert.userId as any)?.name || "Anonymous Donor",
        bloodGroup: (cert.userId as any)?.bloodGroup || "Not specified",
      },
      issuingHospital: cert.issuingHospital,
      issuingHospitalId: cert.issuingHospitalId,
      issueDate: cert.issueDate,
      expiryDate: cert.expiryDate,
      status: cert.status,
      submittedAt: cert.submittedAt,
      reviewedAt: cert.reviewedAt,
      rejectionReason: cert.rejectionReason,
      feedbackMessage: cert.feedbackMessage,
      file: {
        originalName: cert.file.originalName,
        mimeType: cert.file.mimeType,
        size: cert.file.size,
      },
      history: cert.history || [],
    }));

    res.status(200).json({
      success: true,
      data: {
        stats,
        submissions: sanitizedSubmissions,
        pagination: {
          total: totalFilteredCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalFilteredCount / limitNum) || 1,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Get hospital certificate queue error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching hospital certificate review queue",
    });
  }
};

/**
 * @desc    Get single certificate details by ID (enforces ownership or hospital assignment)
 * @route   GET /api/certificates/:id
 * @access  Private (Donor owner, assigned hospital, or admin)
 */
export const getCertificateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?._id) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { id } = req.params;
    const certificate = await DonorCertificate.findById(id).populate("userId", "name bloodGroup");

    if (!certificate) {
      res.status(404).json({ success: false, message: "Certificate not found" });
      return;
    }

    const isOwner = certificate.userId && (certificate.userId as any)._id?.toString() === user._id.toString();
    const isAdmin = user.role === "admin" || user.role === "BLOOD_BANK";
    const isAssignedHospital =
      user.role === "HOSPITAL" && isCertificateAssignedToHospital(certificate, user);

    if (!isOwner && !isAdmin && !isAssignedHospital) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to view this certificate.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: certificate._id,
        referenceId: `CERT-${certificate._id.toString().slice(-6).toUpperCase()}`,
        donor: {
          id: (certificate.userId as any)?._id || certificate.userId,
          name: (certificate.userId as any)?.name || "Anonymous Donor",
          bloodGroup: (certificate.userId as any)?.bloodGroup || "Not specified",
        },
        issuingHospital: certificate.issuingHospital,
        issuingHospitalId: certificate.issuingHospitalId,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        status: certificate.status,
        submittedAt: certificate.submittedAt,
        reviewedAt: certificate.reviewedAt,
        rejectionReason: certificate.rejectionReason,
        feedbackMessage: certificate.feedbackMessage,
        file: {
          originalName: certificate.file.originalName,
          mimeType: certificate.file.mimeType,
          size: certificate.file.size,
        },
        history: certificate.history || [],
      },
    });
  } catch (error: any) {
    console.error("❌ Get certificate by id error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching certificate details",
    });
  }
};

/**
 * @desc    Review and update certificate status (Approve, Reject, Request Clarification)
 * @route   PUT /api/certificates/:id/review
 * @access  Private (HOSPITAL only)
 */
export const reviewCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?._id) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { id } = req.params;
    const { action, reason } = req.body;

    if (!action || !["APPROVE", "REJECT", "REQUEST_CLARIFICATION"].includes(action)) {
      res.status(400).json({
        success: false,
        message: "Invalid review action. Allowed actions: APPROVE, REJECT, REQUEST_CLARIFICATION.",
      });
      return;
    }

    // Require reasons for rejection and clarification requests
    if (action === "REJECT" && (!reason || typeof reason !== "string" || !reason.trim())) {
      res.status(400).json({
        success: false,
        message: "A specific rejection reason is required.",
      });
      return;
    }

    if (action === "REQUEST_CLARIFICATION" && (!reason || typeof reason !== "string" || !reason.trim())) {
      res.status(400).json({
        success: false,
        message: "Clarification instructions or feedback is required.",
      });
      return;
    }

    const certificate = await DonorCertificate.findById(id);
    if (!certificate) {
      res.status(404).json({ success: false, message: "Certificate submission not found." });
      return;
    }

    // Enforce that the certificate is assigned to the authenticated hospital
    if (!isCertificateAssignedToHospital(certificate, user)) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to review certificates issued by another institution.",
      });
      return;
    }

    const previousStatus = certificate.status;
    let newStatus: CertificateStatus;
    if (action === "APPROVE") {
      newStatus = "APPROVED";
      certificate.rejectionReason = undefined;
      certificate.feedbackMessage = undefined;
    } else if (action === "REJECT") {
      newStatus = "REJECTED";
      certificate.rejectionReason = reason.trim();
      certificate.feedbackMessage = undefined;
    } else {
      newStatus = "NEEDS_INFORMATION";
      certificate.feedbackMessage = reason.trim();
      certificate.rejectionReason = undefined;
    }

    const trimmedReason = reason && typeof reason === "string" ? reason.trim() : undefined;

    // Record audit history entry
    const auditEntry = {
      previousStatus,
      newStatus,
      reviewedBy: user._id,
      reviewerName: user.name,
      reviewerHospital: user.organizationName || user.name,
      action: action as "APPROVE" | "REJECT" | "REQUEST_CLARIFICATION",
      reason: trimmedReason,
      timestamp: new Date(),
    };

    certificate.status = newStatus;
    certificate.reviewedAt = new Date();
    certificate.reviewedBy = user._id;
    if (!certificate.history) certificate.history = [];
    certificate.history.push(auditEntry as any);

    await certificate.save();

    // Create in-app notification for the submitting donor
    try {
      const notifTitle =
        action === "APPROVE"
          ? "Medical Certificate Verified"
          : action === "REJECT"
          ? "Medical Certificate Review Update"
          : "Clarification Needed on Medical Certificate";

      const notifMessage =
        action === "APPROVE"
          ? "Your medical certificate has been accepted and verified by the issuing hospital for the simulated donor verification workflow."
          : action === "REJECT"
          ? `Your medical certificate could not be verified by the issuing hospital: "${trimmedReason}". Please review in your dashboard.`
          : `The issuing hospital requested clarification regarding your certificate: "${trimmedReason}". Please review and update.`;

      const notifType =
        action === "APPROVE" ? "Approval" : action === "REJECT" ? "Rejection" : "System";

      await Notification.create({
        receiverId: certificate.userId,
        title: notifTitle,
        message: notifMessage,
        type: notifType,
      });
    } catch (notifErr) {
      console.error("Failed to deliver review notification to donor:", notifErr);
    }

    res.status(200).json({
      success: true,
      message: `Certificate has been successfully ${
        action === "APPROVE" ? "approved" : action === "REJECT" ? "rejected" : "marked for clarification"
      } for the simulated verification workflow.`,
      data: {
        id: certificate._id,
        status: certificate.status,
        issuingHospital: certificate.issuingHospital,
        rejectionReason: certificate.rejectionReason,
        feedbackMessage: certificate.feedbackMessage,
        reviewedAt: certificate.reviewedAt,
        history: certificate.history,
      },
    });
  } catch (error: any) {
    console.error("❌ Review certificate error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing certificate review decision",
    });
  }
};
