import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Hospital from "../models/Hospital.js";

import User from "../models/User.js";

// @desc    Get all hospitals
// @route   GET /api/hospitals
// @access  Private
export const getHospitals = async (req: Request, res: Response): Promise<void> => {
  try {
    const hospitals = await Hospital.find({}).sort({ createdAt: -1 });

    // Also include registered users with role HOSPITAL
    const hospitalUsers = await User.find({ role: "HOSPITAL" }).select(
      "name organizationName address location phone"
    );

    const combined = [...hospitals];
    for (const u of hospitalUsers) {
      const hospName = u.organizationName || u.name;
      const alreadyExists = combined.some(
        (h) => h.name.toLowerCase() === hospName.toLowerCase()
      );
      if (!alreadyExists) {
        combined.push({
          _id: u._id,
          name: hospName,
          address: u.address || "",
          state: u.location?.state || "Karnataka",
          district: u.location?.district || "Dakshina Kannada (Mangalore)",
          phone: u.phone || "",
          latitude: u.location?.latitude || 0,
          longitude: u.location?.longitude || 0,
        } as any);
      }
    }

    res.status(200).json({
      success: true,
      message: "Hospitals retrieved successfully",
      data: combined,
    });
  } catch (error: any) {
    console.error("❌ Get hospitals error:", error);
    res.status(500).json({ success: false, message: "Server error during hospitals retrieval" });
  }
};

// @desc    Add new hospital
// @route   POST /api/hospitals
// @access  Private/Admin
export const addHospital = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  try {
    const { name, address, state, district, phone, latitude, longitude } = req.body;
    
    const hospital = await Hospital.create({
      name,
      address,
      state,
      district,
      phone,
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
    });

    res.status(201).json({
      success: true,
      message: "Hospital added successfully",
      data: hospital,
    });
  } catch (error: any) {
    console.error("❌ Add hospital error:", error);
    res.status(500).json({ success: false, message: "Server error during hospital creation" });
  }
};

// @desc    Update hospital
// @route   PUT /api/hospitals/:id
// @access  Private/Admin
export const updateHospital = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  try {
    const { name, address, state, district, phone, latitude, longitude } = req.body;
    
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      {
        name,
        address,
        state,
        district,
        phone,
        latitude: latitude ?? 0,
        longitude: longitude ?? 0,
      },
      { new: true }
    );

    if (!hospital) {
      res.status(404).json({ success: false, message: "Hospital not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Hospital updated successfully",
      data: hospital,
    });
  } catch (error: any) {
    console.error("❌ Update hospital error:", error);
    res.status(500).json({ success: false, message: "Server error during hospital update" });
  }
};

// @desc    Delete hospital
// @route   DELETE /api/hospitals/:id
// @access  Private/Admin
export const deleteHospital = async (req: Request, res: Response): Promise<void> => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);

    if (!hospital) {
      res.status(404).json({ success: false, message: "Hospital not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Hospital deleted successfully",
      data: hospital,
    });
  } catch (error: any) {
    console.error("❌ Delete hospital error:", error);
    res.status(500).json({ success: false, message: "Server error during hospital deletion" });
  }
};
