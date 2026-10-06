import api from "./api";
import {
  EmergencyRequest,
  EmergencyTrackingStats,
  DonorResponseStatus,
  BloodInventoryItem,
  Notification,
  Hospital,
  UploadSummary,
  InventoryUploadLogItem,
  AvailabilityThresholds,
  User,
  BloodGroup,
  DonorProfileStats,
  PublicDonorProfile,
  UserSettings,
} from "@/types";


export const dashboardService = {
  // Emergency Requests
  getRequests: async (): Promise<EmergencyRequest[]> => {
    const response = await api.get<{ success: boolean; data: EmergencyRequest[] }>("/emergency");
    return response.data.data;
  },

  getRequestDismissals: async (): Promise<{ my: string[]; donate: string[] }> => {
    const response = await api.get<{
      success: boolean;
      data: { my: string[]; donate: string[] };
    }>("/emergency/dismissals");
    return response.data.data;
  },

  dismissRequests: async (view: "my" | "donate", requestIds: string[]): Promise<void> => {
    await api.post("/emergency/dismissals", { view, requestIds });
  },

  createRequest: async (data: {
    bloodGroup: string;
    state: string;
    district: string;
    hospitalName: string;
    address: string;
    contactNumber: string;
    unitsRequired?: number;
    hospital?: string;
    hospitalLatitude?: number;
    hospitalLongitude?: number;
    hospitalAddress?: string;
    hospitalOsmId?: string;
  }): Promise<EmergencyRequest> => {
    const response = await api.post<{ success: boolean; data: EmergencyRequest }>("/emergency", data);
    return response.data.data;
  },

  approveRequest: async (id: string): Promise<EmergencyRequest> => {
    const response = await api.put<{ success: boolean; data: EmergencyRequest }>(`/emergency/${id}/approve`);
    return response.data.data;
  },

  rejectRequest: async (id: string): Promise<EmergencyRequest> => {
    const response = await api.put<{ success: boolean; data: EmergencyRequest }>(`/emergency/${id}/reject`);
    return response.data.data;
  },

  cancelRequest: async (id: string): Promise<EmergencyRequest> => {
    const response = await api.delete<{ success: boolean; data: EmergencyRequest }>(`/emergency/${id}`);
    return response.data.data;
  },

  acceptRequest: async (id: string): Promise<EmergencyRequest> => {
    const response = await api.put<{ success: boolean; data: EmergencyRequest }>(`/emergency/${id}/accept`);
    return response.data.data;
  },

  reportDonation: async (id: string): Promise<EmergencyRequest> => {
    const response = await api.post<{ success: boolean; data: EmergencyRequest }>(`/emergency/${id}/donation-report`);
    return response.data.data;
  },

  confirmDonation: async (id: string): Promise<EmergencyRequest> => {
    const response = await api.post<{ success: boolean; data: EmergencyRequest }>(`/emergency/${id}/donation-confirm`);
    return response.data.data;
  },

  withdrawAcceptance: async (id: string, reason: string): Promise<EmergencyRequest> => {
    const response = await api.post<{ success: boolean; data: EmergencyRequest }>(`/emergency/${id}/withdraw`, { reason });
    return response.data.data;
  },

  declineRequest: async (id: string, reason?: string): Promise<EmergencyRequest> => {
    const response = await api.post<{ success: boolean; data: EmergencyRequest }>(`/emergency/${id}/decline`, { reason });
    return response.data.data;
  },

  getRequestTracking: async (id: string): Promise<EmergencyTrackingStats> => {
    const response = await api.get<{ success: boolean; data: EmergencyTrackingStats }>(`/emergency/${id}/tracking`);
    return response.data.data;
  },

  getDonorStatus: async (id: string): Promise<DonorResponseStatus> => {
    const response = await api.get<{ success: boolean; data: DonorResponseStatus }>(`/emergency/${id}/donor-status`);
    return response.data.data;
  },

  // Inventory
  getInventory: async (): Promise<BloodInventoryItem[]> => {
    const response = await api.get<{ success: boolean; data: BloodInventoryItem[] }>("/inventory");
    return response.data.data;
  },

  updateInventory: async (id: string, units: number): Promise<BloodInventoryItem> => {
    const response = await api.put<{ success: boolean; data: BloodInventoryItem }>(`/inventory/${id}`, { units });
    return response.data.data;
  },

  adjustInventory: async (id: string, delta: number): Promise<BloodInventoryItem> => {
    const response = await api.post<{ success: boolean; data: BloodInventoryItem }>(`/inventory/${id}/adjust`, { delta });
    return response.data.data;
  },

  syncInventoryFromUpload: async (id: string): Promise<BloodInventoryItem> => {
    const response = await api.post<{ success: boolean; data: BloodInventoryItem }>(`/inventory/${id}/sync`);
    return response.data.data;
  },

  uploadInventoryFile: async (
    file: File,
    mode: "merge" | "replace"
  ): Promise<{
    success: boolean;
    message: string;
    summary: UploadSummary;
    log: InventoryUploadLogItem;
    inventory: BloodInventoryItem[];
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);
    const response = await api.post("/inventory/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  getUploadHistory: async (): Promise<InventoryUploadLogItem[]> => {
    const response = await api.get<{ success: boolean; data: InventoryUploadLogItem[] }>("/inventory/upload-history");
    return response.data.data;
  },

  getThresholds: async (): Promise<AvailabilityThresholds> => {
    const response = await api.get<{ success: boolean; data: AvailabilityThresholds }>("/inventory/thresholds");
    return response.data.data;
  },

  updateThresholds: async (thresholds: Partial<AvailabilityThresholds>): Promise<AvailabilityThresholds> => {
    const response = await api.put<{ success: boolean; data: AvailabilityThresholds }>("/inventory/thresholds", thresholds);
    return response.data.data;
  },

  // Notifications
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<{ success: boolean; data: Notification[] }>("/notifications");
    return response.data.data;
  },

  markRead: async (id: string): Promise<Notification> => {
    const response = await api.put<{ success: boolean; data: Notification }>(`/notifications/read/${id}`);
    return response.data.data;
  },

  // Hospitals
  getHospitals: async (): Promise<Hospital[]> => {
    const response = await api.get<{ success: boolean; data: Hospital[] }>("/hospitals");
    return response.data.data;
  },

  addHospital: async (data: Omit<Hospital, "_id" | "createdAt">): Promise<Hospital> => {
    const response = await api.post<{ success: boolean; data: Hospital }>("/hospitals", data);
    return response.data.data;
  },

  updateHospital: async (id: string, data: Partial<Omit<Hospital, "_id" | "createdAt">>): Promise<Hospital> => {
    const response = await api.put<{ success: boolean; data: Hospital }>(`/hospitals/${id}`, data);
    return response.data.data;
  },

  deleteHospital: async (id: string): Promise<void> => {
    await api.delete(`/hospitals/${id}`);
  },

  // User & Donor Profile
  getProfile: async (): Promise<User & { donorStats?: DonorProfileStats }> => {
    const response = await api.get<{ success: boolean; data: User & { donorStats?: DonorProfileStats } }>("/users/profile");
    return response.data.data;
  },

  getDonorProfile: async (): Promise<User & { donorStats?: DonorProfileStats }> => {
    const response = await api.get<{ success: boolean; data: User & { donorStats?: DonorProfileStats } }>("/users/donor-profile");
    return response.data.data;
  },

  getPublicDonorProfile: async (
    id: string,
    coords?: { lat?: number; lng?: number }
  ): Promise<PublicDonorProfile> => {
    const params = coords?.lat && coords?.lng ? { lat: coords.lat, lng: coords.lng } : {};
    const response = await api.get<{ success: boolean; data: PublicDonorProfile }>(`/users/donor/${id}`, { params });
    return response.data.data;
  },

  updateProfile: async (data: {
    name?: string;
    phone?: string;
    bloodGroup?: BloodGroup;
    isAvailableDonor?: boolean;
    location?: {
      state?: string;
      district?: string;
      latitude?: number;
      longitude?: number;
    };
  }): Promise<User & { donorStats?: DonorProfileStats }> => {
    const response = await api.put<{ success: boolean; data: User & { donorStats?: DonorProfileStats } }>("/users/profile", data);
    return response.data.data;
  },
  // Settings
  getSettings: async (): Promise<UserSettings> => {
    const response = await api.get<{ success: boolean; data: UserSettings }>("/users/settings");
    return response.data.data;
  },

  updateSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await api.put<{ success: boolean; data: UserSettings }>("/users/settings", settings);
    return response.data.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await api.put<{ success: boolean; message: string }>("/users/change-password", data);
    return response.data;
  },

  exportUserData: async (): Promise<Record<string, unknown>> => {
    const response = await api.get<{ success: boolean; data: Record<string, unknown> }>("/users/export-data");
    return response.data.data;
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete("/auth/delete-account");
  },
};
export default dashboardService;
