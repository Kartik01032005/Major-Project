import { Request, Response } from "express";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import User from "../models/User.js";
import EmergencyRequest from "../models/EmergencyRequest.js";
import { computeDonorProfileStats, calculateApproxDistance } from "../services/donorProfileService.js";

// @desc    Get authenticated user profile with authentic donor statistics
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const donorStats = await computeDonorProfileStats(
      req.user._id,
      req.user.bloodGroup,
      req.user.createdAt
    );

    const userObj = req.user.toObject ? req.user.toObject() : { ...req.user };
    delete userObj.password;
    delete userObj.resetPasswordToken;
    delete userObj.resetPasswordTokenHash;
    delete userObj.resetPasswordExpires;
    delete userObj.resetPasswordExpiresAt;

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: {
        ...userObj,
        donorStats
      }
    });
  } catch (error: any) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({ success: false, message: "Server error during profile retrieval" });
  }
};

// @desc    Get authenticated donor's profile and donation stats
// @route   GET /api/users/donor-profile
// @access  Private
export const getDonorProfile = async (req: Request, res: Response): Promise<void> => {
  return getProfile(req, res);
};

// @desc    Get donor profile with privacy protection (for requesters / other users)
// @route   GET /api/users/donor/:id
// @access  Private (Authenticated users only)
export const getPublicDonorProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid donor ID" });
      return;
    }

    const donor = await User.findById(id).select("-password -resetPasswordToken -resetPasswordTokenHash -resetPasswordExpires -resetPasswordExpiresAt");
    if (!donor) {
      res.status(404).json({ success: false, message: "Donor not found" });
      return;
    }

    const donorStats = await computeDonorProfileStats(donor._id, donor.bloodGroup, donor.createdAt);

    // Calculate approximate distance if requester coords provided
    const refLat = req.query.lat ? parseFloat(String(req.query.lat)) : req.user.location?.latitude;
    const refLng = req.query.lng ? parseFloat(String(req.query.lng)) : req.user.location?.longitude;
    const { approxDistanceKm, approxDistanceStr } = calculateApproxDistance(
      donor.location?.latitude,
      donor.location?.longitude,
      refLat,
      refLng
    );

    // Privacy rule: Only reveal phone if this donor has accepted an active request created by req.user
    const requesterId = req.user._id;
    const acceptedRequest = await EmergencyRequest.findOne({
      requestBy: requesterId,
      acceptedBy: donor._id,
      status: { $in: ["Pending", "Approved", "Completed"] }
    });

    const isOwnProfile = donor._id.toString() === req.user._id.toString();
    const canSeeContact = isOwnProfile || !!acceptedRequest || req.user.role === "admin";

    // Privacy protection: NEVER expose exact GPS or exact address to other users
    const safeLocation = donor.location
      ? {
          district: donor.location.district,
          state: donor.location.state
        }
      : null;

    res.status(200).json({
      success: true,
      message: "Donor profile retrieved successfully",
      data: {
        _id: donor._id,
        name: donor.name,
        bloodGroup: donor.bloodGroup || null,
        isAvailableDonor: donor.isAvailableDonor,
        location: safeLocation,
        approxDistanceKm,
        approxDistanceStr,
        phone: canSeeContact ? donor.phone : undefined,
        donorStats
      }
    });
  } catch (error: any) {
    console.error("❌ Get public donor profile error:", error);
    res.status(500).json({ success: false, message: "Server error during donor profile retrieval" });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const { name, phone, bloodGroup, isAvailableDonor, location } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Check if phone is being changed and is already taken
    if (phone && phone !== user.phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        res.status(400).json({ success: false, message: "Phone number is already registered" });
        return;
      }
      user.phone = phone;
    }

    if (name) user.name = name.trim();
    if (bloodGroup) user.bloodGroup = bloodGroup;
    if (typeof isAvailableDonor !== "undefined") user.isAvailableDonor = Boolean(isAvailableDonor);
    if (location) {
      user.location = {
        state: location.state ?? user.location.state,
        district: location.district ?? user.location.district,
        latitude: typeof location.latitude === "number" ? location.latitude : user.location.latitude,
        longitude: typeof location.longitude === "number" ? location.longitude : user.location.longitude
      };
    }

    const updatedUser = await user.save();

    const donorStats = await computeDonorProfileStats(
      updatedUser._id,
      updatedUser.bloodGroup,
      updatedUser.createdAt
    );

    // Create copy without password or tokens
    const responseData = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      bloodGroup: updatedUser.bloodGroup,
      role: updatedUser.role,
      isAvailableDonor: updatedUser.isAvailableDonor,
      location: updatedUser.location,
      settings: updatedUser.settings,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      donorStats
    };

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: responseData
    });
  } catch (error: any) {
    console.error("❌ Update profile error:", error);
    res.status(500).json({ success: false, message: "Server error during profile update" });
  }
};

// @desc    Get authenticated user settings
// @route   GET /api/users/settings
// @access  Private
export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }
    const user = await User.findById(req.user._id).select("settings isAvailableDonor bloodGroup phone email name location");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Settings retrieved successfully",
      data: user.settings || {}
    });
  } catch (error: any) {
    console.error("❌ Get settings error:", error);
    res.status(500).json({ success: false, message: "Server error during settings retrieval" });
  }
};

