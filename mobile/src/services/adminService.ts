import { apiClient } from "./apiClient";
import type { HospitalInput } from "../types/userFeatures";

export const adminService = {
  getInventory: () => apiClient.getInventory(),
  updateInventory: (id: string, units: number) => apiClient.updateInventory(id, units),
  adjustInventory: (id: string, delta: number) => apiClient.adjustInventory(id, delta),
  getThresholds: () => apiClient.getInventoryThresholds(),
  getUploadHistory: () => apiClient.getInventoryUploads(),
  uploadInventory: (asset: { uri: string; name: string; mimeType?: string | null; file?: File }, mode: "merge" | "replace") => apiClient.uploadInventory(asset, mode),
  approveRequest: (id: string) => apiClient.approveEmergencyRequest(id),
  rejectRequest: (id: string) => apiClient.rejectEmergencyRequest(id),
  createHospital: (input: HospitalInput) => apiClient.createHospital(input),
  updateHospital: (id: string, input: HospitalInput) => apiClient.updateHospital(id, input),
  deleteHospital: (id: string) => apiClient.deleteHospital(id),
};
