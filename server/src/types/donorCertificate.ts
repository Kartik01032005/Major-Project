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

export interface IContactAttempt {
  contactDate: Date;
  contactMethod: string;
  notes: string;
  outcome?: string;
  staffName?: string;
}

export interface ICertificateAuditLog {
  previousStatus: CertificateStatus;
  newStatus: CertificateStatus;
  reviewedBy: Types.ObjectId;
  reviewerName?: string;
  reviewerHospital?: string;
  reviewerBloodBank?: string;
  reviewerInstitution?: string;
  reviewerRole?: "HOSPITAL" | "BLOOD_BANK" | "USER" | "ADMIN";
  action: "APPROVE" | "REJECT" | "REQUEST_CLARIFICATION" | "CONTACT_ATTEMPT" | "SUBMIT" | "ASSIGN";
  reason?: string;
  contactNotes?: string;
  evidence?: string;
  timestamp: Date;
}

export interface IDonorCertificate extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  issuingHospital: string;
  issuingHospitalId?: Types.ObjectId;
  isUnregisteredHospital?: boolean;
  hospitalDistrict?: string;
  hospitalState?: string;
  assignedBloodBankId?: Types.ObjectId;
  assignedBloodBank?: string;
  assignedAt?: Date;
  assignmentNotes?: string;
  verificationMethod?: "HOSPITAL_DIRECT" | "BLOOD_BANK_EXTERNAL";
  issueDate: Date;
  expiryDate?: Date;
  status: CertificateStatus;
  rejectionReason?: string;
  feedbackMessage?: string;
  file: ICertificateFile;
  contactAttempts?: IContactAttempt[];
  history?: ICertificateAuditLog[];
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
