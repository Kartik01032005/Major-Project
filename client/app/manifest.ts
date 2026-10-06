import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BloodLink – Smart Blood Donor Finder",
    short_name: "BloodLink",
    description: "Real-time blood donor and blood bank matching platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#0F172A",
    theme_color: "#DC2626",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
