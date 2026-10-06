"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaDroplet } from "react-icons/fa6";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiBookOpen,
  FiShield,
  FiExternalLink,
  FiInfo,
} from "react-icons/fi";
import { useTranslation } from "@/context";
import DonationGuidelinesModal from "./DonationGuidelinesModal";

export default function EligibilitySection() {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);

  const checklistItems = [
    { key: "age", text: t("eligibility_check_age"), detail: "18 to 65 years" },
    { key: "weight", text: t("eligibility_check_weight"), detail: "≥ 45 kg" },
    { key: "health", text: t("eligibility_check_health"), detail: "Good overall fitness" },
    { key: "hb", text: t("eligibility_check_hb"), detail: "≥ 12.5 g/dL" },
    { key: "meds", text: t("eligibility_check_meds"), detail: "No acute infection" },
    { key: "pregnancy", text: t("eligibility_check_pregnancy"), detail: "Post-partum deferral" },
    { key: "interval", text: t("eligibility_check_interval"), detail: "3–4 months interval" },
    { key: "screening", text: t("eligibility_check_screening"), detail: "Doctor consultation" },
  ];

  return (
    <section
      id="eligibility"
      aria-label="Blood Donation Eligibility"
      className="section-padding bg-slate-50/70 dark:bg-slate-900/60 border-y border-slate-100 dark:border-slate-800/80"
    >
      <div className="container-custom">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-12"
        >
          <span className="section-badge mb-4">
            <FaDroplet size={10} aria-hidden="true" />
            {t("eligibility_badge")}
          </span>
          <h2 className="display-lg text-slate-900 dark:text-white mt-4 mb-4">
            {t("eligibility_title")}
          </h2>
          <p className="body-lg text-slate-600 dark:text-slate-300">
            {t("eligibility_sub")}
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55 }}
          className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 md:p-10 shadow-sm overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 mb-3 border border-red-100 dark:border-red-900/40">
                <FiShield size={12} />
                <span>e-RaktKosh (MoHFW) & WHO Verified</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Thinking about donating blood?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl leading-relaxed">
                Learn the basic requirements and health factors that licensed blood donation centers and transfusion services examine before every donation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-red-600 text-white hover:bg-red-700 font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md flex-shrink-0 self-start md:self-auto"
            >
              <FiBookOpen size={16} />
              <span>{t("eligibility_cta")}</span>
            </button>
          </div>

          {/* Core Factors Checklist Grid */}
          <div className="py-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-5 flex items-center gap-1.5">
              <FiInfo size={14} />
              <span>Key Criteria Evaluated by Blood Banks</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {checklistItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                    <FiCheckCircle size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      {item.text}
                    </p>
                    <span className="inline-block mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60">
                      {item.detail}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Medical Disclaimer Notice */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-900/50 flex flex-col sm:flex-row items-start gap-3.5">
            <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FiAlertTriangle size={16} />
            </span>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                {t("eligibility_disclaimer_title")}
              </p>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                {t("eligibility_disclaimer_text")}
              </p>
            </div>
          </div>

          {/* Authoritative Sources Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <FiBookOpen className="text-slate-400" size={13} />
              <span>
                <strong>{t("eligibility_sources_title")}:</strong> e-RaktKosh (MoHFW, Govt. of India) & WHO Guidelines
              </span>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1"
            >
              <span>View Full Medical Criteria</span>
              <FiExternalLink size={11} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Guidelines Modal */}
      <DonationGuidelinesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
