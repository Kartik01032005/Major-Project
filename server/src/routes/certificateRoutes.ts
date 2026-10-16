import { Router } from "express";
import { authGuard, hospitalGuard, bloodBankGuard, requireRole } from "../middleware/auth.js";
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
  getBloodBankCertificateQueue,
  recordCertificateContactAttempt,
  getCertificateById,
  reviewCertificate,
} from "../controllers/donorCertificateController.js";
import { checkDonorCertificateEligibility } from "../services/donorEligibilityService.js";

const router = Router();

// Retrieve authenticated user's certificate status
router.get("/my-certificate", authGuard, getMyCertificate);

// Securely view/download authenticated user's uploaded certificate file
router.get("/my-certificate/file", authGuard, downloadMyCertificateFile);
router.get("/eligibility", authGuard, async (req, res) => {
  const eligibility = await checkDonorCertificateEligibility((req as any).user._id);
  res.status(200).json({ success: true, data: eligibility });
});

// Hospital verification dashboard queue (strictly HOSPITAL role)
router.get("/hospital-queue", authGuard, hospitalGuard, getHospitalCertificateQueue);

// Blood Bank external verification queue (strictly BLOOD_BANK role)
router.get("/blood-bank-queue", authGuard, bloodBankGuard, getBloodBankCertificateQueue);

// Record hospital contact attempt notes (strictly BLOOD_BANK role)
router.post("/:id/contact-attempt", authGuard, bloodBankGuard, recordCertificateContactAttempt);

// Securely view/download certificate file by ID (strictly authorized to owner, assigned hospital, or assigned blood bank)
router.get("/:id/file", authGuard, downloadCertificateById);

// Retrieve single certificate details by ID (owner, assigned hospital, or assigned blood bank)
router.get("/:id", authGuard, getCertificateById);

// Submit review decision: Approve, Reject, Request Clarification (HOSPITAL or BLOOD_BANK role)
router.put("/:id/review", authGuard, requireRole("HOSPITAL", "BLOOD_BANK"), reviewCertificate);

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
