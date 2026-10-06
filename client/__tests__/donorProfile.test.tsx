import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DonorProfileCard from "../components/dashboard/user/DonorProfileCard";
import { dashboardService } from "../services/dashboardService";
import { useAuth, useTranslation } from "../context";

jest.mock("../services/dashboardService");
jest.mock("../context", () => ({
  useAuth: jest.fn(),
  useTranslation: jest.fn(),
}));

describe("Task #6 — DonorProfileCard Frontend Component Test Suite", () => {
  const mockUpdateUser = jest.fn();

  const mockDonorUser = {
    _id: "user_donor_123",
    name: "Ramesh Sharma",
    email: "ramesh@example.com",
    phone: "9876543210",
    bloodGroup: "O+",
    role: "user",
    isAvailableDonor: true,
    location: {
      state: "Karnataka",
      district: "Mysore",
      latitude: 12.2958,
      longitude: 76.6394,
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    donorStats: {
      donationsCount: 4,
      lastDonationDate: "2026-08-12T00:00:00.000Z",
      responseRate: 87,
      eligibleRequestsCount: 15,
      respondedRequestsCount: 13,
    },
  };

  const defaultMockTranslations: Record<string, string> = {
    donor_profile_title: "Donor Profile",
    donor_profile_subtitle: "Your verified blood donation activity and status",
    donor_profile_blood_group: "Blood Group",
    donor_profile_not_provided: "Not provided",
    donor_profile_availability: "Availability",
    donor_profile_available: "Available",
    donor_profile_unavailable: "Temporarily unavailable",
    donor_profile_unspecified: "Not specified",
    donor_profile_location: "Location",
    donor_profile_location_approx: "Approx. {dist} away",
    donor_profile_location_unavailable: "Location unavailable",
    donor_profile_donations: "Donations",
    donor_profile_donations_count_suffix: "verified donations",
    donor_profile_donations_unavailable: "Donation history unavailable",
    donor_profile_donations_empty: "No donation history available",
    donor_profile_last_donation: "Last Donation",
    donor_profile_last_donation_unavailable: "Not available",
    donor_profile_response_rate: "Response Rate",
    donor_profile_not_enough_data: "Not enough data",
    donor_profile_loading: "Loading donor profile…",
    donor_profile_error: "Unable to load profile. Please try again.",
    donor_profile_edit: "Edit Profile",
    donor_profile_save: "Save Changes",
    donor_profile_cancel: "Cancel",
    donor_profile_saving: "Saving…",
    donor_profile_saved: "Profile updated successfully",
    donor_profile_eligibility_title: "Donation Eligibility",
    donor_profile_eligibility_notice: "General medical guidance only. Professional clinical screening is required before every blood donation.",
    donor_profile_eligibility_link: "View Official Eligibility Criteria",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string) => defaultMockTranslations[key] || key,
      locale: "en",
      setLocale: jest.fn(),
    });

    (useAuth as jest.Mock).mockReturnValue({
      user: mockDonorUser,
      updateUser: mockUpdateUser,
    });

    (dashboardService.getProfile as jest.Mock).mockResolvedValue(mockDonorUser);
    (dashboardService.updateProfile as jest.Mock).mockResolvedValue(mockDonorUser);
  });

  it("1. renders complete donor profile with availability status", async () => {
    render(<DonorProfileCard />);

    expect(screen.getByText("Donor Profile")).toBeInTheDocument();
    expect(screen.getByText("Your verified blood donation activity and status")).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("Mysore, Karnataka")).toBeInTheDocument();
  });

  it("2. displays genuine verified donation count and last donation date from backend data", async () => {
    render(<DonorProfileCard />);

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("verified donations")).toBeInTheDocument();
    expect(screen.getByText("12 Aug 2026")).toBeInTheDocument();
  });

  it("3. displays response rate percentage when historical response data is available", async () => {
    render(<DonorProfileCard />);

    expect(screen.getByText("87%")).toBeInTheDocument();
  });

  it("5. displays 'Not available' when no completed verified donations exist, avoiding fake dates", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        ...mockDonorUser,
        donorStats: {
          donationsCount: 0,
          lastDonationDate: null,
          responseRate: null,
          eligibleRequestsCount: 0,
          respondedRequestsCount: 0,
        },
      },
      updateUser: mockUpdateUser,
    });
    (dashboardService.getProfile as jest.Mock).mockResolvedValue({
      ...mockDonorUser,
      donorStats: {
        donationsCount: 0,
        lastDonationDate: null,
        responseRate: null,
        eligibleRequestsCount: 0,
        respondedRequestsCount: 0,
      },
    });

    render(<DonorProfileCard />);

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Not available")).toBeInTheDocument();
    expect(screen.getByText("Not enough data")).toBeInTheDocument();
  });

  it("6. provides separate informational donation eligibility section and link", () => {
    render(<DonorProfileCard />);

    expect(
      screen.getByText(/General medical guidance only. Professional clinical screening is required/i)
    ).toBeInTheDocument();
    const eligibilityLink = screen.getByRole("link", { name: /View Official Eligibility Criteria/i });
    expect(eligibilityLink).toHaveAttribute("href", "/#eligibility");
  });

  it("7. toggles edit mode and saves profile updates to backend safely", async () => {
    render(<DonorProfileCard />);

    const editBtn = screen.getByRole("button", { name: /Edit Profile/i });
    fireEvent.click(editBtn);

    // Form inputs appear
    expect(screen.getByPlaceholderText(/e\.g\. Mysore/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save Changes/i })).toBeInTheDocument();

    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(dashboardService.updateProfile).toHaveBeenCalled();
    });
  });

  it("8. handles fetch error safely without crashing or displaying fake numbers", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { ...mockDonorUser, donorStats: undefined },
      updateUser: mockUpdateUser,
    });
    (dashboardService.getProfile as jest.Mock).mockRejectedValue(new Error("Network Error"));

    render(<DonorProfileCard />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load profile. Please try again.")).toBeInTheDocument();
    });
  });
});
