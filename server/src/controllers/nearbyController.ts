import { Request, Response } from "express";
import Hospital from "../models/Hospital.js";
import User from "../models/User.js";
import BloodInventory from "../models/BloodInventory.js";

export interface NearbyPlaceItem {
  id: string;
  name: string;
  address: string;
  district: string;
  state: string;
  phone: string;
  website?: string;
  openingHours?: string;
  open: boolean;
  position: { lat: number; lng: number };
  distanceKm: number;
  distance: string;
  type: "hospital" | "blood_bank";
  available?: string[];
  source: "bloodlink" | "osm";
  isBloodLinkRegistered?: boolean;
}

// ─── Haversine Distance Formula (km) ──────────────────────────────────────────
export function calculateHaversineDistanceKm(
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

export function formatDistanceStr(distKm: number): string {
  if (distKm < 0.1) {
    return "< 100 m";
  }
  return `${distKm.toFixed(1)} km`;
}

// ─── In-Memory Cache for Real OSM Places ──────────────────────────────────────
interface CacheEntry {
  timestamp: number;
  data: NearbyPlaceItem[];
}
const osmCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

// ─── Build Clean Address from OSM Tags ────────────────────────────────────────
function buildOsmAddress(tags: any, fallbackName?: string): { address: string; district: string; state: string } {
  const street = tags?.["addr:street"] || tags?.road || "";
  const house = tags?.["addr:housenumber"] || tags?.house_number || "";
  const suburb = tags?.["addr:suburb"] || tags?.suburb || tags?.neighbourhood || "";
  const city = tags?.["addr:city"] || tags?.city || tags?.town || tags?.village || "";
  const district = tags?.["addr:district"] || tags?.county || city || "";
  const state = tags?.["addr:state"] || tags?.state || "Karnataka";
  const postcode = tags?.["addr:postcode"] || tags?.postcode || "";

  const streetPart = [house, street].filter(Boolean).join(" ");
  const parts = [streetPart, suburb, city, postcode].filter(Boolean);

  const address = parts.length > 0 ? parts.join(", ") : (fallbackName ? `${fallbackName}, ${city || district}` : "Address available on map");

  return { address, district, state };
}

// ─── Overpass API Discovery ──────────────────────────────────────────────────
async function queryOverpass(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<NearbyPlaceItem[]> {
  const query = `[out:json][timeout:12];(nwr["amenity"="hospital"](around:${radiusMeters},${lat},${lng});nwr["amenity"="blood_bank"](around:${radiusMeters},${lat},${lng});nwr["healthcare"="hospital"](around:${radiusMeters},${lat},${lng});nwr["healthcare"="blood_bank"](around:${radiusMeters},${lat},${lng}););out center tags;`;

  const overpassEndpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
  ];

  for (const endpoint of overpassEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: new URLSearchParams({ data: query }).toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "BloodLink-LiveApp/1.0 (bloodlink.finder@gmail.com)",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) continue;
      const data: any = await response.json();
      if (!data.elements || !Array.isArray(data.elements) || data.elements.length === 0) continue;

      const items: NearbyPlaceItem[] = [];
      for (const el of data.elements) {
        const pLat = el.lat ?? el.center?.lat;
        const pLng = el.lon ?? el.center?.lon;
        const rawName = el.tags?.name || el.tags?.["name:en"] || el.tags?.["name:kn"];
        if (!pLat || !pLng || !rawName) continue;

        const distKm = calculateHaversineDistanceKm(lat, lng, pLat, pLng);
        const { address, district, state } = buildOsmAddress(el.tags, rawName);
        const isBloodBank =
          el.tags?.amenity === "blood_bank" ||
          el.tags?.healthcare === "blood_bank" ||
          el.tags?.blood_bank === "yes" ||
          el.tags?.["healthcare:speciality"] === "blood_bank" ||
          rawName.toLowerCase().includes("blood bank") ||
          rawName.toLowerCase().includes("blood centre");

        const openingHours = el.tags?.opening_hours || "";
        let open = true;
        if (openingHours) {
          const lower = openingHours.toLowerCase();
          if (lower.includes("closed") || lower.includes("off")) {
            open = false;
          }
        }

        items.push({
          id: `osm-${el.type || "n"}-${el.id}`,
          name: rawName,
          address,
          district,
          state,
          phone: el.tags?.phone || el.tags?.["contact:phone"] || el.tags?.["phone:mobile"] || "",
          website: el.tags?.website || el.tags?.["contact:website"] || "",
          openingHours,
          open,
          position: { lat: pLat, lng: pLng },
          distanceKm: parseFloat(distKm.toFixed(1)),
          distance: formatDistanceStr(distKm),
          type: isBloodBank ? "blood_bank" : "hospital",
          source: "osm",
          isBloodLinkRegistered: false,
        });
      }

      if (items.length > 0) {
        return items;
      }
    } catch {
      // Continue to next mirror if this one fails or times out
    }
  }

  return [];
}

