import type { Metadata } from "next";
import Link from "next/link";
import { FaDroplet } from "react-icons/fa6";
import {
  FiAlertOctagon,
  FiCheckCircle,
  FiFileText,
  FiHeart,
  FiShield,
  FiUserCheck,
  FiHelpCircle,
} from "react-icons/fi";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Review terms of use, emergency medical disclaimers, donor responsibilities, and guidelines for BloodLink.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsAndConditionsPage() {
  const lastUpdated = "September 20, 2026";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/50 text-red-600 text-xs font-semibold mb-4">
            <FaDroplet size={12} />
            <span>BloodLink Platform Agreement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Last Updated: {lastUpdated}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
            Welcome to BloodLink. By accessing or using the BloodLink web application or mobile APK, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use the service.
          </p>
        </div>

        {/* Emergency Medical Disclaimer (Crucial Requirement) */}
        <div className="bg-red-50 dark:bg-red-950/40 rounded-2xl p-6 sm:p-8 border-2 border-red-500/30 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <FiAlertOctagon size={26} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-900 dark:text-red-300">
                CRITICAL EMERGENCY MEDICAL LIMITATION
              </h2>
              <p className="text-sm text-red-800 dark:text-red-200 mt-2 leading-relaxed font-medium">
                BloodLink is a technology platform for connecting users with donors and medical facilities and does not replace emergency medical services, hospitals, physicians, or official emergency channels.
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-2 leading-relaxed">
                If you or someone in your care is experiencing a life-threatening medical emergency, call national/local emergency services immediately (108 / 112 in India) or report directly to the nearest hospital casualty or trauma center. Do not rely solely on automated or volunteer responses during urgent crises.
              </p>
            </div>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {/* 1. Nature of Service */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                <FiFileText size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                1. Nature of the Platform
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              BloodLink is an open educational and technology initiative. We do not manufacture, store, test, transport, or sell human blood or blood components. BloodLink provides tools to locate public blood banks via OpenStreetMap, discover volunteer donors based on approximate distance, and broadcast emergency blood requests.
            </p>
          </section>

          {/* 2. User Accounts & Responsibilities */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FiUserCheck size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                2. User Account Responsibilities
              </h2>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                <span>You agree to provide accurate and truthful information, including your real blood group, contact number, and location.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                <span>You are responsible for maintaining the confidentiality of your account credentials.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                <span>You must promptly notify the project team if you detect unauthorized use of your account.</span>
              </li>
            </ul>
          </section>

          {/* 3. Emergency Requests & Donor Conduct */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
                <FiHeart size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                3. Emergency Requests &amp; Donor Interactions
              </h2>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <div>
                  <strong>Genuine Requests:</strong> Emergency requests must reflect genuine medical needs verified with the attending physician or hospital.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <div>
                  <strong>Voluntary Participation:</strong> Voluntary donors retain full freedom to accept, decline, or withdraw from donation requests without penalty.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <div>
                  <strong>Prohibition of Commercial Sale:</strong> Blood donation must be strictly voluntary and non-remunerated in compliance with applicable law. Commercial trade, sale, or solicitation of blood is strictly prohibited.
                </div>
              </li>
            </ul>
          </section>

          {/* 4. Prohibited Misuse */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <FiShield size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                4. Prohibited Conduct
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              Users shall not:
            </p>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Submit hoax, spam, fraudulent, or harassing blood requests.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Scrape or harvest personal phone numbers or donor details for marketing or commercial lists.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Attempt to disrupt or flood server APIs or Socket.IO channels.</span>
              </li>
            </ul>
          </section>

          {/* 5. Third-Party Services & Open Data */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FiCheckCircle size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                5. Third-Party Services &amp; OpenStreetMap Data
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Hospital and blood bank facility locations are retrieved from community-maintained OpenStreetMap (OSM) and Overpass data. While we strive to provide reliable records, BloodLink cannot guarantee that every community-mapped facility has 24/7 blood availability or current phone listings. Always call the facility ahead of transit.
            </p>
          </section>

          {/* 6. Limitation of Liability */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                <FiAlertOctagon size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                6. Disclaimer &amp; Limitation of Liability
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              The BloodLink platform is provided &ldquo;as is&rdquo; without warranties of any kind. To the fullest extent permitted by law, the creators and contributors of BloodLink disclaim all liability for delays in donor matching, facility stock shortages, or medical outcomes arising from interactions coordinated on the platform.
            </p>
          </section>

          {/* 7. Contact Information */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
                <FiHelpCircle size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                7. Contact &amp; Governance
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Questions regarding these Terms &amp; Conditions should be addressed to the project maintainer:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <p><strong>Project Support Email:</strong> <a href="mailto:support@bloodlink.in" className="text-red-600 dark:text-red-400 hover:underline">support@bloodlink.in</a></p>
              <p><strong>Helpline:</strong> <a href="tel:+911800000000" className="text-red-600 dark:text-red-400 hover:underline">+91 1800-000-0000</a></p>
              <p><strong>Location:</strong> Mysore, Karnataka, India</p>
              <p><strong>Maintainer:</strong> Kartik Nilekani</p>
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
