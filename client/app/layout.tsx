import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "BloodLink – Smart Blood Donor Finder",
    template: "%s | BloodLink",
  },
  description:
    "BloodLink connects blood donors, blood banks, and hospitals in real time during emergencies. Find blood instantly with live inventory, OpenStreetMap navigation, and instant notifications.",
  keywords: [
    "blood donor",
    "blood bank",
    "emergency blood",
    "blood finder",
    "donate blood",
    "BloodLink",
    "blood donation India",
  ],
  authors: [{ name: "Kartik Nilekani" }],
  creator: "Kartik Nilekani",
  metadataBase: new URL("https://bloodlink.vercel.app"),
  openGraph: {
    title: "BloodLink – Smart Blood Donor Finder",
    description:
      "Find blood donors and blood banks in real time. Save lives with BloodLink.",
    url: "https://bloodlink.vercel.app",
    siteName: "BloodLink",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BloodLink – Smart Blood Donor Finder",
    description: "Find blood donors and blood banks in real time. Save lives with BloodLink.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F0F" },
  ],
};

import { AuthProvider, LanguageProvider } from "@/context";
import Chatbot from "@/components/chatbot/Chatbot";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-screen flex flex-col antialiased">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <Navbar />
              <main className="flex-1 pt-16" id="main-content" role="main">
                {children}
              </main>
              <Footer />
              <Chatbot />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
