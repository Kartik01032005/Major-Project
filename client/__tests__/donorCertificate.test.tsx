import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DonorCertificateCard from "../components/dashboard/user/DonorCertificateCard";
import { dashboardService } from "../services/dashboardService";
import { useAuth, useToast } from "../context";
import { DonorCertificate, Hospital } from "../types";

jest.mock("../services/dashboardService");
jest.mock("../context", () => ({
  useAuth: jest.fn(),
  useToast: jest.fn(),
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
    locale: "en",
  })),
}));

describe("BloodLink — Donor Certificate Submission Test Suite (Task 2)", () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  };

  const mockUser = {
    _id: "user_101",
    id: "user_101",
    name: "Ramesh Sharma",
    email: "ramesh@bloodlink.dev",
    role: "USER" as const,
    bloodGroup: "O+",
  };

  const mockHospitals: Hospital[] = [
    {
      _id: "hosp_1",
      name: "Apollo BGS Hospital Mysore",
      address: "Kuvempunagar",
      district: "Mysore",
      state: "Karnataka",
      phone: "08212568888",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      _id: "hosp_2",
      name: "Columbia Asia Hospital Mysore",
      address: "Hebbal",
      district: "Mysore",
      state: "Karnataka",
      phone: "08212456789",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  const pendingCertificate: DonorCertificate = {
    id: "cert_001",
    status: "PENDING",
    issuingHospital: "Apollo BGS Hospital Mysore",
    issueDate: "2026-01-15T00:00:00.000Z",
    expiryDate: "2027-01-15T00:00:00.000Z",
    submittedAt: "2026-02-01T10:00:00.000Z",
    file: {
      originalName: "medical_cert_ramesh.pdf",
      mimeType: "application/pdf",
      size: 1024 * 250, // 250 KB
    },
  };

  const verifiedCertificate: DonorCertificate = {
    ...pendingCertificate,
    id: "cert_002",
    status: "VERIFIED",
  };

  const needsInfoCertificate: DonorCertificate = {
    ...pendingCertificate,
    id: "cert_003",
    status: "NEEDS_INFORMATION",
    feedbackMessage: "The stamp on page 1 is blurry. Please re-upload a clear scan.",
  };

  const rejectedCertificate: DonorCertificate = {
    ...pendingCertificate,
    id: "cert_004",
    status: "REJECTED",
    rejectionReason: "Document does not contain the required institutional registration seal.",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (dashboardService.getHospitals as jest.Mock).mockResolvedValue(mockHospitals);
  });

  describe("1. Initial Status & Demonstration Notice", () => {
    it("renders NOT_SUBMITTED state when user has not yet uploaded a certificate", async () => {
      (dashboardService.getMyCertificate as jest.Mock).mockResolvedValue({
        status: "NOT_SUBMITTED",
      });

      render(<DonorCertificateCard />);

      await waitFor(() => {
        expect(screen.getByText("Medical Donor Certificate")).toBeInTheDocument();
        expect(screen.getByText("Not Submitted")).toBeInTheDocument();
        expect(screen.getByText(/Demonstration Notice:/i)).toBeInTheDocument();
        expect(screen.getByText("No Certificate Uploaded Yet")).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: /Submit Certificate/i }).length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("2. Submission Form & Client Validation", () => {
    beforeEach(() => {
      (dashboardService.getMyCertificate as jest.Mock).mockResolvedValue({
        status: "NOT_SUBMITTED",
      });
    });

    it("opens upload form with preset demo hospital dropdown and manual toggle", async () => {
      render(<DonorCertificateCard />);

      await waitFor(() => {
        expect(screen.getByText("No Certificate Uploaded Yet")).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByRole("button", { name: /Submit Certificate/i })[0]);

      expect(screen.getByText("Upload Medical Certificate")).toBeInTheDocument();
      expect(screen.getByText("Select demo hospital")).toBeInTheDocument();
      expect(screen.getByText("Enter other hospital name")).toBeInTheDocument();

      // Demo hospital dropdown is present and populated
      expect(screen.getByRole("combobox")).toBeInTheDocument();
      expect(screen.getByText(/Apollo BGS Hospital Mysore/i)).toBeInTheDocument();
    });

    it("allows switching to manual hospital name input", async () => {
      render(<DonorCertificateCard />);

      await waitFor(() => {
        expect(screen.getByText("No Certificate Uploaded Yet")).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByRole("button", { name: /Submit Certificate/i })[0]);

      // Switch to manual input
      const manualRadio = screen.getByLabelText(/Enter other hospital name/i);
      fireEvent.click(manualRadio);

      const manualInput = screen.getByPlaceholderText(/City General Hospital/i);
      expect(manualInput).toBeInTheDocument();

      fireEvent.change(manualInput, { target: { value: "City Care Clinic" } });
      expect(manualInput).toHaveValue("City Care Clinic");
    });

    it("validates that issue date is required and file is required", async () => {
      render(<DonorCertificateCard />);

      await waitFor(() => {
        expect(screen.getByText("No Certificate Uploaded Yet")).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByRole("button", { name: /Submit Certificate/i })[0]);

      // Submit without filling issueDate or attaching file
      fireEvent.click(screen.getByRole("button", { name: /Submit for Verification/i }));

      expect(screen.getByText(/Please provide the certificate issue date/i)).toBeInTheDocument();
      expect(dashboardService.submitCertificate).not.toHaveBeenCalled();
    });

    it("rejects future issue dates", async () => {
      render(<DonorCertificateCard />);

      await waitFor(() => {
        expect(screen.getByText("No Certificate Uploaded Yet")).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByRole("button", { name: /Submit Certificate/i })[0]);

      // Enter future date
      const futureDate = "2099-01-01";
      const dateInputs = document.querySelectorAll('input[type="date"]');
      fireEvent.change(dateInputs[0], { target: { value: futureDate } });

      // Attach dummy file
      const file = new File(["dummy-pdf-content"], "cert.pdf", { type: "application/pdf" });
      const hiddenInput = document.getElementById("certificate-file-input") as HTMLInputElement;
      fireEvent.change(hiddenInput, { target: { files: [file] } });

      fireEvent.click(screen.getByRole("button", { name: /Submit for Verification/i }));

      await waitFor(() => {
        expect(screen.getByTestId("certificate-form-error")).toHaveTextContent(/Certificate issue date cannot be in the future/i);
      });
    });
  });

  describe("3. Successful Submission & State Transitions", () => {
    it("successfully submits certificate and transitions view to PENDING", async () => {
      (dashboardService.getMyCertificate as jest.Mock).mockResolvedValue({
        status: "NOT_SUBMITTED",
      });
      (dashboardService.submitCertificate as jest.Mock).mockResolvedValue(pendingCertificate);

      render(<DonorCertificateCard />);

      await waitFor(() => {
        expect(screen.getByText("No Certificate Uploaded Yet")).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByRole("button", { name: /Submit Certificate/i })[0]);

      // Fill valid issue date
      const inputs = document.querySelectorAll('input[type="date"]');
      fireEvent.change(inputs[0], { target: { value: "2026-01-15" } });

      // Attach file
      const file = new File(["%PDF-1.4 sample"], "medical_cert_ramesh.pdf", {
        type: "application/pdf",
      });
      const hiddenInput = document.getElementById("certificate-file-input") as HTMLInputElement;
      fireEvent.change(hiddenInput, { target: { files: [file] } });

      // Submit
      fireEvent.click(screen.getByRole("button", { name: /Submit for Verification/i }));

      await waitFor(() => {
        expect(dashboardService.submitCertificate).toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalledWith(
          expect.stringMatching(/Certificate submitted successfully/i)
        );
        expect(screen.getByText("Verification Pending")).toBeInTheDocument();
        expect(screen.getByText("medical_cert_ramesh.pdf")).toBeInTheDocument();
      });
    });
  });

  describe("4. Displaying Verification Statuses & Reviewer Notes", () => {
    it("renders VERIFIED status badge and instructions", async () => {
      (dashboardService.getMyCertificate as jest.Mock).mockResolvedValue(verifiedCertificate);

      render(<DonorCertificateCard />);

      await waitFor(() => {
        expect(screen.getByText("Certificate Verified")).toBeInTheDocument();
        expect(screen.getByText(/verified for simulated donor participation/i)).toBeInTheDocument();
      });
    });

    it("renders NEEDS_INFORMATION status with reviewer clarification note", async () => {
      (dashboardService.getMyCertificate as jest.Mock).mockResolvedValue(needsInfoCertificate);

      render(<DonorCertificateCard />);

      await waitFor(() => {
        expect(screen.getByText("Clarification Needed")).toBeInTheDocument();
        expect(screen.getByText(/The stamp on page 1 is blurry/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Resubmit \/ Update/i })).toBeInTheDocument();
      });
    });

    it("renders REJECTED status with reviewer rejection reason", async () => {
      (dashboardService.getMyCertificate as jest.Mock).mockResolvedValue(rejectedCertificate);

      render(<DonorCertificateCard />);

      await waitFor(() => {
        expect(screen.getByText("Certificate Rejected")).toBeInTheDocument();
        expect(
          screen.getByText(/Document does not contain the required institutional registration seal/i)
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Resubmit \/ Update/i })).toBeInTheDocument();
      });
    });
  });

  describe("5. Private File Viewing / Download", () => {
    it("triggers private file download when clicking View / Download Document", async () => {
      (dashboardService.getMyCertificate as jest.Mock).mockResolvedValue(pendingCertificate);
      const mockBlob = new Blob(["%PDF-1.4 content"], { type: "application/pdf" });
      (dashboardService.downloadCertificateFile as jest.Mock).mockResolvedValue(mockBlob);

      // Mock URL methods
      window.URL.createObjectURL = jest.fn(() => "blob:http://localhost/mock-uuid");
      window.URL.revokeObjectURL = jest.fn();

      render(<DonorCertificateCard />);

      await waitFor(() => {
        expect(screen.getByText("medical_cert_ramesh.pdf")).toBeInTheDocument();
      });

      const downloadBtn = screen.getByRole("button", { name: /View \/ Download Document/i });
      fireEvent.click(downloadBtn);

      await waitFor(() => {
        expect(dashboardService.downloadCertificateFile).toHaveBeenCalled();
        expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      });
    });
  });
});
