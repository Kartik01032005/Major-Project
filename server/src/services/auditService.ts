import AuditLog from "../models/AuditLog.js";
import { AuditAction, AuditEntityType, IAuditLog } from "../types/auditLog.js";
import { Types } from "mongoose";

export interface CreateAuditEntryInput {
  action: AuditAction | string;
  entityType: AuditEntityType;
  entityId: string | Types.ObjectId;
  performedBy: string | Types.ObjectId;
  performerName?: string;
  performerRole?: string;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

/**
 * Persists an immutable server-side audit log record.
 * Sanitizes metadata to never expose passwords, tokens, files, or sensitive medical binaries.
 */
export async function logAuditEvent(input: CreateAuditEntryInput): Promise<IAuditLog | null> {
  try {
    const sanitizedMetadata: Record<string, any> = {};
    if (input.metadata && typeof input.metadata === "object") {
      for (const [key, val] of Object.entries(input.metadata)) {
        if (/password|token|secret|file|buffer|credential/i.test(key)) continue;
        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          sanitizedMetadata[key] = JSON.parse(JSON.stringify(val));
        } else {
          sanitizedMetadata[key] = val;
        }
      }
    }

    const entry = await AuditLog.create({
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      performedBy: input.performedBy,
      performerName: input.performerName,
      performerRole: input.performerRole,
      previousStatus: input.previousStatus,
      newStatus: input.newStatus,
      reason: input.reason,
      notes: input.notes,
      metadata: sanitizedMetadata,
      timestamp: new Date(),
    });

    return entry;
  } catch (error) {
    console.error("Failed to log audit event:", error);
    return null;
  }
}

/**
 * Query audit history with filtering and pagination.
 */
export async function getAuditHistory(query: {
  entityId?: string | Types.ObjectId;
  entityType?: AuditEntityType;
  performedBy?: string | Types.ObjectId;
  limit?: number;
  skip?: number;
}) {
  const filter: any = {};
  if (query.entityId) filter.entityId = query.entityId;
  if (query.entityType) filter.entityType = query.entityType;
  if (query.performedBy) filter.performedBy = query.performedBy;

  const limit = Math.min(query.limit || 50, 100);
  const skip = query.skip || 0;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  return { logs, total, limit, skip };
}
