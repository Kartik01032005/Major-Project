"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaDroplet } from "react-icons/fa6";
import { FiArrowRight } from "react-icons/fi";
import Button from "@/components/ui/Button";
import { useTranslation } from "@/context";

export default function CTASection() {
  const { t } = useTranslation();

  return (
    <section
      id="cta"
      aria-label="Call to Action – Join BloodLink"
      className="section-padding bg-slate-50 dark:bg-slate-900/50"
    >
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65 }}
          className="relative overflow-hidden rounded-3xl gradient-bg"
        >
          {/* Decoration */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 right-0 w-72 h-72 rounded-full bg-white/5" />
            {/* Large watermark drop */}
            <FaDroplet
              size={260}
              className="absolute -right-10 -bottom-10 text-white/5"
              aria-hidden="true"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center px-8 py-16 sm:px-16 sm:py-20 gap-6 max-w-2xl mx-auto">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              aria-hidden="true"
            >
              <FaDroplet size={44} className="text-white/70" />
            </motion.div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {t("cta_title")}
            </h2>

            <p className="text-base text-red-100 leading-relaxed">
              {t("cta_sub")}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="lg"
                href="/register"
                icon={<FiArrowRight size={15} />}
                iconPosition="right"
              >
                {t("cta_primary")}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                href="/register?role=admin"
                icon={<FiArrowRight size={15} />}
                iconPosition="right"
              >
                {t("cta_secondary")}
              </Button>
            </div>

            <p className="text-xs text-red-200 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" aria-hidden="true" />
              {t("cta_note")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
