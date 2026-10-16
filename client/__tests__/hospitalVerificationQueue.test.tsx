import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import HospitalVerificationQueue from "../components/dashboard/hospital/HospitalVerificationQueue";
import { dashboardService } from "../services/dashboardService";
import { useAuth, useToast } from "../context";
import { HospitalQueueResponse, HospitalQueueSubmission } from "../types";

jest.mock("../services/dashboardService");
jest.mock("../context", () => ({
  useAuth: jest.fn(),
  useToast: jest.fn(),
}));

describe("BloodLink — Hospital Certificate Review Dashboard Test Suite (Task 3)", () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  };

  const mockHospitalUser = {
    _id: "hosp_apollo_01",
    id: "hosp_apollo_01",
    name: "Dr. Suresh Kumar",
    organizationName: "Apollo BGS Hospital Mysore",
    email: "apollo@bloodlink.dev",
    role: "HOSPITAL" as const,
  };

  const sampleSubmissions: HospitalQueueSubmission[] = [
    {
      id: "cert_sub_01",
      referenceId: "CERT-SUB001",
      donor: {
        id: "user_01",
        name: "Ramesh Sharma",
        bloodGroup: "O+",
      },
      issuingHospital: "Apollo BGS Hospital Mysore",
      issuingHospitalId: "hosp_apollo_01",
      issueDate: "2026-01-15T00:00:00.000Z",
      expiryDate: "2027-01-15T00:00:00.000Z",
      status: "PENDING",
      submittedAt: "2026-02-01T10:00:00.000Z",
      file: {
        originalName: "medical_cert_ramesh.pdf",
        mimeType: "application/pdf",
        size: 1024 * 256,
      },
      history: [
        {
          previousStatus: "NOT_SUBMITTED",
          newStatus: "PENDING",
          reviewedBy: "user_01",
          reviewerName: "Ramesh Sharma",
          action: "APPROVE",
          timestamp: "2026-02-01T10:00:00.000Z",
        },
      ],
    },
    {
      id: "cert_sub_02",
      referenceId: "CERT-SUB002",
      donor: {
        id: "user_02",
        name: "Priya Patel",
        bloodGroup: "A+",
      },
      issuingHospital: "Apollo BGS Hospital Mysore",
      issuingHospitalId: "hosp_apollo_01",
      issueDate: "2026-01-20T00:00:00.000Z",
      status: "APPROVED",
      submittedAt: "2026-02-02T11:00:00.000Z",
      reviewedAt: "2026-02-03T09:00:00.000Z",
      file: {
        originalName: "priya_blood_report.pdf",
        mimeType: "application/pdf",
        size: 1024 * 512,
      },
      history: [],
    },
    {
      id: "cert_sub_03",
      referenceId: "CERT-SUB003",
      donor: {
        id: "user_03",
        name: "Anil Verma",
        bloodGroup: "B-",
      },
      issuingHospital: "Apollo BGS Hospital Mysore",
      issuingHospitalId: "hosp_apollo_01",
      issueDate: "2026-01-25T00:00:00.000Z",
      status: "NEEDS_INFORMATION",
      submittedAt: "2026-02-05T14:30:00.000Z",
      feedbackMessage: "Hospital seal is partially cut off. Please re-upload.",
      file: {
        originalName: "anil_cert_scan.png",
        mimeType: "image/png",
        size: 1024 * 128,
      },
      history: [],
    },
  ];

  const mockQueueResponse: HospitalQueueResponse = {
    stats: {
      total: 3,
      pending: 1,
      approved: 1,
      rejected: 0,
      needsClarification: 1,
    },
    submissions: sampleSubmissions,
    pagination: {
      total: 3,
      page: 1,
      limit: 50,
      totalPages: 1,
    },
  };

  const emptyQueueResponse: HospitalQueueResponse = {
    stats: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      needsClarification: 0,
    },
    submissions: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockHospitalUser });
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  describe("1. Rendering & Statistics", () => {
    it("renders loading indicator and then stats cards with accurate database counts", async () => {
      (dashboardService.getHospitalCertificateQueue as jest.Mock).mockResolvedValue(mockQueueResponse);

      render(<HospitalVerificationQueue />);

      expect(screen.getByText(/loading hospital review queue/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId("stat-total")).toHaveTextContent("3");
      });

      // Stats labels
      expect(screen.getByText("Total Assigned")).toBeInTheDocument();
      expect(screen.getAllByText("Pending Review").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Approved").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Clarification").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Rejected").length).toBeGreaterThanOrEqual(1);

      // Counts displayed via data-testid
      expect(screen.getByTestId("stat-pending")).toHaveTextContent("1");
      expect(screen.getByTestId("stat-approved")).toHaveTextContent("1");
      expect(screen.getByTestId("stat-clarification")).toHaveTextContent("1");
      expect(screen.getByTestId("stat-rejected")).toHaveTextContent("0");
    });

    it("renders a clear empty state when no submissions are assigned to this hospital", async () => {
      (dashboardService.getHospitalCertificateQueue as jest.Mock).mockResolvedValue(emptyQueueResponse);

      render(<HospitalVerificationQueue />);

      await waitFor(() => {
        expect(screen.getByText("No Submissions Found")).toBeInTheDocument();
      });

      expect(
        screen.getByText(/no donor certificate submissions assigned to this hospital/i)
      ).toBeInTheDocument();
    });
  });

  describe("2. Submissions Table & Filtering", () => {
    beforeEach(() => {
      (dashboardService.getHospitalCertificateQueue as jest.Mock).mockResolvedValue(mockQueueResponse);
    });

    it("displays assigned submissions with safe donor details and valid action buttons", async () => {
      render(<HospitalVerificationQueue />);

      await waitFor(() => {
        expect(screen.getByText("Ramesh Sharma")).toBeInTheDocument();
      });

      expect(screen.getByText("Priya Patel")).toBeInTheDocument();
      expect(screen.getByText("Anil Verma")).toBeInTheDocument();

      // Blood group badges
      expect(screen.getByText("O+")).toBeInTheDocument();
      expect(screen.getByText("A+")).toBeInTheDocument();
      expect(screen.getByText("B-")).toBeInTheDocument();

      // View details action buttons exist
      const actionButtons = screen.getAllByRole("button", { name: /review/i });
      expect(actionButtons.length).toBeGreaterThanOrEqual(3);
    });

    it("filters submissions client-side via search input", async () => {
      render(<HospitalVerificationQueue />);

      await waitFor(() => {
        expect(screen.getByText("Ramesh Sharma")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by donor/i);
      fireEvent.change(searchInput, { target: { value: "Priya" } });

      await waitFor(() => {
        expect(screen.queryByText("Ramesh Sharma")).not.toBeInTheDocument();
      });

      expect(screen.getByText("Priya Patel")).toBeInTheDocument();
      expect(screen.queryByText("Anil Verma")).not.toBeInTheDocument();
    });

    it("filters submissions by clicking status tabs", async () => {
      render(<HospitalVerificationQueue />);

      await waitFor(() => {
        expect(screen.getByText("Ramesh Sharma")).toBeInTheDocument();
      });

      // Filter by Approved tab button
      const approvedTab = screen.getByRole("button", { name: /^Approved$/i });
      fireEvent.click(approvedTab);

      await waitFor(() => {
        expect(screen.queryByText("Ramesh Sharma")).not.toBeInTheDocument();
      });

      expect(screen.getByText("Priya Patel")).toBeInTheDocument();
      expect(screen.queryByText("Anil Verma")).not.toBeInTheDocument();
    });
  });

  describe("3. Certificate Review Modal & Action Workflows", () => {
    beforeEach(() => {
      (dashboardService.getHospitalCertificateQueue as jest.Mock).mockResolvedValue(mockQueueResponse);
    });

    it("opens review modal when clicking Review on a pending submission and shows demo disclaimer", async () => {
      render(<HospitalVerificationQueue />);

      await waitFor(() => {
        expect(screen.getByText("Ramesh Sharma")).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole("button", { name: /review/i });
      fireEvent.click(reviewButtons[0]);

      expect(screen.getByText("Certificate Verification Review")).toBeInTheDocument();
      expect(screen.getAllByText(/demo verification workflow/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("medical_cert_ramesh.pdf")).toBeInTheDocument();
    });

    it("successfully submits an APPROVE decision", async () => {
      (dashboardService.reviewCertificate as jest.Mock).mockResolvedValue({
        certificate: { ...sampleSubmissions[0], status: "APPROVED" },
      });

      render(<HospitalVerificationQueue />);

      await waitFor(() => {
        expect(screen.getByText("Ramesh Sharma")).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole("button", { name: /review/i });
      fireEvent.click(reviewButtons[0]);

      // Select Approve action
      const approveActionTab = screen.getByRole("button", { name: /approve certificate/i });
      fireEvent.click(approveActionTab);

      // Confirm decision
      const confirmButton = screen.getByRole("button", { name: /confirm decision/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(dashboardService.reviewCertificate).toHaveBeenCalledWith("cert_sub_01", {
          action: "APPROVE",
          reason: undefined,
        });
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringMatching(/certificate approved successfully/i)
      );
    });

    it("requires a reason when REJECT action is chosen and enforces client validation", async () => {
      render(<HospitalVerificationQueue />);

      await waitFor(() => {
        expect(screen.getByText("Ramesh Sharma")).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole("button", { name: /review/i });
      fireEvent.click(reviewButtons[0]);

      // Select Reject action
      const rejectActionTab = screen.getByRole("button", { name: /reject certificate/i });
      fireEvent.click(rejectActionTab);

      // Try to submit with empty reason
      const confirmButton = screen.getByRole("button", { name: /confirm decision/i });
      fireEvent.click(confirmButton);

      expect(
        screen.getByText(/please specify a clear institutional reason for rejection/i)
      ).toBeInTheDocument();
      expect(dashboardService.reviewCertificate).not.toHaveBeenCalled();

      // Enter a reason and submit
      const reasonInput = screen.getByLabelText(/specific institutional rejection reason/i);
      fireEvent.change(reasonInput, {
        target: { value: "Hospital seal does not match registered sample." },
      });

      (dashboardService.reviewCertificate as jest.Mock).mockResolvedValue({
        certificate: { ...sampleSubmissions[0], status: "REJECTED" },
      });

      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(dashboardService.reviewCertificate).toHaveBeenCalledWith("cert_sub_01", {
          action: "REJECT",
          reason: "Hospital seal does not match registered sample.",
        });
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringMatching(/certificate marked as rejected/i)
      );
    });

    it("requires clarification notes when REQUEST_CLARIFICATION is chosen", async () => {
      render(<HospitalVerificationQueue />);

      await waitFor(() => {
        expect(screen.getByText("Ramesh Sharma")).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole("button", { name: /review/i });
      fireEvent.click(reviewButtons[0]);

      // Select Clarification action
      const clarifyActionTab = screen.getByRole("button", { name: /request clarification/i });
      fireEvent.click(clarifyActionTab);

      // Try to submit empty
      const confirmButton = screen.getByRole("button", { name: /confirm decision/i });
      fireEvent.click(confirmButton);

      expect(
        screen.getByText(/please specify the instructions or clarification required from the donor/i)
      ).toBeInTheDocument();
      expect(dashboardService.reviewCertificate).not.toHaveBeenCalled();

      // Fill clarification explanation
      const feedbackInput = screen.getByLabelText(/instructions \/ clarification required/i);
      fireEvent.change(feedbackInput, {
        target: { value: "Please provide the back page containing the physician signature." },
      });

      (dashboardService.reviewCertificate as jest.Mock).mockResolvedValue({
        certificate: { ...sampleSubmissions[0], status: "NEEDS_INFORMATION" },
      });

      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(dashboardService.reviewCertificate).toHaveBeenCalledWith("cert_sub_01", {
          action: "REQUEST_CLARIFICATION",
          reason: "Please provide the back page containing the physician signature.",
        });
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringMatching(/clarification request sent to donor/i)
      );
    });

    it("handles secure document download trigger", async () => {
      const mockCreateObjectURL = jest.fn(() => "blob:http://localhost/test-blob");
      const mockRevokeObjectURL = jest.fn();
      window.URL.createObjectURL = mockCreateObjectURL;
      window.URL.revokeObjectURL = mockRevokeObjectURL;

      const mockBlob = new Blob(["fake pdf content"], { type: "application/pdf" });
      (dashboardService.downloadCertificateById as jest.Mock).mockResolvedValue(mockBlob);

      render(<HospitalVerificationQueue />);

      await waitFor(() => {
        expect(screen.getByText("Ramesh Sharma")).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole("button", { name: /review/i });
      fireEvent.click(reviewButtons[0]);

      const downloadButton = screen.getByRole("button", { name: /view document/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(dashboardService.downloadCertificateById).toHaveBeenCalledWith("cert_sub_01");
      });

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });
});
