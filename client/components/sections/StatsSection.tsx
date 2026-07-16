"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Stat } from "@/types";

const stats: Stat[] = [
  { id: 1, value: "10,000", label: "Registered donors", suffix: "+" },
  { id: 2, value: "5,200", label: "Requests fulfilled", suffix: "+" },
  { id: 3, value: "200", label: "Partner hospitals", suffix: "+" },
  { id: 4, value: "50", label: "Cities covered", suffix: "+" },
];

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="stats"
      aria-label="BloodLink Statistics"
      className="relative overflow-hidden bg-slate-950 py-16 sm:py-20"
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" aria-hidden="true" />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-transparent to-slate-950 pointer-events-none" aria-hidden="true" />

      <div className="container-custom relative z-10" ref={ref}>
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white tracking-tight mb-3">
            BloodLink by the numbers
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Real impact. Real lives saved. Join a growing network of donors
            making a difference every day.
          </p>
        </motion.div>

        {/* Stats */}
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className={[
                "flex flex-col items-center text-center px-4 py-7 rounded-2xl",
                "border border-slate-800 bg-slate-900/60 backdrop-blur-sm",
                "hover:border-red-900/50 hover:bg-slate-900 transition-all duration-300",
              ].join(" ")}
            >
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {stat.value}{stat.suffix}
                </span>
                <span className="block text-sm text-slate-400 mt-2 font-medium">
                  {stat.label}
                </span>
              </dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  );
}
