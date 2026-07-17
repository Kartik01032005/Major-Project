"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  EmergencyRequest,
  BloodInventoryItem,
  Hospital,
  Notification,
  BloodGroup,
  RequestStatus,
} from "@/types";
import { useAuth } from "@/context/AuthContext";

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const KEYS = {
  requests: "bloodlink_emergency_requests",
  inventory: "bloodlink_blood_inventory",
  hospitals: "bloodlink_hospitals",
  notifications: "bloodlink_notifications",
} as const;

// ─── Default Seed Data ────────────────────────────────────────────────────────
const DEFAULT_INVENTORY: BloodInventoryItem[] = (
  ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as BloodGroup[]
).map((bg, i) => ({
  _id: `inv-${bg.replace("+", "pos").replace("-", "neg")}`,
  bloodGroup: bg,
  units: [12, 5, 20, 3, 8, 2, 25, 10][i],
  lastUpdated: new Date().toISOString(),
}));

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

const DEFAULT_REQUESTS: EmergencyRequest[] = [
  {
    _id: "req-1",
    userId: "demo-donor-id",
    userName: "Rahul Kumar",
    bloodGroup: "O+",
    state: "Karnataka",
    district: "Mysore",
    hospitalName: "KMC Hospital",
    address: "Dr. B. R. Ambedkar Circle, Mysore",
    contactNumber: "9876543210",
    status: "pending",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    _id: "notif-1",
    userId: "demo-donor-id",
    type: "general",
    title: "Welcome to BloodLink!",
    message: "Your account is active. You can now create emergency blood requests.",
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    _id: "notif-2",
    userId: "demo-donor-id",
    type: "request_created",
    title: "Emergency Request Submitted",
    message: "Your request for O+ blood at KMC Hospital is pending review.",
    read: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Context Types ────────────────────────────────────────────────────────────
interface DashboardContextType {
  // Emergency Requests
  requests: EmergencyRequest[];
  createRequest: (data: Omit<EmergencyRequest, "_id" | "userId" | "userName" | "status" | "createdAt" | "updatedAt">) => void;
  updateRequestStatus: (id: string, status: RequestStatus) => void;

  // Blood Inventory
  inventory: BloodInventoryItem[];
  updateInventory: (id: string, units: number) => void;

  // Hospitals
  hospitals: Hospital[];
  addHospital: (data: Omit<Hospital, "_id" | "createdAt">) => void;
  updateHospital: (id: string, data: Partial<Omit<Hospital, "_id" | "createdAt">>) => void;
  deleteHospital: (id: string) => void;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// ─── Helper ───────────────────────────────────────────────────────────────────
function loadOrSeed<T>(key: string, defaultData: T[]): T[] {
  if (typeof window === "undefined") return defaultData;
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored) as T[];
  localStorage.setItem(key, JSON.stringify(defaultData));
  return defaultData;
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [inventory, setInventory] = useState<BloodInventoryItem[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Seed on mount
  useEffect(() => {
    setRequests(loadOrSeed(KEYS.requests, DEFAULT_REQUESTS));
    setInventory(loadOrSeed(KEYS.inventory, DEFAULT_INVENTORY));
    setHospitals(loadOrSeed(KEYS.hospitals, DEFAULT_HOSPITALS));
    setNotifications(loadOrSeed(KEYS.notifications, DEFAULT_NOTIFICATIONS));
  }, []);

  // ── Emergency Requests ────────────────────────────────────────────────────

  const createRequest = useCallback(
    (data: Omit<EmergencyRequest, "_id" | "userId" | "userName" | "status" | "createdAt" | "updatedAt">) => {
      const newReq: EmergencyRequest = {
        _id: `req-${Date.now()}`,
        userId: user?._id ?? "unknown",
        userName: user?.name ?? "Unknown User",
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      };
      const newNotif: Notification = {
        _id: `notif-${Date.now()}`,
        userId: user?._id ?? "unknown",
        type: "request_created",
        title: "Emergency Request Submitted",
        message: `Your request for ${data.bloodGroup} blood at ${data.hospitalName} is pending review.`,
        read: false,
        createdAt: new Date().toISOString(),
      };

      setRequests((prev) => {
        const updated = [newReq, ...prev];
        save(KEYS.requests, updated);
        return updated;
      });
      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        save(KEYS.notifications, updated);
        return updated;
      });
    },
    [user]
  );

  const updateRequestStatus = useCallback((id: string, status: RequestStatus) => {
    setRequests((prev) => {
      const updated = prev.map((r) =>
        r._id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
      );
      save(KEYS.requests, updated);

      // Add approval/rejection notification
      const req = updated.find((r) => r._id === id);
      if (req) {
        const notif: Notification = {
          _id: `notif-${Date.now()}`,
          userId: req.userId,
          type: status === "approved" ? "request_approved" : "request_rejected",
          title: status === "approved" ? "Request Approved ✅" : "Request Rejected ❌",
          message:
            status === "approved"
              ? `Your blood request at ${req.hospitalName} has been approved.`
              : `Your blood request at ${req.hospitalName} has been rejected.`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        setNotifications((prev2) => {
          const n = [notif, ...prev2];
          save(KEYS.notifications, n);
          return n;
        });
      }

      return updated;
    });
  }, []);

  // ── Blood Inventory ───────────────────────────────────────────────────────

  const updateInventory = useCallback((id: string, units: number) => {
    setInventory((prev) => {
      const updated = prev.map((item) =>
        item._id === id
          ? { ...item, units: Math.max(0, units), lastUpdated: new Date().toISOString() }
          : item
      );
      save(KEYS.inventory, updated);
      return updated;
    });
  }, []);

  // ── Hospitals ────────────────────────────────────────────────────────────

  const addHospital = useCallback((data: Omit<Hospital, "_id" | "createdAt">) => {
    const newHosp: Hospital = {
      _id: `hosp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...data,
    };
    setHospitals((prev) => {
      const updated = [newHosp, ...prev];
      save(KEYS.hospitals, updated);
      return updated;
    });
  }, []);

  const updateHospital = useCallback((id: string, data: Partial<Omit<Hospital, "_id" | "createdAt">>) => {
    setHospitals((prev) => {
      const updated = prev.map((h) => (h._id === id ? { ...h, ...data } : h));
      save(KEYS.hospitals, updated);
      return updated;
    });
  }, []);

  const deleteHospital = useCallback((id: string) => {
    setHospitals((prev) => {
      const updated = prev.filter((h) => h._id !== id);
      save(KEYS.hospitals, updated);
      return updated;
    });
  }, []);

  // ── Notifications ─────────────────────────────────────────────────────────

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      save(KEYS.notifications, updated);
      return updated;
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n._id === id ? { ...n, read: true } : n));
      save(KEYS.notifications, updated);
      return updated;
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DashboardContext.Provider
      value={{
        requests,
        createRequest,
        updateRequestStatus,
        inventory,
        updateInventory,
        hospitals,
        addHospital,
        updateHospital,
        deleteHospital,
        notifications,
        unreadCount,
        markAllRead,
        markRead,
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
