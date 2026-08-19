import { env } from "../config/env";
import { isApiObject, isErrorResponse, type HealthResponse } from "../types/api";

class ApiClient {
  async getHealth(): Promise<HealthResponse> {
    const response = await fetch(`${env.apiUrl}/health`);
    const payload: unknown = await response.json();

    if (!response.ok) {
      const message = isErrorResponse(payload) && payload.message ? payload.message : "The BloodLink API returned an error.";
      throw new Error(message);
    }

    if (!isApiObject(payload) || typeof payload.success !== "boolean" || typeof payload.message !== "string" || !payload.message) {
      throw new Error("The BloodLink API returned an invalid health response.");
    }

    return { success: payload.success, message: payload.message };
  }
}

export const apiClient = new ApiClient();
