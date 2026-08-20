import { apiClient } from "./apiClient";
import type { AuthUser } from "../types/auth";
import type { ProfileUpdate } from "../types/userFeatures";

export const userService = {
  getProfile: (): Promise<AuthUser> => apiClient.getProfile(),
  updateProfile: (input: ProfileUpdate): Promise<AuthUser> => apiClient.updateProfile(input),
  deleteAccount: (): Promise<void> => apiClient.deleteAccount(),
};