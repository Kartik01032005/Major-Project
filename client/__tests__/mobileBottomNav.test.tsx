import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { useAuth } from "@/context";
import { usePathname } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock context
jest.mock("@/context", () => ({
  useAuth: jest.fn(),
  useTranslation: () => ({
    t: (k: string) => k,
  }),
}));

describe("TASK — Mobile Bottom Navigation Test Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        _id: "user-123",
        name: "Rahul Naik",
        role: "user",
      },
    });
    (usePathname as jest.Mock).mockReturnValue("/dashboard");
  });

  it("1. renders exactly the 5 specified items (Home, Nearby, Request, My Requests, Settings)", () => {
    render(<MobileBottomNav />);

    const nav = screen.getByRole("navigation", { name: /mobile bottom navigation/i });
    expect(nav).toBeInTheDocument();

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Nearby")).toBeInTheDocument();
    expect(screen.getByText("Request")).toBeInTheDocument();
    expect(screen.getByText("My Requests")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);
  });

  it("2. points each navigation item to its exact authenticated BloodLink route", () => {
    render(<MobileBottomNav />);

    const homeLink = screen.getByRole("link", { name: "Home" });
    const nearbyLink = screen.getByRole("link", { name: "Nearby" });
    const requestLink = screen.getByRole("link", { name: /request emergency blood/i });
    const myRequestsLink = screen.getByRole("link", { name: "My Requests" });
    const settingsLink = screen.getByRole("link", { name: "Settings" });

    expect(homeLink).toHaveAttribute("href", "/dashboard");
    expect(nearbyLink).toHaveAttribute("href", "/dashboard/nearby");
    expect(requestLink).toHaveAttribute("href", "/dashboard/emergency");
    expect(myRequestsLink).toHaveAttribute("href", "/dashboard/requests");
    expect(settingsLink).toHaveAttribute("href", "/dashboard/settings");
  });

  it("3. highlights the Home item with red accent when pathname is /dashboard", () => {
    (usePathname as jest.Mock).mockReturnValue("/dashboard");
    render(<MobileBottomNav />);

    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toHaveAttribute("aria-current", "page");
    expect(homeLink.className).toContain("text-red-600");
  });

  it("4. highlights the Nearby item with red accent when pathname is /dashboard/nearby", () => {
    (usePathname as jest.Mock).mockReturnValue("/dashboard/nearby");
    render(<MobileBottomNav />);

    const nearbyLink = screen.getByRole("link", { name: "Nearby" });
    expect(nearbyLink).toHaveAttribute("aria-current", "page");
    expect(nearbyLink.className).toContain("text-red-600");

    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).not.toHaveAttribute("aria-current");
  });

  it("5. renders prominent circular button and highlights Request when pathname is /dashboard/emergency", () => {
    (usePathname as jest.Mock).mockReturnValue("/dashboard/emergency");
    render(<MobileBottomNav />);

    const requestLink = screen.getByRole("link", { name: /request emergency blood/i });
    expect(requestLink).toHaveAttribute("aria-current", "page");

    // Circular button container is elevated above bottom bar
    expect(requestLink.className).toContain("-top-2.5");
    const circle = requestLink.querySelector("span");
    expect(circle?.className).toContain("rounded-full");
    expect(circle?.className).toContain("bg-gradient-to-br");
  });

  it("6. highlights My Requests when pathname is /dashboard/requests", () => {
    (usePathname as jest.Mock).mockReturnValue("/dashboard/requests");
    render(<MobileBottomNav />);

    const myRequestsLink = screen.getByRole("link", { name: "My Requests" });
    expect(myRequestsLink).toHaveAttribute("aria-current", "page");
    expect(myRequestsLink.className).toContain("text-red-600");
  });

  it("7. highlights Settings when pathname is /dashboard/settings", () => {
    (usePathname as jest.Mock).mockReturnValue("/dashboard/settings");
    render(<MobileBottomNav />);

    const settingsLink = screen.getByRole("link", { name: "Settings" });
    expect(settingsLink).toHaveAttribute("aria-current", "page");
    expect(settingsLink.className).toContain("text-red-600");
  });

  it("8. ensures mobile-only display using md:hidden and fixed bottom layout with safe-area spacing", () => {
    render(<MobileBottomNav />);

    const nav = screen.getByRole("navigation", { name: /mobile bottom navigation/i });
    expect(nav.className).toContain("md:hidden");
    expect(nav.className).toContain("fixed");
    expect(nav.className).toContain("bottom-0");
    expect(nav).toHaveStyle({ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom, 0px))" });
  });

  it("9. routes admin users to admin dashboard home (/dashboard/admin)", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        _id: "admin-1",
        name: "Admin User",
        role: "admin",
      },
    });
    (usePathname as jest.Mock).mockReturnValue("/dashboard/admin");
    render(<MobileBottomNav />);

    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toHaveAttribute("href", "/dashboard/admin");
    expect(homeLink).toHaveAttribute("aria-current", "page");
  });
});
