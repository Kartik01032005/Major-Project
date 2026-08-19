import { env } from "../config/env";
import { secureStorage } from "./secureStorage";
import { getResponseError, isApiObject, type HealthResponse } from "../types/api";
import { isAuthUser, type AuthResponse, type AuthUser, type LoginInput, type RegisterInput, type RegisterResponse } from "../types/auth";

class ApiClient {
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      const token = await secureStorage.getToken();
      const headers = new Headers(options.headers);
      headers.set("Content-Type", "application/json");
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
}

export const apiClient = new ApiClient();
