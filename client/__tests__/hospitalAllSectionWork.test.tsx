import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import ProfilePage from "../app/dashboard/profile/page";
import HospitalDashboardPage from "../app/dashboard/hospital/page";
import HospitalVerificationPage from "../app/dashboard/hospital/verification/page";
import MyRequestsPage from "../app/dashboard/requests/page";
import SettingsPage from "../app/dashboard/settings/page";
import DashboardNearbyPage from "../app/dashboard/nearby/page";
import { useAuth, useTranslation, useToast, useDashboard } from "../context";
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
        sidebar_my_requests: "My Requests",
        sidebar_notifications: "Notifications",
        sidebar_nearby_banks: "Nearby Banks",
        sidebar_settings: "Settings",
        requests_title: "Active Blood Requests",
        requests_tab_my_requests: "My Requests",
        requests_tab_donate_requests: "Donate Blood",
        requests_new: "+ New Request",
        requests_clear_btn: "Clear",
      };
      return map[key] || key;
    },
    locale: "en",
  })),
  useToast: jest.fn(),
  useDashboard: jest.fn(),
  useLanguage: jest.fn(() => ({ locale: "en", setLocale: jest.fn() })),
}));

jest.mock("next-themes", () => ({
  useTheme: jest.fn(() => ({
    resolvedTheme: "dark",
    setTheme: jest.fn(),
  })),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  usePathname: jest.fn(() => "/dashboard/hospital"),
}));

// Mock leaflet map container to avoid canvas/DOM issues in JSDOM
jest.mock("../components/map/MapContainer", () => {
  return function MockMapContainer() {
    return <div data-testid="mock-map-container">Map Container</div>;
  };
});

