import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../types/user.js"; // We'll define type definitions for clean interfaces

const LocationSchema = new Schema({
  state: { type: String, required: true },
  district: { type: String, required: true },
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 }
}, { _id: false });

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, required: true, unique: true, trim: true },
  bloodGroup: {
    type: String,
    required: function(this: any) {
      return this.role === "user";
    },
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
  },
  role: { type: String, required: true, enum: ["user", "admin"], default: "user" },
  isAvailableDonor: { type: Boolean, default: true },
  location: { type: LocationSchema, required: true }
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
