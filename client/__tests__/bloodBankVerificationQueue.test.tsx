import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import BloodBankVerificationQueue from "../components/dashboard/admin/BloodBankVerificationQueue";
import { dashboardService } from "../services/dashboardService";
import { useToast } from "../context";
import { BloodBankQueueResponse, BloodBankQueueSubmission } from "../types";

jest.mock("../services/dashboardService");
jest.mock("../context", () => ({
  useToast: jest.fn(),
}));

describe("BloodLink — Blood Bank Certificate Verification Workflow Test Suite (Task 4)", () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  };

  const sampleSubmissions: BloodBankQueueSubmission[] = [
    {
      id: "bb_sub_01",
      referenceId: "CERT-BB001",
      donor: {
        id: "user_01",
        name: "Arjun Verma",
        bloodGroup: "O+",
      },
      issuingHospital: "St. Philomena Hospital Mysore",
      issuingHospitalContact: {
        hospitalName: "St. Philomena Hospital Mysore",
        phone: "+91-821-2565000",
        email: "contact@stphilomenamysore.org",
        address: "Ashoka Road, St Philomena Church Circle",
        district: "Mysore",
        state: "Karnataka",
        medicalRecordsDesk: "Counter 4, Ground Floor",
      },
      assignedBloodBank: "Mysore City Central Blood Bank",
      issueDate: "2026-01-15T00:00:00.000Z",
      expiryDate: "2026-07-15T00:00:00.000Z",
      status: "PENDING",
      submittedAt: "2026-02-01T10:00:00.000Z",
      file: {
        originalName: "arjun_medical_certificate.pdf",
        mimeType: "application/pdf",
        size: 1024 * 320,
      },
      contactAttempts: [
        {
          contactDate: "2026-02-02T11:00:00.000Z",
          contactMethod: "Phone Call",
          notes: "Spoke with Dr. Anjali at Medical Records desk. Awaiting confirmation callback.",
          outcome: "Hospital Contacted",
          staffName: "Dr. Ramesh BB",
        },
      ],
      history: [
        {
          previousStatus: "PENDING",
          newStatus: "PENDING",
          reviewedBy: "bb_user_01",
          reviewerName: "Dr. Ramesh BB",
          reviewerBloodBank: "Mysore City Central Blood Bank",
          reviewerRole: "BLOOD_BANK",
          action: "CONTACT_ATTEMPT",
          contactNotes: "Phone Call: Spoke with Dr. Anjali",
          timestamp: "2026-02-02T11:00:00.000Z",
        },
      ],
    },
    {
      id: "bb_sub_02",
      referenceId: "CERT-BB002",
      donor: {
        id: "user_02",
        name: "Kavya Sharma",
        bloodGroup: "B+",
      },
      issuingHospital: "Columbia Asia Hospital Mysore",
      issuingHospitalContact: {
        hospitalName: "Columbia Asia Hospital Mysore",
        phone: "+91-821-3989898",
      },
      assignedBloodBank: "Mysore City Central Blood Bank",
      issueDate: "2026-01-20T00:00:00.000Z",
      status: "APPROVED",
      submittedAt: "2026-02-03T09:00:00.000Z",
      reviewedAt: "2026-02-04T14:00:00.000Z",
      file: {
        originalName: "kavya_cert.pdf",
        mimeType: "application/pdf",
        size: 1024 * 512,
      },
      history: [],
    },
  ];

  const sampleQueueResponse: BloodBankQueueResponse = {
    stats: {
      total: 2,
      pending: 1,
      approved: 1,
      rejected: 0,
      needsClarification: 0,
    },
    submissions: sampleSubmissions,
    pagination: {
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (dashboardService.getBloodBankCertificateQueue as jest.Mock).mockResolvedValue(
      sampleQueueResponse
    );
  });

  it("renders queue header, demo disclaimer banner, and stat cards with actual database counts", async () => {
    render(<BloodBankVerificationQueue />);

    await waitFor(() => {
      expect(
        screen.getByText(/External Certificate Verification Queue/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Task 4 Demo/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Fictional College Demo Workflow/i)
      ).toBeInTheDocument();
    });

    // Check stats cards
    expect(screen.getByText("Total Assigned")).toBeInTheDocument();
    expect(screen.getAllByText("Pending Review").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getAllByText("Clarification").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Unable to Verify")).toBeInTheDocument();
  });

  it("displays assigned submissions table with reference ID, donor name, and issuing hospital", async () => {
    render(<BloodBankVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText("CERT-BB001")).toBeInTheDocument();
      expect(screen.getByText("Arjun Verma")).toBeInTheDocument();
      expect(screen.getByText("St. Philomena Hospital Mysore")).toBeInTheDocument();
      expect(screen.getAllByText("Pending Review").length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText("CERT-BB002")).toBeInTheDocument();
      expect(screen.getByText("Kavya Sharma")).toBeInTheDocument();
    });
  });

  it("displays a clear empty state when no submissions are assigned", async () => {
    (dashboardService.getBloodBankCertificateQueue as jest.Mock).mockResolvedValue({
      stats: { total: 0, pending: 0, approved: 0, rejected: 0, needsClarification: 0 },
      submissions: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });

    render(<BloodBankVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText(/No Submissions Assigned/i)).toBeInTheDocument();
      expect(
        screen.getByText(/currently no donor certificate submissions assigned/i)
      ).toBeInTheDocument();
    });
  });

  it("opens review modal with issuing hospital contact details and allows downloading certificate", async () => {
    (dashboardService.downloadCertificateById as jest.Mock).mockResolvedValue(
      new Blob(["fake pdf content"], { type: "application/pdf" })
    );

    // Mock createObjectURL and revokeObjectURL
    window.URL.createObjectURL = jest.fn(() => "blob:http://localhost/cert_download");
    window.URL.revokeObjectURL = jest.fn();

    render(<BloodBankVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText("CERT-BB001")).toBeInTheDocument();
    });

    // Click "Review & Verify"
    const reviewButtons = screen.getAllByRole("button", { name: /Review & Verify/i });
    fireEvent.click(reviewButtons[0]);

    // Modal should be open
    await waitFor(() => {
      expect(screen.getByText(/Certificate Review:/i)).toBeInTheDocument();
      expect(screen.getByText(/Issuing Hospital Contact/i)).toBeInTheDocument();
      expect(screen.getAllByText("+91-821-2565000").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("contact@stphilomenamysore.org")).toBeInTheDocument();
      expect(screen.getByText(/Counter 4, Ground Floor/i)).toBeInTheDocument();
    });

    // Test downloading certificate
    const downloadBtn = screen.getByRole("button", { name: /Download \/ View File/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(dashboardService.downloadCertificateById).toHaveBeenCalledWith("bb_sub_01");
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringMatching(/downloaded successfully/i)
      );
    });
  });

  it("allows logging a contact attempt with validation and saves to audit history", async () => {
    (dashboardService.recordCertificateContactAttempt as jest.Mock).mockResolvedValue({
      contactAttempts: [
        ...sampleSubmissions[0].contactAttempts!,
        {
          contactDate: new Date().toISOString(),
          contactMethod: "Phone Call",
          notes: "Confirmed valid register entry serial #SPH-2026-99.",
          outcome: "Record Confirmed",
          staffName: "Dr. Ramesh BB",
        },
      ],
      history: sampleSubmissions[0].history,
    });

    render(<BloodBankVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText("CERT-BB001")).toBeInTheDocument();
    });

    const reviewButtons = screen.getAllByRole("button", { name: /Review & Verify/i });
    fireEvent.click(reviewButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Log Contact Attempt/i })).toBeInTheDocument();
    });

    // Click "Log Contact Attempt"
    fireEvent.click(screen.getByRole("button", { name: /Log Contact Attempt/i }));

    // Try saving without notes -> validation error
    const saveBtn = screen.getByRole("button", { name: /Save Contact Log/i });
    fireEvent.click(saveBtn);

    expect(mockToast.error).toHaveBeenCalledWith(
      expect.stringMatching(/at least 5 characters/i)
    );

    // Enter valid notes and save
    const notesInput = screen.getByPlaceholderText(/Spoke with Medical Records Department/i);
    fireEvent.change(notesInput, {
      target: { value: "Confirmed valid register entry serial #SPH-2026-99." },
    });

    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(dashboardService.recordCertificateContactAttempt).toHaveBeenCalledWith(
        "bb_sub_01",
        expect.objectContaining({
          notes: "Confirmed valid register entry serial #SPH-2026-99.",
        })
      );
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringMatching(/recorded in audit log/i)
      );
    });
  });

  it("submits clarification decision and requires clarification reason", async () => {
    (dashboardService.reviewCertificate as jest.Mock).mockResolvedValue({
      message: "Clarification requested from donor.",
      data: { status: "NEEDS_INFORMATION" },
    });

    render(<BloodBankVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText("CERT-BB001")).toBeInTheDocument();
    });

    const reviewButtons = screen.getAllByRole("button", { name: /Review & Verify/i });
    fireEvent.click(reviewButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Request Clarification/i })).toBeInTheDocument();
    });

    // Select "Request Clarification"
    fireEvent.click(screen.getByRole("button", { name: /Request Clarification/i }));

    // Try confirming decision without entering reason
    const confirmBtn = screen.getByRole("button", { name: /Confirm Decision/i });
    fireEvent.click(confirmBtn);

    expect(mockToast.error).toHaveBeenCalledWith(
      expect.stringMatching(/specify what clarification/i)
    );

    // Enter reason and submit
    const reasonInput = screen.getByPlaceholderText(/missing or unreadable/i);
    fireEvent.change(reasonInput, {
      target: { value: "Please provide a higher resolution scan showing the doctor's seal." },
    });

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(dashboardService.reviewCertificate).toHaveBeenCalledWith("bb_sub_01", {
        action: "REQUEST_CLARIFICATION",
        reason: "Please provide a higher resolution scan showing the doctor's seal.",
      });
      expect(mockToast.success).toHaveBeenCalled();
    });
  });

  it("submits approval decision successfully", async () => {
    (dashboardService.reviewCertificate as jest.Mock).mockResolvedValue({
      message: "Certificate verified and approved.",
      data: { status: "APPROVED" },
    });

    render(<BloodBankVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText("CERT-BB001")).toBeInTheDocument();
    });

    const reviewButtons = screen.getAllByRole("button", { name: /Review & Verify/i });
    fireEvent.click(reviewButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Confirm & Approve/i })).toBeInTheDocument();
    });

    // Select "Confirm & Approve"
    fireEvent.click(screen.getByRole("button", { name: /Confirm & Approve/i }));

    // Confirm
    const confirmBtn = screen.getByRole("button", { name: /Confirm Decision/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(dashboardService.reviewCertificate).toHaveBeenCalledWith("bb_sub_01", {
        action: "APPROVE",
        reason: undefined,
      });
      expect(mockToast.success).toHaveBeenCalled();
    });
  });
});
