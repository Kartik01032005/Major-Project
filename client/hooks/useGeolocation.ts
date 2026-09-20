"use client";

import { useState, useCallback, useEffect } from "react";
import { LatLng } from "@/types";

import {
  getCurrentDevicePosition,
  checkDevicePermission,
  isNativePlatform,
} from "@/services/locationService";

export type GeolocationPermissionState = "prompt" | "granted" | "denied" | "unsupported";

export interface GeolocationState {
  position: LatLng | null;
  accuracy: number | null;
  isUsingDefault: boolean;
  loading: boolean;
  error: string | null;
  permissionState: GeolocationPermissionState;
  timestamp: number | null;
  refetch: (highAccuracy?: boolean | unknown) => void;
}

export function useGeolocation(options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}): GeolocationState {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isUsingDefault, setIsUsingDefault] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<GeolocationPermissionState>("prompt");
  const [timestamp, setTimestamp] = useState<number | null>(null);

  // Synchronize permission state
  useEffect(() => {
    let isMounted = true;

    if (isNativePlatform()) {
      checkDevicePermission()
        .then((status) => {
          if (!isMounted) return;
          setPermissionState(status as GeolocationPermissionState);
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }

    if (typeof window === "undefined" || !navigator.geolocation) {
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((permissionStatus) => {
          if (!isMounted) return;
          setPermissionState(permissionStatus.state as GeolocationPermissionState);
          permissionStatus.onchange = () => {
            if (!isMounted) return;
            setPermissionState(permissionStatus.state as GeolocationPermissionState);
          };
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchLocation = useCallback(
    (highAccuracy?: boolean | unknown) => {
      const useHighAccuracy = typeof highAccuracy === "boolean" ? highAccuracy : (options?.enableHighAccuracy ?? true);

      setLoading(true);
      setError(null);

      // 1. Native Capacitor (Android / iOS)
      if (isNativePlatform()) {
        getCurrentDevicePosition({
          enableHighAccuracy: useHighAccuracy,
          timeout: options?.timeout ?? 10000,
          maximumAge: options?.maximumAge ?? 30000,
        })
          .then((pos) => {
            setPosition({ lat: pos.latitude, lng: pos.longitude });
            setAccuracy(pos.accuracy ?? null);
            setTimestamp(pos.timestamp ?? Date.now());
            setIsUsingDefault(false);
            setLoading(false);
            setError(null);
            setPermissionState("granted");
          })
          .catch((err) => {
            setAccuracy(null);
            setPosition(null);
            setIsUsingDefault(false);
            setLoading(false);
            const msg = err?.message || "";
            if (err?.code === "PERMISSION_DENIED" || msg.toLowerCase().includes("denied")) {
              setPermissionState("denied");
              setError("Location access denied. Please allow location access in settings to see nearby facilities.");
            } else if (err?.code === "TIMEOUT") {
              setError("Location request timed out. Please try again.");
            } else {
              setError("Unable to determine your location. Please check your device location settings.");
            }
          });
        return;
      }

      // 2. Web Browser
      if (typeof window === "undefined" || !navigator.geolocation) {
        setError("Geolocation is not supported by your browser.");
        setPermissionState("unsupported");
        setPosition(null);
        setIsUsingDefault(false);
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setAccuracy(pos.coords.accuracy);
          setTimestamp(pos.timestamp);
          setIsUsingDefault(false);
          setLoading(false);
          setError(null);
          setPermissionState("granted");
        },
        (err) => {
          setAccuracy(null);
          setPosition(null);
          setIsUsingDefault(false);
          setLoading(false);

          switch (err.code) {
            case err.PERMISSION_DENIED:
              setPermissionState("denied");
              setError("Location access denied. Please allow location access in your browser settings to see nearby facilities.");
              break;
            case err.POSITION_UNAVAILABLE:
              setError("Location information is unavailable from your device GPS.");
              break;
            case err.TIMEOUT:
              setError("Location request timed out. Please try again.");
              break;
            default:
              setError("Unable to determine your location. Please check your device location settings.");
          }
        },
        {
          enableHighAccuracy: useHighAccuracy,
          timeout: options?.timeout ?? 10000,
          maximumAge: options?.maximumAge ?? 30000,
        }
      );
    },
    [options?.enableHighAccuracy, options?.maximumAge, options?.timeout]
  );

  return {
    position,
    accuracy,
    isUsingDefault,
    loading,
    error,
    permissionState,
    timestamp,
    refetch: fetchLocation,
  };
}
