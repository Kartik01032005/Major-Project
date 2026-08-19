import { apiClient } from "./apiClient";
import { secureStorage } from "./secureStorage";
import type { AuthResponse, AuthUser, LoginInput, RegisterInput, RegisterResponse } from "../types/auth";

export const authService = {
  login: async (input: LoginInput): Promise<AuthResponse> => {
    const response = await apiClient.login(input);
    await secureStorage.saveToken(response.token);
    return response;
  },

  register: (input: RegisterInput): Promise<RegisterResponse> => apiClient.register(input),

  getCurrentUser: (): Promise<AuthUser> => apiClient.getCurrentUser(),

  logout: async (): Promise<void> => {
    await secureStorage.clearToken();
  },
};