// ─── Nominatim Live OSM Query Fallback ────────────────────────────────────────
// When Overpass is heavily loaded, Nominatim queries the live OpenStreetMap database instantly.
async function queryNominatimBoundingBox(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<NearbyPlaceItem[]> {
  try {
    const degLat = radiusKm / 111;
    const degLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
    const minLat = lat - degLat;
    const maxLat = lat + degLat;
    const minLng = lng - degLng;
    const maxLng = lng + degLng;

    const viewbox = `${minLng},${maxLat},${maxLng},${minLat}`;
    const headers = { "User-Agent": "BloodLink-LiveApp/1.0 (bloodlink.finder@gmail.com)" };

    // Query hospitals and blood banks in parallel from OSM via Nominatim
    const [hospRes, bbRes] = await Promise.allSettled([
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&amenity=hospital&viewbox=${viewbox}&bounded=1&limit=50&addressdetails=1`,
        { headers, signal: AbortSignal.timeout(6000) }
      ),
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&amenity=blood_bank&viewbox=${viewbox}&bounded=1&limit=25&addressdetails=1`,
        { headers, signal: AbortSignal.timeout(6000) }
      ),
    ]);

    const results: NearbyPlaceItem[] = [];
    const seenIds = new Set<string>();

    if (hospRes.status === "fulfilled" && hospRes.value.ok) {
      const data: any = await hospRes.value.json();
      if (Array.isArray(data)) {
        for (const item of data) {
          const pLat = parseFloat(item.lat);
          const pLng = parseFloat(item.lon);
          if (isNaN(pLat) || isNaN(pLng)) continue;

          const distKm = calculateHaversineDistanceKm(lat, lng, pLat, pLng);
          if (distKm > radiusKm) continue;

          const id = `osm-nom-${item.osm_type || "n"}-${item.osm_id || item.place_id}`;
          if (seenIds.has(id)) continue;
          seenIds.add(id);

          const rawName = item.name || (item.display_name ? item.display_name.split(",")[0] : "Hospital");
          const { address, district, state } = buildOsmAddress(item.address, rawName);

          results.push({
            id,
            name: rawName,
            address,
            district,
            state,
            phone: item.address?.phone || "",
            position: { lat: pLat, lng: pLng },
            distanceKm: parseFloat(distKm.toFixed(1)),
            distance: formatDistanceStr(distKm),
            open: true,
            type: "hospital",
            source: "osm",
            isBloodLinkRegistered: false,
          });
        }
      }
    }

    if (bbRes.status === "fulfilled" && bbRes.value.ok) {
      const data: any = await bbRes.value.json();
      if (Array.isArray(data)) {
        for (const item of data) {
          const pLat = parseFloat(item.lat);
          const pLng = parseFloat(item.lon);
          if (isNaN(pLat) || isNaN(pLng)) continue;

          const distKm = calculateHaversineDistanceKm(lat, lng, pLat, pLng);
          if (distKm > radiusKm) continue;

          const id = `osm-nom-${item.osm_type || "n"}-${item.osm_id || item.place_id}`;
          if (seenIds.has(id)) continue;
          seenIds.add(id);

          const rawName = item.name || (item.display_name ? item.display_name.split(",")[0] : "Blood Bank");
          const { address, district, state } = buildOsmAddress(item.address, rawName);

          results.push({
            id,
            name: rawName,
            address,
            district,
            state,
            phone: item.address?.phone || "",
            position: { lat: pLat, lng: pLng },
            distanceKm: parseFloat(distKm.toFixed(1)),
            distance: formatDistanceStr(distKm),
            open: true,
            type: "blood_bank",
            source: "osm",
            isBloodLinkRegistered: false,
          });
        }
      }
    }

    return results;
  } catch (err) {
    console.warn("Nominatim bounding box search error:", err);
    return [];
  }
}

