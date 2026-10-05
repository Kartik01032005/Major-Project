import axios from "axios";

function getApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.location.hostname) {
    const hostname = window.location.hostname;
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    // If an external production domain is explicitly specified, use it
    if (
      envUrl &&
      !envUrl.includes("localhost") &&
      !envUrl.includes("127.0.0.1") &&
      !/^(?:\d{1,3}\.){3}\d{1,3}/.test(new URL(envUrl).hostname)
    ) {
      return envUrl;
    }
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000/api";
    }
    return `${window.location.protocol}//${hostname}:5000/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 12000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to automatically add JWT Token to headers and handle dynamic hostnames
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname) {
        // Automatically sync baseURL to current page's host if connecting to local/LAN backend
        if (
          !config.baseURL ||
          config.baseURL.includes(":5000") ||
          config.baseURL.startsWith("/api")
        ) {
          if (hostname === "localhost" || hostname === "127.0.0.1") {
            config.baseURL = "http://localhost:5000/api";
          } else {
            config.baseURL = `${window.location.protocol}//${hostname}:5000/api`;
          }
        }
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
