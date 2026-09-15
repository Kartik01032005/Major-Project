import { UserGpsLocation } from "@/types";

export interface HospitalRecommendation {
  osmId: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  cityOrArea: string;
  distanceKm: number;
  formattedDistance: string;
  source: "overpass" | "nominatim";
}

// ─── Haversine Distance Calculation ──────────────────────────────────────────
export function calculateDistanceKm(
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

export function formatDistanceString(distKm: number): string {
  if (distKm < 0.1) {
    return "< 100 m";
  }
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1)} km`;
}

// ─── Address Parser from OSM Tags ─────────────────────────────────────────────
interface OsmTags {
  name?: string;
  "name:en"?: string;
  "addr:full"?: string;
  "addr:street"?: string;
  "addr:housenumber"?: string;
  "addr:suburb"?: string;
  "addr:neighbourhood"?: string;
  "addr:city"?: string;
  "addr:town"?: string;
  "addr:district"?: string;
  "addr:state"?: string;
  "addr:postcode"?: string;
  [key: string]: string | undefined;
}

function parseOsmAddress(tags: OsmTags): { address: string; cityOrArea: string } {
  const cityOrArea =
    tags["addr:city"] ||
    tags["addr:town"] ||
    tags["addr:suburb"] ||
    tags["addr:neighbourhood"] ||
    tags["addr:district"] ||
    "";

  if (tags["addr:full"]) {
    return { address: tags["addr:full"].trim(), cityOrArea };
  }

  const parts: string[] = [];
  if (tags["addr:housenumber"] && tags["addr:street"]) {
    parts.push(`${tags["addr:housenumber"]} ${tags["addr:street"]}`);
  } else if (tags["addr:street"]) {
    parts.push(tags["addr:street"]);
  }

  if (tags["addr:suburb"] || tags["addr:neighbourhood"]) {
    parts.push(tags["addr:suburb"] || tags["addr:neighbourhood"] || "");
  }

  if (cityOrArea && !parts.includes(cityOrArea)) {
    parts.push(cityOrArea);
  }

  if (tags["addr:state"]) {
    parts.push(tags["addr:state"]);
  }

  if (tags["addr:postcode"]) {
    parts.push(tags["addr:postcode"]);
  }

  return {
    address: parts.filter(Boolean).join(", "),
    cityOrArea,
  };
}

// ─── Deduplication ────────────────────────────────────────────────────────────
function deduplicateHospitals(hospitals: HospitalRecommendation[]): HospitalRecommendation[] {
  const unique: HospitalRecommendation[] = [];
  const seenIds = new Set<string>();

  for (const h of hospitals) {
    if (seenIds.has(h.osmId)) continue;

    const hLower = h.name.trim().toLowerCase();

    // Check if duplicate location (< 50 meters) or same name within 200m
    const isDuplicate = unique.some((existing) => {
      const dist = calculateDistanceKm(existing.latitude, existing.longitude, h.latitude, h.longitude);
      if (dist < 0.05) return true;
      if (dist < 0.2) {
        const existLower = existing.name.trim().toLowerCase();
        return existLower === hLower || existLower.includes(hLower) || hLower.includes(existLower);
      }
      return false;
    });

    if (!isDuplicate) {
      seenIds.add(h.osmId);
      unique.push(h);
    }
  }

  return unique;
}

// ─── In-Memory Cache & Active Request Lock ────────────────────────────────────
interface CacheEntry {
  data: HospitalRecommendation[];
  timestamp: number;
}

const nearbyCache = new Map<string, CacheEntry>();
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let activeOverpassController: AbortController | null = null;
let activeNominatimController: AbortController | null = null;

// Primary & mirror endpoints for Overpass
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

// ─── Overpass Query Builder & Runner ──────────────────────────────────────────
export async function fetchNearbyHospitalsOverpass(
  latitude: number,
  longitude: number,
  radiusMeters = 10000,
  signal?: AbortSignal
): Promise<HospitalRecommendation[]> {
  // Round coordinates to ~100m for cache lookup
  const cacheKey = `${latitude.toFixed(3)}_${longitude.toFixed(3)}_${radiusMeters}`;
  const cached = nearbyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Prevent duplicate in-flight Overpass requests
  if (activeOverpassController) {
    activeOverpassController.abort();
  }
  const controller = new AbortController();
  activeOverpassController = controller;

  const effectiveSignal = signal || controller.signal;

  // Exact query required by prompt:
  // [out:json][timeout:15];
  // nwr["amenity"="hospital"](around:10000,LATITUDE,LONGITUDE);
  // out center tags;
  const query = `[out:json][timeout:15];nwr["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});out center tags;`;

  let elements: Array<{
    type: "node" | "way" | "relation";
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: OsmTags;
  }> = [];

  let querySuccessful = false;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "data=" + encodeURIComponent(query),
        signal: effectiveSignal,
      });

      if (response.ok) {
        const json = await response.json();
        if (json && Array.isArray(json.elements)) {
          elements = json.elements;
          querySuccessful = true;
          break;
        }
      }
    } catch (err: unknown) {
      const errorObj = err as { name?: string };
      if (errorObj?.name === "AbortError" || effectiveSignal.aborted) {
        throw err;
      }
      console.warn(`Overpass endpoint ${endpoint} failed:`, err);
    }
  }

  // If Overpass timed out or was unavailable, use Nominatim bounding box as live OSM fallback
  if (!querySuccessful) {
    try {
      const degLat = (radiusMeters / 1000) / 111;
      const degLng = (radiusMeters / 1000) / (111 * Math.cos((latitude * Math.PI) / 180));
      const minLat = latitude - degLat;
      const maxLat = latitude + degLat;
      const minLng = longitude - degLng;
      const maxLng = longitude + degLng;
      const viewbox = `${minLng},${maxLat},${maxLng},${minLat}`;

      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&amenity=hospital&viewbox=${viewbox}&bounded=1&limit=50&addressdetails=1`;
      const nomRes = await fetch(nomUrl, { signal: effectiveSignal });
      if (nomRes.ok) {
        const nomItems = await nomRes.json();
        if (Array.isArray(nomItems)) {
          const results: HospitalRecommendation[] = [];
          for (const item of nomItems) {
            const hLat = parseFloat(item.lat);
            const hLng = parseFloat(item.lon);
            const name = item.name || (item.display_name ? item.display_name.split(",")[0].trim() : "");
            if (!name || isNaN(hLat) || isNaN(hLng)) continue;

            const dist = calculateDistanceKm(latitude, longitude, hLat, hLng);
            const cityOrArea =
              item.address?.city ||
              item.address?.town ||
              item.address?.suburb ||
              item.address?.neighbourhood ||
              item.address?.county ||
              "";

            results.push({
              osmId: `osm-${item.osm_type || "node"}-${item.osm_id || item.place_id}`,
              name,
              latitude: hLat,
              longitude: hLng,
              address: item.display_name || "",
              cityOrArea,
              distanceKm: dist,
              formattedDistance: formatDistanceString(dist),
              source: "nominatim",
            });
          }

          results.sort((a, b) => a.distanceKm - b.distanceKm);
          const deduped = deduplicateHospitals(results);
          nearbyCache.set(cacheKey, { data: deduped, timestamp: Date.now() });
          return deduped;
        }
      }
    } catch (nomErr: unknown) {
      const errorObj = nomErr as { name?: string };
      if (errorObj?.name === "AbortError" || effectiveSignal.aborted) {
        throw nomErr;
      }
      console.warn("Nominatim fallback also failed:", nomErr);
    }
  }

  // Parse Overpass elements
  const hospitals: HospitalRecommendation[] = [];

  for (const el of elements) {
    const tags = el.tags;
    if (!tags) continue;

    const name = tags.name || tags["name:en"];
    if (!name || !name.trim()) continue;

    const hLat = el.lat ?? el.center?.lat;
    const hLng = el.lon ?? el.center?.lon;
    if (typeof hLat !== "number" || typeof hLng !== "number") continue;

    const dist = calculateDistanceKm(latitude, longitude, hLat, hLng);
    const { address, cityOrArea } = parseOsmAddress(tags);

    hospitals.push({
      osmId: `osm-${el.type}-${el.id}`,
      name: name.trim(),
      latitude: hLat,
      longitude: hLng,
      address,
      cityOrArea,
      distanceKm: dist,
      formattedDistance: formatDistanceString(dist),
      source: "overpass",
    });
  }

  // Sort ascending by distance (nearest first)
  hospitals.sort((a, b) => a.distanceKm - b.distanceKm);

  const deduped = deduplicateHospitals(hospitals);
  nearbyCache.set(cacheKey, { data: deduped, timestamp: Date.now() });
  return deduped;
}

// ─── Nominatim Broader Hospital Search ─────────────────────────────────────────
export async function searchHospitalsNominatim(
  query: string,
  userLocation?: UserGpsLocation | null,
  signal?: AbortSignal
): Promise<HospitalRecommendation[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const cacheKey = trimmed.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  if (activeNominatimController) {
    activeNominatimController.abort();
  }
  const controller = new AbortController();
  activeNominatimController = controller;

  const effectiveSignal = signal || controller.signal;

  try {
    // Search with hospital amenity filter or query term
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      trimmed
    )}&amenity=hospital&addressdetails=1&limit=10`;

    let res = await fetch(url, { signal: effectiveSignal });
    let items = res.ok ? await res.json() : [];

    // If 0 items, try searching with query + " hospital"
    if (!Array.isArray(items) || items.length === 0) {
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmed + " hospital"
      )}&addressdetails=1&limit=10`;
      res = await fetch(fallbackUrl, { signal: effectiveSignal });
      if (res.ok) {
        items = await res.json();
      }
    }

    if (!Array.isArray(items)) return [];

    const results: HospitalRecommendation[] = [];
    for (const item of items) {
      const hLat = parseFloat(item.lat);
      const hLng = parseFloat(item.lon);
      const name = item.name || (item.display_name ? item.display_name.split(",")[0].trim() : "");
      if (!name || isNaN(hLat) || isNaN(hLng)) continue;

      const dist = userLocation
        ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, hLat, hLng)
        : 0;

      const cityOrArea =
        item.address?.city ||
        item.address?.town ||
        item.address?.suburb ||
        item.address?.neighbourhood ||
        item.address?.county ||
        "";

      results.push({
        osmId: `osm-${item.osm_type || "node"}-${item.osm_id || item.place_id}`,
        name,
        latitude: hLat,
        longitude: hLng,
        address: item.display_name || "",
        cityOrArea,
        distanceKm: dist,
        formattedDistance: userLocation ? formatDistanceString(dist) : "",
        source: "nominatim",
      });
    }

    if (userLocation) {
      results.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    const deduped = deduplicateHospitals(results);
    searchCache.set(cacheKey, { data: deduped, timestamp: Date.now() });
    return deduped;
  } catch (err: unknown) {
    const errorObj = err as { name?: string };
    if (errorObj?.name === "AbortError" || effectiveSignal.aborted) {
      throw err;
    }
    console.warn("Nominatim hospital search error:", err);
    return [];
  }
}
