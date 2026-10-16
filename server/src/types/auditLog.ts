import { Document, Types } from "mongoose";

export type AuditAction =
  | "CERTIFICATE_SUBMITTED"
  | "CERTIFICATE_ASSIGNED"
  | "CERTIFICATE_APPROVED"
  | "CERTIFICATE_REJECTED"
  | "CERTIFICATE_CLARIFICATION_REQUESTED"
  | "CONTACT_ATTEMPT_LOGGED"
  | "REQUEST_CREATED"
  | "REQUEST_APPROVED"
  | "REQUEST_REJECTED"
  | "REQUEST_ACCEPTED"
  | "REQUEST_CANCELLED"
  | "DONATION_REPORTED"
  | "DONATION_CONFIRMED"
  | "ACCEPTANCE_WITHDRAWN"
  | "INVENTORY_ALERT";

export type AuditEntityType = "CERTIFICATE" | "DONOR_REQUEST" | "USER" | "INVENTORY";

export interface IAuditLog extends Document {
  action: AuditAction | string;
  entityType: AuditEntityType;
  entityId: Types.ObjectId;
  performedBy: Types.ObjectId;
  performerName?: string;
  performerRole?: string;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  notes?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}
