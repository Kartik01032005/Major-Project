import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import LiveRequestTrackingCard from "../components/dashboard/user/LiveRequestTrackingCard";
import { dashboardService } from "../services/dashboardService";
import { socketService } from "../services/socketService";
import { EmergencyTrackingStats } from "../types";

// Mock services
jest.mock("../services/dashboardService");
jest.mock("../services/socketService");

describe("Task #3 — Emergency Request Expiration UI Test Suite", () => {
  const mockRequestId = "req_expiry_12345";
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

  it("11. displays active 'Expires in:' countdown for active request with future expiresAt", async () => {
    // 2 hours in the future
    const futureDate = new Date(Date.now() + 2 * 3600 * 1000).toISOString();

    const activeStats: EmergencyTrackingStats = {
      requestId: mockRequestId,
      requestCreated: new Date().toISOString(),
      expiresAt: futureDate,
      notifiedCount: 10,
      respondedCount: 2,
      acceptedCount: 1,
      unableToDonateCount: 1,
      withdrawnCount: 0,
      pendingCount: 8,
      status: "Pending",
      lifecycleStatus: "Searching for Donors",
    };

    (dashboardService.getRequestTracking as jest.Mock).mockResolvedValue(activeStats);

    render(<LiveRequestTrackingCard requestId={mockRequestId} initialStats={activeStats} />);

    expect(screen.getByText("Expires in:")).toBeInTheDocument();
    // Matches HH:MM:SS format
    expect(screen.getByText(/0[1-2]:[0-5][0-9]:[0-5][0-9]/)).toBeInTheDocument();
  });

  it("12. displays '⏰ Request Expired' and 'This emergency blood request is no longer active.' for expired requests", async () => {
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();

    const expiredStats: EmergencyTrackingStats = {
      requestId: mockRequestId,
      requestCreated: new Date(Date.now() - 25 * 3600 * 1000).toISOString(),
      expiresAt: pastDate,
      notifiedCount: 10,
      respondedCount: 2,
      acceptedCount: 1,
      unableToDonateCount: 1,
      withdrawnCount: 0,
      pendingCount: 8,
      status: "Expired",
      lifecycleStatus: "Request Expired",
    };

    (dashboardService.getRequestTracking as jest.Mock).mockResolvedValue(expiredStats);

    render(<LiveRequestTrackingCard requestId={mockRequestId} initialStats={expiredStats} />);

    expect(screen.getByText("Request Status: ⏰ Expired")).toBeInTheDocument();
    expect(screen.getByText("This emergency blood request is no longer active.")).toBeInTheDocument();
  });

  it("16. transitions to Expired in real-time when 'request_expired' Socket.IO event is received", async () => {
    const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();

    const activeStats: EmergencyTrackingStats = {
      requestId: mockRequestId,
      requestCreated: new Date().toISOString(),
      expiresAt: futureDate,
      notifiedCount: 10,
      respondedCount: 0,
      acceptedCount: 0,
      unableToDonateCount: 0,
      withdrawnCount: 0,
      pendingCount: 10,
      status: "Pending",
      lifecycleStatus: "Searching for Donors",
    };

    const expiredStats: EmergencyTrackingStats = {
      ...activeStats,
      status: "Expired",
      lifecycleStatus: "Request Expired",
    };

    (dashboardService.getRequestTracking as jest.Mock).mockResolvedValue(expiredStats);

    render(<LiveRequestTrackingCard requestId={mockRequestId} initialStats={activeStats} />);

    expect(screen.getByText("Expires in:")).toBeInTheDocument();

    // Emit Socket.IO expiration event
    act(() => {
      if (socketCallbacks["request_expired"]) {
        socketCallbacks["request_expired"]({
          requestId: mockRequestId,
          status: "Expired",
        });
      }
    });

    await waitFor(() => {
      expect(screen.getByText("Request Status: ⏰ Expired")).toBeInTheDocument();
      expect(screen.getByText("This emergency blood request is no longer active.")).toBeInTheDocument();
    });
  });
});
