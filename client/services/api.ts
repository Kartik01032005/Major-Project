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

// In-memory token cache for the current tab's execution context
let inMemoryToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  inMemoryToken = token;
};

export const getAuthToken = (): string | null => {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window !== "undefined") {
    try {
      // sessionStorage is isolated per browser tab, ensuring independent authentication
      const sessionToken = sessionStorage.getItem("bloodlink_auth_token");
      if (sessionToken) {
        inMemoryToken = sessionToken;
        return sessionToken;
      }
    } catch {
      // Storage access blocked or restricted
    }
  }
  return null;
};

export const clearAuthStorage = () => {
  inMemoryToken = null;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("bloodlink_auth_token");
      sessionStorage.removeItem("bloodlink_auth_user");
      // Purge any legacy shared localStorage auth keys to prevent cross-tab session contamination
      localStorage.removeItem("bloodlink_auth_token");
      localStorage.removeItem("bloodlink_auth_user");
    } catch {}
  }
};

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
      const token = getAuthToken();
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

// Auth-validation endpoints where a 401 genuinely means the stored token
// is invalid or expired and credentials should be cleared.
const AUTH_VALIDATION_PATHS = ["/auth/me", "/auth/login", "/auth/delete-account"];

// Response interceptor to handle 401 unauthorized
// Only clear stored credentials when an auth-validation endpoint confirms
// the token itself is invalid. Regular API 401s (e.g. /hospitals, /notifications)
// should NOT wipe the session — they may be transient or caused by a timing race.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const requestUrl = error.config?.url || "";
      const isAuthValidation = AUTH_VALIDATION_PATHS.some(
        (path) => requestUrl === path || requestUrl.endsWith(path)
      );

      if (isAuthValidation) {
        clearAuthStorage();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
