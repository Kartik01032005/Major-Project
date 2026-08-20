import { apiClient } from "./apiClient";
import type { EmergencyRequest, EmergencyRequestInput } from "../types/userFeatures";

export const emergencyService = {
  create: (input: EmergencyRequestInput): Promise<EmergencyRequest> => apiClient.createEmergencyRequest(input),
  list: (): Promise<EmergencyRequest[]> => apiClient.getEmergencyRequests(),
};