import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ActiveRequestsCard from "../components/dashboard/user/ActiveRequestsCard";
import { dashboardService } from "../services/dashboardService";
import { useAuth, useDashboard, useTranslation } from "../context";
import { EmergencyRequest, DonorCertificateEligibility } from "../types";

jest.mock("../services/dashboardService");
jest.mock("../context", () => ({
  useAuth: jest.fn(),
  useDashboard: jest.fn(),
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        requests_tab_my_requests: "My Requests",
        requests_tab_donate_requests: "Donate Requests",
        requests_accept_btn: "Accept",
        requests_accepting: "Accepting...",
        requests_clear_btn: "Clear",
      };
      return map[key] || key;
    },
    locale: "en",
  })),
}));

describe("BloodLink — Donor Request Restrictions Frontend Test Suite (Task 6)", () => {
  const mockUser = {
    _id: "donor_user_01",
    id: "donor_user_01",
    name: "Aakash Patel",
    email: "aakash@bloodlink.dev",
    role: "USER" as const,
    bloodGroup: "O+",
  };

  const sampleEmergencyRequest: EmergencyRequest = {
    _id: "req_emergency_999",
    requestBy: {
      _id: "requester_user_02",
      name: "Suresh Rao",
      email: "suresh@bloodlink.dev",
      phone: "9876543210",
    },
    bloodGroup: "O+",
    hospital: "Apollo BGS Mysore",
    district: "Mysore",
    state: "Karnataka",
    address: "Kuvempunagar",
    contactNumber: "9876543210",
    status: "Pending",
    unitsRequired: 2,
    acceptedBy: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockAcceptRequest = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });

    (useDashboard as jest.Mock).mockReturnValue({
      requests: [sampleEmergencyRequest],
      loadingRequests: false,
      refreshRequests: jest.fn(),
      cancelRequest: jest.fn(),
      acceptRequest: mockAcceptRequest,
      reportDonation: jest.fn(),
      confirmDonation: jest.fn(),
      withdrawAcceptance: jest.fn(),
    });

    (dashboardService.getRequestDismissals as jest.Mock).mockResolvedValue({
      my: [],
      donate: [],
    });
  });

  it("1. shows verification warning banner and disables Accept button when certificate is NOT_SUBMITTED", async () => {
    const eligibilityNotSubmitted: DonorCertificateEligibility = {
      isEligible: false,
      status: "NOT_SUBMITTED",
      reason:
        "A verified medical certificate is required to accept blood donation requests. Please submit your medical certificate for demo verification.",
    };
    (dashboardService.getCertificateEligibility as jest.Mock).mockResolvedValue(
      eligibilityNotSubmitted
    );

    render(<ActiveRequestsCard onNewRequest={jest.fn()} />);

    // Switch to Donate Requests tab
    const donateTabBtn = screen.getByRole("button", { name: /Donate Requests/i });
    fireEvent.click(donateTabBtn);

    await waitFor(() => {
      // Expect warning banner
      expect(screen.getByTestId("verification-required-warning")).toBeInTheDocument();
      expect(
        screen.getByText(/Certificate Verification Required to Accept Requests/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/verified medical certificate is required/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /Submit Certificate →/i })
      ).toBeInTheDocument();

      // Expect disabled Accept button
      const acceptBtn = screen.getByRole("button", { name: "Accept" });
      expect(acceptBtn).toBeDisabled();
      expect(acceptBtn).toHaveAttribute(
        "title",
        expect.stringMatching(/verified medical certificate is required/i)
      );
    });
  });

  it("2. shows review progress notice and disables Accept button when certificate is PENDING", async () => {
    const eligibilityPending: DonorCertificateEligibility = {
      isEligible: false,
      status: "PENDING",
      reason:
        "Your medical certificate is currently pending demo verification. You can accept donation requests once it has been reviewed and approved.",
    };
    (dashboardService.getCertificateEligibility as jest.Mock).mockResolvedValue(
      eligibilityPending
    );

    render(<ActiveRequestsCard onNewRequest={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Donate Requests/i }));

    await waitFor(() => {
      expect(screen.getByTestId("verification-required-warning")).toBeInTheDocument();
      expect(
        screen.getByText(/pending demo verification/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /View Verification Status →/i })
      ).toBeInTheDocument();

      const acceptBtn = screen.getByRole("button", { name: "Accept" });
      expect(acceptBtn).toBeDisabled();
    });
  });

  it("3. shows clarification needed and disables Accept button when status is NEEDS_CLARIFICATION", async () => {
    const eligibilityClarif: DonorCertificateEligibility = {
      isEligible: false,
      status: "NEEDS_CLARIFICATION",
      reason:
        "Your medical certificate requires clarification from the reviewer. Please review and update your submission.",
    };
    (dashboardService.getCertificateEligibility as jest.Mock).mockResolvedValue(
      eligibilityClarif
    );

    render(<ActiveRequestsCard onNewRequest={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Donate Requests/i }));

    await waitFor(() => {
      expect(screen.getByTestId("verification-required-warning")).toBeInTheDocument();
      expect(
        screen.getByText(/requires clarification from the reviewer/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /Update Certificate →/i })
      ).toBeInTheDocument();

      const acceptBtn = screen.getByRole("button", { name: "Accept" });
      expect(acceptBtn).toBeDisabled();
    });
  });

  it("4. hides verification warning banner and enables Accept button when status is APPROVED", async () => {
    const eligibilityApproved: DonorCertificateEligibility = {
      isEligible: true,
      status: "APPROVED",
      reason: "Medical certificate verified. Eligible to accept blood donation requests.",
    };
    (dashboardService.getCertificateEligibility as jest.Mock).mockResolvedValue(
      eligibilityApproved
    );

    render(<ActiveRequestsCard onNewRequest={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Donate Requests/i }));

    await waitFor(() => {
      // Banner should NOT be in document
      expect(screen.queryByTestId("verification-required-warning")).not.toBeInTheDocument();

      // Accept button should be enabled
      const acceptBtn = screen.getByRole("button", { name: "Accept" });
      expect(acceptBtn).not.toBeDisabled();
      expect(acceptBtn).not.toHaveAttribute("title");
    });

    // Opening acceptance confirmation modal
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getAllByText("Apollo BGS Mysore").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("5. renders backend rejection error if an unverified user attempts confirmation", async () => {
    const eligibilityApproved: DonorCertificateEligibility = {
      isEligible: true,
      status: "APPROVED",
      reason: "Medical certificate verified.",
    };
    (dashboardService.getCertificateEligibility as jest.Mock).mockResolvedValue(
      eligibilityApproved
    );

    // Mock server rejection (403 backend guard)
    mockAcceptRequest.mockRejectedValueOnce({
      response: {
        data: {
          success: false,
          message:
            "A verified medical certificate is required to accept blood donation requests. Please submit your medical certificate for demo verification.",
        },
      },
    });

    render(<ActiveRequestsCard onNewRequest={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Donate Requests/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Accept" })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    // Modal is open, click confirm
    const confirmBtn = screen.getByRole("button", { name: /donor_acceptance_confirm_btn/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockAcceptRequest).toHaveBeenCalledWith("req_emergency_999");
      // Error from backend is shown
      expect(
        screen.getAllByText(
          /verified medical certificate is required to accept blood donation requests/i
        ).length
      ).toBeGreaterThanOrEqual(1);
    });
  });
});
