import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join BloodLink as a blood donor or recipient. Connect directly during medical emergencies and help save lives.",
  alternates: {
    canonical: "/register",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
