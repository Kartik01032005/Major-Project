import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SettingsPage from "../app/dashboard/settings/page";
import { dashboardService } from "../services/dashboardService";
import { useAuth, useLanguage } from "../context";

jest.mock("../services/dashboardService");
jest.mock("../context", () => ({
  useAuth: jest.fn(),
  useLanguage: jest.fn(),
}));

jest.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    setTheme: jest.fn(),
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock ProtectedRoute to directly render children
jest.mock("../components/dashboard/ProtectedRoute", () => {
  return function MockProtectedRoute({ children }: { children: React.ReactNode }) {
    return <div data-testid="protected-route">{children}</div>;
  };
});

describe("Settings Section Test Suite", () => {
  const mockUpdateUser = jest.fn();

  const mockUser = {
    _id: "user_test_123",
    name: "Dr. Ananya Rao",
    email: "ananya@example.com",
    phone: "9876543210",
    bloodGroup: "A+",
    role: "user",
    isAvailableDonor: true,
    location: {
      state: "Karnataka",
      district: "Bangalore",
      latitude: 12.9716,
      longitude: 77.5946,
    },
    donorStats: {
      donationsCount: 5,
      lastDonationDate: "2026-05-15T00:00:00.000Z",
      responseRate: 95,
      eligibleRequestsCount: 20,
      respondedRequestsCount: 19,
    },
    settings: {
      donor: { pauseDonorRequests: false },
      notifications: {
        emergencyAlerts: true,
        nearbyRequests: true,
        bloodBankUpdates: false,
        smsNotifications: true,
        whatsappNotifications: false,
      },
      privacy: {
        locationSharing: true,
        profileVisibility: "matching" as const,
        phoneNumberPrivacy: "on_request" as const,
      },
      emergency: {
        alertRadiusKm: 25 as const,
        emergencyContact: {
          name: "Dr. Suresh Rao",
          phone: "9876543211",
          relationship: "Spouse",
        },
      },
      security: {
        twoFactorAuth: false,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      updateUser: mockUpdateUser,
      logout: jest.fn(),
    });

    (useLanguage as jest.Mock).mockReturnValue({
      locale: "en",
      setLocale: jest.fn(),
    });

    (dashboardService.getSettings as jest.Mock).mockResolvedValue(mockUser.settings);
    (dashboardService.updateSettings as jest.Mock).mockResolvedValue(mockUser.settings);
    (dashboardService.updateProfile as jest.Mock).mockResolvedValue(mockUser);
  });

  test("renders all 8 main settings sections with headings", async () => {
    render(<SettingsPage />);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Donor")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Privacy & Location")).toBeInTheDocument();
    expect(screen.getByText("Emergency")).toBeInTheDocument();
    expect(screen.getByText("Security")).toBeInTheDocument();
    expect(screen.getByText("App")).toBeInTheDocument();
    expect(screen.getByText("Account Management")).toBeInTheDocument();
  });

  test("displays verified donations and does not ask for blood group", async () => {
    render(<SettingsPage />);

    expect(screen.queryByText("Official biological blood type for matching")).not.toBeInTheDocument();
    expect(screen.getByText("5 fulfilled")).toBeInTheDocument();
  });

  test("ensures Emergency Blood Requests toggle is disabled and displays mandatory service reason", async () => {
    render(<SettingsPage />);

    const emergencyText = screen.getByText("Emergency Blood Requests");
    expect(emergencyText).toBeInTheDocument();

    const disabledReason = screen.getByText(
      "Critical emergency notifications cannot be disabled because they may be required to provide the requested service."
    );
    expect(disabledReason).toBeInTheDocument();

    const emergencyToggle = screen.getByLabelText("Emergency Blood Requests");
    expect(emergencyToggle).toBeDisabled();
    expect(emergencyToggle).toHaveAttribute("aria-checked", "true");
  });

  test("toggles donor availability and calls updateProfile", async () => {
    render(<SettingsPage />);

    const availabilityToggle = screen.getByLabelText("Donor Availability");
    expect(availabilityToggle).toBeInTheDocument();
    expect(availabilityToggle).toHaveAttribute("aria-checked", "true");

    fireEvent.click(availabilityToggle);

    await waitFor(() => {
      expect(dashboardService.updateProfile).toHaveBeenCalledWith({
        isAvailableDonor: false,
      });
    });
  });

  test("toggles pause donor requests and calls updateSettings", async () => {
    render(<SettingsPage />);

    // Wait for initial getSettings to load
    await waitFor(() => {
      expect(dashboardService.getSettings).toHaveBeenCalled();
    });

    const pauseToggle = screen.getByLabelText("Pause Donor Requests");
    expect(pauseToggle).toBeInTheDocument();
    expect(pauseToggle).toHaveAttribute("aria-checked", "false");

    fireEvent.click(pauseToggle);

    await waitFor(() => {
      expect(dashboardService.updateSettings).toHaveBeenCalledWith({
        donor: expect.objectContaining({ pauseDonorRequests: true }),
      });
    });
  });

  test("opens Edit Profile modal when Edit Profile row is clicked", async () => {
    render(<SettingsPage />);

    const editProfileRow = screen.getByText("Edit Profile");
    fireEvent.click(editProfileRow);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Your Full Name")).toBeInTheDocument();
    });
  });

  test("opens Delete Account modal and enforces typing DELETE before allowing deletion", async () => {
    render(<SettingsPage />);

    const deleteRow = screen.getByText("Delete BloodLink Account");
    fireEvent.click(deleteRow);

    await waitFor(() => {
      expect(screen.getByText("Permanently Delete")).toBeInTheDocument();
    });

    const submitBtn = screen.getByTestId("confirm-delete-btn");
    expect(submitBtn).toBeDisabled();

    const input = screen.getByPlaceholderText("DELETE");
    fireEvent.change(input, { target: { value: "DELETE" } });

    expect(submitBtn).not.toBeDisabled();
  });
});
