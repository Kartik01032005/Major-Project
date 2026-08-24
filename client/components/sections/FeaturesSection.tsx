"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import {
  FiBell, FiMap, FiDroplet, FiLock, FiActivity, FiSmartphone,
} from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import Card from "@/components/ui/Card";
import { useTranslation } from "@/context";

const iconMap: Record<string, React.ElementType> = {
  bell: FiBell,
  map: FiMap,
  drop: FiDroplet,
  lock: FiLock,
  activity: FiActivity,
  mobile: FiSmartphone,
};

const accentColors = [
  "text-red-600 bg-red-50 dark:bg-red-950/50",
  "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
  "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50",
  "text-violet-600 bg-violet-50 dark:bg-violet-950/50",
  "text-orange-600 bg-orange-50 dark:bg-orange-950/50",
  "text-sky-600 bg-sky-50 dark:bg-sky-950/50",
];

const grid: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const card: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FeaturesSection() {
  const { t } = useTranslation();

  const features = [
    {
      id: 1,
      icon: "bell",
      title: "Real-Time Alerts",
      description:
        "Emergency notifications reach nearby donors and blood banks in milliseconds via Socket.IO.",
    },
    {
      id: 2,
      icon: "map",
      title: "Google Maps Integration",
      description:
        "Discover nearby blood banks, view hospital locations, and get turn-by-turn navigation.",
    },
    {
      id: 3,
      icon: "drop",
      title: "Live Blood Inventory",
      description:
        "Blood banks update stock in real time. Users instantly see availability for all 8 blood groups.",
    },
    {
      id: 4,
      icon: "lock",
      title: "Secure Authentication",
      description:
        "JWT-based login with bcrypt hashing. Role-based access for donors and blood bank admins.",
    },
    {
      id: 5,
      icon: "activity",
      title: "Emergency Management",
      description:
        "Create, track, and manage emergency requests with real-time approval workflows.",
    },
    {
      id: 6,
      icon: "mobile",
      title: "Mobile-First Design",
      description:
        "Fully responsive across smartphones, tablets, and desktops for access anywhere.",
    },
  ];

  return (
    <section
      id="features"
      aria-label="BloodLink Features"
      className="section-padding bg-white dark:bg-slate-950"
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
          <span className="section-badge mb-4">
            <FaDroplet size={10} aria-hidden="true" />
            {t("features_badge")}
          </span>
          <h2 className="display-lg text-slate-900 dark:text-white mt-4 mb-4">
            {t("features_title")}
          </h2>
          <p className="body-lg text-slate-500 dark:text-slate-400">
            {t("features_sub")}
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={grid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {features.map((feature, i) => {
            const Icon = iconMap[feature.icon];
            const colors = accentColors[i];

            return (
              <motion.div key={feature.id} variants={card}>
                <Card hover padding="lg" className="h-full group">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 ${colors}`}
                    aria-hidden="true"
                  >
                    <Icon size={17} />
                  </div>

                  {/* Text */}
                  <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
