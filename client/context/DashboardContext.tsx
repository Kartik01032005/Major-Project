"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  EmergencyRequest,
  BloodInventoryItem,
  Hospital,
  Notification,
  RequestStatus,
} from "@/types";
import { useAuth } from "@/context/AuthContext";
import { dashboardService } from "@/services/dashboardService";

// ─── Hospitals still use localStorage (no backend endpoint yet) ───────────────
const HOSPITALS_KEY = "bloodlink_hospitals";

const DEFAULT_HOSPITALS: Hospital[] = [
  {
    _id: "hosp-1",
    name: "Apollo Hospital",
    address: "Bannerghatta Road, JP Nagar",
    state: "Karnataka",
    district: "Bangalore",
    phone: "9876500001",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "hosp-2",
    name: "Manipal Hospital",
    address: "Old Airport Road, Kodihalli",
    state: "Karnataka",
    district: "Bangalore",
    phone: "9876500002",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "hosp-3",
    name: "KMC Hospital",
    address: "Dr. B. R. Ambedkar Circle",
    state: "Karnataka",
    district: "Mysore",
    phone: "9876500003",
    createdAt: new Date().toISOString(),
  },
];

function loadHospitals(): Hospital[] {
  if (typeof window === "undefined") return DEFAULT_HOSPITALS;
  const stored = localStorage.getItem(HOSPITALS_KEY);
  if (stored) return JSON.parse(stored) as Hospital[];
  localStorage.setItem(HOSPITALS_KEY, JSON.stringify(DEFAULT_HOSPITALS));
  return DEFAULT_HOSPITALS;
}

function saveHospitals(data: Hospital[]): void {
  localStorage.setItem(HOSPITALS_KEY, JSON.stringify(data));
}

// ─── Context Types ────────────────────────────────────────────────────────────
interface DashboardContextType {
  // Emergency Requests
  requests: EmergencyRequest[];
  loadingRequests: boolean;
  createRequest: (data: {
    bloodGroup: string;
    state: string;
    district: string;
    hospitalName: string;
    address: string;
    contactNumber: string;
    unitsRequired?: number;
  }) => Promise<void>;
  updateRequestStatus: (id: string, status: "approved" | "rejected") => Promise<void>;
  refreshRequests: () => Promise<void>;

  // Blood Inventory
  inventory: BloodInventoryItem[];
  loadingInventory: boolean;
  updateInventory: (id: string, units: number) => Promise<void>;
  refreshInventory: () => Promise<void>;

  // Hospitals
  hospitals: Hospital[];
  addHospital: (data: Omit<Hospital, "_id" | "createdAt">) => void;
  updateHospital: (id: string, data: Partial<Omit<Hospital, "_id" | "createdAt">>) => void;
  deleteHospital: (id: string) => void;

  // Notifications
  notifications: Notification[];
  loadingNotifications: boolean;
  unreadCount: number;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [inventory, setInventory] = useState<BloodInventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // ── Fetch Helpers ──────────────────────────────────────────────────────────

  const refreshRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const data = await dashboardService.getRequests();
      setRequests(data);
    } catch (err) {
      console.error("Failed to load emergency requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  const refreshInventory = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    setLoadingInventory(true);
    try {
      const data = await dashboardService.getInventory();
      setInventory(data);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoadingInventory(false);
    }
  }, [user]);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    setLoadingNotifications(true);
    try {
      const data = await dashboardService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  }, [user]);

  // ── Seed on Login ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      setHospitals(loadHospitals());
      refreshRequests();
      refreshNotifications();
      if (user.role === "admin") {
        refreshInventory();
      }
    } else {
      // Clear state on logout
      setRequests([]);
      setInventory([]);
      setNotifications([]);
      setHospitals([]);
    }
  }, [user, refreshRequests, refreshInventory, refreshNotifications]);

  // ── Emergency Requests ─────────────────────────────────────────────────────

  const createRequest = useCallback(
    async (data: {
      bloodGroup: string;
      state: string;
      district: string;
      hospitalName: string;
      address: string;
      contactNumber: string;
      unitsRequired?: number;
    }) => {
      // Map frontend field `hospitalName` to backend field `hospitalName` (both supported)
      await dashboardService.createRequest({
        ...data,
        hospital: data.hospitalName,
      });
      await refreshRequests();
      await refreshNotifications();
    },
    [refreshRequests, refreshNotifications]
  );

  const updateRequestStatus = useCallback(
    async (id: string, action: "approved" | "rejected") => {
      if (action === "approved") {
        await dashboardService.approveRequest(id);
      } else {
        await dashboardService.rejectRequest(id);
      }
      await refreshRequests();
    },
    [refreshRequests]
  );

  // ── Blood Inventory ────────────────────────────────────────────────────────

  const updateInventory = useCallback(
    async (id: string, units: number) => {
      const updated = await dashboardService.updateInventory(id, units);
      setInventory((prev) =>
        prev.map((item) => (item._id === id ? updated : item))
      );
    },
    []
  );

  // ── Hospitals (localStorage only) ─────────────────────────────────────────

  const addHospital = useCallback((data: Omit<Hospital, "_id" | "createdAt">) => {
    const newHosp: Hospital = {
      _id: `hosp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...data,
    };
    setHospitals((prev) => {
      const updated = [newHosp, ...prev];
      saveHospitals(updated);
      return updated;
    });
  }, []);

  const updateHospital = useCallback((id: string, data: Partial<Omit<Hospital, "_id" | "createdAt">>) => {
    setHospitals((prev) => {
      const updated = prev.map((h) => (h._id === id ? { ...h, ...data } : h));
      saveHospitals(updated);
      return updated;
    });
  }, []);

  const deleteHospital = useCallback((id: string) => {
    setHospitals((prev) => {
      const updated = prev.filter((h) => h._id !== id);
      saveHospitals(updated);
      return updated;
    });
  }, []);

  // ── Notifications ──────────────────────────────────────────────────────────

  const markRead = useCallback(async (id: string) => {
    try {
      await dashboardService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.all(unread.map((n) => dashboardService.markRead(n._id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <DashboardContext.Provider
      value={{
        requests,
        loadingRequests,
        createRequest,
        updateRequestStatus,
        refreshRequests,
        inventory,
        loadingInventory,
        updateInventory,
        refreshInventory,
        hospitals,
        addHospital,
        updateHospital,
        deleteHospital,
        notifications,
        loadingNotifications,
        unreadCount,
        markAllRead,
        markRead,
        refreshNotifications,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextType => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
};
