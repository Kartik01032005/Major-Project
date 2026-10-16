import { Router } from "express";
import { authGuard } from "../middleware/auth.js";
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
} from "../controllers/donorCertificateController.js";

const router = Router();

// Retrieve authenticated user's certificate status
router.get("/my-certificate", authGuard, getMyCertificate);

// Securely view/download authenticated user's uploaded certificate file
router.get("/my-certificate/file", authGuard, downloadMyCertificateFile);

// Securely view/download certificate file by ID (strictly authorized to owner or admin)
router.get("/:id/file", authGuard, downloadCertificateById);

// Submit or replace medical certificate
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
