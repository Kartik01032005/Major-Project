import { Document, Types } from "mongoose";

export type CertificateStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "VERIFIED"
  | "APPROVED"
  | "REJECTED"
  | "NEEDS_INFORMATION"
  | "NEEDS_CLARIFICATION"
  | "EXPIRED"
  | "REVOKED";

export interface ICertificateFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
}

export interface ICertificateAuditLog {
  previousStatus: CertificateStatus;
  newStatus: CertificateStatus;
  reviewedBy: Types.ObjectId;
  reviewerName?: string;
  reviewerHospital?: string;
  action: "APPROVE" | "REJECT" | "REQUEST_CLARIFICATION";
  reason?: string;
  timestamp: Date;
}

export interface IDonorCertificate extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  issuingHospital: string;
  issuingHospitalId?: Types.ObjectId;
  issueDate: Date;
  expiryDate?: Date;
  status: CertificateStatus;
  rejectionReason?: string;
  feedbackMessage?: string;
  file: ICertificateFile;
  history?: ICertificateAuditLog[];
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
