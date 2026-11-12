"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, BloodGroup, UserRole, ApiResponse } from "@/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<ApiResponse<{ token: string; user: User }>>;
  register: (userData: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    bloodGroup?: BloodGroup;
    role: UserRole;
    organizationName?: string;
    address?: string;
    registrationNumber?: string;
    location?: {
      state: string;
      district: string;
      latitude: number;
      longitude: number;
    };
  }) => Promise<ApiResponse<null>>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_USERS_KEY = "bloodlink_users_db";
const SESSION_STORAGE_TOKEN_KEY = "bloodlink_auth_token";
const SESSION_STORAGE_USER_KEY = "bloodlink_auth_user";

// Pre-populate some demo credentials for testing
const DEFAULT_USERS = [
  {
    _id: "demo-donor-id",
    name: "Rahul Kumar",
    email: "rahul@gmail.com",
    phone: "9876543210",
    password: "password123",
    bloodGroup: "O+" as BloodGroup,
    role: "user" as UserRole,
    isAvailableDonor: true,
    location: {
      state: "Karnataka",
      district: "Mysore",
      latitude: 12.2958,
      longitude: 76.6394,
    },
    createdAt: new Date().toISOString(),
  },
  {
    _id: "demo-admin-id",
    name: "Apollo Blood Bank",
    email: "apollo@bloodlink.in",
    phone: "1800000000",
    password: "password123",
    bloodGroup: "B+" as BloodGroup, // Placeholder/optional for admin
    role: "admin" as UserRole,
    isAvailableDonor: false,
    location: {
      state: "Karnataka",
      district: "Mysore",
      latitude: 12.305,
      longitude: 76.645,
    },
    createdAt: new Date().toISOString(),
  },
];

import { authService } from "@/services";
import { setAuthToken, clearAuthStorage } from "@/services/api";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab-isolated logout: Clears only this tab's authentication session
  const logout = () => {
    setUser(null);
    setToken(null);
    clearAuthStorage();
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Purge any legacy shared localStorage auth tokens to prevent cross-tab contamination
      try {
        localStorage.removeItem(SESSION_STORAGE_TOKEN_KEY);
        localStorage.removeItem(SESSION_STORAGE_USER_KEY);
      } catch {}

      const storedUsers = sessionStorage.getItem(SESSION_STORAGE_USERS_KEY);
      if (!storedUsers) {
        try {
          sessionStorage.setItem(SESSION_STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
        } catch {}
      }

      const verifySession = async () => {
        // Read strictly from sessionStorage so every browser tab maintains its own independent session
        let savedToken: string | null = null;
        let savedUser: string | null = null;
        try {
          savedToken = sessionStorage.getItem(SESSION_STORAGE_TOKEN_KEY);
          savedUser = sessionStorage.getItem(SESSION_STORAGE_USER_KEY);
        } catch {}

        if (savedToken) {
          try {
            // Set token in state and in-memory Axios cache early for requests
            setToken(savedToken);
            setAuthToken(savedToken);
            const res = await authService.getMe();
            if (res.success && res.data) {
              setUser(res.data);
              try {
                sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(res.data));
              } catch {}
            } else {
              logout();
            }
          } catch (err: unknown) {
            const errorObj = err as { response?: { status?: number } };
            // Expired, invalid, or forbidden session: log out this tab only
            if (
              errorObj.response?.status === 401 ||
              errorObj.response?.status === 403 ||
              errorObj.response?.status === 404
            ) {
              logout();
            } else if (!errorObj.response && savedUser) {
              // Server is offline (network error), fallback to cached user details for this tab
              try {
                setUser(JSON.parse(savedUser));
              } catch {
                logout();
              }
            } else {
              logout();
            }
          }
        }
        setLoading(false);
      };

      verifySession();
    }
  }, []);

  const login = async (
    email: string,
    password: string,
    role?: UserRole
  ): Promise<ApiResponse<{ token: string; user: User }>> => {
    try {
      const res = await authService.login(email.trim(), password, role);
      
      if (res.success && res.data) {
        const { token: apiToken, user: apiUser } = res.data;

        setUser(apiUser);
        setToken(apiToken);
        setAuthToken(apiToken);

        // Store exclusively in sessionStorage so different tabs can log in with different accounts
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(SESSION_STORAGE_TOKEN_KEY, apiToken);
            sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(apiUser));
            // Ensure shared localStorage doesn't contain cross-tab auth state
            localStorage.removeItem(SESSION_STORAGE_TOKEN_KEY);
            localStorage.removeItem(SESSION_STORAGE_USER_KEY);
          } catch {}
        }

        return {
          success: true,
          message: res.message || "Login successful.",
          data: { token: apiToken, user: apiUser },
        };
      }
      return { success: false, message: res.message || "Invalid credentials." };
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const errMsg = errorObj.response?.data?.message || 
        (errorObj.message?.includes("Network Error") ? "Unable to connect to BloodLink server. Please ensure the backend is running." : errorObj.message) || 
        "Login failed. Please try again.";
      return { success: false, message: errMsg };
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    bloodGroup?: BloodGroup;
    role: UserRole;
    organizationName?: string;
    address?: string;
    registrationNumber?: string;
    location?: {
      state: string;
      district: string;
      latitude: number;
      longitude: number;
    };
  }): Promise<ApiResponse<null>> => {
    try {
      const regRes = await authService.register(userData);
      
      if (regRes.success) {
        // Automatically login user after registration with the registered role
        const logRes = await login(userData.email, userData.password || "password123", userData.role);
        if (logRes.success) {
          return {
            success: true,
            message: "Account created successfully and logged in.",
          };
        }
      }
      return { success: false, message: regRes.message || "Registration failed." };
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string; errors?: Array<{ msg?: string }> } }; message?: string };
      const errMsg = errorObj.response?.data?.message || 
        errorObj.response?.data?.errors?.[0]?.msg || 
        (errorObj.message?.includes("Network Error") ? "Unable to connect to BloodLink server. Please ensure the backend is running." : errorObj.message) || 
        "Registration failed.";
      return { success: false, message: errMsg };
    }
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const nextUser = { ...prev, ...updatedData };
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(nextUser));
        } catch {}
      }
      return nextUser;
    });
  };

  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(res.data));
          } catch {}
        }
      }
    } catch (e) {
      console.error("Failed to refresh user session", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