describe("BloodLink — Hospital Section All Links Functional", () => {
  const mockHospitalUser = {
    _id: "hosp_999",
    id: "hosp_999",
    name: "Dr. Arvind Rao",
    email: "apollo.mysore@bloodlink.dev",
    phone: "9876543210",
    role: "HOSPITAL" as const,
    organizationName: "Apollo BGS Hospital Mysore",
    address: "Adichunchanagiri Road, Kuvempunagar",
    location: { state: "Karnataka", district: "Mysore" },
    registrationNumber: "HOSP-KA-MYS-0042",
    hospitalType: "Tertiary Care Hospital",
    operatingHours: "24/7 Emergency",
    emergencyContactPhone: "0821-2568888",
    hospitalStats: {
      totalVerifications: 14,
      pendingVerifications: 2,
      approvedVerifications: 11,
      rejectedVerifications: 1,
    },
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
      updateUser: jest.fn(),
      logout: jest.fn(),
      loading: false,
    });
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (useDashboard as jest.Mock).mockReturnValue({
      requests: [
        {
          _id: "req_hosp_1",
          hospital: "Apollo BGS Hospital Mysore",
          bloodGroup: "O+",
          district: "Mysore",
          state: "Karnataka",
          contactNumber: "9876543210",
          status: "Pending",
          createdAt: new Date().toISOString(),
          requestBy: "user_citizen_1",
        },
      ],
      refreshRequests: jest.fn(),
      loadingRequests: false,
      cancelRequest: jest.fn(),
      acceptRequest: jest.fn(),
      reportDonation: jest.fn(),
      confirmDonation: jest.fn(),
      withdrawAcceptance: jest.fn(),
    });
    (dashboardService.getProfile as jest.Mock).mockResolvedValue(mockHospitalUser);
    (dashboardService.getHospitalCertificateQueue as jest.Mock).mockResolvedValue({
      stats: { total: 1, pending: 1, approved: 0, rejected: 0, needsClarification: 0 },
      submissions: [
        {
          _id: "sub_1",
          certificateId: "CERT-2026-001",
          donor: { _id: "donor_1", name: "Rahul Sharma", email: "rahul@example.com" },
          issuingHospital: { name: "Apollo BGS Hospital Mysore" },
          status: "PENDING",
          createdAt: new Date().toISOString(),
          originalFileName: "certificate.pdf",
        },
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    (dashboardService.getRequestDismissals as jest.Mock).mockResolvedValue({ my: [], donate: [] });
    (dashboardService.getCertificateEligibility as jest.Mock).mockResolvedValue({ isEligible: true, status: "APPROVED" });
    (dashboardService.getSettings as jest.Mock).mockResolvedValue({
      donor: { pauseDonorRequests: false },
      notifications: { emergencyAlerts: true, communityUpdates: true, quietHours: false },
      privacy: { profileVisibility: "PUBLIC" },
      emergency: { alertRadiusKm: 25 },
      security: { twoFactorEnabled: false },
    });
  });

  it("1. Sidebar displays all 6 Hospital items in correct order without Emergency Request creation", () => {
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

    expect(labels[0]).toBe("Home");
    expect(links[0]).toHaveAttribute("href", "/");

    expect(labels[1]).toBe("Hospital Profile");
    expect(links[1]).toHaveAttribute("href", "/dashboard/profile");

    expect(labels[2]).toBe("Certificate Verification Queue");
    expect(links[2]).toHaveAttribute("href", "/dashboard/hospital");

    expect(labels[3]).toBe("My Requests");
    expect(links[3]).toHaveAttribute("href", "/dashboard/requests");

    expect(labels[4]).toBe("Nearby Banks");
    expect(links[4]).toHaveAttribute("href", "/dashboard/nearby");

    expect(labels[5]).toBe("Settings");
    expect(links[5]).toHaveAttribute("href", "/dashboard/settings");

    // Must NOT contain Emergency Request
    expect(labels).not.toContain("Emergency Request");
  });

  it("2. Hospital Profile page (/dashboard/profile) renders HospitalProfileCard for hospital accounts", async () => {
    render(<ProfilePage />);

    expect(await screen.findByText("Apollo BGS Hospital Mysore")).toBeInTheDocument();
    expect(screen.getAllByText("HOSP-KA-MYS-0042").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Tertiary Care Hospital").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("24/7 Emergency").length).toBeGreaterThanOrEqual(1);
  });

  it("3. Certificate Verification Queue (/dashboard/hospital & /dashboard/hospital/verification) renders queue properly", async () => {
    render(<HospitalDashboardPage />);

    expect(await screen.findByText("Certificate Verification Queue")).toBeInTheDocument();
    expect(screen.getByText("DEMO VERIFICATION WORKFLOW")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by donor name, certificate ID, or hospital/i)).toBeInTheDocument();
    expect(await screen.findByText("Rahul Sharma")).toBeInTheDocument();
  });

  it("4. My Requests page (/dashboard/requests) allows Hospital accounts and omits + New Request creation", async () => {
    render(<MyRequestsPage />);

    // Header and active requests load
    expect(await screen.findByText("Active Blood Requests")).toBeInTheDocument();
    // The hospital request for Apollo BGS is listed
    expect(await screen.findByText("Apollo BGS Hospital Mysore")).toBeInTheDocument();
    // Emergency Request creation button MUST NOT be present
    expect(screen.queryByText("+ New Request")).not.toBeInTheDocument();
  });

  it("5. Nearby Banks page (/dashboard/nearby) renders facilities navigation", async () => {
    render(<DashboardNearbyPage />);

    // Nearby facilities renders header and controls
    expect(await screen.findByText("nearby_page_title")).toBeInTheDocument();
    expect(screen.getAllByText(/nearby_filter_bloodbanks/i).length).toBeGreaterThanOrEqual(1);
  });

  it("6. Settings page (/dashboard/settings) allows Hospital accounts and loads settings sections", async () => {
    render(<SettingsPage />);

    // Account Section
    expect(await screen.findByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    expect(screen.getByText("Phone & Email")).toBeInTheDocument();
    expect(screen.getByText("Change Password")).toBeInTheDocument();

    // Notifications & Security
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Emergency Blood Requests")).toBeInTheDocument();
  });
});
