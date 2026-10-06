"use client";

import React, { useState } from "react";
import { FiFileText } from "react-icons/fi";
import SettingsModal from "./SettingsModal";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "privacy" | "terms";
}

export default function LegalModal({
  isOpen,
  onClose,
  defaultTab = "privacy",
}: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<"privacy" | "terms">(defaultTab);

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title={activeTab === "privacy" ? "Privacy Policy" : "Terms & Conditions"}
      description="Legal agreements governing BloodLink user privacy and donor safety."
      icon={<FiFileText size={20} />}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={[
              "px-4 py-2 text-xs font-semibold border-b-2 transition-colors",
              activeTab === "privacy"
                ? "border-red-600 text-red-600 dark:text-red-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
            ].join(" ")}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("terms")}
            className={[
              "px-4 py-2 text-xs font-semibold border-b-2 transition-colors",
              activeTab === "terms"
                ? "border-red-600 text-red-600 dark:text-red-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
            ].join(" ")}
          >
            Terms & Conditions
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[50vh] overflow-y-auto pr-2 text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
          {activeTab === "privacy" ? (
            <>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  1. Information We Collect
                </h4>
                <p>
                  BloodLink collects personal identification information (name, contact number, email address), health indicators (blood group, donation eligibility history), and approximate geospatial coordinates exclusively for emergency blood dispatching and donor matching.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  2. Use and Protection of Your Data
                </h4>
                <p>
                  Your phone number and precise location are protected. In accordance with your Privacy Settings, your phone number remains shielded until an explicit emergency request is accepted. We never sell, lease, or monetize donor medical data to third-party advertising partners.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  3. Emergency Communication
                </h4>
                <p>
                  Critical emergency blood notifications are dispatched to registered donors within matching geographic radiuses to facilitate rapid medical triage during severe patient shortages.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  1. Voluntary Participation
                </h4>
                <p>
                  Blood donation is strictly voluntary and altruistic. In accordance with national healthcare laws, BloodLink prohibits any monetary exchange, compensation, or commercial trading for blood donations.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  2. Medical Disclaimer
                </h4>
                <p>
                  BloodLink serves as a digital coordination conduit between verified hospitals, donors, and recipients. Physical suitability for blood donation must always be examined and certified by qualified medical professionals at registered blood banks prior to donation.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  3. Code of Conduct
                </h4>
                <p>
                  Users must provide truthful details regarding blood group, location, and emergency requirements. Malicious requests or harassment will result in immediate permanent account termination.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </SettingsModal>
  );
}
