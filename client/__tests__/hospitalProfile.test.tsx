import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProfilePage from "../app/dashboard/profile/page";
import HospitalProfileCard from "../components/dashboard/hospital/HospitalProfileCard";
import { dashboardService } from "../services/dashboardService";
import { useAuth, useToast } from "../context";

jest.mock("../services/dashboardService");
jest.mock("../context", () => ({
  useAuth: jest.fn(),
  useToast: jest.fn(),
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
    locale: "en",
  })),
}));

// Mock ProtectedRoute to render children directly
jest.mock("../components/dashboard/ProtectedRoute", () => {
  const actual = jest.requireActual("../components/dashboard/ProtectedRoute");
  return {
    __esModule: true,
    ...actual,
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

describe("BloodLink — Hospital Profile Section Test Suite", () => {
  const mockUpdateUser = jest.fn();
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  };

  const mockHospitalUser = {
    _id: "hosp_123",
    id: "hosp_123",
    name: "Dr. Arvind Rao",
    email: "apollo.mysore@bloodlink.dev",
    phone: "9876543210",
    role: "HOSPITAL" as const,
    approvalStatus: "APPROVED" as const,
    organizationName: "Apollo BGS Hospital Mysore",
    address: "Adhichunchanagiri Road, Kuvempunagar",
    registrationNumber: "HOSP-KA-2026-901",
    hospitalType: "Super-Specialty Hospital",
    operatingHours: "24/7 Emergency & Inpatient Services",
    emergencyContactPhone: "0821-2568888",
    isAvailableDonor: false,
    location: {
      state: "Karnataka",
      district: "Mysore",
      latitude: 12.2958,
      longitude: 76.6394,
    },
    createdAt: "2026-01-15T10:00:00.000Z",
    hospitalStats: {
      profileCompletion: 100,
      totalRequests: 8,
      activeRequests: 2,
      fulfilledRequests: 6,
      totalDonorsResponded: 14,
    },
  };

  const mockDonorUser = {
    _id: "user_123",
    id: "user_123",
    name: "Rahul Kumar",
    email: "rahul@bloodlink.dev",
    phone: "9876543211",
    role: "USER" as const,
    approvalStatus: "APPROVED" as const,
    bloodGroup: "O+",
    isAvailableDonor: true,
    location: {
      state: "Karnataka",
      district: "Mysore",
    },
    createdAt: "2026-02-01T10:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (dashboardService.getProfile as jest.Mock).mockResolvedValue(mockHospitalUser);
    (dashboardService.updateProfile as jest.Mock).mockResolvedValue({
      ...mockHospitalUser,
      organizationName: "Updated Apollo Hospital",
      phone: "9988776655",
    });
  });

  describe("1. Role-Based Profile Page Routing", () => {
    it("renders HospitalProfileCard when authenticated user has HOSPITAL role", async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockHospitalUser,
        updateUser: mockUpdateUser,
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByRole("region", { name: /Hospital Profile/i })).toBeInTheDocument();
        expect(screen.getByText("Apollo BGS Hospital Mysore")).toBeInTheDocument();
      });
    });

    it("renders donor ProfileCard when authenticated user has USER role", async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockDonorUser,
        updateUser: mockUpdateUser,
      });

      render(<ProfilePage />);

      await waitFor(() => {
        // User profile renders donor components, not hospital components
        expect(screen.queryByRole("region", { name: /Hospital Profile/i })).not.toBeInTheDocument();
        expect(screen.getByText("Rahul Kumar")).toBeInTheDocument();
      });
    });
  });

  describe("2. Hospital Profile Header & Information Cards", () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockHospitalUser,
        updateUser: mockUpdateUser,
      });
    });

    it("displays hospital name, HOSPITAL badge, Active status, and registration info", async () => {
      render(<HospitalProfileCard />);

      await waitFor(() => {
        expect(screen.getByText("Apollo BGS Hospital Mysore")).toBeInTheDocument();
        expect(screen.getByTestId("hospital-role-badge")).toBeInTheDocument();
        expect(screen.getByText("Active")).toBeInTheDocument();
        expect(screen.getByText(/Member since 2026/i)).toBeInTheDocument();
      });
    });

    it("displays official demo email, contact phone, address, and license ID", async () => {
      render(<HospitalProfileCard />);

      await waitFor(() => {
        expect(screen.getByText("apollo.mysore@bloodlink.dev")).toBeInTheDocument();
        expect(screen.getByText("9876543210")).toBeInTheDocument();
        expect(screen.getAllByText(/Mysore, Karnataka/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("HOSP-KA-2026-901").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("Super-Specialty Hospital").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("24/7 Emergency & Inpatient Services")).toBeInTheDocument();
      });
    });

    it("displays 'Not provided' gracefully when optional fields are missing", async () => {
      const minimalHospital = {
        ...mockHospitalUser,
        registrationNumber: undefined,
        address: undefined,
        emergencyContactPhone: undefined,
        hospitalType: undefined,
      };

      (useAuth as jest.Mock).mockReturnValue({
        user: minimalHospital,
        updateUser: mockUpdateUser,
      });
      (dashboardService.getProfile as jest.Mock).mockResolvedValue(minimalHospital);

      render(<HospitalProfileCard />);

      await waitFor(() => {
        expect(screen.getAllByText(/Not provided/i).length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("3. Hospital Overview Statistics", () => {
    it("displays accurate counts for blood requests and donors responded from backend data", async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockHospitalUser,
        updateUser: mockUpdateUser,
      });

      render(<HospitalProfileCard />);

      await waitFor(() => {
        expect(screen.getByText("8")).toBeInTheDocument(); // Total requests
        expect(screen.getByText("2")).toBeInTheDocument(); // Active requests
        expect(screen.getByText("14")).toBeInTheDocument(); // Donors responded
        expect(screen.getByText("100%")).toBeInTheDocument(); // Profile completion
      });
    });

    it("shows 'No records yet' when activity counts are zero", async () => {
      const emptyHospital = {
        ...mockHospitalUser,
        hospitalStats: {
          profileCompletion: 60,
          totalRequests: 0,
          activeRequests: 0,
          fulfilledRequests: 0,
          totalDonorsResponded: 0,
        },
      };

      (useAuth as jest.Mock).mockReturnValue({
        user: emptyHospital,
        updateUser: mockUpdateUser,
      });
      (dashboardService.getProfile as jest.Mock).mockResolvedValue(emptyHospital);

      render(<HospitalProfileCard />);

      await waitFor(() => {
        expect(screen.getAllByText("No records yet").length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe("4. Edit Profile & Persistence", () => {
    it("allows entering edit mode and persists updated hospital details", async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockHospitalUser,
        updateUser: mockUpdateUser,
      });

      render(<HospitalProfileCard />);

      // Click Edit Profile button
      const editBtn = screen.getByTestId("header-edit-profile-btn");
      fireEvent.click(editBtn);

      // Verify form is visible
      expect(screen.getByText("Edit Hospital Profile")).toBeInTheDocument();

      // Change hospital name and phone
      const orgInput = screen.getByPlaceholderText(/City General Hospital/i);
      const phoneInput = screen.getByPlaceholderText(/9876543210/i);

      fireEvent.change(orgInput, { target: { value: "Updated Apollo Hospital" } });
      fireEvent.change(phoneInput, { target: { value: "9988776655" } });

      // Save form
      const saveBtn = screen.getByRole("button", { name: /Save Hospital Profile/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(dashboardService.updateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationName: "Updated Apollo Hospital",
            phone: "9988776655",
          })
        );
        expect(mockUpdateUser).toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalledWith("Hospital profile updated successfully");
      });
    });

    it("rejects invalid phone numbers with validation error", async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockHospitalUser,
        updateUser: mockUpdateUser,
      });

      render(<HospitalProfileCard />);

      fireEvent.click(screen.getByTestId("header-edit-profile-btn"));

      const phoneInput = screen.getByPlaceholderText(/9876543210/i);
      fireEvent.change(phoneInput, { target: { value: "123" } }); // Invalid 3 digits

      fireEvent.click(screen.getByRole("button", { name: /Save Hospital Profile/i }));

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid 10-digit mobile phone number/i)).toBeInTheDocument();
        expect(dashboardService.updateProfile).not.toHaveBeenCalled();
      });
    });
  });

  describe("5. Hospital Quick Operations & Action Links", () => {
    it("renders valid links to hospital portal, blood requests, and nearby blood banks", () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockHospitalUser,
        updateUser: mockUpdateUser,
      });

      render(<HospitalProfileCard />);

      expect(screen.getByRole("link", { name: /Hospital Portal/i })).toHaveAttribute("href", "/dashboard/hospital");
      expect(screen.getByRole("link", { name: /Blood Requests/i })).toHaveAttribute("href", "/dashboard/requests");
      expect(screen.getByRole("link", { name: /Nearby Blood Banks/i })).toHaveAttribute("href", "/dashboard/nearby");
    });
  });
});
