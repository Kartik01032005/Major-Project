import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nearby Hospitals & Blood Banks",
  description: "Find nearby hospitals and blood banks using real OpenStreetMap location data, live inventory, and emergency contact details.",
  alternates: {
    canonical: "/nearby",
  },
};

export default function NearbyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
