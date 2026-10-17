import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import HospitalDashboardPage from "../app/dashboard/hospital/page";
import HospitalVerificationPage from "../app/dashboard/hospital/verification/page";
import { useAuth, useTranslation, useToast } from "../context";
import { dashboardService } from "../services/dashboardService";

jest.mock("../services/dashboardService");
jest.mock("../context", () => ({
  useAuth: jest.fn(),
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        nav_home: "Home",
        sidebar_overview: "Overview",
        sidebar_my_profile: "My Profile",
        sidebar_emergency_request: "Emergency Request",
        sidebar_emergency_requests: "Emergency Requests",
        sidebar_my_requests: "My Requests",
        sidebar_notifications: "Notifications",
        sidebar_nearby_banks: "Nearby Blood Banks",
        sidebar_settings: "Settings",
      };
      return map[key] || key;
    },
    locale: "en",
  })),
  useToast: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  usePathname: jest.fn(() => "/dashboard/hospital"),
}));

jest.mock("../components/dashboard/ProtectedRoute", () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

describe("BloodLink — Hospital Navigation & Certificate Verification Queue Update", () => {
  const mockHospitalUser = {
    _id: "hosp_123",
    id: "hosp_123",
    name: "Dr. Arvind Rao",
    email: "apollo.mysore@bloodlink.dev",
    phone: "9876543210",
    role: "HOSPITAL" as const,
    organizationName: "Apollo BGS Hospital Mysore",
  };

  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockHospitalUser,
      logout: jest.fn(),
    });
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (dashboardService.getHospitalCertificateQueue as jest.Mock).mockResolvedValue({
      stats: { total: 0, pending: 0, approved: 0, rejected: 0, needsClarification: 0 },
      submissions: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });
  });

  describe("1. Hospital Dashboard Sidebar Navigation Order & Items", () => {
    it("renders Hospital sidebar items in exact requested order and omits Emergency Request creation", () => {
      render(
        <DashboardSidebar
          collapsed={false}
          setCollapsed={jest.fn()}
          mobileOpen={false}
          setMobileOpen={jest.fn()}
        />
      );

      const navLinks = screen.getAllByRole("link");
      const labels = navLinks.map((link) => link.textContent?.trim() || "");

      // 1. Home
      expect(labels[0]).toBe("Home");
      expect(navLinks[0]).toHaveAttribute("href", "/");

      // 2. Hospital Profile
      expect(labels[1]).toBe("Hospital Profile");
      expect(navLinks[1]).toHaveAttribute("href", "/dashboard/profile");

      // 3. Certificate Verification Queue (placed immediately below Hospital Profile)
      expect(labels[2]).toBe("Certificate Verification Queue");
      expect(navLinks[2]).toHaveAttribute("href", "/dashboard/hospital");

      // 4. Other existing items
      expect(labels[3]).toBe("Emergency Requests");
      expect(navLinks[3]).toHaveAttribute("href", "/dashboard/requests");

      expect(labels[4]).toBe("Nearby Blood Banks");
      expect(navLinks[4]).toHaveAttribute("href", "/dashboard/nearby");

      expect(labels[5]).toBe("Settings");
      expect(navLinks[5]).toHaveAttribute("href", "/dashboard/settings");

      // Ensure Emergency Request creation link is completely absent from Hospital sidebar
      expect(labels).not.toContain("Emergency Request");
      const emergencyLinks = navLinks.filter(
        (l) => l.getAttribute("href") === "/dashboard/emergency"
      );
      expect(emergencyLinks).toHaveLength(0);
    });

    it("highlights Certificate Verification Queue when on /dashboard/hospital", () => {
      render(
        <DashboardSidebar
          collapsed={false}
          setCollapsed={jest.fn()}
          mobileOpen={false}
          setMobileOpen={jest.fn()}
        />
      );

      const queueLink = screen.getByText("Certificate Verification Queue").closest("a");
      expect(queueLink).toHaveClass("text-red-700");
    });
  });

  describe("2. Hospital Dashboard Page (/dashboard/hospital)", () => {
    it("does not render Create Emergency Alert button or Emergency Request creation card", async () => {
      render(<HospitalDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Certificate Verification Queue")).toBeInTheDocument();
      });

      // Emergency creation CTA button should be absent
      expect(screen.queryByText("Create Emergency Alert")).not.toBeInTheDocument();

      // Quick operations should have Emergency Requests and Nearby Blood Banks, but not Emergency Request creation
      expect(screen.getByText("Emergency Requests")).toBeInTheDocument();
      expect(screen.getByText("Nearby Blood Banks")).toBeInTheDocument();

      const links = screen.getAllByRole("link");
      const emergencyLinks = links.filter(
        (l) => l.getAttribute("href") === "/dashboard/emergency"
      );
      expect(emergencyLinks).toHaveLength(0);
    });

    it("renders the Certificate Verification Queue card with required header and badge", async () => {
      render(<HospitalDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Certificate Verification Queue")).toBeInTheDocument();
      });

      expect(screen.getByText("DEMO VERIFICATION WORKFLOW")).toBeInTheDocument();
      expect(
        screen.getByText(/Review and verify medical certificates issued by this hospital/i)
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
    });
  });

  describe("3. Dedicated Hospital Verification Route (/dashboard/hospital/verification)", () => {
    it("renders Certificate Verification Queue within hospital layout on dedicated route", async () => {
      render(<HospitalVerificationPage />);

      await waitFor(() => {
        expect(screen.getByText("Certificate Verification Queue")).toBeInTheDocument();
      });

      expect(screen.getByText("DEMO VERIFICATION WORKFLOW")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/search by donor name, certificate ID, or hospital.../i)
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^All$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Pending$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Approved$/i })).toBeInTheDocument();
    });
  });
});
