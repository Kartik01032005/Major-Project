import type { GeoPoint } from "../types/location";

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Great-circle distance between two geo points in kilometres.
 */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const latitudeDelta = toRadians(b.latitude - a.latitude);
  const longitudeDelta = toRadians(b.longitude - a.longitude);
  const latitude1 = toRadians(a.latitude);
  const latitude2 = toRadians(b.latitude);

  const sineDeltaLat = Math.sin(latitudeDelta / 2);
  const sineDeltaLng = Math.sin(longitudeDelta / 2);
  const haversine =
    sineDeltaLat * sineDeltaLat +
    sineDeltaLng * sineDeltaLng * Math.cos(latitude1) * Math.cos(latitude2);
  const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return EARTH_RADIUS_KM * centralAngle;
}

/**
 * Formats a distance in kilometres as a human-readable string.
 * Short distances render in metres to match the web's "850 m" / "2.4 km" convention.
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
