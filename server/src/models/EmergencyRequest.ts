import { Schema, model } from "mongoose";
import { IEmergencyRequest } from "../types/emergencyRequest.js";

const EmergencyRequestSchema = new Schema<IEmergencyRequest>({
  requestBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  bloodGroup: {
    type: String,
    required: true,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
  },
  unitsRequired: { type: Number, required: true, default: 1, min: 1 },
  hospital: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  contactNumber: { type: String, required: true, trim: true },
  location: {
    latitude: { type: Number, required: true, default: 0 },
    longitude: { type: Number, required: true, default: 0 }
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Completed"],
    default: "Pending"
  },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null }
}, {
  timestamps: true
});

// For indexing to speed up queries
EmergencyRequestSchema.index({ bloodGroup: 1, district: 1, status: 1 });

export const EmergencyRequest = model<IEmergencyRequest>("EmergencyRequest", EmergencyRequestSchema);
export default EmergencyRequest;
