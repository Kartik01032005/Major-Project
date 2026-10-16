import { Document } from "mongoose";

export interface ILocation {
  state: string;
  district: string;
  latitude?: number;
  longitude?: number;
}

export interface IEmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface IUserSettings {
  donor?: {
    pauseDonorRequests?: boolean;
  };
  notifications?: {
    emergencyAlerts?: boolean;
    nearbyRequests?: boolean;
    bloodBankUpdates?: boolean;
    smsNotifications?: boolean;
    whatsappNotifications?: boolean;
  };
  privacy?: {
    locationSharing?: boolean;
    profileVisibility?: "matching" | "hidden";
    phoneNumberPrivacy?: "hidden" | "on_request" | "public";
  };
  emergency?: {
    alertRadiusKm?: 5 | 10 | 25 | 50;
    emergencyContact?: IEmergencyContact;
  };
  security?: {
    twoFactorAuth?: boolean;
  };
}

export type Role = "USER" | "BLOOD_BANK" | "HOSPITAL" | "user" | "admin";
export type ApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface IHospitalProfileStats {
  profileCompletion: number;
  totalRequests: number;
  activeRequests: number;
  fulfilledRequests: number;
  totalDonorsResponded: number;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional so we can exclude it when reading data from database
  phone: string;
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  role: Role;
  approvalStatus?: ApprovalStatus;
  organizationName?: string;
  address?: string;
  registrationNumber?: string;
  hospitalType?: string;
  operatingHours?: string;
  emergencyContactPhone?: string;
  hospitalStats?: IHospitalProfileStats;
  rejectionReason?: string;
  approvedAt?: Date;
  approvedBy?: any;
  isAvailableDonor: boolean;
  location: ILocation;
  settings?: IUserSettings;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  resetPasswordTokenHash?: string;
  resetPasswordExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (enteredPassword: string) => Promise<boolean>;
}
