import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import MedicalCertificatePage from "../app/dashboard/certificate/page";
import DashboardTopbar from "../components/dashboard/DashboardTopbar";
import { useAuth, useDashboard, useTranslation, useToast } from "../context";
import { dashboardService } from "../services/dashboardService";

jest.mock("../services/dashboardService");
jest.mock("../context", () => ({
  useAuth: jest.fn(),
  useDashboard: jest.fn(),
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        nav_home: "Home",
        sidebar_overview: "Overview",
        sidebar_my_profile: "My Profile",
        sidebar_emergency_request: "Emergency Request",
        sidebar_my_requests: "My Requests",
        sidebar_nearby_banks: "Nearby Banks",
        sidebar_settings: "Settings",
        topbar_overview: "Overview",
        topbar_my_profile: "My Profile",
        topbar_my_requests: "My Requests",
      };
      return map[key] || key;
    },
    locale: "en",
  })),
  useToast: jest.fn(() => ({
    toast: {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    },
  })),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  usePathname: jest.fn(() => "/dashboard/certificate"),
}));

describe("BloodLink — User Medical Certificate Sidebar & Dedicated Page", () => {
  const mockUser = {
    _id: "user_donor_1",
    id: "user_donor_1",
    name: "Rahul C Naik",
    email: "rahulcnaik2005@gmail.com",
    role: "USER" as const,
    bloodGroup: "O+",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: jest.fn(),
      loading: false,
    });
    (useDashboard as jest.Mock).mockReturnValue({
      notifications: [],
      unreadCount: 0,
      markAllRead: jest.fn(),
      markRead: jest.fn(),
      requests: [],
      refreshRequests: jest.fn(),
      loadingRequests: false,
    });
    (dashboardService.getHospitals as jest.Mock).mockResolvedValue([]);
    (dashboardService.getMyCertificate as jest.Mock).mockResolvedValue({
      id: "cert_101",
      status: "APPROVED",
      issuingHospital: "Manju hospital",
      issueDate: "2026-10-15T00:00:00.000Z",
      expiryDate: "2027-01-15T00:00:00.000Z",
      fileUrl: "https://example.com/rahul_med_cert.png",
      fileName: "rahul med cert.png",
      fileSize: 2024100,
      createdAt: "2026-10-17T00:00:00.000Z",
    });
  });

  it("1. User Dashboard Sidebar includes Medical Certificate and removes Notifications", () => {
    render(
      <DashboardSidebar
        collapsed={false}
        setCollapsed={jest.fn()}
        mobileOpen={false}
        setMobileOpen={jest.fn()}
      />
    );

    const links = screen.getAllByRole("link");
    const labels = links.map((l) => l.textContent?.trim() || "");

    // Must contain Medical Certificate pointing to /dashboard/certificate
    expect(labels).toContain("Medical Certificate");
    const certLink = links.find((l) => l.getAttribute("href") === "/dashboard/certificate");
    expect(certLink).toBeDefined();

    // Notifications must NOT be present in the sidebar
    expect(labels).not.toContain("Notifications");
    const notifLink = links.find((l) => l.getAttribute("href") === "/dashboard/notifications");
    expect(notifLink).toBeUndefined();
  });

  it("2. Medical Certificate Page (/dashboard/certificate) renders only the certificate card", async () => {
    render(<MedicalCertificatePage />);

    expect((await screen.findAllByText("Medical Donor Certificate")).length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText("Certificate Approved")).toBeInTheDocument();
    expect(await screen.findByText("Manju hospital")).toBeInTheDocument();

    // Must NOT render profile statistics, edit profile form, or request cards
    expect(screen.queryByText("Edit Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Active Blood Requests")).not.toBeInTheDocument();
    expect(screen.queryByText("Hospital Profile")).not.toBeInTheDocument();
  });

  it("3. DashboardTopbar shows Medical Certificate title when on /dashboard/certificate", () => {
    render(<DashboardTopbar onMenuClick={jest.fn()} />);
    expect(screen.getByText("Medical Certificate")).toBeInTheDocument();
  });
});
