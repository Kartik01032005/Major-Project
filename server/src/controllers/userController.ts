import { Request, Response } from "express";
import { validationResult } from "express-validator";
import User from "../models/User.js";

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: req.user
    });
  } catch (error: any) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({ success: false, message: "Server error during profile retrieval" });
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

    if (name) user.name = name;
    if (bloodGroup) user.bloodGroup = bloodGroup;
    if (typeof isAvailableDonor !== "undefined") user.isAvailableDonor = isAvailableDonor;
    if (location) {
      user.location = {
        state: location.state ?? user.location.state,
        district: location.district ?? user.location.district,
        latitude: location.latitude ?? user.location.latitude,
        longitude: location.longitude ?? user.location.longitude
      };
    }

    const updatedUser = await user.save();

    // Create copy without password
    const responseData = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      bloodGroup: updatedUser.bloodGroup,
      role: updatedUser.role,
      isAvailableDonor: updatedUser.isAvailableDonor,
      location: updatedUser.location,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
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
