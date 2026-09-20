import type { Metadata } from "next";
import DashboardLayoutClient from "./DashboardLayoutClient";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "BloodLink User Dashboard - Manage emergency requests, live notifications, and donor profile.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
