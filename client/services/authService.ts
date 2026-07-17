import api from "./api";

import { User, BloodGroup, UserRole } from "@/types";

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface MeResponse {
  success: boolean;
  message: string;
  data: User;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", { email, password });
    return response.data;
  },

  register: async (userData: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    bloodGroup?: BloodGroup;
    role: UserRole;
    location?: {
      state: string;
      district: string;
      latitude: number;
      longitude: number;
    };
  }): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>("/auth/register", userData);
    return response.data;
  },

  getMe: async (): Promise<MeResponse> => {
    const response = await api.get<MeResponse>("/auth/me");
    return response.data;
  },
};
export default authService;
