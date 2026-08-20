import type { AuthUser, UserLocation } from "./auth";

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type RequestStatus = "Pending" | "Approved" | "Rejected" | "Completed";

export type ProfileUpdate = {
  name?: string;
  phone?: string;
  bloodGroup?: BloodGroup;
  isAvailableDonor?: boolean;
  location?: Partial<UserLocation>;
};

export type EmergencyRequestInput = {
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospital: string;
  state: string;
  district: string;
  address: string;
  contactNumber: string;
};

export type EmergencyRequest = {
  _id: string;
  requestBy: string | { _id: string; name: string; email: string; phone: string };
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospital: string;
  state: string;
  district: string;
  address: string;
  contactNumber: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
};

export const bloodGroups: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function isEmergencyRequest(value: unknown): value is EmergencyRequest {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate._id === "string" && bloodGroups.includes(candidate.bloodGroup as BloodGroup) &&
    typeof candidate.hospital === "string" && typeof candidate.state === "string" &&
    typeof candidate.district === "string" && typeof candidate.address === "string" &&
    typeof candidate.contactNumber === "string" &&
    ["Pending", "Approved", "Rejected", "Completed"].includes(candidate.status as string);
}

export function requestBelongsToUser(request: EmergencyRequest, user: AuthUser): boolean {
  return typeof request.requestBy === "string" ? request.requestBy === user._id : request.requestBy._id === user._id;
}