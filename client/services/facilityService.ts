import { api } from "./api";
import { LatLng, MapBloodBank, MapHospital, BloodGroup } from "@/types";

export interface NearbyFacilityResponse {
  userPosition: LatLng;
  radiusKm: number;
  totalVisible: number;
  counts: {
    hospitals: number;
    bloodBanks: number;
  };
  hospitals: (MapHospital & {
    distance: string;
    distanceKm: number;
    open?: boolean;
    openingHours?: string;
    website?: string;
    isBloodLinkRegistered?: boolean;
  })[];
  bloodBanks: (MapBloodBank & {
    distanceKm: number;
    openingHours?: string;
    website?: string;
    isBloodLinkRegistered?: boolean;
  })[];
}

export interface GeocodedLocation {
  displayName: string;
  lat: number;
  lng: number;
  type?: string;
}

export const CLIENT_PRESET_LOCATIONS: GeocodedLocation[] = [
  { displayName: "Sirsi, Uttara Kannada, Karnataka", lat: 14.6195, lng: 74.8354, type: "town" },
  { displayName: "Bengaluru, Karnataka", lat: 12.9716, lng: 77.5946, type: "city" },
  { displayName: "Mysuru, Karnataka", lat: 12.2958, lng: 76.6394, type: "city" },
  { displayName: "Mangaluru, Karnataka", lat: 12.9141, lng: 74.8560, type: "city" },
  { displayName: "Hubballi-Dharwad, Karnataka", lat: 15.3647, lng: 75.1240, type: "city" },
  { displayName: "Belagavi, Karnataka", lat: 15.8497, lng: 74.4977, type: "city" },
  { displayName: "Kalaburagi, Karnataka", lat: 17.3297, lng: 76.8343, type: "city" },
  { displayName: "Davanagere, Karnataka", lat: 14.4644, lng: 75.9218, type: "city" },
  { displayName: "Ballari, Karnataka", lat: 15.1394, lng: 76.9214, type: "city" },
  { displayName: "Shivamogga, Karnataka", lat: 13.9299, lng: 75.5681, type: "city" },
  { displayName: "Tumakuru, Karnataka", lat: 13.3379, lng: 77.1010, type: "city" },
  { displayName: "Udupi, Karnataka", lat: 13.3409, lng: 74.7421, type: "city" },
  { displayName: "Hassan, Karnataka", lat: 13.0033, lng: 76.1004, type: "city" },
  { displayName: "Koramangala, Bengaluru", lat: 12.9352, lng: 77.6245, type: "suburb" },
  { displayName: "Indiranagar, Bengaluru", lat: 12.9784, lng: 77.6408, type: "suburb" },
  { displayName: "Whitefield, Bengaluru", lat: 12.9698, lng: 77.7500, type: "suburb" },
  { displayName: "Jayanagar, Bengaluru", lat: 12.9308, lng: 77.5838, type: "suburb" },
  { displayName: "Electronic City, Bengaluru", lat: 12.8452, lng: 77.6602, type: "suburb" },
  { displayName: "HSR Layout, Bengaluru", lat: 12.9121, lng: 77.6446, type: "suburb" },
  { displayName: "Mumbai, Maharashtra", lat: 19.0760, lng: 72.8777, type: "city" },
  { displayName: "Pune, Maharashtra", lat: 18.5204, lng: 73.8567, type: "city" },
  { displayName: "New Delhi, Delhi", lat: 28.6139, lng: 77.2090, type: "city" },
  { displayName: "Hyderabad, Telangana", lat: 17.3850, lng: 78.4867, type: "city" },
  { displayName: "Chennai, Tamil Nadu", lat: 13.0827, lng: 80.2707, type: "city" },
  { displayName: "Kolkata, West Bengal", lat: 22.5726, lng: 88.3639, type: "city" },
];

// ─── Haversine Distance (client calculation fallback) ─────────────────────────
export function calculateClientDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface FetchFacilitiesParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  type?: "all" | "hospitals" | "bloodbanks";
  bloodGroup?: BloodGroup | "all";
  openNow?: boolean;
  search?: string;
  signal?: AbortSignal;
}

// ─── Client In-Memory Caches ──────────────────────────────────────────────────
const facilityCache = new Map<string, { data: NearbyFacilityResponse; timestamp: number }>();
const FACILITY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const geocodeCache = new Map<string, { data: GeocodedLocation[]; timestamp: number }>();
const GEOCODE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export function formatDistance(distKm: number): string {
  if (distKm < 0.1) {
    return "< 100 m";
  }
  return `${distKm.toFixed(1)} km`;
}

