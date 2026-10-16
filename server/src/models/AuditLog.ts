import { Schema, model } from "mongoose";
import { IAuditLog } from "../types/auditLog.js";

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    entityType: {
      type: String,
      required: true,
      enum: ["CERTIFICATE", "DONOR_REQUEST", "USER", "INVENTORY"],
      index: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    performerName: { type: String, trim: true },
    performerRole: { type: String, trim: true },
    previousStatus: { type: String, trim: true },
    newStatus: { type: String, trim: true },
    reason: { type: String, trim: true },
    notes: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for high performance audit querying
AuditLogSchema.index({ entityId: 1, timestamp: -1 });
AuditLogSchema.index({ performedBy: 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, timestamp: -1 });

export const AuditLog = model<IAuditLog>("AuditLog", AuditLogSchema);
export default AuditLog;