// ─── Fetch Real OSM Facilities (Overpass with Nominatim Fallback) ─────────────
async function fetchRealOSMPlaces(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<NearbyPlaceItem[]> {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)},${radiusKm}`;
  const cached = osmCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const radiusMeters = Math.min(Math.round(radiusKm * 1000), 50000);

  // 1. Try Overpass first
  let places = await queryOverpass(lat, lng, radiusMeters);

  // 2. If Overpass timed out or returned empty, use Nominatim live OSM search
  if (!places || places.length === 0) {
    places = await queryNominatimBoundingBox(lat, lng, radiusKm);
  }

  if (places && places.length > 0) {
    osmCache.set(cacheKey, { timestamp: Date.now(), data: places });
  }

  return places || [];
}

// ─── Main Controller: getNearbyFacilities ─────────────────────────────────────
export const getNearbyFacilities = async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({
        success: false,
        message: "Valid lat and lng query parameters are required for nearby facilities search.",
      });
      return;
    }

    const radiusKm = Math.min(Math.max(parseFloat(req.query.radius as string) || 5, 1), 100);
    const filterType = (req.query.type as string) || "all";
    const bloodGroup = (req.query.bloodGroup as string) || "";
    const openNowOnly = req.query.openNow === "true";
    const search = ((req.query.search as string) || "").trim().toLowerCase();

    // 1. Fetch BloodLink MongoDB Registered Blood Banks
    const bloodBankUsers = await User.find({
      role: "admin",
      "location.latitude": { $ne: 0 },
      "location.longitude": { $ne: 0 },
    }).lean();

    const bloodBankIds = bloodBankUsers.map((u) => u._id);
    const inventoryRecords = await BloodInventory.find({
      bloodBankId: { $in: bloodBankIds },
      units: { $gt: 0 },
    }).lean();

    const inventoryMap: Record<string, string[]> = {};
    for (const record of inventoryRecords) {
      const bId = record.bloodBankId.toString();
      if (!inventoryMap[bId]) inventoryMap[bId] = [];
      inventoryMap[bId].push(record.bloodGroup);
    }

    const bloodLinkBanks: NearbyPlaceItem[] = [];
    for (const bank of bloodBankUsers) {
      const bLat = bank.location?.latitude;
      const bLng = bank.location?.longitude;
      if (bLat == null || bLng == null || (bLat === 0 && bLng === 0)) continue;

      const distKm = calculateHaversineDistanceKm(lat, lng, bLat, bLng);
      if (distKm > radiusKm) continue;

      const available = inventoryMap[bank._id.toString()] || ["A+", "B+", "O+", "AB+"];

      bloodLinkBanks.push({
        id: `bb-${bank._id}`,
        name: bank.name,
        address: `${bank.location?.district || ""}, ${bank.location?.state || ""}`.replace(/^, /, "") || "Address on record",
        district: bank.location?.district || "",
        state: bank.location?.state || "",
        phone: bank.phone || "",
        position: { lat: bLat, lng: bLng },
        distanceKm: parseFloat(distKm.toFixed(1)),
        distance: formatDistanceStr(distKm),
        open: true,
        type: "blood_bank",
        available,
        source: "bloodlink",
        isBloodLinkRegistered: true,
      });
    }

    // 2. Fetch BloodLink MongoDB Registered Hospitals
    const dbHospitals = await Hospital.find({
      latitude: { $ne: 0 },
      longitude: { $ne: 0 },
    }).lean();

    const bloodLinkHospitals: NearbyPlaceItem[] = [];
    for (const h of dbHospitals) {
      if (!h.latitude || !h.longitude) continue;
      const distKm = calculateHaversineDistanceKm(lat, lng, h.latitude, h.longitude);
      if (distKm > radiusKm) continue;

      bloodLinkHospitals.push({
        id: `h-${h._id}`,
        name: h.name,
        address: h.address,
        district: h.district,
        state: h.state,
        phone: h.phone,
        position: { lat: h.latitude, lng: h.longitude },
        distanceKm: parseFloat(distKm.toFixed(1)),
        distance: formatDistanceStr(distKm),
        open: true,
        type: "hospital",
        source: "bloodlink",
        isBloodLinkRegistered: true,
      });
    }

    // 3. Fetch Real OpenStreetMap Hospitals & Blood Banks (Overpass + Nominatim)
    const osmPlaces = await fetchRealOSMPlaces(lat, lng, radiusKm);

    // Merge OSM places and MongoDB places, preventing duplicates
    const combinedHospitals: NearbyPlaceItem[] = [...bloodLinkHospitals];
    const combinedBloodBanks: NearbyPlaceItem[] = [...bloodLinkBanks];

    for (const osm of osmPlaces) {
      const osmLower = osm.name.trim().toLowerCase();
      if (osm.type === "hospital") {
        const isDuplicate = combinedHospitals.some((h) => {
          const dist = calculateHaversineDistanceKm(h.position.lat, h.position.lng, osm.position.lat, osm.position.lng);
          if (dist < 0.03) return true;
          if (dist < 0.15) {
            const hLower = h.name.trim().toLowerCase();
            return hLower === osmLower || hLower.includes(osmLower) || osmLower.includes(hLower);
          }
          return false;
        });
        if (!isDuplicate) {
          combinedHospitals.push(osm);
        }
      } else {
        const isDuplicate = combinedBloodBanks.some((b) => {
          const dist = calculateHaversineDistanceKm(b.position.lat, b.position.lng, osm.position.lat, osm.position.lng);
          if (dist < 0.03) return true;
          if (dist < 0.15) {
            const bLower = b.name.trim().toLowerCase();
            return bLower === osmLower || bLower.includes(osmLower) || osmLower.includes(bLower);
          }
          return false;
        });
        if (!isDuplicate) {
          combinedBloodBanks.push(osm);
        }
      }
    }

    // 4. Apply Filters: Search keyword
    const filterBySearch = (item: NearbyPlaceItem) => {
      if (!search) return true;
      return (
        item.name.toLowerCase().includes(search) ||
        item.address.toLowerCase().includes(search) ||
        item.district.toLowerCase().includes(search)
      );
    };

    // Filter by Blood Group (for blood banks)
    const filterByBloodGroup = (bank: NearbyPlaceItem) => {
      if (!bloodGroup || bloodGroup === "all") return true;
      if (!bank.available) return true;
      return bank.available.includes(bloodGroup);
    };

    // Filter by Open Now
    const filterByOpenNow = (item: NearbyPlaceItem) => {
      if (!openNowOnly) return true;
      return item.open === true;
    };

    const finalHospitals = combinedHospitals
      .filter((h) => h.distanceKm <= radiusKm)
      .filter(filterBySearch)
      .filter(filterByOpenNow)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const finalBloodBanks = combinedBloodBanks
      .filter((b) => b.distanceKm <= radiusKm)
      .filter(filterBySearch)
      .filter(filterByBloodGroup)
      .filter(filterByOpenNow)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    // Apply Type filter
    let visibleHospitals = finalHospitals;
    let visibleBloodBanks = finalBloodBanks;

    if (filterType === "hospitals") {
      visibleBloodBanks = [];
    } else if (filterType === "bloodbanks") {
      visibleHospitals = [];
    }

    res.status(200).json({
      success: true,
      message: "Nearby facilities retrieved successfully",
      data: {
        userPosition: { lat, lng },
        radiusKm,
        totalVisible: visibleHospitals.length + visibleBloodBanks.length,
        counts: {
          hospitals: finalHospitals.length,
          bloodBanks: finalBloodBanks.length,
        },
        hospitals: visibleHospitals,
        bloodBanks: visibleBloodBanks,
      },
    });
  } catch (error: any) {
    console.error("❌ Nearby facilities error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve nearby facilities",
      error: error.message,
    });
  }
};

// ─── Preset Locations for Instant Geocoding ──────────────────────────────────
export interface PresetLocation {
  name: string;
  district: string;
  state: string;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
  keywords: string[];
}

export const PRESET_LOCATIONS: PresetLocation[] = [
  { name: "Sirsi", district: "Uttara Kannada", state: "Karnataka", displayName: "Sirsi, Uttara Kannada, Karnataka", lat: 14.6195, lng: 74.8354, type: "town", keywords: ["sirsi", "shirasi", "uttara kannada"] },
  { name: "Bengaluru", district: "Bengaluru Urban", state: "Karnataka", displayName: "Bengaluru, Karnataka", lat: 12.9716, lng: 77.5946, type: "city", keywords: ["bangalore", "bengaluru", "blr"] },
  { name: "Mysuru", district: "Mysuru", state: "Karnataka", displayName: "Mysuru, Karnataka", lat: 12.2958, lng: 76.6394, type: "city", keywords: ["mysore", "mysuru"] },
  { name: "Mangaluru", district: "Dakshina Kannada", state: "Karnataka", displayName: "Mangaluru, Karnataka", lat: 12.9141, lng: 74.8560, type: "city", keywords: ["mangalore", "mangaluru"] },
  { name: "Hubballi", district: "Dharwad", state: "Karnataka", displayName: "Hubballi-Dharwad, Karnataka", lat: 15.3647, lng: 75.1240, type: "city", keywords: ["hubli", "hubballi", "dharwad"] },
  { name: "Belagavi", district: "Belagavi", state: "Karnataka", displayName: "Belagavi, Karnataka", lat: 15.8497, lng: 74.4977, type: "city", keywords: ["belgaum", "belagavi"] },
  { name: "Kalaburagi", district: "Kalaburagi", state: "Karnataka", displayName: "Kalaburagi, Karnataka", lat: 17.3297, lng: 76.8343, type: "city", keywords: ["gulbarga", "kalaburagi"] },
  { name: "Davanagere", district: "Davanagere", state: "Karnataka", displayName: "Davanagere, Karnataka", lat: 14.4644, lng: 75.9218, type: "city", keywords: ["davanagere", "davangere"] },
  { name: "Ballari", district: "Ballari", state: "Karnataka", displayName: "Ballari, Karnataka", lat: 15.1394, lng: 76.9214, type: "city", keywords: ["bellary", "ballari"] },
  { name: "Shivamogga", district: "Shivamogga", state: "Karnataka", displayName: "Shivamogga, Karnataka", lat: 13.9299, lng: 75.5681, type: "city", keywords: ["shimoga", "shivamogga"] },
  { name: "Tumakuru", district: "Tumakuru", state: "Karnataka", displayName: "Tumakuru, Karnataka", lat: 13.3379, lng: 77.1010, type: "city", keywords: ["tumkur", "tumakuru"] },
  { name: "Udupi", district: "Udupi", state: "Karnataka", displayName: "Udupi, Karnataka", lat: 13.3409, lng: 74.7421, type: "city", keywords: ["udupi", "manipal"] },
  { name: "Hassan", district: "Hassan", state: "Karnataka", displayName: "Hassan, Karnataka", lat: 13.0033, lng: 76.1004, type: "city", keywords: ["hassan"] },
  { name: "Bidar", district: "Bidar", state: "Karnataka", displayName: "Bidar, Karnataka", lat: 17.9104, lng: 77.5199, type: "city", keywords: ["bidar"] },
  { name: "Raichur", district: "Raichur", state: "Karnataka", displayName: "Raichur, Karnataka", lat: 16.2076, lng: 77.3463, type: "city", keywords: ["raichur"] },
  { name: "Vijayapura", district: "Vijayapura", state: "Karnataka", displayName: "Vijayapura, Karnataka", lat: 16.8302, lng: 75.7100, type: "city", keywords: ["bijapur", "vijayapura"] },
  { name: "Koramangala", district: "Bengaluru Urban", state: "Karnataka", displayName: "Koramangala, Bengaluru", lat: 12.9352, lng: 77.6245, type: "suburb", keywords: ["koramangala"] },
  { name: "Indiranagar", district: "Bengaluru Urban", state: "Karnataka", displayName: "Indiranagar, Bengaluru", lat: 12.9784, lng: 77.6408, type: "suburb", keywords: ["indiranagar"] },
  { name: "Whitefield", district: "Bengaluru Urban", state: "Karnataka", displayName: "Whitefield, Bengaluru", lat: 12.9698, lng: 77.7500, type: "suburb", keywords: ["whitefield"] },
  { name: "Jayanagar", district: "Bengaluru Urban", state: "Karnataka", displayName: "Jayanagar, Bengaluru", lat: 12.9308, lng: 77.5838, type: "suburb", keywords: ["jayanagar"] },
  { name: "Electronic City", district: "Bengaluru Urban", state: "Karnataka", displayName: "Electronic City, Bengaluru", lat: 12.8452, lng: 77.6602, type: "suburb", keywords: ["electronic city"] },
  { name: "HSR Layout", district: "Bengaluru Urban", state: "Karnataka", displayName: "HSR Layout, Bengaluru", lat: 12.9121, lng: 77.6446, type: "suburb", keywords: ["hsr", "hsr layout"] },
  { name: "Mumbai", district: "Mumbai City", state: "Maharashtra", displayName: "Mumbai, Maharashtra", lat: 19.0760, lng: 72.8777, type: "city", keywords: ["mumbai", "bombay"] },
  { name: "Pune", district: "Pune", state: "Maharashtra", displayName: "Pune, Maharashtra", lat: 18.5204, lng: 73.8567, type: "city", keywords: ["pune", "poona"] },
  { name: "Delhi", district: "New Delhi", state: "Delhi", displayName: "New Delhi, Delhi", lat: 28.6139, lng: 77.2090, type: "city", keywords: ["delhi", "new delhi"] },
  { name: "Hyderabad", district: "Hyderabad", state: "Telangana", displayName: "Hyderabad, Telangana", lat: 17.3850, lng: 78.4867, type: "city", keywords: ["hyderabad"] },
  { name: "Chennai", district: "Chennai", state: "Tamil Nadu", displayName: "Chennai, Tamil Nadu", lat: 13.0827, lng: 80.2707, type: "city", keywords: ["chennai", "madras"] },
  { name: "Kolkata", district: "Kolkata", state: "West Bengal", displayName: "Kolkata, West Bengal", lat: 22.5726, lng: 88.3639, type: "city", keywords: ["kolkata"] },
  { name: "Ahmedabad", district: "Ahmedabad", state: "Gujarat", displayName: "Ahmedabad, Gujarat", lat: 23.0225, lng: 72.5714, type: "city", keywords: ["ahmedabad"] },
  { name: "Jaipur", district: "Jaipur", state: "Rajasthan", displayName: "Jaipur, Rajasthan", lat: 26.9124, lng: 75.7873, type: "city", keywords: ["jaipur"] },
  { name: "Kochi", district: "Ernakulam", state: "Kerala", displayName: "Kochi, Kerala", lat: 9.9312, lng: 76.2673, type: "city", keywords: ["kochi", "cochin"] },
  { name: "Goa", district: "North Goa", state: "Goa", displayName: "Panaji, Goa", lat: 15.4909, lng: 73.8278, type: "city", keywords: ["goa", "panaji"] },
];

// ─── Geocode Location Controller (Pure Nominatim & Presets) ───────────────────
export const geocodeLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = ((req.query.q as string) || "").trim();
    if (!q || q.length < 2) {
      res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
      return;
    }

    const lower = q.toLowerCase();

    // 1. Instant match in predefined popular locations
    const matches = PRESET_LOCATIONS.filter((loc) => {
      return (
        loc.name.toLowerCase().includes(lower) ||
        loc.district.toLowerCase().includes(lower) ||
        loc.displayName.toLowerCase().includes(lower) ||
        loc.keywords.some((k) => k.includes(lower) || lower.includes(k))
      );
    });

    if (matches.length > 0) {
      res.status(200).json({
        success: true,
        source: "preset",
        results: matches.slice(0, 5).map((m) => ({
          displayName: m.displayName,
          lat: m.lat,
          lng: m.lng,
          type: m.type,
        })),
      });
      return;
    }

    // 2. OpenStreetMap Nominatim for any arbitrary Indian place/city/town
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q
      )}&countrycodes=in&limit=6&addressdetails=1`;
      const osmRes = await fetch(osmUrl, {
        headers: {
          "User-Agent": "BloodLink-LiveApp/1.0 (bloodlink.finder@gmail.com)",
        },
        signal: AbortSignal.timeout(6000),
      });

      if (osmRes.ok) {
        const data: any = await osmRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const results = data.map((item: any) => ({
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            type: item.type || "locality",
          }));
          res.status(200).json({ success: true, source: "osm", results });
          return;
        }
      }
    } catch (osmErr) {
      console.warn("OSM Nominatim Geocoding error:", osmErr);
    }

    res.status(200).json({
      success: true,
      source: "none",
      results: [],
    });
  } catch (error: any) {
    console.error("❌ Geocode error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to geocode location",
      error: error.message,
    });
  }
};
