import { env } from "../config/env";
import { secureStorage } from "./secureStorage";
import { getResponseError, isApiObject, type HealthResponse } from "../types/api";
import { isAuthUser, type AuthResponse, type AuthUser, type LoginInput, type RegisterInput, type RegisterResponse } from "../types/auth";
import type { AvailabilityThresholds, EmergencyRequest, EmergencyRequestInput, HospitalInput, InventoryItem, InventoryUpload, ProfileUpdate, } from "../types/userFeatures";
import { isEmergencyRequest } from "../types/userFeatures";
import { isHospitalResponse, type HospitalResponse } from "../types/location";
import { isNotification, type Notification } from "../types/notification";

class ApiClient {
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      const token = await secureStorage.getToken();
      const headers = new Headers(options.headers);
      if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
      if (token) headers.set("Authorization", `Bearer ${token}`);

      response = await fetch(`${env.apiUrl}${path}`, { ...options, headers });
    } catch {
      throw new Error("Unable to reach the BloodLink API. Check your connection and try again.");
    }

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      throw new Error("The BloodLink API returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(getResponseError(payload, "The BloodLink API returned an error."));
    }

    return payload as T;
  }

  async getHealth(): Promise<HealthResponse> {
    const payload: unknown = await this.request<unknown>("/health");

    if (!isApiObject(payload) || typeof payload.success !== "boolean" || typeof payload.message !== "string" || !payload.message) {
      throw new Error("The BloodLink API returned an invalid health response.");
    }

    return { success: payload.success, message: payload.message };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const payload: unknown = await this.request<unknown>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!isApiObject(payload) || !isApiObject(payload.data) || typeof payload.data.token !== "string" || !isAuthUser(payload.data.user)) {
      throw new Error("The BloodLink API returned an invalid login response.");
    }
    return { token: payload.data.token, user: payload.data.user };
  }

  async register(input: RegisterInput): Promise<RegisterResponse> {
    const payload: unknown = await this.request<unknown>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!isApiObject(payload) || !isApiObject(payload.data) || !isAuthUser(payload.data)) {
      throw new Error("The BloodLink API returned an invalid registration response.");
    }
    return { user: payload.data };
  }

  async getCurrentUser(): Promise<AuthUser> {
    const payload: unknown = await this.request<unknown>("/auth/me");
    if (!isApiObject(payload) || !isAuthUser(payload.data)) {
      throw new Error("The BloodLink API returned an invalid session response.");
    }
    return payload.data;
  }

  async getProfile(): Promise<AuthUser> {
    const payload: unknown = await this.request<unknown>("/users/profile");
    if (!isApiObject(payload) || !isAuthUser(payload.data)) throw new Error("The BloodLink API returned an invalid profile response.");
    return payload.data;
  }

  async updateProfile(input: ProfileUpdate): Promise<AuthUser> {
    const payload: unknown = await this.request<unknown>("/users/profile", { method: "PUT", body: JSON.stringify(input) });
    if (!isApiObject(payload) || !isAuthUser(payload.data)) throw new Error("The BloodLink API returned an invalid profile response.");
    return payload.data;
  }

  async deleteAccount(): Promise<void> {
    await this.request<unknown>("/auth/delete-account", { method: "DELETE" });
  }

  async createEmergencyRequest(input: EmergencyRequestInput): Promise<EmergencyRequest> {
    const payload: unknown = await this.request<unknown>("/emergency", { method: "POST", body: JSON.stringify(input) });
    if (!isApiObject(payload) || !isEmergencyRequest(payload.data)) throw new Error("The BloodLink API returned an invalid emergency request.");
    return payload.data;
  }

  async getEmergencyRequests(): Promise<EmergencyRequest[]> {
    const payload: unknown = await this.request<unknown>("/emergency");
    if (!isApiObject(payload) || !Array.isArray(payload.data) || !payload.data.every(isEmergencyRequest)) {
      throw new Error("The BloodLink API returned invalid emergency requests.");
    }
    return payload.data;
  }

  async approveEmergencyRequest(id: string): Promise<EmergencyRequest> {
    const payload: unknown = await this.request<unknown>(`/emergency/${id}/approve`, { method: "PUT" });
    if (!isApiObject(payload) || !isEmergencyRequest(payload.data)) throw new Error("The BloodLink API returned an invalid emergency request.");
    return payload.data;
  }

  async rejectEmergencyRequest(id: string): Promise<EmergencyRequest> {
    const payload: unknown = await this.request<unknown>(`/emergency/${id}/reject`, { method: "PUT" });
    if (!isApiObject(payload) || !isEmergencyRequest(payload.data)) throw new Error("The BloodLink API returned an invalid emergency request.");
    return payload.data;
  }

  async getHospitals(): Promise<HospitalResponse[]> {
    const payload: unknown = await this.request<unknown>("/hospitals");
    if (!isApiObject(payload) || !Array.isArray(payload.data) || !payload.data.every(isHospitalResponse)) {
      throw new Error("The BloodLink API returned an invalid hospital list.");
    }
    return payload.data;
  }

  async createHospital(input: HospitalInput): Promise<HospitalResponse> {
    const payload: unknown = await this.request<unknown>("/hospitals", { method: "POST", body: JSON.stringify(input) });
    if (!isApiObject(payload) || !isHospitalResponse(payload.data)) throw new Error("The BloodLink API returned an invalid hospital.");
    return payload.data;
  }

  async updateHospital(id: string, input: HospitalInput): Promise<HospitalResponse> {
    const payload: unknown = await this.request<unknown>(`/hospitals/${id}`, { method: "PUT", body: JSON.stringify(input) });
    if (!isApiObject(payload) || !isHospitalResponse(payload.data)) throw new Error("The BloodLink API returned an invalid hospital.");
    return payload.data;
  }

  async deleteHospital(id: string): Promise<void> {
    await this.request<unknown>(`/hospitals/${id}`, { method: "DELETE" });
  }

  async getInventory(): Promise<InventoryItem[]> {
    const payload: unknown = await this.request<unknown>("/inventory");
    if (!isApiObject(payload) || !Array.isArray(payload.data) || !payload.data.every(isInventoryItem)) throw new Error("The BloodLink API returned an invalid inventory list.");
    return payload.data;
  }

  async updateInventory(id: string, units: number): Promise<InventoryItem> {
    const payload: unknown = await this.request<unknown>(`/inventory/${id}`, { method: "PUT", body: JSON.stringify({ units }) });
    if (!isApiObject(payload) || !isInventoryItem(payload.data)) throw new Error("The BloodLink API returned an invalid inventory update.");
    return payload.data;
  }

  async adjustInventory(id: string, delta: number): Promise<InventoryItem> {
    const payload: unknown = await this.request<unknown>(`/inventory/${id}/adjust`, { method: "POST", body: JSON.stringify({ delta }) });
    if (!isApiObject(payload) || !isInventoryItem(payload.data)) throw new Error("The BloodLink API returned an invalid inventory update.");
    return payload.data;
  }

  async getInventoryThresholds(): Promise<AvailabilityThresholds> {
    const payload: unknown = await this.request<unknown>("/inventory/thresholds");
    if (!isApiObject(payload) || !isThresholds(payload.data)) throw new Error("The BloodLink API returned invalid inventory thresholds.");
    return payload.data;
  }

  async getInventoryUploads(): Promise<InventoryUpload[]> {
    const payload: unknown = await this.request<unknown>("/inventory/upload-history");
    if (!isApiObject(payload) || !Array.isArray(payload.data) || !payload.data.every(isInventoryUpload)) throw new Error("The BloodLink API returned invalid upload history.");
    return payload.data;
  }

  async uploadInventory(asset: { uri: string; name: string; mimeType?: string | null; file?: File }, mode: "merge" | "replace"): Promise<InventoryItem[]> {
    const form = new FormData();
    form.append("mode", mode);
    if (asset.file) form.append("file", asset.file);
    else form.append("file", { uri: asset.uri, name: asset.name, type: asset.mimeType ?? "application/octet-stream" } as unknown as Blob);
    const payload: unknown = await this.request<unknown>("/inventory/upload", { method: "POST", body: form });
    if (!isApiObject(payload) || !Array.isArray(payload.inventory) || !payload.inventory.every(isInventoryItem)) throw new Error("The BloodLink API returned an invalid upload response.");
    return payload.inventory;
  }

  async getNotifications(): Promise<Notification[]> {
    const payload: unknown = await this.request<unknown>("/notifications");
    if (!isApiObject(payload) || !Array.isArray(payload.data) || !payload.data.every(isNotification)) {
      throw new Error("The BloodLink API returned an invalid notification list.");
    }
    return payload.data;
  }

  async markNotificationRead(id: string): Promise<Notification> {
    const payload: unknown = await this.request<unknown>(`/notifications/read/${id}`, { method: "PUT" });
    if (!isApiObject(payload) || !isNotification(payload.data)) {
      throw new Error("The BloodLink API returned an invalid notification update.");
    }
    return payload.data;
  }
}

function isInventoryItem(value: unknown): value is InventoryItem {
  if (!isApiObject(value)) return false;
  return typeof value._id === "string" && typeof value.bloodGroup === "string" && typeof value.units === "number" && typeof value.createdAt === "string" && typeof value.updatedAt === "string";
}

function isThresholds(value: unknown): value is AvailabilityThresholds {
  if (!isApiObject(value)) return false;
  return ["highlyAvailable", "veryHigh", "high", "good", "available", "moderate", "low", "veryLow", "critical", "almostEmpty"].every((key) => typeof value[key] === "number");
}

function isInventoryUpload(value: unknown): value is InventoryUpload {
  return isApiObject(value) && typeof value._id === "string" && typeof value.fileName === "string" && typeof value.fileType === "string" && typeof value.mode === "string" && typeof value.createdAt === "string" && isApiObject(value.summary) && typeof value.summary.validRecords === "number" && typeof value.summary.unitsAdded === "number";
}

export const apiClient = new ApiClient();
