import type { Metadata } from "next";
import Link from "next/link";
import { FaDroplet } from "react-icons/fa6";
import {
  FiLock,
  FiMapPin,
  FiBell,
  FiMail,
  FiMessageSquare,
  FiUserCheck,
  FiAlertTriangle,
} from "react-icons/fi";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how BloodLink handles your account, location, blood group, and contact data with security and privacy.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "September 20, 2026";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/50 text-red-600 text-xs font-semibold mb-4">
            <FaDroplet size={12} />
            <span>BloodLink Platform Privacy Notice</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Last Updated: {lastUpdated}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
            BloodLink is a technology platform designed to assist in finding blood donors, viewing nearby blood banks and hospitals, and coordinating blood requests. We take the privacy and security of your personal and health-related information seriously. This Privacy Policy details what information we collect, how it is used, and how it is protected.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* 1. Project & Platform Disclaimer */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <FiAlertTriangle size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                1. Project & Platform Nature
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              BloodLink is an independent engineering project developed to demonstrate real-time geolocation matching and blood inventory visibility. BloodLink is <strong>not</strong> a medical provider, blood repository, hospital, or emergency medical service (EMS). In life-threatening emergencies, always dial official local emergency numbers (e.g., 108/112 in India) and contact local hospital trauma centers immediately.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
                <FiUserCheck size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                2. Information We Collect
              </h2>
            </div>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Account Information:</strong> Name, email address, phone number, and user role (donor, recipient, or administrator).
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Blood Group & Donor Status:</strong> ABO/Rh blood group (A+, A-, B+, B-, AB+, AB-, O+, O-), donation availability toggle, and last donation date if provided.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Emergency Request Details:</strong> Required blood group, units requested, hospital name, urgency level, patient contact phone, and request status.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Authentication Credentials:</strong> Passwords are cryptographically salted and hashed using bcrypt before storage. We never store or log plain-text passwords.
                </div>
              </li>
            </ul>
          </section>

          {/* 3. Location and GPS Data */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FiMapPin size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                3. Real-Time Location & Geolocation Data
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              BloodLink uses real device GPS coordinates (via browser Geolocation API or Capacitor Geolocation on Android) exclusively when you request to find nearby facilities or match with local donors:
            </p>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                <span>GPS coordinates are captured <strong>only with your explicit permission</strong>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                <span>We do <strong>not</strong> track your location in the background or monitor continuous movements.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                <span>Coordinates are used to query nearby medical nodes using OpenStreetMap & Overpass APIs and calculate distance in kilometers.</span>
              </li>
            </ul>
          </section>

          {/* 4. Notifications & Communication */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <FiBell size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                4. Real-Time Notifications & Email Services
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              We use the following communication channels:
            </p>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                <span><strong>Socket.IO Live Alerts:</strong> Real-time in-app alerts dispatched during emergency blood requests and status changes.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                <span><strong>Nodemailer / SMTP Email:</strong> Used to send password reset tokens and critical request confirmations. We do not sell or share email addresses with advertisers.</span>
              </li>
            </ul>
          </section>

          {/* 5. Chatbot & AI Assistance */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FiMessageSquare size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                5. BloodLink AI Assistant
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              BloodLink provides an in-app informational chatbot to answer questions about blood compatibility, donation intervals, and platform features. Chat interactions are used solely to generate conversational replies and are not tied to commercial profiling. The chatbot is an informational tool and does not provide formal medical diagnoses.
            </p>
          </section>

          {/* 6. Data Storage & Security */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                <FiLock size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                6. Storage & Security Practices
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              Application records are stored in a secured MongoDB database. Security measures include:
            </p>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-2 shrink-0" />
                <span>JSON Web Token (JWT) session authorization with timed expiration.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-2 shrink-0" />
                <span>Strict API rate limiting (via express-rate-limit) on authentication and request endpoints.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-2 shrink-0" />
                <span>Input sanitization and parameterized queries to mitigate injection risks.</span>
              </li>
            </ul>
          </section>

          {/* 7. User Rights & Contact */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
                <FiMail size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                7. User Rights, Deletion & Contact
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              You maintain control over your data. You may update your profile, toggle your donation availability off at any time, or request complete account and data removal by contacting us.
            </p>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <p><strong>Project Support Email:</strong> <a href="mailto:support@bloodlink.in" className="text-red-600 dark:text-red-400 hover:underline">support@bloodlink.in</a></p>
              <p><strong>Helpline:</strong> <a href="tel:+911800000000" className="text-red-600 dark:text-red-400 hover:underline">+91 1800-000-0000</a></p>
              <p><strong>Location:</strong> Mysore, Karnataka, India</p>
              <p><strong>Project Maintainer:</strong> Kartik Nilekani</p>
            </div>
          </section>
        </div>

        {/* Bottom Back Button */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          >
            &larr; Return to BloodLink Home
          </Link>
        </div>
      </div>
    </div>
  );
}
