"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiSearch, FiMapPin, FiNavigation, FiLoader, FiAlertTriangle, FiCheck } from "react-icons/fi";
import { FaHospital } from "react-icons/fa";
import {
  fetchNearbyHospitalsOverpass,
  searchHospitalsNominatim,
  HospitalRecommendation,
} from "@/services/hospitalRecommendationService";
import { UserGpsLocation, SelectedHospital } from "@/types";

interface HospitalAutocompleteProps {
  value: string;
  onChange: (name: string) => void;
  onSelectHospital: (hospital: SelectedHospital) => void;
  onUserLocationDetected?: (location: UserGpsLocation) => void;
  error?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function HospitalAutocomplete({
  value,
  onChange,
  onSelectHospital,
  onUserLocationDetected,
  error,
  placeholder = "Search or enter hospital name...",
  className = "",
  disabled = false,
}: HospitalAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<UserGpsLocation | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "locating" | "success" | "denied" | "error">("idle");
  const [gpsErrorMessage, setGpsErrorMessage] = useState<string>("");

  const [nearbyHospitals, setNearbyHospitals] = useState<HospitalRecommendation[]>([]);
  const [searchResults, setSearchResults] = useState<HospitalRecommendation[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [searching, setSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasRequestedGpsRef = useRef(false);

  // ── 1. Acquire User Browser GPS ───────────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsStatus("error");
      setGpsErrorMessage("Geolocation is not supported by your browser.");
      return;
    }

    setGpsStatus("locating");
    setGpsErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: UserGpsLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setUserLocation(loc);
        setGpsStatus("success");
        if (onUserLocationDetected) {
          onUserLocationDetected(loc);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus("denied");
          setGpsErrorMessage("Allow location access to see nearby hospitals.");
        } else {
          setGpsStatus("error");
          setGpsErrorMessage("Unable to determine current location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, [onUserLocationDetected]);

  // Trigger GPS acquisition once on mount
  useEffect(() => {
    if (!hasRequestedGpsRef.current) {
      hasRequestedGpsRef.current = true;
      requestLocation();
    }
  }, [requestLocation]);

  // ── 2. Fetch Nearby Hospitals (10 km Overpass) when userLocation is ready ─
  useEffect(() => {
    if (!userLocation) return;

    let isMounted = true;
    const controller = new AbortController();

    const loadHospitals = async () => {
      try {
        const hospitals = await fetchNearbyHospitalsOverpass(
          userLocation.latitude,
          userLocation.longitude,
          10000,
          controller.signal
        );
        if (isMounted) {
          setNearbyHospitals(hospitals);
        }
      } catch (err) {
        if (isMounted) {
          console.warn("Failed to load nearby hospitals:", err);
        }
      } finally {
        if (isMounted) {
          setLoadingNearby(false);
        }
      }
    };

    queueMicrotask(() => {
      if (isMounted) {
        setLoadingNearby(true);
        loadHospitals();
      }
    });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [userLocation]);

  // ── 3. Debounced Search Handler ───────────────────────────────────────────
  useEffect(() => {
    const query = value.trim();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query) {
      const resetTimer = setTimeout(() => {
        setSearchResults([]);
        setSearching(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    // Filter local nearby results first
    const localMatches = nearbyHospitals.filter(
      (h) =>
        h.name.toLowerCase().includes(query.toLowerCase()) ||
        h.address.toLowerCase().includes(query.toLowerCase())
    );

    // If query is at least 2 chars and local matches are scarce (< 3), search broadly via Nominatim
    debounceTimerRef.current = setTimeout(async () => {
      if (query.length >= 2) {
        setSearching(true);
        try {
          const nominatimResults = await searchHospitalsNominatim(query, userLocation);
          // Combine local matches + nominatim results without duplicates
          const seen = new Set(localMatches.map((m) => m.name.toLowerCase()));
          const combined = [...localMatches];
          for (const item of nominatimResults) {
            if (!seen.has(item.name.toLowerCase())) {
              seen.add(item.name.toLowerCase());
              combined.push(item);
            }
          }
          setSearchResults(combined);
        } catch (err) {
          console.warn("Error during hospital search:", err);
          setSearchResults(localMatches);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults(localMatches);
      }
    }, 350); // 350ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, nearbyHospitals, userLocation]);

  // ── 4. Dismiss on Click Outside ───────────────────────────────────────────
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // ── 5. List of Items to Display ───────────────────────────────────────────
  const isTyping = value.trim().length > 0;
  const displayedHospitals: HospitalRecommendation[] = isTyping
    ? searchResults.length > 0
      ? searchResults
      : nearbyHospitals.filter(
          (h) =>
            h.name.toLowerCase().includes(value.trim().toLowerCase()) ||
            h.address.toLowerCase().includes(value.trim().toLowerCase())
        )
    : nearbyHospitals;

  // ── 6. Hospital Selection ─────────────────────────────────────────────────
  const handleSelect = (hospital: HospitalRecommendation) => {
    onChange(hospital.name);
    onSelectHospital({
      name: hospital.name,
      latitude: hospital.latitude,
      longitude: hospital.longitude,
      address: hospital.address,
      osmId: hospital.osmId,
      distanceKm: hospital.distanceKm,
      cityOrArea: hospital.cityOrArea,
    });
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // ── 7. Keyboard Navigation ────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < displayedHospitals.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : displayedHospitals.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < displayedHospitals.length) {
        handleSelect(displayedHospitals[highlightedIndex]);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
          {searching || loadingNearby ? (
            <FiLoader className="animate-spin text-red-500" size={15} />
          ) : (
            <FiSearch size={15} />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            // If GPS was not acquired yet or denied, prompt or refresh
            if (gpsStatus === "idle") {
              requestLocation();
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={[
            "w-full h-10 pl-10 pr-9 rounded-xl border text-sm",
            "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
            "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500",
            "transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500",
            error ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700",
          ].join(" ")}
        />

        {/* GPS Indicator Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {gpsStatus === "success" && (
            <span title="GPS Location Active (10 km radius)" className="text-emerald-500 text-xs flex items-center">
              <FiNavigation size={13} className="text-emerald-500" />
            </span>
          )}
          {gpsStatus === "locating" && (
            <span title="Finding nearby hospitals..." className="text-amber-500 text-xs flex items-center">
              <FiLoader size={13} className="animate-spin text-amber-500" />
            </span>
          )}
          {gpsStatus === "denied" && (
            <button
              type="button"
              onClick={requestLocation}
              title="Location permission denied. Click to retry."
              className="text-amber-500 hover:text-amber-600 transition-colors"
            >
              <FiAlertTriangle size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 max-h-72 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 text-sm divide-y divide-slate-100 dark:divide-slate-800/60"
        >
          {/* Header Status / GPS Notices */}
          {gpsStatus === "locating" && (
            <div className="px-3.5 py-2 text-xs flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20">
              <FiLoader className="animate-spin shrink-0" size={13} />
              <span>Finding nearby hospitals...</span>
            </div>
          )}

          {gpsStatus === "denied" && (
            <div className="px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <FiAlertTriangle className="shrink-0" size={13} />
                <span>Allow location access to see nearby hospitals.</span>
              </div>
              <button
                type="button"
                onClick={requestLocation}
                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline shrink-0"
              >
                Enable
              </button>
            </div>
          )}

          {gpsStatus === "error" && (
            <div className="px-3.5 py-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <span>{gpsErrorMessage || "Location unavailable. You can search manually."}</span>
              <button
                type="button"
                onClick={requestLocation}
                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline ml-2"
              >
                Retry
              </button>
            </div>
          )}

          {/* Section Title */}
          {!isTyping && gpsStatus === "success" && displayedHospitals.length > 0 && (
            <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <span>Nearby Hospitals within 10 km</span>
              <span className="text-[10px] font-normal text-slate-400">OpenStreetMap</span>
            </div>
          )}

          {isTyping && displayedHospitals.length > 0 && (
            <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <span>Matching Hospitals</span>
              {searching && (
                <span className="text-[10px] text-amber-500 flex items-center gap-1">
                  <FiLoader size={10} className="animate-spin" /> Searching OSM...
                </span>
              )}
            </div>
          )}

          {/* Hospital Results List */}
          {displayedHospitals.length > 0 ? (
            displayedHospitals.map((hospital, index) => {
              const isSelected = value.trim().toLowerCase() === hospital.name.toLowerCase();
              const isHighlighted = highlightedIndex === index;

              return (
                <button
                  key={`${hospital.osmId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(hospital)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={[
                    "w-full px-3.5 py-2.5 text-left flex items-start gap-2.5 transition-colors",
                    isHighlighted
                      ? "bg-red-50 dark:bg-red-950/40 text-slate-900 dark:text-white"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200",
                    isSelected ? "font-semibold" : "",
                  ].join(" ")}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 shrink-0">
                    <FaHospital size={13} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {hospital.name}
                      </span>
                      {hospital.formattedDistance && (
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400 shrink-0 bg-red-50 dark:bg-red-950/50 px-1.5 py-0.5 rounded-md">
                          {hospital.formattedDistance}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      <FiMapPin size={11} className="shrink-0 text-slate-400" />
                      <span className="truncate">
                        {hospital.cityOrArea ? `${hospital.cityOrArea} · ` : ""}
                        {hospital.address || "Address available on map"}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <FiCheck size={14} className="text-red-600 dark:text-red-400 shrink-0 mt-1" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-5 text-center text-slate-500 dark:text-slate-400">
              {loadingNearby || searching ? (
                <div className="flex flex-col items-center justify-center gap-2">
                  <FiLoader size={18} className="animate-spin text-red-600" />
                  <span className="text-xs">Searching OpenStreetMap for hospitals...</span>
                </div>
              ) : isTyping ? (
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No matching hospitals found on OpenStreetMap.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    You can still use &quot;{value.trim()}&quot; as a custom hospital name.
                  </p>
                </div>
              ) : gpsStatus === "success" ? (
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No hospitals found within 10 km.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Type a hospital name to search more broadly or enter manually.
                  </p>
                </div>
              ) : (
                <p className="text-xs">Type a hospital name to search.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