function deduplicateFacilities<T extends { id: string; name: string; position: LatLng }>(
  items: T[]
): T[] {
  const result: T[] = [];
  const seenIds = new Set<string>();

  for (const item of items) {
    if (seenIds.has(item.id)) continue;

    const itemLower = item.name.trim().toLowerCase();

    // Check if another item is at the exact same physical coordinates (< 30 meters)
    // or within 150 meters with matching / overlapping names
    const isDuplicate = result.some((existing) => {
      const dist = calculateClientDistanceKm(
        existing.position.lat,
        existing.position.lng,
        item.position.lat,
        item.position.lng
      );
      if (dist < 0.03) return true; // Within 30 meters is the exact same building

      if (dist < 0.15) {
        const existingLower = existing.name.trim().toLowerCase();
        return (
          existingLower === itemLower ||
          existingLower.includes(itemLower) ||
          itemLower.includes(existingLower)
        );
      }
      return false;
    });

    if (!isDuplicate) {
      seenIds.add(item.id);
      result.push(item);
    }
  }

  return result;
}

export const facilityService = {
  getNearbyFacilities: async (
    params: FetchFacilitiesParams
  ): Promise<NearbyFacilityResponse> => {
    if (params.signal?.aborted) {
      const abortErr = new Error("The operation was aborted");
      abortErr.name = "AbortError";
      throw abortErr;
    }

    const radius = params.radiusKm ?? 5;

    const type = params.type ?? "all";
    const bloodGroup = params.bloodGroup && params.bloodGroup !== "all" ? params.bloodGroup : "";
    const openNow = params.openNow ? "1" : "0";
    const search = params.search?.trim().toLowerCase() || "";

    // Cache key based on rounded coordinates (~100m precision)
    const cacheKey = `${params.lat.toFixed(3)}_${params.lng.toFixed(3)}_${radius}_${type}_${bloodGroup}_${openNow}_${search}`;

    const cached = facilityCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < FACILITY_CACHE_TTL) {
      return cached.data;
    }

    try {
      const response = await api.get<{
        success: boolean;
        data: NearbyFacilityResponse;
      }>("/nearby", {
        params: {
          lat: params.lat,
          lng: params.lng,
          radius,
          type,
          bloodGroup: bloodGroup || undefined,
          openNow: params.openNow ? "true" : undefined,
          search: search || undefined,
        },
        timeout: 10000,
        signal: params.signal,
      });

      if (response.data?.success && response.data.data) {
        const data = response.data.data;
        // Deduplicate places
        data.hospitals = deduplicateFacilities(data.hospitals);
        data.bloodBanks = deduplicateFacilities(data.bloodBanks);
        data.counts = {
          hospitals: data.hospitals.length,
          bloodBanks: data.bloodBanks.length,
        };
        data.totalVisible = data.hospitals.length + data.bloodBanks.length;

        facilityCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }
      throw new Error("Invalid response format");
    } catch (err: unknown) {
      const errorObj = err as { name?: string };
      if (errorObj?.name === "CanceledError" || errorObj?.name === "AbortError" || params.signal?.aborted) {
        throw err;
      }

      // Direct live OpenStreetMap Nominatim bounding box query fallback
      const q = search;
      const degLat = radius / 111;
      const degLng = radius / (111 * Math.cos((params.lat * Math.PI) / 180));
      const minLat = params.lat - degLat;
      const maxLat = params.lat + degLat;
      const minLng = params.lng - degLng;
      const maxLng = params.lng + degLng;
      const viewbox = `${minLng},${maxLat},${maxLng},${minLat}`;

      const computedHospitals: NearbyFacilityResponse["hospitals"] = [];
      const computedBanks: NearbyFacilityResponse["bloodBanks"] = [];

      try {
        const [hospRes, bankRes] = await Promise.allSettled([
          fetch(`https://nominatim.openstreetmap.org/search?format=json&amenity=hospital&viewbox=${viewbox}&bounded=1&limit=40&addressdetails=1`, { signal: params.signal }),
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=blood+bank&viewbox=${viewbox}&bounded=1&limit=25&addressdetails=1`, { signal: params.signal }),
        ]);

        interface NominatimPlaceItem {
          lat: string;
          lon: string;
          name?: string;
          display_name?: string;
          osm_id?: number | string;
          place_id?: number | string;
          address?: {
            city?: string;
            town?: string;
            county?: string;
            state?: string;
            phone?: string;
          };
        }

        if (hospRes.status === "fulfilled" && hospRes.value.ok) {
          const items: NominatimPlaceItem[] = await hospRes.value.json();
          if (Array.isArray(items)) {
            for (const item of items) {
              const pLat = parseFloat(item.lat);
              const pLng = parseFloat(item.lon);
              if (isNaN(pLat) || isNaN(pLng)) continue;
              const d = calculateClientDistanceKm(params.lat, params.lng, pLat, pLng);
              if (d > radius) continue;
              const rawName = item.name || (item.display_name ? item.display_name.split(",")[0] : "Hospital");
              const addr = item.display_name || "Address available on map";
              const city = item.address?.city || item.address?.town || item.address?.county || "";
              const state = item.address?.state || "Karnataka";

              computedHospitals.push({
                id: `nom-h-${item.osm_id || item.place_id}`,
                name: rawName,
                address: addr,
                district: city,
                state,
                phone: item.address?.phone || "",
                position: { lat: pLat, lng: pLng },
                distanceKm: parseFloat(d.toFixed(1)),
                distance: formatDistance(d),
                open: true,
                isBloodLinkRegistered: false,
              });
            }
          }
        }

        if (bankRes.status === "fulfilled" && bankRes.value.ok) {
          const bankItems: NominatimPlaceItem[] = await bankRes.value.json();
          if (Array.isArray(bankItems)) {
            for (const item of bankItems) {
              const pLat = parseFloat(item.lat);
              const pLng = parseFloat(item.lon);
              if (isNaN(pLat) || isNaN(pLng)) continue;
              const d = calculateClientDistanceKm(params.lat, params.lng, pLat, pLng);
              if (d > radius) continue;
              const rawName = item.name || (item.display_name ? item.display_name.split(",")[0] : "Blood Bank");
              const addr = item.display_name || "Address available on map";
              const city = item.address?.city || item.address?.town || item.address?.county || "";
              const state = item.address?.state || "Karnataka";

              computedBanks.push({
                id: `nom-b-${item.osm_id || item.place_id}`,
                name: rawName,
                address: addr,
                district: city,
                state,
                phone: item.address?.phone || "",
                position: { lat: pLat, lng: pLng },
                distanceKm: parseFloat(d.toFixed(1)),
                distance: formatDistance(d),
                available: ["A+", "B+", "O+", "AB+", "O-"] as BloodGroup[],
                open: true,
                isBloodLinkRegistered: false,
              });
            }
          }
        }
      } catch (nomErr: unknown) {
        const nomErrObj = nomErr as { name?: string };
        if (nomErrObj?.name === "AbortError" || params.signal?.aborted) throw nomErr;
      }

      const deduplicatedHospitals = deduplicateFacilities(computedHospitals);
      const filteredHospitals = deduplicatedHospitals
        .filter((h) => {
          if (!q) return true;
          return h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q);
        })
        .sort((a, b) => a.distanceKm - b.distanceKm);

      const visibleHospitals = type === "bloodbanks" ? [] : filteredHospitals;
      const visibleBloodBanks = type === "hospitals" ? [] : computedBanks;

      const fallbackResult: NearbyFacilityResponse = {
        userPosition: { lat: params.lat, lng: params.lng },
        radiusKm: radius,
        totalVisible: visibleHospitals.length + visibleBloodBanks.length,
        counts: {
          hospitals: filteredHospitals.length,
          bloodBanks: computedBanks.length,
        },
        hospitals: visibleHospitals,
        bloodBanks: visibleBloodBanks,
      };

      facilityCache.set(cacheKey, { data: fallbackResult, timestamp: Date.now() });
      return fallbackResult;
    }
  },

  geocodeLocation: async (query: string): Promise<GeocodedLocation[]> => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const cached = geocodeCache.get(q);
    if (cached && Date.now() - cached.timestamp < GEOCODE_CACHE_TTL) {
      return cached.data;
    }

    try {
      const res = await api.get<{ success: boolean; results: GeocodedLocation[] }>("/nearby/geocode", {
        params: { q },
        timeout: 5000,
      });
      if (res.data?.success && Array.isArray(res.data.results) && res.data.results.length > 0) {
        geocodeCache.set(q, { data: res.data.results, timestamp: Date.now() });
        return res.data.results;
      }
    } catch {
      // Fallback below
    }

    const matches = CLIENT_PRESET_LOCATIONS.filter((l) =>
      l.displayName.toLowerCase().includes(q)
    );
    if (matches.length > 0) {
      const res = matches.slice(0, 5);
      geocodeCache.set(q, { data: res, timestamp: Date.now() });
      return res;
    }

    try {
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=5&addressdetails=1`
      );
      if (osmRes.ok) {
        interface NominatimGeocodeItem {
          display_name: string;
          lat: string;
          lon: string;
          type?: string;
        }
        const data: NominatimGeocodeItem[] = await osmRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const res: GeocodedLocation[] = data.map((item: NominatimGeocodeItem) => ({
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            type: item.type || "locality",
          }));
          geocodeCache.set(q, { data: res, timestamp: Date.now() });
          return res;
        }
      }
    } catch {
      // fallback
    }

    return [];
  },
};
