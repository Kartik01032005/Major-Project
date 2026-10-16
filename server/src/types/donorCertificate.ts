import { Document, Types } from "mongoose";

export type CertificateStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "NEEDS_INFORMATION"
  | "EXPIRED"
  | "REVOKED";

export interface ICertificateFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
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
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
