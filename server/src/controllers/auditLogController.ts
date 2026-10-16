import { Request, Response } from "express";
import AuditLog from "../models/AuditLog.js";
import DonorCertificate from "../models/DonorCertificate.js";
import EmergencyRequest from "../models/EmergencyRequest.js";
import { AuditEntityType } from "../types/auditLog.js";

/**
 * @desc    Get audit history logs
 * @route   GET /api/audit-logs
 * @access  Private (Authenticated User, Reviewer, or Admin)
 */
export const getAuditLogsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { entityId, entityType, action } = req.query;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 100);
    const skip = Math.max(parseInt(req.query.skip as string) || 0, 0);

    const userRole = (req.user.role || "").toUpperCase();
    const isPrivileged = ["HOSPITAL", "BLOOD_BANK", "ADMIN"].includes(userRole);

    const filter: any = {};

    if (action && typeof action === "string") {
      filter.action = action.trim();
    }

    if (entityType && typeof entityType === "string") {
      filter.entityType = entityType.trim() as AuditEntityType;
    }

    if (entityId && typeof entityId === "string") {
      filter.entityId = entityId.trim();

      // Authorization guard on specific entity:
      if (!isPrivileged) {
        // If regular USER checks a certificate or request, verify ownership
        const [userCert, userReq] = await Promise.all([
          DonorCertificate.findOne({ _id: entityId, userId: req.user._id }),
          EmergencyRequest.findOne({ _id: entityId, requestBy: req.user._id }),
        ]);

        if (!userCert && !userReq) {
          // Check if user was the performer
          const wasPerformer = await AuditLog.exists({
            entityId,
            performedBy: req.user._id,
          });

          if (!wasPerformer) {
            res.status(403).json({
              success: false,
              message: "Not authorized to view audit history for this entity",
            });
            return;
          }
        }
      }
    } else if (!isPrivileged) {
      // Regular user querying without specific entity can only view actions performed by themselves
      filter.performedBy = req.user._id;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Audit logs retrieved successfully",
      data: logs,
      total,
      limit,
      skip,
    });
  } catch (error: any) {
    console.error("❌ Get audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during audit logs retrieval",
    });
  }
};
