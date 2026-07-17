import { Request, Response } from "express";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "supersecretkey_bloodlink_12345";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

// ─── Token Generator ──────────────────────────────────────────────────────────
const generateToken = (id: string): string => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
};

// ─── Register Controller ──────────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  const { name, email, password, phone, bloodGroup, role, location } = req.body;

  try {
    // Check if user already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      res.status(400).json({ success: false, message: "Email is already registered" });
      return;
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      res.status(400).json({ success: false, message: "Phone number is already registered" });
      return;
    }

    // Set fallback location details if not provided
    const userLocation = location ?? {
      state: "Not Set",
      district: "Not Set",
      latitude: 0,
      longitude: 0,
    };

    // Create user (password hashing is handled in User Schema pre-save)
    const newUser = await User.create({
      name,
      email,
      password,
      phone,
      bloodGroup,
      role: role ?? "user",
      location: userLocation,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
};

// ─── Login Controller ─────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });
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
    res.status(500).json({ success: false, message: "Server error during login" });
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
