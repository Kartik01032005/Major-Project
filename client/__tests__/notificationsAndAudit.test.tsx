import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import NotificationsPanel from "../components/dashboard/user/NotificationsPanel";
import { useDashboard, useTranslation } from "../context";
import { Notification } from "../types";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("../context", () => ({
  useDashboard: jest.fn(),
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        notifications_title: "Notifications",
        notifications_new: "New",
        notifications_mark_all: "Mark All Read",
        notifications_empty_title: "No Notifications Yet",
        notifications_empty_sub: "Updates will appear here.",
        notifications_unread: "Unread",
        common_just_now: "just now",
      };
      return map[key] || key;
    },
    locale: "en",
  })),
}));

describe("BloodLink — Notifications Panel Frontend Test Suite (Task 7)", () => {
  const mockMarkRead = jest.fn();
  const mockMarkAllRead = jest.fn();
  const mockDeleteNotification = jest.fn();

  const sampleNotifications: Notification[] = [
    {
      _id: "notif_001",
      receiverId: "user_123",
      type: "Emergency",
      title: "🚨 Emergency Blood Alert",
      message: "Urgent: O+ blood is required at Apollo BGS Mysore.",
      link: "/dashboard/requests",
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "notif_002",
      receiverId: "user_123",
      type: "Approval",
      title: "Medical Certificate Verified",
      message: "Your medical certificate has been accepted and verified.",
      link: "/dashboard/certificate",
      isRead: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("1. renders notifications list with unread counter and badges", () => {
    (useDashboard as jest.Mock).mockReturnValue({
      notifications: sampleNotifications,
      unreadCount: 1,
      markRead: mockMarkRead,
      markAllRead: mockMarkAllRead,
      deleteNotification: mockDeleteNotification,
    });

    render(<NotificationsPanel />);

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("1 New")).toBeInTheDocument();
    expect(screen.getByText("🚨 Emergency Blood Alert")).toBeInTheDocument();
    expect(screen.getByText("Medical Certificate Verified")).toBeInTheDocument();
  });

  it("2. marks unread notification as read and navigates to link on click", async () => {
    (useDashboard as jest.Mock).mockReturnValue({
      notifications: sampleNotifications,
      unreadCount: 1,
      markRead: mockMarkRead,
      markAllRead: mockMarkAllRead,
      deleteNotification: mockDeleteNotification,
    });

    render(<NotificationsPanel />);

    const firstNotif = screen.getByText("🚨 Emergency Blood Alert");
    fireEvent.click(firstNotif);

    await waitFor(() => {
      expect(mockMarkRead).toHaveBeenCalledWith("notif_001");
      expect(mockPush).toHaveBeenCalledWith("/dashboard/requests");
    });
  });

  it("3. navigates on clicking already read notification without redundant markRead", async () => {
    (useDashboard as jest.Mock).mockReturnValue({
      notifications: sampleNotifications,
      unreadCount: 1,
      markRead: mockMarkRead,
      markAllRead: mockMarkAllRead,
      deleteNotification: mockDeleteNotification,
    });

    render(<NotificationsPanel />);

    const secondNotif = screen.getByText("Medical Certificate Verified");
    fireEvent.click(secondNotif);

    await waitFor(() => {
      expect(mockMarkRead).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/dashboard/certificate");
    });
  });

  it("4. calls deleteNotification when delete button is clicked", async () => {
    (useDashboard as jest.Mock).mockReturnValue({
      notifications: sampleNotifications,
      unreadCount: 1,
      markRead: mockMarkRead,
      markAllRead: mockMarkAllRead,
      deleteNotification: mockDeleteNotification,
    });

    render(<NotificationsPanel />);

    const deleteButtons = screen.getAllByTitle("Delete notification");
    expect(deleteButtons.length).toBe(2);

    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDeleteNotification).toHaveBeenCalledWith("notif_001");
    });
  });

  it("5. calls markAllRead when mark all button is clicked", async () => {
    (useDashboard as jest.Mock).mockReturnValue({
      notifications: sampleNotifications,
      unreadCount: 1,
      markRead: mockMarkRead,
      markAllRead: mockMarkAllRead,
      deleteNotification: mockDeleteNotification,
    });

    render(<NotificationsPanel />);

    const markAllBtn = screen.getByRole("button", { name: /Mark All Read/i });
    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(mockMarkAllRead).toHaveBeenCalled();
    });
  });

  it("6. renders empty state when there are no notifications", () => {
    (useDashboard as jest.Mock).mockReturnValue({
      notifications: [],
      unreadCount: 0,
      markRead: mockMarkRead,
      markAllRead: mockMarkAllRead,
      deleteNotification: mockDeleteNotification,
    });

    render(<NotificationsPanel />);

    expect(screen.getByText("No Notifications Yet")).toBeInTheDocument();
    expect(screen.getByText("Updates will appear here.")).toBeInTheDocument();
  });
});
