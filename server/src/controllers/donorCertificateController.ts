import { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import DonorCertificate from "../models/DonorCertificate.js";
import User from "../models/User.js";
import Hospital from "../models/Hospital.js";
import Notification from "../models/Notification.js";
import { CertificateStatus } from "../types/donorCertificate.js";
import { enqueueNotification } from "../services/notificationQueue.js";
import { logAuditEvent } from "../services/auditService.js";

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
    orConditions.push({
      issuingHospital: new RegExp(`^${escapedOrg}$`, "i"),
      isUnregisteredHospital: { $ne: true },
      verificationMethod: { $ne: "BLOOD_BANK_EXTERNAL" },
    });

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
    orConditions.push({
      issuingHospital: new RegExp(`^${escapedName}$`, "i"),
      isUnregisteredHospital: { $ne: true },
      verificationMethod: { $ne: "BLOOD_BANK_EXTERNAL" },
    });
  }

  return { $or: orConditions };
}

/**
 * Checks whether a certificate document belongs to the specified hospital user.
 */
function isCertificateAssignedToHospital(cert: any, hospitalUser: any): boolean {
  if (cert.verificationMethod === "BLOOD_BANK_EXTERNAL" || cert.isUnregisteredHospital) {
    return false;
  }

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
 * Builds the MongoDB query condition to match submissions assigned to a specific blood bank.
 */
function buildBloodBankMatchQuery(bloodBankUser: any) {
  const orConditions: any[] = [{ assignedBloodBankId: bloodBankUser._id }];

  if (bloodBankUser.organizationName) {
    const escapedOrg = escapeRegex(bloodBankUser.organizationName.trim());
    orConditions.push({ assignedBloodBank: new RegExp(`^${escapedOrg}$`, "i") });
  }

  if (bloodBankUser.name) {
    const escapedName = escapeRegex(bloodBankUser.name.trim());
    orConditions.push({ assignedBloodBank: new RegExp(`^${escapedName}$`, "i") });
  }

  return { $or: orConditions };
}

/**
 * Checks whether a certificate submission is assigned to the specified blood bank.
 */
function isCertificateAssignedToBloodBank(cert: any, bloodBankUser: any): boolean {
  if (cert.assignedBloodBankId && cert.assignedBloodBankId.toString() === bloodBankUser._id.toString()) {
    return true;
  }

  const certBank = (cert.assignedBloodBank || "").trim().toLowerCase();
  const userOrg = (bloodBankUser.organizationName || "").trim().toLowerCase();
  const userName = (bloodBankUser.name || "").trim().toLowerCase();

  if (userOrg && certBank && certBank === userOrg) return true;
  if (userName && certBank && certBank === userName) return true;

  return false;
}

/**
 * Look up the stated issuing hospital's official contact information for blood bank reviewers.
 */
async function getIssuingHospitalContactInfo(cert: any): Promise<{
  hospitalName?: string;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  state?: string;
  medicalRecordsDesk?: string;
  notes?: string;
  isUnregisteredHospital?: boolean;
} | null> {
  try {
    let hospitalDoc: any = null;
    if (cert.issuingHospitalId) {
      hospitalDoc = await Hospital.findById(cert.issuingHospitalId);
      if (!hospitalDoc) {
        hospitalDoc = await User.findOne({ _id: cert.issuingHospitalId, role: "HOSPITAL" });
      }
    }
    if (!hospitalDoc && cert.issuingHospital) {
      const escaped = escapeRegex(cert.issuingHospital.trim());
      hospitalDoc = await Hospital.findOne({ name: new RegExp(`^${escaped}$`, "i") });
      if (!hospitalDoc) {
        hospitalDoc = await User.findOne({
          role: "HOSPITAL",
          $or: [
            { organizationName: new RegExp(`^${escaped}$`, "i") },
            { name: new RegExp(`^${escaped}$`, "i") },
          ],
        });
      }
    }

    if (hospitalDoc) {
      return {
        hospitalName: hospitalDoc.organizationName || hospitalDoc.name || cert.issuingHospital,
        phone: hospitalDoc.phone || "Not listed",
        email: hospitalDoc.email || undefined,
        address: hospitalDoc.address || undefined,
        district: hospitalDoc.district || (hospitalDoc.location as any)?.district,
        state: hospitalDoc.state || (hospitalDoc.location as any)?.state,
        medicalRecordsDesk: "Hospital Records & Verification Counter",
        isUnregisteredHospital: false,
      };
    }

    // For unregistered demo issuing hospitals
    return {
      hospitalName: cert.issuingHospital,
      phone: "Unlisted (Unregistered Demo Facility)",
      address: "Independent healthcare facility (Not registered on BloodLink)",
      district: cert.hospitalDistrict || "External / Unregistered",
      state: cert.hospitalState || "Demo Region",
      medicalRecordsDesk: "Direct Medical Records inquiry required",
      notes: "This issuing hospital does not have an active BloodLink institutional account. External demo verification assigned to Blood Bank.",
      isUnregisteredHospital: true,
    };
  } catch (err) {
    console.error("Error looking up hospital contact info:", err);
  }
  return null;
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
        isUnregisteredHospital: certificate.isUnregisteredHospital || false,
        hospitalDistrict: certificate.hospitalDistrict,
        hospitalState: certificate.hospitalState,
        assignedBloodBank: certificate.assignedBloodBank,
        assignedBloodBankId: certificate.assignedBloodBankId,
        verificationMethod: certificate.verificationMethod,
        assignmentNotes: certificate.assignmentNotes,
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

    const {
      issuingHospital,
      issueDate,
      expiryDate,
      issuingHospitalId,
      hospitalDistrict,
      hospitalState,
    } = req.body;

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

    // Resolve whether issuing hospital is a participating registered BloodLink hospital
    let resolvedHospitalId = issuingHospitalId;
    let matchingHospitalUser = null;

    if (resolvedHospitalId) {
      matchingHospitalUser = await User.findOne({ _id: resolvedHospitalId, role: "HOSPITAL" });
    }
    if (!matchingHospitalUser && issuingHospital) {
      const trimmedHosp = issuingHospital.trim();
      const escapedHosp = escapeRegex(trimmedHosp);
      matchingHospitalUser = await User.findOne({
        role: "HOSPITAL",
        $or: [
          { organizationName: new RegExp(`^${escapedHosp}$`, "i") },
          { name: new RegExp(`^${escapedHosp}$`, "i") },
        ],
      });
      if (matchingHospitalUser) {
        resolvedHospitalId = matchingHospitalUser._id;
      }
    }

    let verificationMethod: "HOSPITAL_DIRECT" | "BLOOD_BANK_EXTERNAL" = "HOSPITAL_DIRECT";
    let isUnregisteredHospital = false;
    let assignedBloodBankId: any = undefined;
    let assignedBloodBank: string | undefined = undefined;
    let assignmentNotes: string;

    if (matchingHospitalUser) {
      // Registered demo hospital: Direct hospital review
      verificationMethod = "HOSPITAL_DIRECT";
      isUnregisteredHospital = false;
      resolvedHospitalId = matchingHospitalUser._id;
      assignmentNotes = `Direct verification assigned to registered issuing hospital (${
        matchingHospitalUser.organizationName || matchingHospitalUser.name
      }).`;
    } else {
      // Unregistered hospital: Universal participation routing to eligible demo Blood Bank reviewer
      verificationMethod = "BLOOD_BANK_EXTERNAL";
      isUnregisteredHospital = true;
      resolvedHospitalId = undefined;

      const submittingUser = await User.findById(userId);
      const targetDistrict =
        (hospitalDistrict && typeof hospitalDistrict === "string" && hospitalDistrict.trim()) ||
        submittingUser?.location?.district;
      const targetState =
        (hospitalState && typeof hospitalState === "string" && hospitalState.trim()) ||
        submittingUser?.location?.state;

      let eligibleBloodBank = null;

      // Priority 1: Match registered Blood Bank in same district and state
      if (targetDistrict && targetState) {
        eligibleBloodBank = await User.findOne({
          role: "BLOOD_BANK",
          "location.district": new RegExp(`^${escapeRegex(targetDistrict.trim())}$`, "i"),
          "location.state": new RegExp(`^${escapeRegex(targetState.trim())}$`, "i"),
        });
      }

      // Priority 2: Match registered Blood Bank in same state
      if (!eligibleBloodBank && targetState) {
        eligibleBloodBank = await User.findOne({
          role: "BLOOD_BANK",
          "location.state": new RegExp(`^${escapeRegex(targetState.trim())}$`, "i"),
        });
      }

      // Priority 3: Fallback to any registered Blood Bank in demo database
      if (!eligibleBloodBank) {
        eligibleBloodBank = await User.findOne({ role: "BLOOD_BANK" });
      }

      if (eligibleBloodBank) {
        assignedBloodBankId = eligibleBloodBank._id;
        assignedBloodBank = eligibleBloodBank.organizationName || eligibleBloodBank.name;
        assignmentNotes = `Hospital is not registered on BloodLink. Routed to nearby participating Blood Bank (${assignedBloodBank}) for external demo verification.`;
      } else {
        assignmentNotes =
          "Pending reviewer assignment: No eligible participating demo verification facility is currently registered in the system.";
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

    const submitHistoryEntry = {
      previousStatus: existingCert ? existingCert.status : "NOT_SUBMITTED",
      newStatus: "PENDING",
      reviewedBy: userId,
      reviewerName: (req as any).user?.name || "Donor",
      reviewerRole: "USER" as const,
      action: "SUBMIT" as const,
      contactNotes: assignmentNotes,
      timestamp: new Date(),
    };

    let certificate;
    if (existingCert) {
      // Update existing submission with new document, strictly resetting to PENDING
      existingCert.issuingHospital = issuingHospital.trim();
      existingCert.issuingHospitalId = resolvedHospitalId || undefined;
      existingCert.isUnregisteredHospital = isUnregisteredHospital;
      existingCert.hospitalDistrict = hospitalDistrict
        ? String(hospitalDistrict).trim()
        : undefined;
      existingCert.hospitalState = hospitalState ? String(hospitalState).trim() : undefined;
      existingCert.assignedBloodBankId = assignedBloodBankId;
      existingCert.assignedBloodBank = assignedBloodBank;
      existingCert.assignedAt = new Date();
      existingCert.assignmentNotes = assignmentNotes;
      existingCert.verificationMethod = verificationMethod;
      existingCert.issueDate = parsedIssueDate;
      existingCert.expiryDate = parsedExpiryDate;
      existingCert.file = newFileData;
      existingCert.status = "PENDING";
      existingCert.submittedAt = new Date();
      existingCert.rejectionReason = undefined;
      existingCert.feedbackMessage = undefined;
      existingCert.reviewedAt = undefined;
      existingCert.reviewedBy = undefined;
      if (!existingCert.history) existingCert.history = [];
      existingCert.history.push(submitHistoryEntry as any);

      certificate = await existingCert.save();
    } else {
      // Create fresh certificate submission, unconditionally starting with PENDING
      certificate = await DonorCertificate.create({
        userId,
        issuingHospital: issuingHospital.trim(),
        issuingHospitalId: resolvedHospitalId || undefined,
        isUnregisteredHospital,
        hospitalDistrict: hospitalDistrict ? String(hospitalDistrict).trim() : undefined,
        hospitalState: hospitalState ? String(hospitalState).trim() : undefined,
        assignedBloodBankId,
        assignedBloodBank,
        assignedAt: new Date(),
        assignmentNotes,
        verificationMethod,
        issueDate: parsedIssueDate,
        expiryDate: parsedExpiryDate,
        file: newFileData,
        status: "PENDING",
        submittedAt: new Date(),
        history: [submitHistoryEntry as any],
      });
    }

    // Record audit event for certificate submission
    void logAuditEvent({
      action: "CERTIFICATE_SUBMITTED",
      entityType: "CERTIFICATE",
      entityId: certificate._id,
      performedBy: userId,
      performerName: (req as any).user?.name || "Donor",
      performerRole: "USER",
      previousStatus: existingCert ? existingCert.status : "NOT_SUBMITTED",
      newStatus: "PENDING",
      metadata: {
        issuingHospital: certificate.issuingHospital,
        isUnregisteredHospital: certificate.isUnregisteredHospital,
        verificationMethod: certificate.verificationMethod,
        assignedBloodBank: certificate.assignedBloodBank,
      },
    });

    // Notify donor of successful submission
    enqueueNotification({
      receiverId: userId.toString(),
      title: "Medical Certificate Submitted",
      message: `Your medical certificate from ${certificate.issuingHospital} has been submitted for demo verification.`,
      type: "System",
      link: "/dashboard#donor-certificate",
    });

    // Notify assigned institution
    if (resolvedHospitalId) {
      enqueueNotification({
        receiverId: resolvedHospitalId.toString(),
        title: "New Certificate Verification Assigned",
        message: `A new donor medical certificate has been submitted for ${certificate.issuingHospital} and assigned for demo verification.`,
        type: "System",
        link: "/dashboard/hospital",
      });
    } else if (assignedBloodBankId) {
      enqueueNotification({
        receiverId: assignedBloodBankId.toString(),
        title: "New External Certificate Verification Assigned",
        message: `A donor certificate issued by ${certificate.issuingHospital} has been routed to your blood bank for external demo verification.`,
        type: "System",
        link: "/dashboard/admin#verification-queue",
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
        isUnregisteredHospital: certificate.isUnregisteredHospital,
        verificationMethod: certificate.verificationMethod,
        assignedBloodBank: certificate.assignedBloodBank,
        assignedBloodBankId: certificate.assignedBloodBankId,
        assignmentNotes: certificate.assignmentNotes,
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
    const isAssignedHospital =
      user.role === "HOSPITAL" && isCertificateAssignedToHospital(certificate, user);
    const isAssignedBloodBank =
      (user.role === "BLOOD_BANK" || user.role === "admin") &&
      isCertificateAssignedToBloodBank(certificate, user);

    if (!isOwner && !isAssignedHospital && !isAssignedBloodBank) {
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
      isUnregisteredHospital: cert.isUnregisteredHospital || false,
      verificationMethod: cert.verificationMethod || "HOSPITAL_DIRECT",
      assignmentNotes: cert.assignmentNotes,
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
    const isAssignedHospital =
      user.role === "HOSPITAL" && isCertificateAssignedToHospital(certificate, user);
    const isAssignedBloodBank =
      (user.role === "BLOOD_BANK" || user.role === "admin") &&
      isCertificateAssignedToBloodBank(certificate, user);

    if (!isOwner && !isAssignedHospital && !isAssignedBloodBank) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to view this certificate.",
      });
      return;
    }

    const hospitalContact = await getIssuingHospitalContactInfo(certificate);

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
        isUnregisteredHospital: certificate.isUnregisteredHospital || false,
        verificationMethod: certificate.verificationMethod || "HOSPITAL_DIRECT",
        assignmentNotes: certificate.assignmentNotes,
        hospitalDistrict: certificate.hospitalDistrict,
        hospitalState: certificate.hospitalState,
        issuingHospitalContact: hospitalContact,
        assignedBloodBank: certificate.assignedBloodBank,
        assignedBloodBankId: certificate.assignedBloodBankId,
        assignedAt: certificate.assignedAt,
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
        contactAttempts: certificate.contactAttempts || [],
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

    // Enforce that the certificate is assigned to the authenticated reviewer institution
    const isHospital = user.role === "HOSPITAL";
    const isBloodBank = user.role === "BLOOD_BANK" || user.role === "admin";

    if (isHospital && !isCertificateAssignedToHospital(certificate, user)) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to review certificates issued by another institution.",
      });
      return;
    }

    if (isBloodBank && !isCertificateAssignedToBloodBank(certificate, user)) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to review certificates assigned to another blood bank.",
      });
      return;
    }

    if (!isHospital && !isBloodBank) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions to review medical certificates.",
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
    const reviewerInst = user.organizationName || user.name || (isHospital ? "Hospital" : "Blood Bank");

    // Record audit history entry
    const auditEntry = {
      previousStatus,
      newStatus,
      reviewedBy: user._id,
      reviewerName: user.name,
      reviewerHospital: isHospital ? reviewerInst : undefined,
      reviewerBloodBank: isBloodBank ? reviewerInst : undefined,
      reviewerInstitution: reviewerInst,
      reviewerRole: isHospital ? "HOSPITAL" : "BLOOD_BANK",
      action: action as "APPROVE" | "REJECT" | "REQUEST_CLARIFICATION",
      reason: trimmedReason,
      contactNotes: req.body.contactNotes ? String(req.body.contactNotes).trim() : undefined,
      evidence: req.body.evidence ? String(req.body.evidence).trim() : undefined,
      timestamp: new Date(),
    };

    certificate.status = newStatus;
    certificate.reviewedAt = new Date();
    certificate.reviewedBy = user._id;
    if (!certificate.history) certificate.history = [];
    certificate.history.push(auditEntry as any);

    await certificate.save();

    // Record audit log for certificate review decision
    void logAuditEvent({
      action:
        action === "APPROVE"
          ? "CERTIFICATE_APPROVED"
          : action === "REJECT"
          ? "CERTIFICATE_REJECTED"
          : "CERTIFICATE_CLARIFICATION_REQUESTED",
      entityType: "CERTIFICATE",
      entityId: certificate._id,
      performedBy: user._id,
      performerName: user.name,
      performerRole: isHospital ? "HOSPITAL" : "BLOOD_BANK",
      previousStatus,
      newStatus,
      reason: trimmedReason,
      metadata: {
        reviewerInstitution: reviewerInst,
        contactNotes: req.body.contactNotes ? String(req.body.contactNotes).trim() : undefined,
      },
    });

    // Create in-app notification for the submitting donor
    try {
      const reviewerTypeLabel = isHospital ? "the issuing hospital" : "the reviewing blood bank";
      const notifTitle =
        action === "APPROVE"
          ? "Medical Certificate Verified"
          : action === "REJECT"
          ? "Medical Certificate Review Update"
          : "Clarification Needed on Medical Certificate";

      const notifMessage =
        action === "APPROVE"
          ? `Your medical certificate has been accepted and verified by ${reviewerTypeLabel} for the simulated donor verification workflow.`
          : action === "REJECT"
          ? `Your medical certificate could not be verified by ${reviewerTypeLabel}: "${trimmedReason}". Please review in your dashboard.`
          : `${reviewerTypeLabel.charAt(0).toUpperCase() + reviewerTypeLabel.slice(1)} requested clarification regarding your certificate: "${trimmedReason}". Please review and update.`;

      const notifType =
        action === "APPROVE" ? "Approval" : action === "REJECT" ? "Rejection" : "System";

      enqueueNotification({
        receiverId: certificate.userId.toString(),
        title: notifTitle,
        message: notifMessage,
        type: notifType,
        link: "/dashboard#donor-certificate",
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

/**
 * @desc    Get blood bank certificate verification queue with real-time counters and filtering
 * @route   GET /api/certificates/blood-bank-queue
 * @access  Private (BLOOD_BANK / admin only)
 */
export const getBloodBankCertificateQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?._id) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const bloodBankMatch = buildBloodBankMatchQuery(user);

    // Compute genuine summary statistics for this blood bank
    const allMatching = await DonorCertificate.find(bloodBankMatch).select("status");

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

    const queryFilters: any = { ...bloodBankMatch };

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
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [rawSubmissions, totalFilteredCount] = await Promise.all([
      DonorCertificate.find(queryFilters)
        .populate("userId", "name bloodGroup")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      DonorCertificate.countDocuments(queryFilters),
    ]);

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

    // Attach hospital official contact info for each submission
    const sanitizedSubmissions = await Promise.all(
      submissions.map(async (cert) => {
        const hospitalContact = await getIssuingHospitalContactInfo(cert);
        return {
          id: cert._id,
          referenceId: `CERT-${cert._id.toString().slice(-6).toUpperCase()}`,
          donor: {
            id: (cert.userId as any)?._id || cert.userId,
            name: (cert.userId as any)?.name || "Anonymous Donor",
            bloodGroup: (cert.userId as any)?.bloodGroup || "Not specified",
          },
          issuingHospital: cert.issuingHospital,
          issuingHospitalId: cert.issuingHospitalId,
          isUnregisteredHospital: cert.isUnregisteredHospital || false,
          verificationMethod: cert.verificationMethod || "BLOOD_BANK_EXTERNAL",
          assignmentNotes: cert.assignmentNotes,
          issuingHospitalContact: hospitalContact,
          assignedBloodBank: cert.assignedBloodBank,
          assignedBloodBankId: cert.assignedBloodBankId,
          assignedAt: cert.assignedAt,
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
          contactAttempts: cert.contactAttempts || [],
          history: cert.history || [],
        };
      })
    );

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
    console.error("❌ Get blood bank certificate queue error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching blood bank certificate review queue",
    });
  }
};

