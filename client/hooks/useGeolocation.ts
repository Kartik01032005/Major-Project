"use client";

import { useState, useCallback } from "react";
import { LatLng } from "@/types";

// Default fallback: Bengaluru, Karnataka
const DEFAULT_LOCATION: LatLng = { lat: 12.9716, lng: 77.5946 };

interface GeolocationState {
  position: LatLng;
  isUsingDefault: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGeolocation(): GeolocationState {
  const [position, setPosition] = useState<LatLng>(DEFAULT_LOCATION);
  const [isUsingDefault, setIsUsingDefault] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsUsingDefault(true);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsUsingDefault(false);
        setLoading(false);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location access denied. Showing default location (Bengaluru).");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location unavailable. Showing default location.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Showing default location.");
            break;
          default:
            setError("Unable to determine location.");
        }
        setIsUsingDefault(true);
        setLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000, // 5 min cache
      }
    );
  }, []);

  return { position, isUsingDefault, loading, error, refetch: fetchLocation };
}
