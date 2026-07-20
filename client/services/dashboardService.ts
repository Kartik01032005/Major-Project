import api from "./api";
import {
  EmergencyRequest,
  BloodInventoryItem,
  Notification,
  Hospital,
} from "@/types";


export const dashboardService = {
  // Emergency Requests
  getRequests: async (): Promise<EmergencyRequest[]> => {
    const response = await api.get<{ success: boolean; data: EmergencyRequest[] }>("/emergency");
    return response.data.data;
  },

  createRequest: async (data: any): Promise<EmergencyRequest> => {
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

  deleteRequest: async (id: string): Promise<void> => {
    await api.delete(`/emergency/${id}`);
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
