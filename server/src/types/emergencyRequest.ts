import { Document, Types } from "mongoose";

export interface IEmergencyRequest extends Document {
  requestBy: Types.ObjectId;
  bloodGroup: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  unitsRequired: number;
  hospital: string;
  hospitalLatitude?: number;
  hospitalLongitude?: number;
  hospitalAddress?: string;
  hospitalOsmId?: string;
  state: string;
  district: string;
  address: string;
  contactNumber: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: "Pending" | "Approved" | "Rejected" | "Completed" | "Cancelled" | "Expired";
  approvedBy?: Types.ObjectId | null;
  acceptedBy: Types.ObjectId[];
  donationReportedBy?: Types.ObjectId[];
  donationReportedAt?: Date | null;
  donationConfirmedBy?: Types.ObjectId | null;
  donationConfirmedAt?: Date | null;
  withdrawnBy?: Array<{
    donor: Types.ObjectId;
    reason: string;
    withdrawnAt: Date;
  }>;
  declinedBy?: Array<{
    donor: Types.ObjectId;
    reason?: string;
    declinedAt: Date;
  }>;
  notifiedDonorsCount?: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmergencyTrackingStats {
  requestId: string;
  requestCreated: Date;
  expiresAt?: Date;
  notifiedCount: number;
  respondedCount: number;
  acceptedCount: number;
  unableToDonateCount: number;
  withdrawnCount: number;
  pendingCount: number;
  status: "Pending" | "Approved" | "Rejected" | "Completed" | "Cancelled" | "Expired";
  lifecycleStatus:
    | "Searching for Donors"
    | "Donor Response Received"
    | "Request Fulfilled"
    | "Request Cancelled"
    | "Request Rejected"
    | "Request Expired";
}
