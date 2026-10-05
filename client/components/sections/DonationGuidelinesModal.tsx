"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiShield,
  FiExternalLink,
  FiBookOpen,
  FiActivity,
  FiFileText,
} from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useTranslation } from "@/context";

interface DonationGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DonationGuidelinesModal({
  isOpen,
  onClose,
}: DonationGuidelinesModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"core" | "deferral" | "process" | "sources">("core");

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guidelines-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center text-lg flex-shrink-0">
                <FaDroplet size={18} />
              </span>
              <div>
                <h2
                  id="guidelines-modal-title"
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
                >
                  {t("eligibility_modal_title")}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Authoritative criteria according to e-RaktKosh (MoHFW, Govt. of India) & WHO
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={t("eligibility_close")}
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("core")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "core"
                  ? "border-red-600 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FiCheckCircle size={14} />
              <span>{t("eligibility_tab_core")}</span>
            </button>

            <button
              onClick={() => setActiveTab("deferral")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "deferral"
                  ? "border-red-600 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FiClock size={14} />
              <span>{t("eligibility_tab_deferral")}</span>
            </button>

            <button
              onClick={() => setActiveTab("process")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "process"
                  ? "border-red-600 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FiActivity size={14} />
              <span>{t("eligibility_tab_process")}</span>
            </button>

            <button
              onClick={() => setActiveTab("sources")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "sources"
                  ? "border-red-600 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FiBookOpen size={14} />
              <span>{t("eligibility_tab_sources")}</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6 text-sm">
            {/* Tab 1: Core Criteria */}
            {activeTab === "core" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Age Requirement
                    </p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      18 to 65 Years
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Indian statutory limit (Drugs and Cosmetics Rules & e-RaktKosh). First-time donors should ideally be under 60.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Minimum Weight
                    </p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      ≥ 45 kg (350 ml) / ≥ 50 kg (450 ml)
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Ensures the donor retains safe blood volume during and following the collection.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Hemoglobin Level
                    </p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      ≥ 12.5 g/dL
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Tested via a quick pre-donation finger-prick test to safeguard against anemia.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Donation Interval
                    </p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      90 Days (Men) / 120 Days (Women)
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Allows full replenishment of red blood cells and iron stores prior to donating again.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FiActivity className="text-red-500" />
                    <span>Vital Signs Screening at Blood Bank</span>
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Pulse: 60 - 100 bpm (regular)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>BP: 100-140 / 60-90 mmHg</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Body Temp: Normal (afebrile)</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 2: Deferral Periods */}
            {activeTab === "deferral" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
                  <FiAlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={17} />
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    <strong>Temporary Deferral</strong> means you are temporarily ineligible to donate blood for your own safety or patient safety. Once the deferral window passes, you are welcome to donate.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-white mb-0.5">Tattoos & Body Piercings</p>
                    <p className="text-red-600 dark:text-red-400 font-semibold mb-1">Deferral: 12 Months</p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Standard Indian NBTC/e-RaktKosh guideline to rule out blood-borne transmissible agents.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-white mb-0.5">Major / Minor Surgery</p>
                    <p className="text-red-600 dark:text-red-400 font-semibold mb-1">Deferral: 6 to 12 Months</p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Depends on surgical procedure, healing, and blood transfusion received during care.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-white mb-0.5">Pregnancy & Lactation</p>
                    <p className="text-red-600 dark:text-red-400 font-semibold mb-1">Deferral: 12 Months Post-Delivery</p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Deferred during pregnancy and while actively breastfeeding to preserve maternal iron reserves.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-white mb-0.5">Dental Extractions</p>
                    <p className="text-red-600 dark:text-red-400 font-semibold mb-1">Deferral: 3 to 7 Days</p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Until oral tissue has completely healed and no signs of localized infection remain.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-white mb-0.5">Infections & Antibiotics</p>
                    <p className="text-red-600 dark:text-red-400 font-semibold mb-1">Deferral: 7 to 14 Days Post-Course</p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Must be completely symptom-free and finished with prescription antibiotic regimen.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-white mb-0.5">Alcohol Consumption</p>
                    <p className="text-red-600 dark:text-red-400 font-semibold mb-1">Deferral: 24 Hours</p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Avoid alcohol for at least 24 hours prior to donation to prevent dehydration.
                    </p>
                  </div>
                </div>

                {/* Permanent Deferrals Note */}
                <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/40 text-xs">
                  <p className="font-bold text-red-900 dark:text-red-300 mb-1">Permanent Deferral Conditions</p>
                  <p className="text-red-700 dark:text-red-400 leading-relaxed">
                    Persons with chronic cardiac, renal, or hepatic disease, active malignancies, coagulopathies, or positive tests for HIV 1/2, Hepatitis B (HBsAg), Hepatitis C (HCV), or Syphilis cannot donate blood.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Donation Process */}
            {activeTab === "process" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  A typical whole blood donation takes less than 30 minutes in total, with the needle collection taking only 8 to 10 minutes:
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">Registration & Questionnaire</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Donor completes an official health history questionnaire and presents a valid photo ID.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">Mini Physical Checkup</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        A healthcare professional checks your hemoglobin (finger-prick), blood pressure, pulse, and weight.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">Safe Blood Collection</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Performed using brand-new, sterile, single-use disposable kits in sanitized environment (8–10 mins).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">Rest & Refreshment</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Donors rest for 10–15 minutes and enjoy light refreshments/fluids before returning to normal activity.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Medical Sources */}
            {activeTab === "sources" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
                  <FiShield className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={17} />
                  <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                    BloodLink does not invent or guess medical rules. All displayed criteria are directly traceable to statutory regulations and official medical bodies.
                  </p>
                </div>

                <div className="space-y-3">
                  <a
                    href="https://eraktkosh.mohfw.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-900 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-red-600 transition-colors flex items-center gap-1.5">
                        <span>e-RaktKosh – National Blood Transfusion Initiative</span>
                        <FiExternalLink size={12} />
                      </p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        Govt. of India
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Ministry of Health & Family Welfare, Government of India. Official donor eligibility criteria and blood bank operational rules under the Drugs and Cosmetics Act.
                    </p>
                  </a>

                  <a
                    href="https://www.who.int/campaigns/world-blood-donor-day"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-900 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-red-600 transition-colors flex items-center gap-1.5">
                        <span>World Health Organization (WHO) – Blood Donor Selection</span>
                        <FiExternalLink size={12} />
                      </p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        International
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Global framework on voluntary non-remunerated blood donation and medical recommendations for donor screening and safety.
                    </p>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Footer Notice & Close Button */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 text-[11px] leading-tight">
              <FiAlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={13} />
              <span>
                Final eligibility is determined solely by the qualified medical staff at the licensed blood center following formal health screening.
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              {t("eligibility_close")}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
