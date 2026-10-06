import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EligibilitySection from "@/components/sections/EligibilitySection";
import DonationGuidelinesModal from "@/components/sections/DonationGuidelinesModal";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
}));

describe("Blood Donation Eligibility Feature", () => {
  it("renders the Blood Donation Eligibility section with heading and checklist", () => {
    render(<EligibilitySection />);

    // Section title & subtitle
    expect(screen.getByText(/Blood Donation Eligibility/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Thinking about donating blood/i)[0]).toBeInTheDocument();

    // Checkpoints
    expect(screen.getByText(/Age between 18 and 65 years/i)).toBeInTheDocument();
    expect(screen.getByText(/Minimum weight of 45 kg/i)).toBeInTheDocument();
    expect(screen.getByText(/Hemoglobin level of at least 12.5 g\/dL/i)).toBeInTheDocument();
    expect(screen.getByText(/Interval since last donation: 90 days/i)).toBeInTheDocument();

    // Medical disclaimer
    expect(screen.getByText(/Important Medical Notice/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Final eligibility is determined by the blood bank or qualified healthcare professional/i)
    ).toBeInTheDocument();

    // CTA button
    const ctaBtns = screen.getAllByRole("button", { name: /View Donation Guidelines/i });
    expect(ctaBtns.length).toBeGreaterThan(0);
  });

  it("opens guidelines modal when clicking 'View Donation Guidelines'", () => {
    render(<EligibilitySection />);

    const ctaBtn = screen.getAllByRole("button", { name: /View Donation Guidelines/i })[0];
    fireEvent.click(ctaBtn);

    // Modal appears
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Blood Donation Eligibility & Guidelines/i)).toBeInTheDocument();
    expect(screen.getAllByText(/18 to 65 Years/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/e-RaktKosh/i).length).toBeGreaterThan(0);
  });

  it("allows switching tabs inside guidelines modal and closing it", () => {
    const handleClose = jest.fn();
    render(<DonationGuidelinesModal isOpen={true} onClose={handleClose} />);

    // Check modal is open
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Switch to Deferral Periods tab
    const deferralTab = screen.getByRole("button", { name: /Deferral Periods/i });
    fireEvent.click(deferralTab);
    expect(screen.getByText(/Tattoos & Body Piercings/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Deferral: 12 Months/i).length).toBeGreaterThan(0);

    // Switch to Medical Sources tab
    const sourcesTab = screen.getByRole("button", { name: /Medical Sources/i });
    fireEvent.click(sourcesTab);
    expect(screen.getByText(/National Blood Transfusion Initiative/i)).toBeInTheDocument();
    expect(screen.getByText(/World Health Organization/i)).toBeInTheDocument();

    // Close button
    const closeBtn = screen.getAllByRole("button", { name: /Close/i })[0];
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
