"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMap, FiNavigation, FiPhone, FiMapPin, FiSearch,
  FiFilter, FiAlertCircle, FiLoader,
} from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useGeolocation } from "@/hooks";
import MapContainer from "@/components/map/MapContainer";
import { MapBloodBank, BloodGroup } from "@/types";

// ─── Mock Data with real coordinates (Bangalore / Karnataka) ──────────────────

const BLOOD_BANKS: MapBloodBank[] = [
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
    position: { lat: 12.9016, lng: 77.5945 },
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
    position: { lat: 12.9592, lng: 77.6493 },
  },
  {
    id: "bb-3",
    name: "Victoria Hospital Blood Bank",
    address: "K.R. Road, Fort Area",
    district: "Bangalore",
    state: "Karnataka",
    phone: "9876500003",
    distance: "5.2 km",
    available: ["A+", "A-", "B+", "O-"],
    open: true,
    position: { lat: 12.9678, lng: 77.5706 },
  },
  {
    id: "bb-4",
    name: "Bowring Hospital Blood Bank",
    address: "Shivaji Nagar",
    district: "Bangalore",
    state: "Karnataka",
    phone: "9876500004",
    distance: "6.0 km",
    available: ["AB-", "AB+"],
    open: false,
    position: { lat: 12.9789, lng: 77.6204 },
  },
  {
    id: "bb-5",
    name: "KMC Blood Bank",
    address: "Dr. B.R. Ambedkar Circle",
    district: "Mysore",
    state: "Karnataka",
    phone: "9876500005",
    distance: "6.8 km",
    available: ["A-", "B+"],
    open: true,
    position: { lat: 12.2958, lng: 76.6394 },
  },
  {
    id: "bb-6",
    name: "JSS Blood Bank",
    address: "MG Road, Mysore",
    district: "Mysore",
    state: "Karnataka",
    phone: "9876500006",
    distance: "9.1 km",
    available: ["O+", "B+", "A+"],
    open: false,
    position: { lat: 12.3052, lng: 76.6551 },
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

const ALL_BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function NearbyPage() {
  const { position, isUsingDefault, loading: geoLoading, error: geoError, refetch } = useGeolocation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [bgFilter, setBgFilter] = useState<BloodGroup | "all">("all");
  const [showOpenOnly, setShowOpenOnly] = useState(false);

  const filtered = useMemo(() => {
    return BLOOD_BANKS.filter((bank) => {
      const matchSearch =
        bank.name.toLowerCase().includes(search.toLowerCase()) ||
        bank.district.toLowerCase().includes(search.toLowerCase()) ||
        bank.address.toLowerCase().includes(search.toLowerCase());
      const matchBg = bgFilter === "all" || bank.available.includes(bgFilter as BloodGroup);
      const matchOpen = !showOpenOnly || bank.open;
      return matchSearch && matchBg && matchOpen;
    });
  }, [search, bgFilter, showOpenOnly]);

  const mapCenter = selectedId
    ? BLOOD_BANKS.find((b) => b.id === selectedId)?.position ?? position
    : position;

  const openMaps = (bank: MapBloodBank) => {
    const q = encodeURIComponent(`${bank.name}, ${bank.address}, ${bank.district}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiMap className="text-red-600" size={20} />
            Nearby Blood Banks
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {filtered.length} of {BLOOD_BANKS.length} banks shown
          </p>
        </div>

        {/* Find Near Me */}
        <button
          onClick={refetch}
          disabled={geoLoading}
          className={[
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
            "bg-red-600 text-white hover:bg-red-700 shadow-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
            geoLoading ? "opacity-70 cursor-not-allowed" : "hover:shadow-md",
          ].join(" ")}
          aria-label="Find blood banks near my location"
        >
          {geoLoading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Locating…</>
          ) : (
            <><FiNavigation size={15} /> Find Near Me</>
          )}
        </button>
      </div>

      {/* Geolocation status bar */}
      <AnimatePresence>
        {(geoError || isUsingDefault) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className={[
              "flex items-start gap-2 px-4 py-2.5 rounded-xl text-xs",
              geoError
                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
            ].join(" ")}>
              <FiAlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>
                {geoError ?? "Showing Bengaluru as default location. Click \"Find Near Me\" to use your actual location."}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout: map + list */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* ── Left Panel: Filters + List ──────────────────────────────── */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bank name or area…"
              className={[
                "w-full h-10 pl-9 pr-4 rounded-xl border text-sm",
                "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
                "border-slate-200 dark:border-slate-700",
                "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500",
                "placeholder:text-slate-400",
              ].join(" ")}
              aria-label="Search blood banks"
            />
          </div>

          {/* Blood group filter chips */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <FiFilter size={10} /> Filter by Blood Group
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setBgFilter("all")}
                className={[
                  "text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all",
                  bgFilter === "all"
                    ? "bg-red-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
                ].join(" ")}
              >
                All
              </button>
              {ALL_BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  onClick={() => setBgFilter(bg === bgFilter ? "all" : bg)}
                  className={[
                    "text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1",
                    bgFilter === bg
                      ? "bg-red-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
                  ].join(" ")}
                >
                  <FaDroplet size={8} /> {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Open only toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={[
              "relative w-9 h-5 rounded-full transition-colors",
              showOpenOnly ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600",
            ].join(" ")}>
              <span className={[
                "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all",
                showOpenOnly ? "left-4.5" : "left-0.5",
              ].join(" ")} />
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Open now only
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={showOpenOnly}
              onChange={(e) => setShowOpenOnly(e.target.checked)}
              aria-label="Show open blood banks only"
            />
          </label>

          {/* Bank list */}
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[420px] lg:max-h-[calc(100vh-18rem)] pr-0.5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                  <FiMap size={18} />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">No blood banks match your filters</p>
              </div>
            ) : (
              filtered.map((bank, i) => (
                <motion.button
                  key={bank.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedId(bank.id === selectedId ? null : bank.id)}
                  className={[
                    "w-full text-left rounded-2xl border p-4 transition-all",
                    selectedId === bank.id
                      ? "border-red-500 bg-red-50/60 dark:bg-red-950/20 shadow-md"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-red-300 dark:hover:border-red-700 hover:shadow-sm",
                  ].join(" ")}
                  aria-pressed={selectedId === bank.id}
                  aria-label={`Select ${bank.name}`}
                >
                  {/* Name + status */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
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

                  {/* Address + distance */}
                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                    <FiMapPin size={11} className="flex-shrink-0" />
                    <span className="truncate">{bank.address} · <strong>{bank.distance}</strong></span>
                  </div>

                  {/* Blood group badges */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {bank.available.map((bg) => (
                      <span
                        key={bg}
                        className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${BLOOD_GROUP_COLORS[bg]}`}
                      >
                        <FaDroplet size={8} /> {bg}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openMaps(bank); }}
                      className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                      aria-label={`Navigate to ${bank.name}`}
                    >
                      <FiNavigation size={11} /> Navigate
                    </button>
                    <a
                      href={`tel:${bank.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      aria-label={`Call ${bank.name}`}
                    >
                      <FiPhone size={11} /> Call
                    </a>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>

        {/* ── Right Panel: Map ─────────────────────────────────────────── */}
        <div className="flex-1 min-h-[300px] lg:min-h-0">
          <MapContainer
            center={mapCenter}
            zoom={selectedId ? 15 : 12}
            height="h-full min-h-[320px] lg:min-h-[calc(100vh-12rem)]"
            bloodBanks={filtered}
            userPosition={isUsingDefault ? null : position}
            onBloodBankSelect={(bank) => setSelectedId(bank.id)}
          />
        </div>
      </div>
    </div>
  );
}
