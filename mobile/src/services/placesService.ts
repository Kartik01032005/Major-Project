import { apiClient } from "./apiClient";
import { haversineKm } from "../utils/distance";
import {
  hasValidCoordinates,
  type GeoPoint,
  type HospitalResponse,
  type NearbyPlace,
} from "../types/location";

/**
 * Transforms an API hospital record into a nearby place. Hospitals without
 * usable coordinates (default 0,0) keep an undefined position-distance and are
 * represented without a mapable position so callers can degrade gracefully.
 */
export function hospitalToPlace(hospital: HospitalResponse): NearbyPlace {
  return {
    _id: hospital._id,
    name: hospital.name,
    address: hospital.address,
    state: hospital.state,
    district: hospital.district,
    phone: hospital.phone,
    category: "hospital",
    source: "live",
    position: {
      latitude: hospital.latitude,
      longitude: hospital.longitude,
    },
  };
}

/**
 * Bundled sample blood-bank data. There is NO backend blood-bank model or
 * public inventory endpoint, so live blood-bank data is unavailable to the app
 * (the web app itself uses mock data). This static list lets the demo show the
 * intended UX; it is flagged `source: "sample"` and surfaced honestly in the UI.
 */
export const SAMPLE_BLOOD_BANKS: NearbyPlace[] = [
  {
    _id: "sample-bb-1",
    name: "Apollo Blood Bank",
    address: "Bannerghatta Road, JP Nagar",
    state: "Karnataka",
    district: "Bangalore",
    phone: "9876500001",
    category: "bloodBank",
    source: "sample",
    position: { latitude: 12.9016, longitude: 77.5945 },
  },
  {
    _id: "sample-bb-2",
    name: "Manipal Blood Centre",
    address: "Old Airport Road, Kodihalli",
    state: "Karnataka",
    district: "Bangalore",
    phone: "9876500002",
    category: "bloodBank",
    source: "sample",
    position: { latitude: 12.9592, longitude: 77.6493 },
  },
  {
    _id: "sample-bb-3",
    name: "KMC Blood Bank",
    address: "Dr. B. R. Ambedkar Circle",
    state: "Karnataka",
    district: "Mysore",
    phone: "9876500003",
    category: "bloodBank",
    source: "sample",
    position: { latitude: 12.2958, longitude: 76.6394 },
  },
];

/** Returns true when a place has coordinates accurate enough to map or compute distance. */
export function placeHasMappablePosition(place: NearbyPlace): boolean {
  return hasValidCoordinates(place.position.latitude, place.position.longitude);
}

/**
 * Annotates each place with its distance from the origin and returns them sorted
 * nearest-first. Places without mappable coordinates sort to the end (distance
 * left undefined). Returns a new array; does not mutate inputs.
 */
export function annotateAndSortByDistance(places: NearbyPlace[], origin: GeoPoint): NearbyPlace[] {
  return places
    .map((place) => {
      if (!placeHasMappablePosition(place)) return place;
      return { ...place, distanceKm: haversineKm(origin, place.position) };
    })
    .sort((a, b) => {
      const aDistance = a.distanceKm;
      const bDistance = b.distanceKm;
      if (aDistance === undefined && bDistance === undefined) return 0;
      if (aDistance === undefined) return 1;
      if (bDistance === undefined) return -1;
      return aDistance - bDistance;
    });
}

export const placesService = {
  /** Fetches live hospital records and maps them to nearby places. */
  async listHospitals(): Promise<NearbyPlace[]> {
    const hospitals = await apiClient.getHospitals();
    return hospitals.map(hospitalToPlace);
  },
  /** Bundled sample blood-bank data for the demo UX (not live data). */
  listSampleBloodBanks(): NearbyPlace[] {
    return SAMPLE_BLOOD_BANKS;
  },
};
