export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type LocationStatus = "idle" | "loading" | "granted" | "denied" | "unavailable" | "error";

export type NearbyCategory = "hospital" | "bloodBank";

export type NearbyPlace = {
  _id: string;
  name: string;
  address: string;
  state: string;
  district: string;
  phone: string;
  category: NearbyCategory;
  position: GeoPoint;
  /** Distance in kilometres from the user. Undefined when distance can't be computed. */
  distanceKm?: number;
};

export type HospitalResponse = {
  _id: string;
  name: string;
  address: string;
  state: string;
  district: string;
  phone: string;
  latitude: number;
  longitude: number;
};

export function isHospitalResponse(value: unknown): value is HospitalResponse {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate._id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.address === "string" &&
    typeof candidate.state === "string" &&
    typeof candidate.district === "string" &&
    typeof candidate.phone === "string" &&
    typeof candidate.latitude === "number" &&
    typeof candidate.longitude === "number"
  );
}

export function hasValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}
