"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMapPin,
  FiNavigation,
  FiPhone,
  FiSearch,
  FiCrosshair,
  FiAlertCircle,
  FiLoader,
  FiX,
  FiCheckCircle,
  FiSliders,
} from "react-icons/fi";
import { FaDroplet, FaHospital } from "react-icons/fa6";
import MapContainer from "@/components/map/MapContainer";
import {
  facilityService,
  NearbyFacilityResponse,
  GeocodedLocation,
  CLIENT_PRESET_LOCATIONS,
} from "@/services/facilityService";
import { useTranslation } from "@/context";
import {
  LatLng,
  BloodGroup,
  MapBloodBank,
  MapHospital,
  UserLocationState,
  SearchLocationState,
  SelectedPlaceState,
} from "@/types";

// Bengaluru fallback coordinates
const BENGALURU_FALLBACK: LatLng = { lat: 12.9716, lng: 77.5946 };

const RADIUS_OPTIONS = [5, 10, 20, 30, 50] as const;
type RadiusOption = (typeof RADIUS_OPTIONS)[number];

const ALL_BLOOD_GROUPS: BloodGroup[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

const BLOOD_GROUP_COLORS: Record<string, string> = {
  "A+": "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-900",
  "A-": "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-900",
  "B+": "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900",
  "B-": "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900",
  "AB+": "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900",
  "AB-": "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900",
  "O+": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
  "O-": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
};

declare global {
  interface Window {
    __bloodlinkNavigate?: (lat: number, lng: number, name: string) => void;
  }
}

export default function NearbyFacilitiesPage() {
  const { t } = useTranslation();

  // ─── Location State: Strictly Separated ────────────────────────────────────
  // A. USER LOCATION: User's actual current GPS location
  const [userLocation, setUserLocation] = useState<UserLocationState | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);

  // B. SEARCH LOCATION: Selected search location (e.g. Sirsi, Karnataka)
  const [searchLocation, setSearchLocation] = useState<SearchLocationState | null>(null);
  const [locationMode, setLocationMode] = useState<"auto" | "manual">("auto");
  const [manualQuery, setManualQuery] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodedLocation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // C. SELECTED PLACE: Currently selected hospital or blood bank
  const [, setSelectedPlace] = useState<SelectedPlaceState | null>(null);

  // D. NAVIGATION STATE: For GPS acquisition during "Navigate"
  const [navigatingState, setNavigatingState] = useState<{
    isAcquiring: boolean;
    facilityName?: string;
    error?: string | null;
  }>({ isAcquiring: false });

  // Filters & Controls
  const [radius, setRadius] = useState<RadiusOption>(30);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "hospitals" | "bloodbanks">("all");
  const [bloodGroupFilter, setBloodGroupFilter] = useState<BloodGroup | "all">("all");
  const [openNowFilter, setOpenNowFilter] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Facility Data
  const [facilityData, setFacilityData] = useState<NearbyFacilityResponse | null>(null);
  const [loadingFacilities, setLoadingFacilities] = useState(false);

  // ─── 1. Geolocation Logic (Auto GPS) ───────────────────────────────────────
  const requestLocation = useCallback((forceFresh = false) => {
    setGeoLoading(true);
    setGeoError(null);

    if (typeof window === "undefined" || !navigator.geolocation) {
      setUserLocation({
        latitude: BENGALURU_FALLBACK.lat,
        longitude: BENGALURU_FALLBACK.lng,
        isFallback: true,
        timestamp: Date.now(),
      });
      setGeoLoading(false);
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now(),
          isFallback: false,
        });
        setGeoLoading(false);
        setGeoError(null);
      },
      (err) => {
        let msg = "Location unavailable. Showing default fallback.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = t("nearby_err_location_denied") || "Location access was denied. Showing Bengaluru as default.";
        }
        setUserLocation({
          latitude: BENGALURU_FALLBACK.lat,
          longitude: BENGALURU_FALLBACK.lng,
          isFallback: true,
          timestamp: Date.now(),
        });
        setGeoLoading(false);
        setGeoError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: forceFresh ? 10000 : 8000,
        maximumAge: forceFresh ? 0 : 30000,
      }
    );
  }, [t]);

  // Request user GPS on mount asynchronously
  useEffect(() => {
    let isMounted = true;
    if (typeof window === "undefined" || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isMounted) return;
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now(),
          isFallback: false,
        });
        setGeoLoading(false);
        setGeoError(null);
      },
      (err) => {
        if (!isMounted) return;
        let msg = "Location unavailable. Showing default fallback.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = t("nearby_err_location_denied") || "Location access was denied. Showing Bengaluru as default.";
        }
        setUserLocation({
          latitude: BENGALURU_FALLBACK.lat,
          longitude: BENGALURU_FALLBACK.lng,
          isFallback: true,
          timestamp: Date.now(),
        });
        setGeoLoading(false);
        setGeoError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000,
      }
    );

    return () => {
      isMounted = false;
    };
  }, [t]);

  // Ref to prevent re-triggering geocoding effect immediately after selecting a suggestion
  const skipGeocodeRef = useRef(false);

  // Helper to open navigation in next page (new tab) without touching the current page
  const openNavigationUrl = (url: string) => {
    if (typeof window === "undefined") return;
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ─── 2. Fresh GPS Navigation Handler ───────────────────────────────────────
  const handleNavigateToPlace = useCallback(
    (place: { lat: number; lng: number; name: string }) => {
      // 1. Check if userLocation is fresh (< 5 mins) and NOT fallback
      const isFreshGps =
        userLocation &&
        !userLocation.isFallback &&
        userLocation.timestamp &&
        Date.now() - userLocation.timestamp < 5 * 60 * 1000;

      if (isFreshGps && userLocation) {
        const origin = `${userLocation.latitude},${userLocation.longitude}`;
        const destination = `${place.lat},${place.lng}`;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
        openNavigationUrl(url);
        return;
      }

      // 2. Request fresh GPS coordinates from browser
      if (typeof window === "undefined" || !navigator.geolocation) {
        setNavigatingState({
          isAcquiring: false,
          error: "Geolocation is not supported by your browser. Current location is required for navigation origin.",
        });
        return;
      }

      setNavigatingState({
        isAcquiring: true,
        facilityName: place.name,
        error: null,
      });

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const freshUserLoc: UserLocationState = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: Date.now(),
            isFallback: false,
          };
          setUserLocation(freshUserLoc);
          setNavigatingState({ isAcquiring: false });

          const origin = `${freshUserLoc.latitude},${freshUserLoc.longitude}`;
          const destination = `${place.lat},${place.lng}`;
          const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
          openNavigationUrl(url);
        },
        () => {
          setNavigatingState({
            isAcquiring: false,
            error:
              "Your current location is required for accurate navigation. Please allow location access.",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 9000,
          maximumAge: 0,
        }
      );
    },
    [userLocation]
  );

  // Expose global navigation handler for Leaflet popup buttons
  useEffect(() => {
    window.__bloodlinkNavigate = (lat: number, lng: number, name: string) => {
      handleNavigateToPlace({ lat, lng, name: decodeURIComponent(name) });
    };
    return () => {
      delete window.__bloodlinkNavigate;
    };
  }, [handleNavigateToPlace]);

  // Debounced live suggestions when typing in manualQuery
  useEffect(() => {
    if (skipGeocodeRef.current) {
      skipGeocodeRef.current = false;
      return;
    }

    const q = manualQuery.trim().toLowerCase();
    if (q.length < 2) {
      const timer = setTimeout(() => setSuggestions([]), 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      facilityService
        .geocodeLocation(q)
        .then((res) => setSuggestions(res))
        .catch(() => setSuggestions([]));
    }, 300);

    return () => clearTimeout(timer);
  }, [manualQuery]);

  // ─── 3. Manual Location Search Handlers ─────────────────────────────────────
  const searchManualArea = async (queryText?: string) => {
    const q = (queryText ?? manualQuery).trim();
    if (!q || q.length < 2) return;

    setGeocoding(true);
    setGeocodeError(null);
    try {
      const results = await facilityService.geocodeLocation(q);
      if (results && results.length > 0) {
        skipGeocodeRef.current = true;
        setSearchLocation({
          displayName: results[0].displayName,
          latitude: results[0].lat,
          longitude: results[0].lng,
          type: results[0].type,
        });
        setManualQuery(results[0].displayName);
        setShowSuggestions(false);
        setGeocodeError(null);
      } else {
        setGeocodeError(
          t("nearby_location_not_found") ||
            "Location not found. Please check spelling or choose from popular areas."
        );
      }
    } catch {
      setGeocodeError(
        t("nearby_location_not_found") ||
          "Failed to locate area. Please check spelling or select from popular areas."
      );
    } finally {
      setGeocoding(false);
    }
  };

  const handleSelectSuggestion = (loc: GeocodedLocation) => {
    skipGeocodeRef.current = true;
    setSearchLocation({
      displayName: loc.displayName,
      latitude: loc.lat,
      longitude: loc.lng,
      type: loc.type,
    });
    setManualQuery(loc.displayName);
    setShowSuggestions(false);
    setGeocodeError(null);
  };

  // ─── 4. Active Search Coordinates & Center ─────────────────────────────────
  const activeCenter: LatLng = useMemo(() => {
    if (locationMode === "manual" && searchLocation) {
      return { lat: searchLocation.latitude, lng: searchLocation.longitude };
    }
    if (userLocation) {
      return { lat: userLocation.latitude, lng: userLocation.longitude };
    }
    return BENGALURU_FALLBACK;
  }, [locationMode, searchLocation, userLocation]);

  const isUsingFallback = Boolean(userLocation?.isFallback);

  const centerLabel = useMemo(() => {
    if (locationMode === "manual" && searchLocation) {
      return `📍 ${searchLocation.displayName}`;
    }
    return isUsingFallback
      ? "📍 Bengaluru (Fallback Location)"
      : "📍 Your Current Location (GPS)";
  }, [locationMode, searchLocation, isUsingFallback]);

  const centerSub = useMemo(() => {
    return `${t("nearby_within_radius")?.replace("{radius}", String(radius)) || `Within ${radius} km`}`;
  }, [t, radius]);

  // ─── 5. Fetch Facilities Data from Active Center (AbortController Protected) ───
  useEffect(() => {
    // DO NOT fetch places before location is known (Requirement 10)
    if (!userLocation && !(locationMode === "manual" && searchLocation)) {
      return;
    }

    let isSubscribed = true;
    const abortController = new AbortController();

    const startTimer = setTimeout(() => {
      if (isSubscribed) setLoadingFacilities(true);
    }, 0);

    facilityService
      .getNearbyFacilities({
        lat: activeCenter.lat,
        lng: activeCenter.lng,
        radiusKm: radius,
        type: typeFilter,
        bloodGroup: bloodGroupFilter,
        openNow: openNowFilter,
        search: search.trim() || undefined,
        signal: abortController.signal,
      })
      .then((data) => {
        if (isSubscribed) {
          setFacilityData(data);
          setLoadingFacilities(false);
        }
      })
      .catch((err) => {
        if (isSubscribed && err?.name !== "CanceledError" && err?.name !== "AbortError") {
          setLoadingFacilities(false);
        }
      });

    return () => {
      isSubscribed = false;
      clearTimeout(startTimer);
      abortController.abort();
    };
  }, [
    userLocation,
    locationMode,
    searchLocation,
    activeCenter.lat,
    activeCenter.lng,
    radius,
    typeFilter,
    bloodGroupFilter,
    openNowFilter,
    search,
  ]);

  // ─── Filtered lists ────────────────────────────────────────────────────────
  const hospitals = useMemo(() => facilityData?.hospitals ?? [], [facilityData?.hospitals]);
  const bloodBanks = useMemo(() => facilityData?.bloodBanks ?? [], [facilityData?.bloodBanks]);

  // Combined sorted list for unified result cards
  const allFacilities = useMemo(() => {
    const list: Array<
      | (MapHospital & {
          type: "hospital";
          distanceKm: number;
          distance: string;
          open?: boolean;
          openingHours?: string;
          isBloodLinkRegistered?: boolean;
        })
      | (MapBloodBank & {
          type: "blood_bank";
          distanceKm: number;
          distance: string;
          openingHours?: string;
          isBloodLinkRegistered?: boolean;
        })
    > = [];

    if (typeFilter !== "bloodbanks") {
      hospitals.forEach((h) => list.push({ ...h, type: "hospital" }));
    }
    if (typeFilter !== "hospitals") {
      bloodBanks.forEach((b) => list.push({ ...b, type: "blood_bank" }));
    }

    return list.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [hospitals, bloodBanks, typeFilter]);

  const hospitalCount = facilityData?.counts.hospitals ?? hospitals.length;
  const bloodBankCount = facilityData?.counts.bloodBanks ?? bloodBanks.length;
  const totalCount = allFacilities.length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* ── Page Header & Location Mode Switch ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 border border-red-100 dark:border-red-900/50">
                  <FiMapPin size={20} />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t("nearby_page_title") || "Nearby Hospitals & Blood Banks"}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>
                      {t("nearby_within_radius")?.replace("{radius}", String(radius)) || `Within ${radius} km`}:
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                      <FaHospital size={13} /> {hospitalCount} {t("nearby_filter_hospitals") || "Hospitals"}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                      <FaDroplet size={12} /> {bloodBankCount} {t("nearby_filter_bloodbanks") || "Blood Banks"}
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">
                      {totalCount} places found
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Mode Switcher: Automatic GPS vs Manual Search */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <button
                  id="mode-auto-btn"
                  onClick={() => {
                    setLocationMode("auto");
                    if (isUsingFallback) requestLocation(true);
                  }}
                  className={[
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all",
                    locationMode === "auto"
                      ? "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                  ].join(" ")}
                >
                  <FiCrosshair size={14} />
                  <span>{t("nearby_location_mode_auto") || "Automatic Location"}</span>
                </button>
                <button
                  id="mode-manual-btn"
                  onClick={() => {
                    setLocationMode("manual");
                    if (!searchLocation) {
                      setSearchLocation({
                        displayName: "Sirsi, Uttara Kannada, Karnataka",
                        latitude: 14.6195,
                        longitude: 74.8354,
                        type: "town",
                      });
                    }
                  }}
                  className={[
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all",
                    locationMode === "manual"
                      ? "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                  ].join(" ")}
                >
                  <FiSearch size={14} />
                  <span>{t("nearby_location_mode_manual") || "Search Manually"}</span>
                </button>
              </div>

              {locationMode === "auto" && (
                <button
                  id="find-near-me-btn"
                  onClick={() => requestLocation(true)}
                  disabled={geoLoading}
                  aria-label={t("nearby_find_near_me") || "Find Near Me"}
                  className={[
                    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm transition-all",
                    "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:scale-98",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
                    geoLoading ? "opacity-80 cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}
                >
                  {geoLoading ? (
                    <>
                      <FiLoader size={14} className="animate-spin" />
                      <span>{t("nearby_loading_location") || "Detecting…"}</span>
                    </>
                  ) : (
                    <>
                      <FiCrosshair size={14} className="text-white" />
                      <span>{t("nearby_find_near_me") || "Find Near Me"}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Subheader: Auto GPS info vs Manual Search Controls */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            {locationMode === "auto" ? (
              isUsingFallback ? (
                <div
                  role="status"
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-2">
                    <FiAlertCircle size={16} className="shrink-0 text-amber-600" />
                    <span>
                      {geoError ||
                        t("nearby_fallback_notice") ||
                        "Bengaluru is currently being used as a fallback location because your current location could not be determined."}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => requestLocation(true)}
                      className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-200 text-left sm:text-right"
                    >
                      {t("nearby_find_near_me") || "Enable Location"}
                    </button>
                    <button
                      onClick={() => setLocationMode("manual")}
                      className="text-xs px-2.5 py-1 rounded-lg bg-amber-200/60 dark:bg-amber-900/60 font-medium hover:bg-amber-300/60 transition-colors"
                    >
                      {t("nearby_location_mode_manual") || "Search Manually"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                    <div className="flex items-center gap-2">
                      <FiCheckCircle size={14} className="shrink-0" />
                      <span>
                        {t("nearby_actual_location_notice") || "Showing facilities near your actual GPS location"} (
                        {activeCenter.lat.toFixed(4)}, {activeCenter.lng.toFixed(4)})
                        {userLocation?.accuracy && (
                          <span className="ml-1 text-slate-500 font-normal">
                            ±{Math.round(userLocation.accuracy)}m accuracy
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      onClick={() => setLocationMode("manual")}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white underline"
                    >
                      Want to view another city? {t("nearby_location_mode_manual") || "Search Manually"}
                    </button>
                  </div>

                  {/* Low GPS accuracy warning if > 500 meters */}
                  {userLocation?.accuracy && userLocation.accuracy > 500 && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                      <FiAlertCircle size={14} className="shrink-0 text-amber-600" />
                      <span>Your location accuracy is low (±{Math.round(userLocation.accuracy)}m). Move to an open area for better accuracy.</span>
                    </div>
                  )}
                </div>
              )
            ) : (
              /* Manual Location Search Bar & Popular Chips */
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <FiSearch
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      id="manual-location-input"
                      type="text"
                      value={manualQuery}
                      onChange={(e) => {
                        setManualQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          searchManualArea();
                        }
                      }}
                      placeholder={
                        t("nearby_manual_search_placeholder") ||
                        "Enter city, district, area or pincode (e.g. Sirsi, Mysuru, Bengaluru)..."
                      }
                      className={[
                        "w-full pl-10 pr-10 py-2.5 rounded-xl text-sm transition-all outline-none",
                        "bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700",
                        "text-slate-900 dark:text-white placeholder-slate-400",
                        "focus:bg-white dark:focus:bg-slate-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20",
                      ].join(" ")}
                    />
                    {manualQuery && (
                      <button
                        onClick={() => {
                          setManualQuery("");
                          setSuggestions([]);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <FiX size={15} />
                      </button>
                    )}

                    {/* Autocomplete Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden py-1 max-h-56 overflow-y-auto">
                        {suggestions.map((s, idx) => (
                          <button
                            key={`${s.displayName}-${idx}`}
                            onClick={() => handleSelectSuggestion(s)}
                            className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                          >
                            <FiMapPin size={14} className="text-red-500 shrink-0" />
                            <span className="truncate">{s.displayName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    id="manual-location-search-btn"
                    onClick={() => searchManualArea()}
                    disabled={geocoding || !manualQuery.trim()}
                    className={[
                      "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all shrink-0",
                      "bg-red-600 hover:bg-red-700 active:scale-98",
                      geocoding || !manualQuery.trim() ? "opacity-75 cursor-not-allowed" : "cursor-pointer",
                    ].join(" ")}
                  >
                    {geocoding ? (
                      <>
                        <FiLoader size={15} className="animate-spin" />
                        <span>Searching…</span>
                      </>
                    ) : (
                      <>
                        <FiSearch size={15} />
                        <span>{t("nearby_manual_search_btn") || "Search Area"}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Geocode error if any */}
                {geocodeError && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <FiAlertCircle size={13} />
                    <span>{geocodeError}</span>
                  </p>
                )}

                {/* Popular Area Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                    {t("nearby_popular_areas") || "Popular Areas:"}
                  </span>
                  {CLIENT_PRESET_LOCATIONS.slice(0, 8).map((preset) => {
                    const isCurrent = searchLocation?.displayName === preset.displayName;
                    return (
                      <button
                        key={preset.displayName}
                        onClick={() => handleSelectSuggestion(preset)}
                        className={[
                          "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                          isCurrent
                            ? "bg-red-600 text-white shadow-sm font-bold"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
                        ].join(" ")}
                      >
                        {preset.displayName.split(",")[0]}
                      </button>
                    );
                  })}
                </div>

                {/* Active Manual Location Status */}
                {searchLocation && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/50 text-xs text-red-900 dark:text-red-200">
                    <span className="flex items-center gap-2">
                      <FiMapPin size={14} className="text-red-600 shrink-0" />
                      <span>
                        {t("nearby_searching_around")?.replace("{radius}", String(radius)) ||
                          `Showing facilities within ${radius} km of`}{" "}
                        <strong>{searchLocation.displayName}</strong>
                      </span>
                    </span>
                    <button
                      onClick={() => {
                        setLocationMode("auto");
                        if (isUsingFallback) requestLocation(true);
                      }}
                      className="text-[11px] font-semibold text-red-700 dark:text-red-300 underline ml-3 shrink-0"
                    >
                      {t("nearby_location_mode_auto") || "Use My GPS"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Search & Filter Controls ─────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input for Facilities */}
            <div className="relative flex-1">
              <FiSearch
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                id="facility-search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  t("nearby_search_placeholder") || "Search hospital, blood bank or area..."
                }
                className={[
                  "w-full pl-10 pr-10 py-2.5 rounded-xl text-sm transition-all outline-none",
                  "bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700",
                  "text-slate-900 dark:text-white placeholder-slate-400",
                  "focus:bg-white dark:focus:bg-slate-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20",
                ].join(" ")}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>

            {/* Type Filters & Open Now Toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0 overflow-x-auto">
                {(
                  [
                    { id: "all", label: t("nearby_filter_all") || "All" },
                    { id: "hospitals", label: t("nearby_filter_hospitals") || "Hospitals" },
                    { id: "bloodbanks", label: t("nearby_filter_bloodbanks") || "Blood Banks" },
                  ] as const
                ).map((type) => {
                  const active = typeFilter === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setTypeFilter(type.id)}
                      className={[
                        "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap",
                        active
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                      ].join(" ")}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>

              {/* Open Now Pill */}
              <button
                id="filter-open-now-btn"
                onClick={() => setOpenNowFilter((prev) => !prev)}
                className={[
                  "px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 border",
                  openNowFilter
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white",
                ].join(" ")}
              >
                <span className={openNowFilter ? "w-2 h-2 rounded-full bg-white animate-pulse" : "w-2 h-2 rounded-full bg-emerald-500"} />
                <span>{t("nearby_filter_open_now") || "Open Now"}</span>
              </button>
            </div>
          </div>

          {/* Search Radius Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <FiSliders size={14} className="text-red-500" />
              <span>{t("nearby_search_radius") || "Search Radius"}</span>
            </div>

            {/* Radius Options: 5 km, 10 km, 20 km, 30 km, 50 km */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0" role="radiogroup" aria-label="Search Radius">
              {RADIUS_OPTIONS.map((r) => {
                const selected = radius === r;
                return (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    role="radio"
                    aria-checked={selected}
                    className={[
                      "relative px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0",
                      selected
                        ? "bg-red-600 text-white shadow-md shadow-red-600/20 font-bold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
                    ].join(" ")}
                  >
                    {r} km
                  </button>
                );
              })}
            </div>
          </div>

          {/* Blood Group Filter Pills (only relevant when blood banks are shown) */}
          {typeFilter !== "hospitals" && (
            <div className="flex items-center gap-1.5 pt-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-medium text-slate-400 shrink-0 mr-1">
                {t("nearby_filter_blood_group") || "Blood Group"}:
              </span>
              <button
                onClick={() => setBloodGroupFilter("all")}
                className={[
                  "px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all",
                  bloodGroupFilter === "all"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200",
                ].join(" ")}
              >
                {t("nearby_all_groups") || "All Groups"}
              </button>
              {ALL_BLOOD_GROUPS.map((bg) => {
                const active = bloodGroupFilter === bg;
                return (
                  <button
                    key={bg}
                    onClick={() => setBloodGroupFilter(bg)}
                    className={[
                      "px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all border",
                      active
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-red-300",
                    ].join(" ")}
                  >
                    {bg}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Main Layout: Results Sidebar (Left) & Large Interactive Map (Right) ─ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── Left Column: Facility Cards List (Desktop 5 cols, Mobile below map) ── */}
          <div className="order-2 lg:order-1 lg:col-span-5 space-y-3">
            {/* Header summary count */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {totalCount} {totalCount === 1 ? "Result" : "Results"}{" "}
                {t("nearby_within_radius")?.replace("{radius}", String(radius)) || `Within ${radius} km`}
              </span>
              {loadingFacilities && (
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <FiLoader size={13} className="animate-spin text-red-500" />
                  <span>Discovering OSM Places…</span>
                </span>
              )}
            </div>

            {/* Loading Skeleton */}
            {loadingFacilities && allFacilities.length === 0 && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse space-y-3">
                    <div className="flex justify-between">
                      <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="w-14 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="w-1/2 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loadingFacilities && allFacilities.length === 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-500 mx-auto">
                  <FiMapPin size={24} />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  No hospitals or blood banks found within {radius} km
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {t("nearby_no_results") || "Try increasing the search radius to 50 km or clearing filters."}
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {radius < 50 && (
                    <button
                      onClick={() => setRadius(50)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      Increase to 50 km
                    </button>
                  )}
                  {locationMode === "auto" && !isUsingFallback && (
                    <button
                      onClick={() => {
                        setUserLocation({
                          latitude: BENGALURU_FALLBACK.lat,
                          longitude: BENGALURU_FALLBACK.lng,
                          isFallback: true,
                          timestamp: Date.now(),
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm transition-all"
                    >
                      View Bengaluru Hub
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Results Cards List */}
            <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {allFacilities.map((facility) => {
                  const isHospital = facility.type === "hospital";
                  const isSelected = selectedId === facility.id;

                  return (
                    <motion.div
                      key={facility.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setSelectedId(facility.id)}
                      className={[
                        "group p-4 rounded-2xl border transition-all cursor-pointer",
                        isSelected
                          ? "bg-white dark:bg-slate-900 border-red-500 shadow-md ring-2 ring-red-500/20"
                          : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm",
                      ].join(" ")}
                    >
                      {/* Top row: Type badge, status, and distance */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={[
                              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold",
                              isHospital
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                                : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900",
                            ].join(" ")}
                          >
                            {isHospital ? (
                              <>
                                <FaHospital size={11} />
                                <span>Hospital</span>
                              </>
                            ) : (
                              <>
                                <FaDroplet size={10} />
                                <span>Blood Bank</span>
                              </>
                            )}
                          </span>

                          {/* BloodLink Registered Verification Badge */}
                          {facility.isBloodLinkRegistered && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300 border border-red-200 dark:border-red-900">
                              ✓ BloodLink Registered
                            </span>
                          )}

                          {"open" in facility && (
                            <span
                              className={[
                                "inline-flex items-center gap-1 text-[11px] font-medium",
                                facility.open
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-slate-400 dark:text-slate-500",
                              ].join(" ")}
                            >
                              <span
                                className={[
                                  "w-1.5 h-1.5 rounded-full",
                                  facility.open ? "bg-emerald-500" : "bg-slate-400",
                                ].join(" ")}
                              />
                              {facility.open
                                ? t("nearby_status_open") || "Open"
                                : t("nearby_status_closed") || "Closed"}
                            </span>
                          )}
                        </div>

                        {/* Distance Badge */}
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg shrink-0">
                          <FiMapPin size={11} className="text-red-500" />
                          <span>{facility.distance}</span>
                        </span>
                      </div>

                      {/* Facility Name & Address */}
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-1">
                        {facility.name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {facility.address}
                      </p>

                      {/* Blood bank available stock tags */}
                      {!isHospital && "available" in facility && facility.available.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                          <span className="text-[11px] text-slate-400 font-medium block mb-1">
                            {t("nearby_available_stock") || "Available Stock"}:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {facility.available.map((bg) => (
                              <span
                                key={bg}
                                className={[
                                  "px-2 py-0.5 rounded-md text-[11px] font-bold border",
                                  BLOOD_GROUP_COLORS[bg] || "bg-slate-100 text-slate-700",
                                ].join(" ")}
                              >
                                {bg}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons: Navigate, Open Map, Call */}
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 flex-wrap">
                        {/* 🧭 Navigate (from user's actual GPS location) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateToPlace({
                              lat: facility.position.lat,
                              lng: facility.position.lng,
                              name: facility.name,
                            });
                          }}
                          className="flex-1 min-w-[90px] min-h-[44px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 active:scale-[0.98] text-white text-xs font-semibold shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          <FiNavigation size={13} />
                          <span>{t("nearby_btn_navigate") || "Navigate"}</span>
                        </button>

                        {/* 🗺️ Open Map on OpenStreetMap (exact coordinates) */}
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${facility.position.lat}&mlon=${facility.position.lng}#map=16/${facility.position.lat}/${facility.position.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 min-w-[90px] min-h-[44px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                          <FiMapPin size={13} className="text-red-500" />
                          <span>{t("nearby_btn_open_map") || "Open Map"}</span>
                        </a>

                        {/* 📞 Call (only if real phone data exists) */}
                        {facility.phone ? (
                          <a
                            href={`tel:${facility.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 min-w-[75px] min-h-[44px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                          >
                            <FiPhone size={13} />
                            <span>{t("nearby_btn_call") || "Call"}</span>
                          </a>
                        ) : (
                          <span className="flex-1 min-w-[75px] min-h-[44px] inline-flex items-center justify-center py-2.5 px-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-[11px] font-medium text-center">
                            Phone N/A
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right Column: Interactive Map (Desktop 7 cols, Mobile top) ── */}
          <div className="order-1 lg:order-2 lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 sm:p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 sticky top-20">
              <div className="h-[400px] sm:h-[520px] lg:h-[620px] w-full rounded-2xl overflow-hidden">
                <MapContainer
                  center={activeCenter}
                  zoom={13}
                  height="h-full"
                  className="w-full"
                  userLocation={userLocation}
                  userPositionLabel={centerLabel}
                  userPositionSub={centerSub}
                  searchLocation={locationMode === "manual" ? searchLocation : null}
                  radiusKm={radius}
                  selectedId={selectedId}
                  bloodBanks={bloodBanks}
                  hospitals={hospitals}
                  onBloodBankSelect={(bank) => {
                    setSelectedId(bank.id);
                    setSelectedPlace({
                      id: bank.id,
                      name: bank.name,
                      latitude: bank.position.lat,
                      longitude: bank.position.lng,
                      type: "blood_bank",
                      address: bank.address,
                      phone: bank.phone,
                      distance: bank.distance,
                    });
                  }}
                  onHospitalSelect={(hosp) => {
                    setSelectedId(hosp.id);
                    setSelectedPlace({
                      id: hosp.id,
                      name: hosp.name,
                      latitude: hosp.position.lat,
                      longitude: hosp.position.lng,
                      type: "hospital",
                      address: hosp.address,
                      phone: hosp.phone,
                    });
                  }}
                />
              </div>

              {/* Map Legend */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
                    <span>Hospitals</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-600 shadow-sm" />
                    <span>Blood Banks</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500 border border-white dark:border-slate-900" />
                    <span>Your Location</span>
                  </span>
                  {locationMode === "manual" && searchLocation && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-amber-500 border border-white dark:border-slate-900" />
                      <span>Search Center</span>
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">
                  Radius: {radius} km circle
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation Location Modal (Acquiring fresh GPS) ── */}
        {navigatingState.isAcquiring && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 max-w-md w-full animate-in fade-in zoom-in-95">
              <FiLoader className="animate-spin text-red-600 shrink-0" size={24} />
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Getting your current location…</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Acquiring exact GPS coordinates to start directions to {navigatingState.facilityName || "destination"}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation Error Toast ── */}
        {navigatingState.error && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md bg-red-50 dark:bg-red-950/95 border border-red-200 dark:border-red-900 rounded-2xl p-4 shadow-xl text-red-800 dark:text-red-200 flex items-start gap-3">
            <FiAlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <strong className="block text-sm font-semibold mb-0.5">Navigation Location Required</strong>
              <p>{navigatingState.error}</p>
            </div>
            <button
              onClick={() => setNavigatingState((s) => ({ ...s, error: null }))}
              className="p-1 text-red-400 hover:text-red-600 rounded-lg"
            >
              <FiX size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
