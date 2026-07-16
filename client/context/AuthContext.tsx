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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize DB if not present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      if (!storedUsers) {
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      }

      const savedToken = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
      const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
    // Simulate server latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    const storedUsersJson = localStorage.getItem(LOCAL_STORAGE_USERS_KEY) || "[]";
    const storedUsers = JSON.parse(storedUsersJson);

    const foundUser = storedUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!foundUser) {
      return { success: false, message: "User account not found." };
    }

    if (foundUser.password !== password) {
      return { success: false, message: "Invalid credentials. Please try again." };
    }

    // Exclude password from the public user object
    const { password: _, ...userWithoutPassword } = foundUser;
    const mockToken = `mock-jwt-token-${foundUser._id}-${Date.now()}`;

    // Update context state
    setUser(userWithoutPassword as User);
    setToken(mockToken);

    // Save to localStorage
    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, mockToken);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userWithoutPassword));

    return {
      success: true,
      message: "Login successful.",
      data: { token: mockToken, user: userWithoutPassword as User },
    };
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
    // Simulate server latency
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const storedUsersJson = localStorage.getItem(LOCAL_STORAGE_USERS_KEY) || "[]";
    const storedUsers = JSON.parse(storedUsersJson);

    const emailExists = storedUsers.some((u: any) => u.email.toLowerCase() === userData.email.toLowerCase());
    if (emailExists) {
      return { success: false, message: "Email is already registered." };
    }

    // Format new user
    const newUser = {
      _id: `user-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password || "password123",
      bloodGroup: userData.bloodGroup || ("O+" as BloodGroup),
      role: userData.role,
      isAvailableDonor: userData.role === "user", // Available by default if individual
      location: userData.location || {
        state: "Karnataka",
        district: "Mysore",
        latitude: 12.2958,
        longitude: 76.6394,
      },
      createdAt: new Date().toISOString(),
    };

    // Save back to db array
    storedUsers.push(newUser);
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(storedUsers));

    // Automatically log user in after registration
    const { password: _, ...userWithoutPassword } = newUser;
    const mockToken = `mock-jwt-token-${newUser._id}-${Date.now()}`;

    setUser(userWithoutPassword as User);
    setToken(mockToken);
    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, mockToken);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userWithoutPassword));

    return {
      success: true,
      message: "Account created successfully.",
    };
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
