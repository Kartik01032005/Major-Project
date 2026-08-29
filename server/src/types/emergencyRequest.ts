import { Document, Types } from "mongoose";

export interface IEmergencyRequest extends Document {
  requestBy: Types.ObjectId;
  bloodGroup: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  unitsRequired: number;
  hospital: string;
  state: string;
  district: string;
  address: string;
  contactNumber: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: "Pending" | "Approved" | "Rejected" | "Completed" | "Cancelled";
  approvedBy?: Types.ObjectId | null;
  acceptedBy: Types.ObjectId[];
  withdrawnBy?: Array<{
    donor: Types.ObjectId;
    reason: string;
    withdrawnAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
