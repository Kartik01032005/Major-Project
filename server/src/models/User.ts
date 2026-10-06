import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../types/user.js"; // We'll define type definitions for clean interfaces

const LocationSchema = new Schema({
  state: { type: String, required: true },
  district: { type: String, required: true },
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 }
}, { _id: false });

const SettingsSchema = new Schema({
  donor: {
    pauseDonorRequests: { type: Boolean, default: false }
  },
  notifications: {
    emergencyAlerts: { type: Boolean, default: true },
    nearbyRequests: { type: Boolean, default: true },
    bloodBankUpdates: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    whatsappNotifications: { type: Boolean, default: false }
  },
  privacy: {
    locationSharing: { type: Boolean, default: true },
    profileVisibility: { type: String, enum: ["matching", "hidden"], default: "matching" },
    phoneNumberPrivacy: { type: String, enum: ["hidden", "on_request", "public"], default: "on_request" }
  },
  emergency: {
    alertRadiusKm: { type: Number, enum: [5, 10, 25, 50], default: 10 },
    emergencyContact: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      relationship: { type: String, default: "" }
    }
  },
  security: {
    twoFactorAuth: { type: Boolean, default: false }
  }
}, { _id: false });

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, required: true, unique: true, trim: true },
  bloodGroup: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
  },
  role: { type: String, required: true, enum: ["user", "admin"], default: "user" },
  isAvailableDonor: { type: Boolean, default: true },
  location: { type: LocationSchema, required: true },
  settings: {
    type: SettingsSchema,
    default: () => ({
      donor: { pauseDonorRequests: false },
      notifications: { emergencyAlerts: true, nearbyRequests: true, bloodBankUpdates: true, smsNotifications: false, whatsappNotifications: false },
      privacy: { locationSharing: true, profileVisibility: "matching", phoneNumberPrivacy: "on_request" },
      emergency: { alertRadiusKm: 10, emergencyContact: { name: "", phone: "", relationship: "" } },
      security: { twoFactorAuth: false }
    })
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  resetPasswordTokenHash: { type: String },
  resetPasswordExpiresAt: { type: Date }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre("save", async function(next) {
  if (!this.isModified("password") || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = (await bcrypt.hash(this.password, salt)) as string;
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(enteredPassword: string): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password || "");
};


export const User = model<IUser>("User", UserSchema);
export default User;
