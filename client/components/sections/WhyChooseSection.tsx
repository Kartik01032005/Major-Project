"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { FaDroplet } from "react-icons/fa6";
import { FiCheck } from "react-icons/fi";
import { WhyPoint } from "@/types";
import { useTranslation } from "@/context";

const points: WhyPoint[] = [
  {
    id: 1,
    title: "Real-time notifications",
    description: "Socket.IO powered alerts reach donors and banks in milliseconds.",
  },
  {
    id: 2,
    title: "Verified blood banks",
    description: "Only verified, trusted blood banks and hospitals are listed.",
  },
  {
    id: 3,
    title: "Zero learning curve",
    description: "Intuitive interface designed for all users, even during emergencies.",
  },
  {
    id: 4,
    title: "Location-aware search",
    description: "OpenStreetMap & Leaflet auto-detect your location to find the nearest bank.",
  },
  {
    id: 5,
    title: "Role-based dashboards",
    description: "Separate views for donors and blood bank administrators.",
  },
  {
    id: 6,
    title: "Production-grade security",
    description: "JWT auth, bcrypt hashing, and env-secured APIs protect every user.",
  },
  {
    id: 7,
    title: "99.9% uptime",
    description: "Hosted on Vercel and Render — ready when every second counts.",
  },
  {
    id: 8,
    title: "Open source",
    description: "Built transparently. Community contributions always welcome.",
  },
];

const list: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

export default function WhyChooseSection() {
  const { t } = useTranslation();

  return (
    <section
      id="why-choose"
      aria-label="Why Choose BloodLink"
      className="section-padding bg-white dark:bg-slate-950"
    >
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: Highlight card */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative rounded-2xl gradient-bg overflow-hidden p-8 lg:p-10">
              {/* Subtle decoration */}
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute -bottom-14 -left-6 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />

              <div className="relative z-10 space-y-5">
                <FaDroplet size={40} className="text-white/60 animate-heartbeat" aria-hidden="true" />

                <h3 className="text-2xl font-bold text-white leading-tight">
                  The fastest path to blood in an emergency
                </h3>
                <p className="text-sm text-red-200 leading-relaxed">
                  Traditional methods take hours. BloodLink takes seconds —
                  real-time alerts, live inventory, OpenStreetMap navigation,
                  all in one platform.
                </p>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    { value: "< 30s", label: "Alert delivery" },
                    { value: "24/7", label: "Always available" },
                    { value: "200+", label: "Partner hospitals" },
                    { value: "8", label: "Blood groups" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/10"
                    >
                      <div className="text-lg font-bold text-white">{s.value}</div>
                      <div className="text-xs text-red-200 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Points */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55 }}
              className="mb-8"
            >
              <span className="section-badge mb-4">
                <FaDroplet size={10} aria-hidden="true" />
                {t("why_badge")}
              </span>
              <h2 className="display-lg text-slate-900 dark:text-white mt-4">
                {t("why_title")}
              </h2>
            </motion.div>

            <motion.ul
              variants={list}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              role="list"
            >
              {points.map((p) => (
                <motion.li
                  key={p.id}
                  variants={item}
                  className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200"
                >
                  <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center shrink-0 mt-0.5">
                    <FiCheck size={11} className="text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {p.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </div>
      </div>
    </section>
  );
}
