"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  EmergencyRequest,
  BloodInventoryItem,
  Hospital,
  Notification,
  InventoryUploadLogItem,
  AvailabilityThresholds,
  UploadSummary,
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
    hospitalLatitude?: number;
    hospitalLongitude?: number;
    hospitalAddress?: string;
    hospitalOsmId?: string;
  }) => Promise<void>;
  updateRequestStatus: (id: string, status: "approved" | "rejected") => Promise<void>;
  cancelRequest: (id: string) => Promise<void>;
  acceptRequest: (id: string) => Promise<void>;
  reportDonation: (id: string) => Promise<void>;
  confirmDonation: (id: string) => Promise<void>;
  withdrawAcceptance: (id: string, reason: string) => Promise<void>;
  refreshRequests: () => Promise<void>;

  // Blood Inventory
  inventory: BloodInventoryItem[];
  loadingInventory: boolean;
  uploadHistory: InventoryUploadLogItem[];
  thresholds: AvailabilityThresholds | null;
  updateInventory: (id: string, units: number) => Promise<void>;
  adjustInventory: (id: string, delta: number) => Promise<void>;
  syncInventoryFromUpload: (id: string) => Promise<void>;
  uploadInventoryFile: (file: File, mode: "merge" | "replace") => Promise<UploadSummary>;
  refreshInventory: () => Promise<void>;
  refreshUploadHistory: () => Promise<void>;
  updateThresholds: (thresholds: Partial<AvailabilityThresholds>) => Promise<void>;

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
  const [uploadHistory, setUploadHistory] = useState<InventoryUploadLogItem[]>([]);
  const [thresholds, setThresholds] = useState<AvailabilityThresholds | null>(null);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const currentUserIdRef = useRef<string | null>(null);

  // ── Fetch Helpers ──────────────────────────────────────────────────────────

  const refreshUploadHistory = useCallback(async () => {
    if (!user || user.role !== "admin") {
      setUploadHistory([]);
      return;
    }
    try {
      const logs = await dashboardService.getUploadHistory();
      setUploadHistory(Array.isArray(logs) ? logs : []);
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number } };
      if (errorObj?.response?.status === 403 || errorObj?.response?.status === 401) {
        setUploadHistory([]);
      } else {
        console.error("Failed to load upload history:", err);
      }
    }
  }, [user]);

  const refreshThresholds = useCallback(async () => {
    if (!user || user.role !== "admin") {
      setThresholds(null);
      return;
    }
    try {
      const data = await dashboardService.getThresholds();
      setThresholds(data || null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number } };
      if (errorObj?.response?.status === 403 || errorObj?.response?.status === 401) {
        setThresholds(null);
      } else {
        console.error("Failed to load thresholds:", err);
      }
    }
  }, [user]);

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
    if (!user || user.role !== "admin") {
      setInventory([]);
      return;
    }
    setLoadingInventory(true);
    try {
      const data = await dashboardService.getInventory();
      setInventory(Array.isArray(data) ? data : []);
      refreshThresholds();
      refreshUploadHistory();
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number } };
      if (errorObj?.response?.status === 403 || errorObj?.response?.status === 401) {
        setInventory([]);
      } else {
        console.error("Failed to load inventory:", err);
      }
    } finally {
      setLoadingInventory(false);
    }
  }, [user, refreshThresholds, refreshUploadHistory]);

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
    if (!user) {
      currentUserIdRef.current = null;
      socketService.disconnect();
      const timer = setTimeout(() => {
        setRequests([]);
        setInventory([]);
        setNotifications([]);
        setHospitals([]);
      }, 0);
      return () => clearTimeout(timer);
    }

    if (currentUserIdRef.current && currentUserIdRef.current !== user._id) {
      setRequests([]);
      setInventory([]);
      setNotifications([]);
      setHospitals([]);
    }
    currentUserIdRef.current = user._id;

    const userId = user._id;

    const initDashboardData = async () => {
      await refreshHospitals();
      await refreshRequests();
      await refreshNotifications();
      if (user?.role === "admin") {
        await refreshInventory();
      } else {
        setInventory([]);
        setUploadHistory([]);
        setThresholds(null);
      }
    };

    initDashboardData();

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
    socket.on("request_expired", handleRequestUpdated);
    socket.on("request_deleted", handleRequestDeleted);
    socket.on("notification", handleNotification);

    return () => {
      socket.off("request_created", handleRequestCreated);
      socket.off("request_updated", handleRequestUpdated);
      socket.off("request_expired", handleRequestUpdated);
      socket.off("request_deleted", handleRequestDeleted);
      socket.off("notification", handleNotification);
    };
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
      hospitalLatitude?: number;
      hospitalLongitude?: number;
      hospitalAddress?: string;
      hospitalOsmId?: string;
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

  const cancelRequest = useCallback(
    async (id: string) => {
      await dashboardService.cancelRequest(id);
      await refreshRequests();
    },
    [refreshRequests]
  );

  const acceptRequest = useCallback(
    async (id: string) => {
      await dashboardService.acceptRequest(id);
      await refreshRequests();
    },
    [refreshRequests]
  );

  const reportDonation = useCallback(
    async (id: string) => {
      await dashboardService.reportDonation(id);
      await refreshRequests();
    },
    [refreshRequests]
  );

  const confirmDonation = useCallback(
    async (id: string) => {
      await dashboardService.confirmDonation(id);
      await refreshRequests();
    },
    [refreshRequests]
  );
  const withdrawAcceptance = useCallback(
    async (id: string, reason: string) => {
      await dashboardService.withdrawAcceptance(id, reason);
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

  const adjustInventory = useCallback(
    async (id: string, delta: number) => {
      const updated = await dashboardService.adjustInventory(id, delta);
      setInventory((prev) => prev.map((item) => (item._id === id ? updated : item)));
    },
    []
  );

  const syncInventoryFromUpload = useCallback(
    async (id: string) => {
      const updated = await dashboardService.syncInventoryFromUpload(id);
      setInventory((prev) => prev.map((item) => (item._id === id ? updated : item)));
    },
    []
  );

  const uploadInventoryFile = useCallback(
    async (file: File, mode: "merge" | "replace") => {
      const res = await dashboardService.uploadInventoryFile(file, mode);
      if (res.inventory) {
        setInventory(res.inventory);
      }
      refreshUploadHistory();
      refreshNotifications();
      return res.summary;
    },
    [refreshUploadHistory, refreshNotifications]
  );

  const updateThresholds = useCallback(
    async (data: Partial<AvailabilityThresholds>) => {
      const updated = await dashboardService.updateThresholds(data);
      setThresholds(updated);
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
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number } };
      // If 403 or 404, the notification no longer belongs to this session; remove it from local state
      if (errorObj?.response?.status === 403 || errorObj?.response?.status === 404) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      } else {
        console.error("Failed to mark notification as read:", err);
      }
    }
  }, []);

  const markAllRead = useCallback(async () => {
    // Optimistically mark all notifications in UI as read
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await dashboardService.markAllRead();
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number } };
      if (errorObj?.response?.status === 403 || errorObj?.response?.status === 401) {
        refreshNotifications();
      } else {
        console.error("Failed to mark all notifications as read:", err);
      }
    }
  }, [refreshNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <DashboardContext.Provider
      value={{
        requests,
        loadingRequests,
        createRequest,
        updateRequestStatus,
        cancelRequest,
        acceptRequest,
        reportDonation,
        confirmDonation,
        withdrawAcceptance,
        refreshRequests,
        inventory,
        loadingInventory,
        uploadHistory,
        thresholds,
        updateInventory,
        adjustInventory,
        syncInventoryFromUpload,
        uploadInventoryFile,
        refreshInventory,
        refreshUploadHistory,
        updateThresholds,
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
