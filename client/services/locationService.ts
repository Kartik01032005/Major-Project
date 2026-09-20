import { Capacitor } from "@capacitor/core";
import { Geolocation, PermissionStatus as CapPermissionStatus } from "@capacitor/geolocation";
import { UserLocationState } from "@/types";

export type DevicePermissionState = "prompt" | "granted" | "denied" | "unsupported";

export interface GetLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export class LocationServiceError extends Error {
  code: "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | "UNSUPPORTED";

  constructor(
    message: string,
    code: "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | "UNSUPPORTED"
  ) {
    super(message);
    this.name = "LocationServiceError";
    this.code = code;
  }
}

export const isNativePlatform = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/**
 * Checks current geolocation permission without triggering prompts
 */
export async function checkDevicePermission(): Promise<DevicePermissionState> {
  if (typeof window === "undefined") return "unsupported";

  // 1. Native Capacitor (Android / iOS)
  if (isNativePlatform()) {
    try {
      const status: CapPermissionStatus = await Geolocation.checkPermissions();
      if (status.location === "granted") return "granted";
      if (status.location === "denied") return "denied";
      return "prompt";
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "";
      if (!msg.toLowerCase().includes("not implemented")) {
        return "prompt";
      }
      // If plugin is not implemented, fall through to browser permissions check
    }
  }

  // 2. Web Browser / WebView Fallback
  if (!navigator?.geolocation) {
    return "unsupported";
  }

  if (navigator.permissions && navigator.permissions.query) {
    try {
      const p = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      return p.state as DevicePermissionState;
    } catch {
      return "prompt";
    }
  }

  return "prompt";
}

/**
 * Requests device location permission
 */
export async function requestDevicePermission(): Promise<DevicePermissionState> {
  if (typeof window === "undefined") return "unsupported";

  // 1. Native Capacitor (Android / iOS)
  if (isNativePlatform()) {
    try {
      const status: CapPermissionStatus = await Geolocation.requestPermissions({
        permissions: ["location"],
      });
      if (status.location === "granted") return "granted";
      if (status.location === "denied") return "denied";
      return "prompt";
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "";
      if (!msg.toLowerCase().includes("not implemented")) {
        return "denied";
      }
      // If plugin is not implemented, fall through to browser permission check
    }
  }

  // 2. Web Browser / WebView Fallback
  return checkDevicePermission();
}

/**
 * Obtains the real device GPS position using native Capacitor GPS on Android
 * or browser geolocation in web browsers and native WebView.
 */
export async function getCurrentDevicePosition(
  options: GetLocationOptions = {}
): Promise<UserLocationState> {
  if (typeof window === "undefined") {
    throw new LocationServiceError("Window is undefined.", "UNSUPPORTED");
  }

  const enableHighAccuracy = options.enableHighAccuracy ?? true;
  const timeout = options.timeout ?? 10000;
  const maximumAge = options.maximumAge ?? 0;

  // 1. Native Android / iOS via Capacitor Geolocation
  if (isNativePlatform()) {
    try {
      let permStatus: CapPermissionStatus | null = null;
      try {
        permStatus = await Geolocation.checkPermissions();
      } catch (permCheckErr) {
        const msg = (permCheckErr as Error)?.message || "";
        if (msg.toLowerCase().includes("not implemented")) {
          permStatus = null;
        }
      }

      if (permStatus) {
        if (permStatus.location !== "granted") {
          try {
            permStatus = await Geolocation.requestPermissions({ permissions: ["location"] });
          } catch {
            // Ignore request error and check status below
          }
        }

        if (permStatus.location === "denied") {
          throw new LocationServiceError(
            "Location permission was denied. Please allow location access in Android Settings.",
            "PERMISSION_DENIED"
          );
        }

        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy,
          timeout,
          maximumAge,
        });

        if (pos && pos.coords) {
          return {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp ?? Date.now(),
            isFallback: false,
          };
        }
      }
    } catch (err: unknown) {
      if (err instanceof LocationServiceError && err.code === "PERMISSION_DENIED") {
        throw err;
      }
      const message = (err as Error)?.message || "";
      if (message.toLowerCase().includes("denied")) {
        throw new LocationServiceError(message, "PERMISSION_DENIED");
      }
      if (message.toLowerCase().includes("not implemented")) {
        console.warn("[LocationService] Capacitor Geolocation plugin not implemented; falling back to navigator.geolocation");
      } else if (!navigator?.geolocation) {
        if (message.toLowerCase().includes("timeout")) {
          throw new LocationServiceError(message, "TIMEOUT");
        }
        throw new LocationServiceError(message, "POSITION_UNAVAILABLE");
      }
    }
  }

  // 2. Web Browser or Native WebView fallback via navigator.geolocation
  if (!navigator?.geolocation) {
    throw new LocationServiceError(
      "Geolocation is not supported by your browser or device.",
      "UNSUPPORTED"
    );
  }

  return new Promise<UserLocationState>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp || Date.now(),
          isFallback: false,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(
            new LocationServiceError(
              "Location access was denied. Please allow location access to find nearby facilities.",
              "PERMISSION_DENIED"
            )
          );
        } else if (err.code === err.TIMEOUT) {
          reject(
            new LocationServiceError(
              "Location request timed out. Please tap Find Near Me to try again.",
              "TIMEOUT"
            )
          );
        } else {
          reject(
            new LocationServiceError(
              "Location information is currently unavailable from device GPS.",
              "POSITION_UNAVAILABLE"
            )
          );
        }
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  });
}
