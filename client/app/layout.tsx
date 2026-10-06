import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { AuthProvider, LanguageProvider, ToastProvider } from "@/context";
import Chatbot from "@/components/chatbot/Chatbot";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bloodlink.vercel.app";

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
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BloodLink – Smart Blood Donor Finder",
    description:
      "Find blood donors and blood banks in real time. Save lives with BloodLink.",
    url: siteUrl,
    siteName: "BloodLink",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BloodLink – Smart Blood Donor Finder",
    description: "Find blood donors and blood banks in real time. Save lives with BloodLink.",
    creator: "@KartikNilekani",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F0F" },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-screen flex flex-col antialiased" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10000] focus:px-4 focus:py-2 focus:bg-red-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white font-medium text-sm"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ToastProvider>
                <Navbar />
                <main className="flex-1 pt-16" id="main-content" role="main">
                  {children}
                </main>
                <Footer />
                <Chatbot />
                <ServiceWorkerRegister />
              </ToastProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
