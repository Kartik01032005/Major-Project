"use client";

import { useEffect } from "react";

let activeModalsCount = 0;
let originalBodyOverflow = "";
let originalDashboardOverflow = "";

/**
 * Custom hook to lock body & dashboard content scrolling when a modal or dialog is open.
 * Supports multiple nested or concurrent modals via reference counting.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const dashboardContent = document.getElementById("dashboard-content");

    if (activeModalsCount === 0) {
      originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      if (dashboardContent) {
        originalDashboardOverflow = dashboardContent.style.overflow;
        dashboardContent.style.overflow = "hidden";
      }
    }
    activeModalsCount++;

    return () => {
      activeModalsCount = Math.max(0, activeModalsCount - 1);
      if (activeModalsCount === 0) {
        document.body.style.overflow = originalBodyOverflow;
        const currentDashboard = document.getElementById("dashboard-content");
        if (currentDashboard) {
          currentDashboard.style.overflow = originalDashboardOverflow;
        }
      }
    };
  }, [isLocked]);
}
