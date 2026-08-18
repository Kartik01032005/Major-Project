import React from "react";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

// Mock next/navigation if needed
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
}));

describe("Landing Page (Home)", () => {
  it("renders the landing page without crashing", () => {
    render(<Home />);
    // Verify main landmarks/headings exist
    const mainElement = screen.getByRole("main");
    expect(mainElement).toBeInTheDocument();
  });
});
