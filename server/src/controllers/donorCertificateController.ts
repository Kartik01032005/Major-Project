import { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import DonorCertificate from "../models/DonorCertificate.js";

function cleanupUploadedFile(filePath?: string) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignore file deletion errors
    }
  }
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
      existingCert.issuingHospitalId = issuingHospitalId || undefined;
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
        issuingHospitalId: issuingHospitalId || undefined,
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
 * @desc    Securely download/view a certificate file by ID (strictly enforces owner or admin)
 * @route   GET /api/certificates/:id/file
 * @access  Private (Owner or Admin)
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

    // Strict cross-user authorization protection
    const isOwner = certificate.userId.toString() === user._id.toString();
    const isAdmin = user.role === "admin" || user.role === "BLOOD_BANK";
    if (!isOwner && !isAdmin) {
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
