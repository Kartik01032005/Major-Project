"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, BloodGroup, UserRole, ApiResponse } from "@/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<ApiResponse<{ token: string; user: User }>>;
  register: (userData: {
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
  }) => Promise<ApiResponse<null>>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USERS_KEY = "bloodlink_users_db";
const LOCAL_STORAGE_TOKEN_KEY = "bloodlink_auth_token";
const LOCAL_STORAGE_USER_KEY = "bloodlink_auth_user";

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize DB if not present and verify existing session with backend
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      if (!storedUsers) {
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      }

      const verifySession = async () => {
        const savedToken = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
        const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);

        if (savedToken) {
          try {
            // Set token state early for interceptor to pick up
            setToken(savedToken);
            const res = await authService.getMe();
            if (res.success && res.data) {
              setUser(res.data);
              localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(res.data));
            } else {
              logout();
            }
          } catch (err: any) {
            // Expired or bad token: log out
            if (err.response?.status === 401) {
              logout();
            } else if (savedUser) {
              // Server is offline, fallback to cached user details for seamless offline client test
              setUser(JSON.parse(savedUser));
            }
          }
        }
        setLoading(false);
      };

      verifySession();
    }
  }, []);

  const login = async (email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
    try {
      const res = await authService.login(email, password);
      
      if (res.success && res.data) {
        const { token: apiToken, user: apiUser } = res.data;

        setUser(apiUser);
        setToken(apiToken);
        localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, apiToken);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(apiUser));

        return {
          success: true,
          message: res.message || "Login successful.",
          data: { token: apiToken, user: apiUser },
        };
      }
      return { success: false, message: res.message || "Invalid credentials." };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Login failed. Please try again.";
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
        // Automatically login user after registration
        const logRes = await login(userData.email, userData.password || "password123");
        if (logRes.success) {
          return {
            success: true,
            message: "Account created successfully and logged in.",
          };
        }
      }
      return { success: false, message: regRes.message || "Registration failed." };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || err.message || "Registration failed.";
      return { success: false, message: errMsg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
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
