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

export type RequestStatus = "pending" | "approved" | "rejected";

export interface EmergencyRequest {
  _id: string;
  userId: string;
  userName: string;
  bloodGroup: BloodGroup;
  state: string;
  district: string;
  hospitalName: string;
  address: string;
  contactNumber: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Blood Inventory ──────────────────────────────────────────────────────────

export interface BloodInventoryItem {
  _id: string;
  bloodGroup: BloodGroup;
  units: number;
  lastUpdated: string;
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

export type NotificationType = "request_created" | "request_approved" | "request_rejected" | "inventory_updated" | "general";

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
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
