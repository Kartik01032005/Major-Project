import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { Request, Response, NextFunction } from "express";

const UPLOAD_BASE_DIR = process.env.CERTIFICATE_UPLOAD_DIR
  ? path.resolve(process.env.CERTIFICATE_UPLOAD_DIR)
  : path.resolve(process.cwd(), "uploads", "certificates");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}

export { UPLOAD_BASE_DIR };

const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOAD_BASE_DIR)) {
      fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
    }
    cb(null, UPLOAD_BASE_DIR);
  },
  filename: (req: any, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = req.user?._id?.toString() || "anon";
    const randomSuffix = crypto.randomBytes(8).toString("hex");
    const safeFilename = `cert-${userId}-${Date.now()}-${randomSuffix}${ext}`;
    cb(null, safeFilename);
  },
});

export const certificateMulter = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 10,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      return cb(
        new Error(
          "Invalid file type. Allowed formats: PDF, JPG, and PNG (maximum 5MB)."
        )
      );
    }
    cb(null, true);
  },
});

const MAGIC_SIGNATURES: Record<string, Buffer[]> = {
  pdf: [Buffer.from("%PDF-")],
  jpg: [Buffer.from([0xff, 0xd8, 0xff])],
  jpeg: [Buffer.from([0xff, 0xd8, 0xff])],
  png: [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
};

/**
 * Validates the magic bytes of the uploaded certificate file
 * to guarantee that the file content matches its declared format.
 */
export function validateCertificateFile(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const file = req.file;
  if (!file) {
    res.status(400).json({
      success: false,
      message: "Please select a medical certificate document to upload.",
    });
    return;
  }

  const ext = path.extname(file.originalname).slice(1).toLowerCase();
  const expectedSignatures = MAGIC_SIGNATURES[ext];

  if (!expectedSignatures || expectedSignatures.length === 0) {
    if (fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (e) {
        // ignore
      }
    }
    res.status(400).json({
      success: false,
      message: "Unsupported file extension. Allowed formats: PDF, JPG, PNG.",
    });
    return;
  }

  try {
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(file.path, "r");
    const bytesRead = fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    const matches = expectedSignatures.some((sig) => {
      if (bytesRead < sig.length) return false;
      return buffer.subarray(0, sig.length).equals(sig);
    });

    if (!matches) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      res.status(400).json({
        success: false,
        message: "File content does not match the file extension or is corrupted.",
      });
      return;
    }
  } catch (err: any) {
    if (fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (e) {
        // ignore
      }
    }
    res.status(400).json({
      success: false,
      message: "Failed to read and verify uploaded file content.",
    });
    return;
  }

  next();
}

/**
 * Handles Multer-specific errors gracefully with clean JSON responses.
 */
export function handleCertificateUploadError(
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        success: false,
        message: "File size exceeds the 5MB limit. Please upload a smaller file.",
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
    return;
  }

  if (err instanceof Error && err.message.includes("Invalid file type")) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  next(err);
}
