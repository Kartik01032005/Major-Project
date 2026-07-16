"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaDroplet } from "react-icons/fa6";
import { FiHeart, FiUsers, FiShield } from "react-icons/fi";
import Card from "@/components/ui/Card";

const pillars = [
  {
    id: 1,
    icon: FiHeart,
    title: "Our Mission",
    description:
      "Drastically reduce the time to locate blood during emergencies by creating a real-time, connected platform for donors, blood banks, and hospitals.",
  },
  {
    id: 2,
    icon: FiUsers,
    title: "Who We Serve",
    description:
      "Blood donors, patients in urgent need, hospital administrators managing inventory, and blood banks tracking stock in real time.",
  },
  {
    id: 3,
    icon: FiShield,
    title: "Our Commitment",
    description:
      "Data security, user privacy, and system reliability come first. Your information is encrypted and never shared without consent.",
  },
];

const iconColors = [
  { bg: "bg-red-50 dark:bg-red-950/50", icon: "text-red-600" },
  { bg: "bg-blue-50 dark:bg-blue-950/50", icon: "text-blue-600" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/50", icon: "text-emerald-600" },
];

export default function AboutSection() {
  return (
    <section
      id="about"
      aria-label="About BloodLink"
      className="section-padding bg-slate-50 dark:bg-slate-900/50"
    >
      <div className="container-custom">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="max-w-2xl mx-auto text-center mb-14"
        >
          <span className="section-badge mb-4">About BloodLink</span>
          <h2 className="display-lg text-slate-900 dark:text-white mt-4 mb-4">
            What is <span className="gradient-text">BloodLink</span>?
          </h2>
          <p className="body-lg text-slate-500 dark:text-slate-400">
            A modern full-stack platform that bridges the gap between blood donors
            and patients in critical need — powered by real-time technology
            and a clean, intuitive experience.
          </p>
        </motion.div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pillars.map(({ id, icon: Icon, title, description }, i) => {
            const colors = iconColors[i];
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.55, delay: i * 0.12 }}
              >
                <Card hover padding="lg" className="h-full">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg} mb-5`}>
                    <Icon size={18} className={colors.icon} aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Story banner */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 relative overflow-hidden rounded-2xl gradient-bg px-8 py-10 lg:px-12"
        >
          {/* Decorative */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -bottom-16 -left-8 w-60 h-60 rounded-full bg-white/5" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="max-w-lg">
              <h3 className="text-xl font-bold text-white mb-2">
                Built to Save Lives
              </h3>
              <p className="text-sm text-red-200 leading-relaxed">
                Every year, millions face emergencies where blood is unavailable at
                the right time. BloodLink closes this gap — one notification at a time.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 opacity-60">
              <FaDroplet size={40} className="text-white animate-heartbeat" aria-hidden="true" />
              <FaDroplet size={56} className="text-white animate-heartbeat" style={{ animationDelay: "0.2s" }} aria-hidden="true" />
              <FaDroplet size={40} className="text-white animate-heartbeat" style={{ animationDelay: "0.4s" }} aria-hidden="true" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
