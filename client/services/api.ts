import axios from "axios";

function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (
    envUrl &&
    !envUrl.includes("localhost") &&
    !envUrl.includes("127.0.0.1")
  ) {
    return envUrl;
  }
  if (
    typeof window !== "undefined" &&
    window.location.hostname &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return `${window.location.protocol}//${window.location.hostname}:5000/api`;
  }
  return envUrl ?? "http://localhost:5000/api";
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to automatically add JWT Token to headers and handle dynamic hostnames
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      // If current base URL points to localhost but phone is accessing via LAN IP
      if (
        config.baseURL?.includes("localhost:5000") &&
        window.location.hostname &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"
      ) {
        config.baseURL = `${window.location.protocol}//${window.location.hostname}:5000/api`;
      }
      const token = localStorage.getItem("bloodlink_auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
export default api;