/**
 * @desc    Record hospital contact attempt and verification findings
 * @route   POST /api/certificates/:id/contact-attempt
 * @access  Private (BLOOD_BANK only)
 */
export const recordCertificateContactAttempt = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?._id) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { id } = req.params;
    const { contactMethod, notes, outcome } = req.body;

    if (!notes || typeof notes !== "string" || !notes.trim()) {
      res.status(400).json({
        success: false,
        message: "Contact attempt notes and verification findings are required.",
      });
      return;
    }

    const certificate = await DonorCertificate.findById(id);
    if (!certificate) {
      res.status(404).json({ success: false, message: "Certificate submission not found." });
      return;
    }

    // Verify authorized blood bank assignment
    if (!isCertificateAssignedToBloodBank(certificate, user)) {
      res.status(403).json({
        success: false,
        message:
          "You are not authorized to record contact attempts for submissions assigned to another facility.",
      });
      return;
    }

    const trimmedNotes = notes.trim();
    const trimmedMethod =
      (contactMethod && typeof contactMethod === "string" ? contactMethod.trim() : "Phone Call") ||
      "Phone Call";
    const trimmedOutcome =
      (outcome && typeof outcome === "string" ? outcome.trim() : "Follow-up") || "Follow-up";

    const attempt = {
      contactDate: new Date(),
      contactMethod: trimmedMethod,
      notes: trimmedNotes,
      outcome: trimmedOutcome,
      staffName: user.name || "Blood Bank Staff",
    };

    if (!certificate.contactAttempts) certificate.contactAttempts = [];
    certificate.contactAttempts.push(attempt as any);

    // Append to audit trail
    if (!certificate.history) certificate.history = [];
    certificate.history.push({
      previousStatus: certificate.status,
      newStatus: certificate.status,
      reviewedBy: user._id,
      reviewerName: user.name,
      reviewerBloodBank: user.organizationName || user.name,
      reviewerInstitution: user.organizationName || user.name,
      reviewerRole: "BLOOD_BANK",
      action: "CONTACT_ATTEMPT",
      contactNotes: `${trimmedMethod}: ${trimmedNotes} (${trimmedOutcome})`,
      timestamp: new Date(),
    } as any);

    await certificate.save();

    // Record audit event for contact attempt
    void logAuditEvent({
      action: "CONTACT_ATTEMPT_LOGGED",
      entityType: "CERTIFICATE",
      entityId: certificate._id,
      performedBy: user._id,
      performerName: user.name,
      performerRole: "BLOOD_BANK",
      previousStatus: certificate.status,
      newStatus: certificate.status,
      notes: `${trimmedMethod}: ${trimmedNotes} (${trimmedOutcome})`,
      metadata: {
        contactMethod: trimmedMethod,
        outcome: trimmedOutcome,
        staffName: attempt.staffName,
      },
    });

    res.status(200).json({
      success: true,
      message: "Contact attempt recorded successfully in audit history.",
      data: {
        contactAttempts: certificate.contactAttempts,
        history: certificate.history,
      },
    });
  } catch (error: any) {
    console.error("❌ Record contact attempt error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while recording hospital contact attempt",
    });
  }
};
