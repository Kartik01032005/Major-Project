"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaDroplet } from "react-icons/fa6";
import { FiArrowRight, FiActivity, FiMapPin } from "react-icons/fi";
import Button from "@/components/ui/Button";
import { useTranslation } from "@/context";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1 },
  }),
};

const bloodGroups = ["A+", "B+", "O+", "AB+", "A−", "B−", "O−", "AB−"];

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section
      id="home"
      aria-label="BloodLink – Hero"
      className="relative min-h-screen flex items-center bg-white dark:bg-slate-950 overflow-hidden"
    >
      {/* ── Background ───────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-grid opacity-100 pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white dark:from-slate-950 dark:via-transparent dark:to-slate-950 pointer-events-none" />

      {/* Soft glow */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-red-500/5 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/4 blur-3xl pointer-events-none" aria-hidden="true" />

      {/* Floating blood group badges */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {bloodGroups.map((g, i) => (
          <motion.span
            key={g}
            className="absolute text-[11px] font-bold px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 shadow-sm select-none"
            style={{
              left: i % 2 === 0 ? `${6 + (i * 7) % 18}%` : undefined,
              right: i % 2 !== 0 ? `${4 + (i * 9) % 16}%` : undefined,
              top: `${12 + (i * 9) % 72}%`,
            }}
            animate={{ y: [0, -10, 0], opacity: [0.5, 0.9, 0.5] }}
            transition={{
              repeat: Infinity,
              duration: 3.5 + i * 0.5,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
          >
            {g}
          </motion.span>
        ))}
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="container-custom relative z-10 py-24 lg:py-0 lg:min-h-screen lg:flex lg:items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">

          {/* Left: Copy */}
          <div className="max-w-xl">
            {/* Badge */}
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <span className="section-badge mb-6">
                <FaDroplet size={10} aria-hidden="true" />
                {t("hero_badge")}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="display-xl text-slate-900 dark:text-white mt-4 mb-5"
            >
              {t("hero_headline_1")}{" "}
              <span className="gradient-text">{t("hero_headline_2")}</span>
              <br />
              {t("hero_headline_3")}
            </motion.h1>

            {/* Subtext */}
            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="body-lg mb-8 text-slate-500 dark:text-slate-400"
            >
              {t("hero_sub")}
            </motion.p>

            {/* CTA Row */}
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap items-center gap-3 mb-10"
            >
              <Button
                variant="primary"
                size="lg"
                href="/register"
                icon={<FiArrowRight size={15} />}
                iconPosition="right"
              >
                {t("hero_cta_primary")}
              </Button>
              <Button variant="outline" size="lg" href="/#how-it-works">
                {t("hero_cta_secondary")}
              </Button>
            </motion.div>

            {/* Trust stats */}
            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800"
            >
              {[
                { value: "10K+", label: t("hero_stat_donors") },
                { value: "5K+", label: t("hero_stat_fulfilled") },
                { value: "200+", label: t("hero_stat_hospitals") },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {s.value}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Visual dashboard card */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="hidden lg:block relative"
          >
            {/* Main card */}
            <div className="relative z-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-float">
              {/* Header bar */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs text-slate-400 font-mono">bloodlink.app</span>
              </div>

              <div className="p-6 space-y-4">
                {/* Alert card */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                    <FiActivity size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Emergency Alert — O+
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Apollo Hospital, Mysore — 1.2 km
                    </p>
                  </div>
                  <span className="ml-auto shrink-0 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded-full">
                    LIVE
                  </span>
                </div>

                {/* Blood inventory mini */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5 uppercase tracking-wider">
                    {t("hero_live_inventory")}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { group: "O+", pct: 78, color: "bg-emerald-500" },
                      { group: "A+", pct: 45, color: "bg-blue-500" },
                      { group: "B+", pct: 60, color: "bg-violet-500" },
                      { group: "AB−", pct: 12, color: "bg-amber-500" },
                    ].map((b) => (
                      <div key={b.group} className="flex flex-col items-center gap-1.5">
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${b.color}`}
                            style={{ width: `${b.pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          {b.group}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location row */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <FiMapPin size={14} className="text-red-500 shrink-0" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    3 {t("hero_blood_banks_nearby")}
                  </span>
                </div>

                {/* CTA button */}
                <button
                  type="button"
                  className="w-full h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-[0_4px_14px_0_rgb(220_38_38_/_0.3)]"
                >
                  {t("hero_request_emergency")}
                </button>
              </div>
            </div>

            {/* Floating notification */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
              className="absolute -bottom-4 -left-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl px-4 py-3 z-20"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {t("hero_donor_found")}
                  </p>
                  <p className="text-[10px] text-slate-500">{t("hero_seconds_ago")}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2"
        animate={{ y: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        aria-hidden="true"
      >
        <div className="w-[22px] h-[36px] rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-start justify-center pt-1.5">
          <div className="w-1 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600" />
        </div>
      </motion.div>
    </section>
  );
}