// @desc    Update authenticated user settings
// @route   PUT /api/users/settings
// @access  Private
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const { donor, notifications, privacy, emergency, security } = req.body;
    const currentSettings = user.settings || {};

    const newSettings = {
      donor: {
        pauseDonorRequests: donor && typeof donor.pauseDonorRequests === "boolean"
          ? donor.pauseDonorRequests
          : (currentSettings.donor?.pauseDonorRequests ?? false)
      },
      notifications: {
        emergencyAlerts: true, // locked
        nearbyRequests: notifications && typeof notifications.nearbyRequests === "boolean"
          ? notifications.nearbyRequests
          : (currentSettings.notifications?.nearbyRequests ?? true),
        bloodBankUpdates: notifications && typeof notifications.bloodBankUpdates === "boolean"
          ? notifications.bloodBankUpdates
          : (currentSettings.notifications?.bloodBankUpdates ?? true),
        smsNotifications: notifications && typeof notifications.smsNotifications === "boolean"
          ? notifications.smsNotifications
          : (currentSettings.notifications?.smsNotifications ?? false),
        whatsappNotifications: notifications && typeof notifications.whatsappNotifications === "boolean"
          ? notifications.whatsappNotifications
          : (currentSettings.notifications?.whatsappNotifications ?? false),
      },
      privacy: {
        locationSharing: privacy && typeof privacy.locationSharing === "boolean"
          ? privacy.locationSharing
          : (currentSettings.privacy?.locationSharing ?? true),
        profileVisibility: (privacy && ["matching", "hidden"].includes(privacy.profileVisibility)
          ? privacy.profileVisibility
          : (currentSettings.privacy?.profileVisibility ?? "matching")) as "matching" | "hidden",
        phoneNumberPrivacy: (privacy && ["hidden", "on_request", "public"].includes(privacy.phoneNumberPrivacy)
          ? privacy.phoneNumberPrivacy
          : (currentSettings.privacy?.phoneNumberPrivacy ?? "on_request")) as "hidden" | "on_request" | "public",
      },
      emergency: {
        alertRadiusKm: (emergency && [5, 10, 25, 50].includes(Number(emergency.alertRadiusKm))
          ? Number(emergency.alertRadiusKm)
          : (currentSettings.emergency?.alertRadiusKm ?? 10)) as 5 | 10 | 25 | 50,
        emergencyContact: {
          name: emergency?.emergencyContact?.name !== undefined
            ? String(emergency.emergencyContact.name).trim()
            : (currentSettings.emergency?.emergencyContact?.name ?? ""),
          phone: emergency?.emergencyContact?.phone !== undefined
            ? String(emergency.emergencyContact.phone).trim()
            : (currentSettings.emergency?.emergencyContact?.phone ?? ""),
          relationship: emergency?.emergencyContact?.relationship !== undefined
            ? String(emergency.emergencyContact.relationship).trim()
            : (currentSettings.emergency?.emergencyContact?.relationship ?? ""),
        }
      },
      security: {
        twoFactorAuth: security && typeof security.twoFactorAuth === "boolean"
          ? security.twoFactorAuth
          : (currentSettings.security?.twoFactorAuth ?? false)
      }
    };

    user.settings = newSettings;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: user.settings
    });
  } catch (error: any) {
    console.error("❌ Update settings error:", error);
    res.status(500).json({ success: false, message: "Server error during settings update" });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: "Current and new password are required" });
      return;
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      res.status(400).json({ success: false, message: "New password must be at least 6 characters long" });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ success: false, message: "Incorrect current password" });
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({ success: false, message: "New password must be different from current password" });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error: any) {
    console.error("❌ Change password error:", error);
    res.status(500).json({ success: false, message: "Server error during password update" });
  }
};

// @desc    Download personal data export
// @route   GET /api/users/export-data
// @access  Private
export const exportUserData = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const userId = req.user._id;
    const user = await User.findById(userId).select("-password -resetPasswordToken -resetPasswordTokenHash -resetPasswordExpires -resetPasswordExpiresAt");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const donorStats = await computeDonorProfileStats(userId, user.bloodGroup, user.createdAt);
    const emergencyRequests = await EmergencyRequest.find({ requestBy: userId }).select("-__v");
    const respondedRequests = await EmergencyRequest.find({ "responses.donorId": userId }).select("_id bloodGroup hospitalName district state status createdAt");

    const exportPayload = {
      bloodlinkVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      account: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        role: user.role,
        isAvailableDonor: user.isAvailableDonor,
        location: user.location,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      settings: user.settings || {},
      donorStatistics: donorStats,
      createdEmergencyRequests: emergencyRequests,
      donorInteractions: respondedRequests
    };

    res.setHeader("Content-Disposition", `attachment; filename="bloodlink-data-${userId}.json"`);
    res.status(200).json({
      success: true,
      data: exportPayload
    });
  } catch (error: any) {
    console.error("❌ Export user data error:", error);
    res.status(500).json({ success: false, message: "Server error during data export" });
  }
};
