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

const CertificateAuditLogSchema = new Schema(
  {
    previousStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewerName: { type: String, trim: true },
    reviewerHospital: { type: String, trim: true },
    action: {
      type: String,
      enum: ["APPROVE", "REJECT", "REQUEST_CLARIFICATION"],
      required: true,
    },
    reason: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
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
      index: true,
    },
    issuingHospitalId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
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
        "APPROVED",
        "REJECTED",
        "NEEDS_INFORMATION",
        "NEEDS_CLARIFICATION",
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
    history: {
      type: [CertificateAuditLogSchema],
      default: [],
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

// Compound indexes
DonorCertificateSchema.index({ userId: 1, createdAt: -1 });
DonorCertificateSchema.index({ issuingHospitalId: 1, status: 1 });
DonorCertificateSchema.index({ issuingHospital: 1, status: 1 });

export const DonorCertificate = model<IDonorCertificate>(
  "DonorCertificate",
  DonorCertificateSchema
);

export default DonorCertificate;
