import api from "./api";
import {
  EmergencyRequest,
  BloodInventoryItem,
  Notification,
  Hospital,
  UploadSummary,
  InventoryUploadLogItem,
  AvailabilityThresholds,
} from "@/types";


export const dashboardService = {
  // Emergency Requests
  getRequests: async (): Promise<EmergencyRequest[]> => {
    const response = await api.get<{ success: boolean; data: EmergencyRequest[] }>("/emergency");
    return response.data.data;
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
};
export default dashboardService;
