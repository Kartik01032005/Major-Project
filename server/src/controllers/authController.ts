import { Request, Response } from "express";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import EmergencyRequest from "../models/EmergencyRequest.js";
import Notification from "../models/Notification.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured before starting the server.");
}

// ─── Token Generator ──────────────────────────────────────────────────────────
const generateToken = (id: string): string => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
};

// ─── Register Controller ──────────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array(),
      message: errors.array()[0]?.msg || "Validation failed"
    });
    return;
  }

  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: "Database is unavailable. Please verify MongoDB is running or MONGODB_URI is configured.",
    });
    return;
  }

  const { name, email, password, phone, role, bloodGroup, location, organizationName } = req.body;
  const normalizedEmail = email ? email.toLowerCase().trim() : "";

  try {
    // Check if user already exists
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      res.status(400).json({ success: false, message: "Email already exists." });
      return;
    }

    const existingPhone = await User.findOne({ phone: phone?.trim() });
    if (existingPhone) {
      res.status(400).json({ success: false, message: "Phone number already exists." });
      return;
    }

    // Set fallback location details if not provided
    const userLocation = location ?? {
      state: "Not Set",
      district: "Not Set",
      latitude: 0,
      longitude: 0,
    };

    const finalName = role === "admin" && organizationName ? `${name} (${organizationName})` : name;

    // Create user (password hashing is handled in User Schema pre-save)
    const newUser = await User.create({
      name: finalName,
      email: normalizedEmail,
      password,
      phone: phone?.trim(),
      bloodGroup: role === "admin" ? undefined : bloodGroup,
      role: role ?? "user",
      location: userLocation,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        _id: newUser._id,
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        bloodGroup: newUser.bloodGroup,
        role: newUser.role,
        isAvailableDonor: newUser.isAvailableDonor,
        location: newUser.location,
      },
    });
  } catch (error: any) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error during registration" });
  }
};

// ─── Login Controller ─────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array(),
      message: errors.array()[0]?.msg || "Invalid email or password"
    });
    return;
  }

  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: "Database is unavailable. Please verify MongoDB is running or MONGODB_URI is configured.",
    });
    return;
  }

  const { email, password } = req.body;
  const normalizedEmail = email ? email.toLowerCase().trim() : "";

  try {
    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    // Check password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    // Create token
    const token = generateToken(user._id.toString());

    // Exclude password in response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bloodGroup: user.bloodGroup,
      role: user.role,
      isAvailableDonor: user.isAvailableDonor,
      location: user.location,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: userResponse,
      },
    });
  } catch (error: any) {
    console.error("❌ Login error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error during login" });
  }
};

// ─── Get Current Logged In User Controller ───────────────────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: req.user,
    });
  } catch (error: any) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({ success: false, message: "Server error during profile retrieval" });
  }
};

// ─── Forgot Password Controller ──────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array(),
      message: errors.array()[0]?.msg || "Invalid email address"
    });
    return;
  }

  const { email } = req.body;
  const normalizedEmail = email ? email.toLowerCase().trim() : "";

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Return 200 for security so attackers cannot enumerate valid user emails
      res.status(200).json({
        success: true,
        message: "If an account exists with this email, password reset instructions have been sent."
      });
      return;
    }

    // Generate random reset token
    const cryptoModule = await import("crypto");
    const resetToken = cryptoModule.randomBytes(32).toString("hex");

    // Hash token and store in user document
    const hashedToken = cryptoModule.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour validity
    await user.save();

    // Construct reset link
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

    // Send email
    const { emailService } = await import("../services/emailService.js");
    await emailService.sendPasswordResetEmail(user.email, resetUrl, user.name);

    res.status(200).json({
      success: true,
      message: "If an account exists with this email, password reset instructions have been sent.",
      data: {
        resetToken: process.env.NODE_ENV !== "production" ? resetToken : undefined,
        resetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
      }
    });
  } catch (error: any) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error during password reset request" });
  }
};

// ─── Reset Password Controller ────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array(),
      message: errors.array()[0]?.msg || "Validation error"
    });
    return;
  }

  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400).json({ success: false, message: "Token and new password are required." });
    return;
  }

  try {
    const cryptoModule = await import("crypto");
    const hashedToken = cryptoModule.createHash("sha256").update(token).digest("hex");

    // Find user with matching token and valid expiry
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token. Please request a new reset link."
      });
      return;
    }

    // Set new password (pre-save hook will hash it with bcrypt)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password."
    });
  } catch (error: any) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error during password reset" });
  }
};

// ─── Delete Account Controller ────────────────────────────────────────────────
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const userId = req.user._id;

    // Delete user from Database
    const userDeleted = await User.findByIdAndDelete(userId);
    if (!userDeleted) {
      res.status(404).json({ success: false, message: "User not found or already deleted" });
      return;
    }

    // Clean up all associated requests and notifications for database integrity
    await EmergencyRequest.deleteMany({ requestBy: userId });
    await Notification.deleteMany({ receiverId: userId });

    res.status(200).json({
      success: true,
      message: "Account and associated data deleted permanently"
    });
  } catch (error: any) {
    console.error("❌ Delete account error:", error);
    res.status(500).json({ success: false, message: "Server error during account deletion" });
  }
};
