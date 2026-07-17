"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiMap, FiPhone, FiNavigation, FiMapPin } from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";

interface BloodBank {
  id: string;
  name: string;
  address: string;
  district: string;
  state: string;
  phone: string;
  distance: string;
  available: string[];
  open: boolean;
}

const MOCK_BLOOD_BANKS: BloodBank[] = [
  {
    id: "bb-1",
    name: "Apollo Blood Bank",
    address: "Bannerghatta Road, JP Nagar",
    district: "Bangalore",
    state: "Karnataka",
    phone: "9876500001",
    distance: "2.4 km",
    available: ["A+", "O+", "B+", "AB+"],
    open: true,
  },
  {
    id: "bb-2",
    name: "Manipal Blood Centre",
    address: "Old Airport Road, Kodihalli",
    district: "Bangalore",
    state: "Karnataka",
    phone: "9876500002",
    distance: "4.1 km",
    available: ["O+", "O-", "B-"],
    open: true,
  },
  {
    id: "bb-3",
    name: "KMC Blood Bank",
    address: "Dr. B. R. Ambedkar Circle",
    district: "Mysore",
    state: "Karnataka",
    phone: "9876500003",
    distance: "6.8 km",
    available: ["A-", "AB-", "B+"],
    open: false,
  },
];

const BLOOD_GROUP_COLORS: Record<string, string> = {
  "A+": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "A-": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "B+": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "B-": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "AB+": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "AB-": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "O+": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "O-": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

export default function NearbyBloodBanksCard() {
  const openMaps = (bank: BloodBank) => {
    const query = encodeURIComponent(`${bank.name}, ${bank.address}, ${bank.district}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600">
            <FiMap size={15} />
          </span>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Nearby Blood Banks</h3>
        </div>
        <span className="text-[11px] text-slate-400">Mock data · Maps coming soon</span>
      </div>

      {/* Map placeholder */}
      <div className="relative h-32 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="relative z-10 flex flex-col items-center text-slate-400 dark:text-slate-500">
          <FiMap size={28} className="mb-1.5" />
          <p className="text-xs font-medium">Google Maps Integration</p>
          <p className="text-[10px]">Coming in Maps Sprint</p>
        </div>
        {/* Decorative pins */}
        {[
          { top: "30%", left: "25%", bg: "bg-red-600" },
          { top: "50%", left: "55%", bg: "bg-blue-600" },
          { top: "20%", left: "70%", bg: "bg-emerald-600" },
        ].map((pin, i) => (
          <div
            key={i}
            className={`absolute w-4 h-4 rounded-full ${pin.bg} border-2 border-white dark:border-slate-900 shadow-md`}
            style={{ top: pin.top, left: pin.left }}
          />
        ))}
      </div>

      {/* Bank List */}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {MOCK_BLOOD_BANKS.map((bank, i) => (
          <motion.li
            key={bank.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="px-5 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Name + open status */}
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{bank.name}</p>
                  <span className={[
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0",
                    bank.open
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                  ].join(" ")}>
                    {bank.open ? "Open" : "Closed"}
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                  <FiMapPin size={11} className="flex-shrink-0" />
                  <span className="truncate">{bank.address} · {bank.distance}</span>
                </div>

                {/* Available blood groups */}
                <div className="flex flex-wrap gap-1">
                  {bank.available.map((bg) => (
                    <span
                      key={bg}
                      className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${BLOOD_GROUP_COLORS[bg]}`}
                    >
                      <FaDroplet size={9} /> {bg}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button
                  onClick={() => openMaps(bank)}
                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  aria-label={`Navigate to ${bank.name}`}
                >
                  <FiNavigation size={11} /> Navigate
                </button>
                <a
                  href={`tel:${bank.phone}`}
                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  aria-label={`Call ${bank.name}`}
                >
                  <FiPhone size={11} /> Call
                </a>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
