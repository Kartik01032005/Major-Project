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
import { socketService } from "@/services/socketService";



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
  loadingHospitals: boolean;
  addHospital: (data: Omit<Hospital, "_id" | "createdAt">) => Promise<void>;
  updateHospital: (id: string, data: Partial<Omit<Hospital, "_id" | "createdAt">>) => Promise<void>;
  deleteHospital: (id: string) => Promise<void>;
  refreshHospitals: () => Promise<void>;

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
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // ── Fetch Helpers ──────────────────────────────────────────────────────────

  const refreshHospitals = useCallback(async () => {
    if (!user) return;
    setLoadingHospitals(true);
    try {
      const data = await dashboardService.getHospitals();
      setHospitals(data);
    } catch (err) {
      console.error("Failed to load hospitals:", err);
    } finally {
      setLoadingHospitals(false);
    }
  }, [user]);

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

// ── Seed on Login & Real-time Socket Sync ────────────────────────────────────
  useEffect(() => {
    if (user) {
      const userId = user._id || (user as any).id;
      refreshHospitals();
      refreshRequests();
      refreshNotifications();
      if (user.role === "admin") {
        refreshInventory();
      }

      // Connect Socket.IO for real-time alerts & request updates
      const socket = socketService.connect(userId);

      const handleRequestCreated = () => {
        refreshRequests();
      };

      const handleRequestUpdated = () => {
        refreshRequests();
      };

      const handleRequestDeleted = () => {
        refreshRequests();
      };

      const handleNotification = () => {
        refreshNotifications();
      };

      socket.on("request_created", handleRequestCreated);
      socket.on("request_updated", handleRequestUpdated);
      socket.on("request_deleted", handleRequestDeleted);
      socket.on("notification", handleNotification);

      return () => {
        socket.off("request_created", handleRequestCreated);
        socket.off("request_updated", handleRequestUpdated);
        socket.off("request_deleted", handleRequestDeleted);
        socket.off("notification", handleNotification);
      };
    } else {
      // Clear state on logout
      setRequests([]);
      setInventory([]);
      setNotifications([]);
      setHospitals([]);
      socketService.disconnect();
    }
  }, [user, refreshHospitals, refreshRequests, refreshInventory, refreshNotifications]);

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

  const addHospital = useCallback(async (data: Omit<Hospital, "_id" | "createdAt">) => {
    try {
      const newHosp = await dashboardService.addHospital(data);
      setHospitals((prev) => [newHosp, ...prev]);
    } catch (err) {
      console.error("Failed to add hospital:", err);
    }
  }, []);

  const updateHospital = useCallback(async (id: string, data: Partial<Omit<Hospital, "_id" | "createdAt">>) => {
    try {
      const updated = await dashboardService.updateHospital(id, data);
      setHospitals((prev) => prev.map((h) => (h._id === id ? updated : h)));
    } catch (err) {
      console.error("Failed to update hospital:", err);
    }
  }, []);

  const deleteHospital = useCallback(async (id: string) => {
    try {
      await dashboardService.deleteHospital(id);
      setHospitals((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      console.error("Failed to delete hospital:", err);
    }
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
        loadingHospitals,
        addHospital,
        updateHospital,
        deleteHospital,
        refreshHospitals,
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
