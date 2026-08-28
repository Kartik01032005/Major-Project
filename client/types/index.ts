// ─── Navigation ──────────────────────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
}

// ─── UI Component Props ───────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  padding?: "sm" | "md" | "lg";
}

// ─── Landing Page Data ────────────────────────────────────────────────────────

export interface Feature {
  id: number;
  icon: string;
  title: string;
  description: string;
}

export interface Stat {
  id: number;
  value: string;
  label: string;
  suffix?: string;
}

export interface Step {
  id: number;
  step: string;
  title: string;
  description: string;
}

export interface WhyPoint {
  id: number;
  title: string;
  description: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type UserRole = "user" | "admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup: BloodGroup;
  role: UserRole;
  isAvailableDonor: boolean;
  location?: {
    state: string;
    district: string;
    latitude: number;
    longitude: number;
  };
  createdAt: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// ─── Emergency Request ────────────────────────────────────────────────────────

export type RequestStatus = "Pending" | "Approved" | "Rejected" | "Completed" | "Cancelled";

export interface EmergencyRequest {
  _id: string;
  requestBy: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    location?: {
      state: string;
      district: string;
    };
  } | string;
  bloodGroup: BloodGroup;
  unitsRequired?: number;
  hospital: string;
  state: string;
  district: string;
  address: string;
  contactNumber: string;
  status: RequestStatus;
  approvedBy?: string | null;
  acceptedBy?: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Blood Inventory ──────────────────────────────────────────────────────────

export interface BloodInventoryItem {
  _id: string;
  bloodBankId: string;
  bloodGroup: BloodGroup;
  units: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Hospital ─────────────────────────────────────────────────────────────────

export interface Hospital {
  _id: string;
  name: string;
  address: string;
  state: string;
  district: string;
  phone: string;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType = "Emergency" | "Approval" | "Rejection" | "Inventory" | "System";

export interface Notification {
  _id: string;
  receiverId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Dashboard Nav ────────────────────────────────────────────────────────────

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

// ─── Maps (Sprint 4) ──────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapBloodBank {
  id: string;
  name: string;
  address: string;
  district: string;
  state: string;
  phone: string;
  distance: string;
  available: BloodGroup[];
  open: boolean;
  position: LatLng;
}

export interface MapHospital {
  id: string;
  name: string;
  address: string;
  district: string;
  state: string;
  phone: string;
  position: LatLng;
}

// ─── Bulk Inventory & Stock Levels ────────────────────────────────────────────

export interface UploadError {
  row?: number;
  donorId?: string;
  reason: string;
}

export interface UploadSummary {
  totalParsed: number;
  validRecords: number;
  invalidRecords: number;
  unitsAdded: number;
  unitsByGroup: Record<string, number>;
  errors: UploadError[];
}

export interface InventoryUploadLogItem {
  _id: string;
  fileName: string;
  fileType: "xlsx" | "xls" | "csv" | "pdf";
  mode: "merge" | "replace";
  summary: UploadSummary;
  createdAt: string;
}

export interface AvailabilityThresholds {
  highlyAvailable: number; // Level 1
  veryHigh: number;        // Level 2
  high: number;            // Level 3
  good: number;            // Level 4
  available: number;       // Level 5
  moderate: number;        // Level 6
  low: number;             // Level 7
  veryLow: number;         // Level 8
  critical: number;        // Level 9
  almostEmpty: number;     // Level 10
}

export type AvailabilityLevel =
  | "Highly Available"
  | "Very High"
  | "High"
  | "Good"
  | "Available"
  | "Moderate"
  | "Low"
  | "Very Low"
  | "Critical"
  | "Almost Empty";
