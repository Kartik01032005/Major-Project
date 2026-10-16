import { Schema, model } from "mongoose";
import { IDonorCertificate } from "../types/donorCertificate.js";

const CertificateFileSchema = new Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
  },
  { _id: false }
);

const DonorCertificateSchema = new Schema<IDonorCertificate>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    issuingHospital: {
      type: String,
      required: true,
      trim: true,
    },
    issuingHospitalId: {
      type: Schema.Types.ObjectId,
      ref: "Hospital",
    },
    issueDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: [
        "NOT_SUBMITTED",
        "PENDING",
        "VERIFIED",
        "REJECTED",
        "NEEDS_INFORMATION",
        "EXPIRED",
        "REVOKED",
      ],
      default: "PENDING",
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    feedbackMessage: {
      type: String,
      trim: true,
    },
    file: {
      type: CertificateFileSchema,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find user's latest certificate submissions
DonorCertificateSchema.index({ userId: 1, createdAt: -1 });

export const DonorCertificate = model<IDonorCertificate>(
  "DonorCertificate",
  DonorCertificateSchema
);

export default DonorCertificate;
