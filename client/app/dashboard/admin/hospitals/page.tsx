"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FiMapPin, FiPhone, FiSearch, FiNavigation, FiPlus,
} from "react-icons/fi";
import { useDashboard } from "@/context";
import MapContainer from "@/components/map/MapContainer";
import HospitalManagement from "@/components/dashboard/admin/HospitalManagement";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";
import { MapHospital } from "@/types";

// Default coordinates for Karnataka hospitals (seeded mock data)
// Real lat/lng will come from the backend in a future sprint
const DEFAULT_HOSPITAL_COORDS: Record<string, { lat: number; lng: number }> = {
  "Apollo Blood Bank & Hospital":    { lat: 12.9016, lng: 77.5945 },
  "Manipal Blood Centre":            { lat: 12.9592, lng: 77.6493 },
  "KMC Hospital & Blood Bank":       { lat: 12.2958, lng: 76.6394 },
  "Victoria Hospital Blood Bank":    { lat: 12.9678, lng: 77.5706 },
  "Bowring Hospital":                { lat: 12.9789, lng: 77.6204 },
};

const FALLBACK_SPREAD = [
  { lat: 12.9200, lng: 77.5700 },
  { lat: 12.9400, lng: 77.6000 },
  { lat: 12.9600, lng: 77.6300 },
  { lat: 12.9800, lng: 77.5500 },
  { lat: 12.9000, lng: 77.6100 },
  { lat: 12.9300, lng: 77.5800 },
];

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 }; // Bangalore

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminHospitalsMapPage() {
  const { hospitals } = useDashboard();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return hospitals.filter((h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.district.toLowerCase().includes(search.toLowerCase()) ||
      h.state.toLowerCase().includes(search.toLowerCase())
    );
  }, [hospitals, search]);

  // Map hospitals from DashboardContext → MapHospital with fallback coordinates
  const mapHospitals: MapHospital[] = useMemo(() => {
    return filtered.map((h, i) => ({
      id: h._id,
      name: h.name,
      address: h.address,
      district: h.district,
      state: h.state,
      phone: h.phone,
      position: DEFAULT_HOSPITAL_COORDS[h.name] ?? FALLBACK_SPREAD[i % FALLBACK_SPREAD.length],
    }));
  }, [filtered]);

  const selectedMapHospital = selectedId
    ? mapHospitals.find((h) => h.id === selectedId)
    : null;

  const mapCenter = selectedMapHospital?.position ?? DEFAULT_CENTER;

  const openMaps = (h: MapHospital) => {
    const q = encodeURIComponent(`${h.name}, ${h.address}, ${h.district}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiMapPin className="text-blue-600" size={20} />
              Hospital Map View
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {mapHospitals.length} hospital{mapHospitals.length !== 1 ? "s" : ""} registered
            </p>
          </div>
        </div>

        {/* Map + List split */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left: Hospital list */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
              <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search hospitals…"
                className={[
                  "w-full h-10 pl-9 pr-4 rounded-xl border text-sm",
                  "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
                  "border-slate-200 dark:border-slate-700",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500",
                  "placeholder:text-slate-400",
                ].join(" ")}
                aria-label="Search hospitals"
              />
            </div>

            {/* Hospital cards */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px] lg:max-h-[calc(100vh-20rem)] pr-0.5">
              {mapHospitals.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                    <FiMapPin size={18} />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {hospitals.length === 0 ? "No hospitals added yet." : "No results for your search."}
                  </p>
                </div>
              ) : (
                mapHospitals.map((h, i) => (
                  <motion.button
                    key={h.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedId(h.id === selectedId ? null : h.id)}
                    className={[
                      "w-full text-left rounded-2xl border p-4 transition-all",
                      selectedId === h.id
                        ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/20 shadow-md"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm",
                    ].join(" ")}
                    aria-pressed={selectedId === h.id}
                    aria-label={`Select ${h.name}`}
                  >
                    {/* Hospital icon + name */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 flex-shrink-0 mt-0.5">
                        <FiMapPin size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{h.name}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{h.address}, {h.district}</p>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                          <FiPhone size={10} /> {h.phone}
                        </div>
                      </div>
                    </div>

                    {/* Navigate button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); openMaps(h); }}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      aria-label={`Navigate to ${h.name}`}
                    >
                      <FiNavigation size={11} /> Navigate
                    </button>
                  </motion.button>
                ))
              )}
            </div>
          </div>

          {/* Right: Map */}
          <div className="flex-1 min-h-[300px] lg:min-h-0">
            <MapContainer
              center={mapCenter}
              zoom={selectedId ? 15 : 12}
              height="h-full min-h-[320px] lg:min-h-[calc(100vh-14rem)]"
              hospitals={mapHospitals}
              onHospitalSelect={(h) => setSelectedId(h.id)}
            />
          </div>
        </div>

        {/* Hospital CRUD table below */}
        <HospitalManagement />
      </div>
    </ProtectedRoute>
  );
}
