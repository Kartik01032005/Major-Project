import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

interface DecodedToken {
  id: string;
}

export type CanonicalRole = "USER" | "BLOOD_BANK" | "HOSPITAL";

export const getCanonicalRole = (role?: string | null): CanonicalRole | null => {
  if (!role || typeof role !== "string") return null;
  const upper = role.trim().toUpperCase();
  if (upper === "USER") return "USER";
  if (upper === "BLOOD_BANK" || upper === "ADMIN") return "BLOOD_BANK";
  if (upper === "HOSPITAL") return "HOSPITAL";
  return null;
};

export const normalizeRole = (role?: string | null): CanonicalRole => {
  return getCanonicalRole(role) || "USER";
};

export const getEffectiveApprovalStatus = (user: { role?: string; approvalStatus?: string }): "PENDING_APPROVAL" | "APPROVED" | "REJECTED" => {
  const canonicalRole = getCanonicalRole(user.role);
  if (!canonicalRole) return "REJECTED";
  if (user.approvalStatus === "REJECTED") return "REJECTED";
  return "APPROVED";
};

export const authGuard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401).json({ success: false, message: "Not authorized, no token provided" });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ success: false, message: "Server authentication is not configured" });
      return;
    }
    const decoded = jwt.verify(token, secret) as DecodedToken;

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Not authorized, invalid token" });
  }
};

/**
 * Require one or more roles. In college project demo mode, institutional accounts have direct dashboard and API access.
 */
export const requireRole = (...allowedRoles: Array<"USER" | "BLOOD_BANK" | "HOSPITAL">) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const canonicalUserRole = getCanonicalRole(req.user.role);
    if (!canonicalUserRole) {
      res.status(403).json({
        success: false,
        message: "This account has an invalid or missing role configuration. Access denied.",
      });
      return;
    }

    if (!allowedRoles.includes(canonicalUserRole)) {
      res.status(403).json({ success: false, message: "Access denied: Insufficient permissions" });
      return;
    }

    if (req.user.approvalStatus === "REJECTED") {
      res.status(403).json({
        success: false,
        message: "Institutional account registration was rejected.",
        approvalStatus: "REJECTED"
      });
      return;
    }

    next();
  };
};

/**
 * Blood Bank guard (backward compatible with adminGuard)
 */
export const adminGuard = (req: Request, res: Response, next: NextFunction): void => {
  return requireRole("BLOOD_BANK")(req, res, next);
};

export const bloodBankGuard = adminGuard;

export const hospitalGuard = (req: Request, res: Response, next: NextFunction): void => {
  return requireRole("HOSPITAL")(req, res, next);
};

export const institutionGuard = (req: Request, res: Response, next: NextFunction): void => {
  return requireRole("BLOOD_BANK", "HOSPITAL")(req, res, next);
};
