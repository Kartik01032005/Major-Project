import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";
import LoginPage from "@/app/login/page";
import RegisterPage from "@/app/register/page";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

// Mock contexts
let mockUser: any = null;
let mockLoading = false;
const mockLogin = jest.fn();
const mockRegister = jest.fn();

jest.mock("@/context", () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockLoading,
    login: mockLogin,
    register: mockRegister,
    logout: jest.fn(),
  }),
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        login_title: "Sign in to BloodLink",
        login_tab_donor: "User",
        login_tab_admin: "Blood Bank",
        register_title: "Join BloodLink",
        register_tab_donor: "Donor",
        register_tab_admin: "Blood Bank",
        dashboard_loading: "Loading session...",
      };
      return translations[key] || key;
    },
  }),
  useToast: () => ({
    toast: {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    },
  }),
}));

describe("Role-Based Authentication & Authorization (Frontend)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
    mockLoading = false;
  });

  describe("ProtectedRoute Guard", () => {
    it("redirects unauthenticated user to login", () => {
      mockUser = null;
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockReplace).toHaveBeenCalledWith("/login");
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("renders children when authenticated user has the correct role", () => {
      mockUser = {
        id: "u1",
        name: "Test Donor",
        role: "USER",
        approvalStatus: "APPROVED",
      };

      render(
        <ProtectedRoute requiredRole="USER">
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("allows hospital user direct access to HOSPITAL protected route without approval block", () => {
      mockUser = {
        id: "h1",
        name: "General Hospital",
        role: "HOSPITAL",
        approvalStatus: "APPROVED",
      };

      render(
        <ProtectedRoute requiredRole="HOSPITAL">
          <div>Hospital Dashboard Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText("Hospital Dashboard Content")).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("allows blood bank user direct access to BLOOD_BANK protected route without approval block", () => {
      mockUser = {
        id: "bb1",
        name: "Demo Blood Bank",
        role: "BLOOD_BANK",
        approvalStatus: "APPROVED",
      };

      render(
        <ProtectedRoute requiredRole="BLOOD_BANK">
          <div>Blood Bank Dashboard Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText("Blood Bank Dashboard Content")).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("redirects unauthorized role to their respective dashboard", () => {
      mockUser = {
        id: "u1",
        name: "Test Donor",
        role: "USER",
        approvalStatus: "APPROVED",
      };

      render(
        <ProtectedRoute requiredRole="BLOOD_BANK">
          <div>Admin Area</div>
        </ProtectedRoute>
      );

      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
      expect(screen.queryByText("Admin Area")).not.toBeInTheDocument();
    });

    it("allows legacy 'admin' role on BLOOD_BANK protected route", () => {
      mockUser = {
        id: "admin1",
        name: "Legacy Admin",
        role: "admin",
        approvalStatus: "APPROVED",
      };

      render(
        <ProtectedRoute requiredRole="BLOOD_BANK">
          <div>Blood Bank Inventory</div>
        </ProtectedRoute>
      );

      expect(screen.getByText("Blood Bank Inventory")).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe("Login Page Role Selection", () => {
    it("renders role tabs for User, Blood Bank, and Hospital", () => {
      render(<LoginPage />);

      expect(screen.getByRole("tab", { name: /User/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Blood Bank/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Hospital/i })).toBeInTheDocument();
    });

    it("switches to Hospital tab and updates login portal info", () => {
      render(<LoginPage />);

      const hospitalTab = screen.getByRole("tab", { name: /Hospital/i });
      fireEvent.click(hospitalTab);

      expect(
        screen.getByText("Sign in to access the Hospital Partner Portal")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("hospital.admin@hospital.org")
      ).toBeInTheDocument();
    });

    it("switches to Blood Bank tab and updates login portal info", () => {
      render(<LoginPage />);

      const bloodBankTab = screen.getByRole("tab", { name: /Blood Bank/i });
      fireEvent.click(bloodBankTab);

      expect(
        screen.getByText("Sign in to access Blood Bank Inventory & Operations")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("bloodbank@bloodlink.org")
      ).toBeInTheDocument();
    });

    it("passes active selectedRole when submitting login", async () => {
      mockLogin.mockResolvedValueOnce({
        success: true,
        message: "Login successful",
        data: {
          token: "valid-jwt",
          user: { role: "HOSPITAL", approvalStatus: "APPROVED" },
        },
      });

      const { container } = render(<LoginPage />);

      // Switch to Hospital tab
      const hospitalTab = screen.getByRole("tab", { name: /Hospital/i });
      fireEvent.click(hospitalTab);

      // Fill in credentials
      const emailInput = container.querySelector('input[type="email"]')!;
      const passwordInput = container.querySelector('input[type="password"]')!;
      fireEvent.change(emailInput, { target: { value: "hospital@bloodlink.dev" } });
      fireEvent.change(passwordInput, { target: { value: "Password123" } });

      // Submit
      fireEvent.click(container.querySelector('button[type="submit"]')!);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          "hospital@bloodlink.dev",
          "Password123",
          "HOSPITAL"
        );
      });
    });

    it("displays role mismatch error message without redirecting on failure", async () => {
      mockLogin.mockResolvedValueOnce({
        success: false,
        message: "This account is not registered for the selected role. Please select the correct role.",
      });

      const { container } = render(<LoginPage />);

      // Fill credentials
      const emailInput = container.querySelector('input[type="email"]')!;
      const passwordInput = container.querySelector('input[type="password"]')!;
      fireEvent.change(emailInput, { target: { value: "kartik.bb@bloodlink.dev" } });
      fireEvent.change(passwordInput, { target: { value: "Password123" } });

      // Submit under default USER role
      fireEvent.click(container.querySelector('button[type="submit"]')!);

      await waitFor(() => {
        expect(
          screen.getByText(
            "This account is not registered for the selected role. Please select the correct role."
          )
        ).toBeInTheDocument();
      });

      // No redirect occurred
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe("Register Page Role Selection & Institutional Flow", () => {
    it("renders role tabs for Donor, Blood Bank, and Hospital", () => {
      render(<RegisterPage />);

      expect(screen.getByRole("button", { name: /Donor/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Blood Bank/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Hospital/i })).toBeInTheDocument();
    });

    it("displays institutional demo notice when Hospital tab is selected", async () => {
      render(<RegisterPage />);

      const hospitalTab = screen.getByRole("button", { name: /Hospital/i });
      fireEvent.click(hospitalTab);

      await waitFor(() => {
        expect(
          screen.getByText(/College Project Demo Mode/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/activated immediately/i)
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("e.g. City General Hospital")
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("e.g. HSP-REG-84729")
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("Street address, building, campus location")
        ).toBeInTheDocument();
      });
    });
  });
});
