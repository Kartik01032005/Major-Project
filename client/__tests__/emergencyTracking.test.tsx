import React from "react";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import LiveRequestTrackingCard from "../components/dashboard/user/LiveRequestTrackingCard";
import { dashboardService } from "../services/dashboardService";
import { socketService } from "../services/socketService";
import { EmergencyTrackingStats } from "../types";

// Mock services
jest.mock("../services/dashboardService");
jest.mock("../services/socketService");

describe("LiveRequestTrackingCard Component", () => {
  const mockRequestId = "req_123456789";

  const sampleStats: EmergencyTrackingStats = {
    requestId: mockRequestId,
    requestCreated: "2026-10-05T10:00:00.000Z",
    notifiedCount: 15,
    respondedCount: 7,
    acceptedCount: 3,
    unableToDonateCount: 2,
    withdrawnCount: 1,
    pendingCount: 8,
    status: "Pending",
    lifecycleStatus: "Donor Response Received",
  };

  let socketCallbacks: Record<string, ((...args: any[]) => void)> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    socketCallbacks = {};

    (socketService.connect as jest.Mock).mockReturnValue({
      connected: true,
      on: jest.fn(),
      off: jest.fn(),
    });

    (socketService.on as jest.Mock).mockImplementation((event: string, cb: (...args: any[]) => void) => {
      socketCallbacks[event] = cb;
    });

    (socketService.off as jest.Mock).mockImplementation((event: string) => {
      delete socketCallbacks[event];
    });
  });

  it("15. displays initial loading state while fetching tracking stats", async () => {
    // Return unresolved promise to observe loading
    (dashboardService.getRequestTracking as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<LiveRequestTrackingCard requestId={mockRequestId} />);

    expect(screen.getByText("🔴 Live Request Tracking")).toBeInTheDocument();
    expect(screen.getByText(/Fetching real-time tracking data/i)).toBeInTheDocument();
  });

  it("1. renders complete live tracking pipeline with real statistics", async () => {
    (dashboardService.getRequestTracking as jest.Mock).mockResolvedValue(sampleStats);

    render(<LiveRequestTrackingCard requestId={mockRequestId} initialStats={sampleStats} />);

    expect(screen.getByText("Live Request Tracking")).toBeInTheDocument();
    expect(screen.getByText("Request Created")).toBeInTheDocument();
    expect(screen.getByText("Donors Notified")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Donors Responded")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();

    // Breakdown
    expect(screen.getByText("Accepted")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Unable")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();

    // Status badge
    expect(screen.getByText(/🟢 Donor Response Received/i)).toBeInTheDocument();
  });

  it("8. dynamically updates statistics when Socket.IO request_tracking_updated event arrives", async () => {
    (dashboardService.getRequestTracking as jest.Mock).mockResolvedValue(sampleStats);

    render(<LiveRequestTrackingCard requestId={mockRequestId} initialStats={sampleStats} />);

    expect(screen.getByText("3")).toBeInTheDocument(); // Initial accepted count

    // Simulate incoming Socket.IO event with a new donor accepting
    const updatedStats: EmergencyTrackingStats = {
      ...sampleStats,
      acceptedCount: 4,
      respondedCount: 8,
      pendingCount: 7,
    };

    act(() => {
      if (socketCallbacks["request_tracking_updated"]) {
        socketCallbacks["request_tracking_updated"](updatedStats);
      }
    });

    await waitFor(() => {
      expect(screen.getByText("4")).toBeInTheDocument(); // Updated accepted count
      expect(screen.getByText("8")).toBeInTheDocument(); // Updated responded count
    });
  });

  it("9. handles Socket.IO disconnection and refetches on reconnect", async () => {
    (dashboardService.getRequestTracking as jest.Mock).mockResolvedValue(sampleStats);

    render(<LiveRequestTrackingCard requestId={mockRequestId} initialStats={sampleStats} />);

    // Simulate socket disconnect
    act(() => {
      if (socketCallbacks["disconnect"]) {
        socketCallbacks["disconnect"]();
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/Reconnecting/i)).toBeInTheDocument();
    });

    // Simulate socket reconnect
    await act(async () => {
      if (socketCallbacks["connect"]) {
        socketCallbacks["connect"]();
      }
    });

    expect(dashboardService.getRequestTracking).toHaveBeenCalledWith(mockRequestId);
  });

  it("16. renders error state with retry action when API call fails", async () => {
    (dashboardService.getRequestTracking as jest.Mock).mockRejectedValueOnce(
      new Error("Network Error: Backend offline")
    );

    render(<LiveRequestTrackingCard requestId={mockRequestId} />);

    await waitFor(() => {
      expect(screen.getByText(/Network Error: Backend offline/i)).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    // Resolve successfully on retry
    (dashboardService.getRequestTracking as jest.Mock).mockResolvedValueOnce(sampleStats);

    await act(async () => {
      fireEvent.click(screen.getByText("Retry"));
    });

    await waitFor(() => {
      expect(screen.getByText("Live Request Tracking")).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument();
    });
  });

  it("13 & 14. displays correct badges for Searching, Fulfilled, and Cancelled statuses", async () => {
    // Fulfilled
    const fulfilledStats: EmergencyTrackingStats = {
      ...sampleStats,
      status: "Completed",
      lifecycleStatus: "Request Fulfilled",
    };
    const { rerender } = render(
      <LiveRequestTrackingCard requestId={mockRequestId} initialStats={fulfilledStats} />
    );
    expect(screen.getByText(/✅ Request Fulfilled/i)).toBeInTheDocument();

    // Cancelled
    const cancelledStats: EmergencyTrackingStats = {
      ...sampleStats,
      status: "Cancelled",
      lifecycleStatus: "Request Cancelled",
    };
    rerender(<LiveRequestTrackingCard requestId={mockRequestId} initialStats={cancelledStats} />);
    expect(screen.getByText(/⚪ Request Cancelled/i)).toBeInTheDocument();

    // Searching
    const searchingStats: EmergencyTrackingStats = {
      ...sampleStats,
      acceptedCount: 0,
      respondedCount: 0,
      lifecycleStatus: "Searching for Donors",
    };
    rerender(<LiveRequestTrackingCard requestId={mockRequestId} initialStats={searchingStats} />);
    expect(screen.getByText(/🟠 Searching for Donors/i)).toBeInTheDocument();
  });
});
