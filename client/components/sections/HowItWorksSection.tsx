"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaDroplet } from "react-icons/fa6";
import { FiUserPlus, FiAlertTriangle, FiNavigation } from "react-icons/fi";
import { Step } from "@/types";

const steps: Step[] = [
  {
    id: 1,
    step: "01",
    title: "Create your account",
    description:
      "Register in seconds. Enter your location and role. Your profile is ready to save lives immediately.",
  },
  {
    id: 2,
    step: "02",
    title: "Submit an emergency request",
    description:
      "When blood is needed urgently, post a request with blood group, hospital, and contact details. Nearby donors are notified instantly.",
  },
  {
    id: 3,
    step: "03",
    title: "Connect and navigate",
    description:
      "Donors and blood banks respond in real time. Once approved, Google Maps guides you directly to the nearest blood source.",
  },
];

const stepIcons = [FiUserPlus, FiAlertTriangle, FiNavigation];

const stepColors = [
  { ring: "ring-blue-100 dark:ring-blue-900/30", icon: "bg-blue-600", label: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50" },
  { ring: "ring-red-100 dark:ring-red-900/30", icon: "bg-red-600", label: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50" },
  { ring: "ring-emerald-100 dark:ring-emerald-900/30", icon: "bg-emerald-600", label: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50" },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-label="How BloodLink Works"
      className="section-padding bg-slate-50 dark:bg-slate-900/50"
    >
      <div className="container-custom">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <span className="section-badge mb-4">
            <FaDroplet size={10} aria-hidden="true" />
            How It Works
          </span>
          <h2 className="display-lg text-slate-900 dark:text-white mt-4 mb-4">
            Three steps.{" "}
            <span className="gradient-text">Life-saving results.</span>
          </h2>
          <p className="body-lg text-slate-500 dark:text-slate-400">
            BloodLink is designed to be fast and intuitive — even in
            the most critical moments.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop only) */}
          <div
            className="hidden lg:block absolute top-10 left-[calc(50%/3+4rem)] right-[calc(50%/3+4rem)] h-px bg-slate-200 dark:bg-slate-800 z-0"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {steps.map(({ id, step, title, description }, i) => {
              const Icon = stepIcons[i];
              const colors = stepColors[i];

              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.55, delay: i * 0.15 }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Step number + icon */}
                  <div className={`relative w-20 h-20 rounded-2xl ${colors.icon} flex items-center justify-center shadow-lg mb-5 ring-4 ${colors.ring}`}>
                    <Icon size={28} className="text-white" aria-hidden="true" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                      {step}
                    </span>
                  </div>

                  <span className={`text-xs font-semibold px-3 py-1 rounded-full mb-3 ${colors.label}`}>
                    Step {step}
                  </span>

                  <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[260px]">
                    {description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
