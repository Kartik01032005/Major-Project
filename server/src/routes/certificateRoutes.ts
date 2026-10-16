import { Router } from "express";
import { authGuard, hospitalGuard } from "../middleware/auth.js";
import {
  certificateMulter,
  validateCertificateFile,
  handleCertificateUploadError,
} from "../middleware/certificateUpload.js";
import {
  getMyCertificate,
  submitCertificate,
  downloadMyCertificateFile,
  downloadCertificateById,
  getHospitalCertificateQueue,
  getCertificateById,
  reviewCertificate,
} from "../controllers/donorCertificateController.js";

const router = Router();

// Retrieve authenticated user's certificate status
router.get("/my-certificate", authGuard, getMyCertificate);

// Securely view/download authenticated user's uploaded certificate file
router.get("/my-certificate/file", authGuard, downloadMyCertificateFile);

// Hospital verification dashboard queue (strictly HOSPITAL role)
router.get("/hospital-queue", authGuard, hospitalGuard, getHospitalCertificateQueue);

// Securely view/download certificate file by ID (strictly authorized to owner, assigned hospital, or admin)
router.get("/:id/file", authGuard, downloadCertificateById);

// Retrieve single certificate details by ID (owner, assigned hospital, or admin)
router.get("/:id", authGuard, getCertificateById);

// Submit review decision: Approve, Reject, Request Clarification (strictly HOSPITAL role)
router.put("/:id/review", authGuard, hospitalGuard, reviewCertificate);

// Submit or replace medical certificate (Donor)
router.post(
  "/",
  authGuard,
  certificateMulter.single("certificate"),
  validateCertificateFile,
  submitCertificate
);

// Upload error handling middleware
router.use(handleCertificateUploadError);

export default router;
