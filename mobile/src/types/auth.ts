export type UserRole = "user" | "admin";

export type UserLocation = {
  state: string;
  district: string;
  latitude?: number;
  longitude?: number;
};

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup?: string;
  role: UserRole;
  isAvailableDonor: boolean;
  location: UserLocation;
  createdAt?: string;
  updatedAt?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  location: UserLocation;
  organizationName?: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type RegisterResponse = {
  user: AuthUser;
};

export function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  const location = candidate.location;

  return (
    typeof candidate._id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.phone === "string" &&
    (candidate.role === "user" || candidate.role === "admin") &&
    typeof candidate.isAvailableDonor === "boolean" &&
    typeof location === "object" &&
    location !== null &&
    typeof (location as Record<string, unknown>).state === "string" &&
    typeof (location as Record<string, unknown>).district === "string"
  );
}
