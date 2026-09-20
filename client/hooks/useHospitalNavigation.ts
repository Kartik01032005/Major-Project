import { useState, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getCurrentDevicePosition, isNativePlatform } from "@/services/locationService";

export interface NavigableLocation {
  id: string;
  name: string;
  address?: string;
  district?: string;
  state?: string;
  position?: { lat: number; lng: number };
}

export function useHospitalNavigation() {
  const { t } = useLanguage();
  const [navLoadingId, setNavLoadingId] = useState<string | null>(null);
  const [navError, setNavError] = useState<{ id: string; message: string } | null>(null);

  const navigateToHospital = useCallback(
    (location: NavigableLocation) => {
      if (navLoadingId) return;

      setNavError(null);

      let destParam = "";
      if (
        location.position &&
        typeof location.position.lat === "number" &&
        typeof location.position.lng === "number" &&
        (location.position.lat !== 0 || location.position.lng !== 0)
      ) {
        destParam = `${location.position.lat},${location.position.lng}`;
      } else {
        const parts = [location.name, location.address, location.district, location.state].filter(Boolean);
        destParam = encodeURIComponent(parts.join(", "));
      }

      if (!destParam) {
        setNavError({
          id: location.id,
          message: t("donor_nav_err_invalid_dest") || "Invalid or missing destination coordinates.",
        });
        return;
      }

      setNavLoadingId(location.id);

      // 1. Native Capacitor (Android / iOS)
      if (isNativePlatform()) {
        getCurrentDevicePosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 })
          .then((pos) => {
            setNavLoadingId(null);
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${pos.latitude},${pos.longitude}&destination=${destParam}`;
            window.open(mapsUrl, "_blank", "noopener,noreferrer");
          })
          .catch((err) => {
            setNavLoadingId(null);
            let msg = t("donor_nav_err_generic") || "Unable to get your current location. Please try again.";
            if (err?.code === "PERMISSION_DENIED") {
              msg = t("donor_nav_err_denied") || "Location permission is required for navigation.";
            } else if (err?.code === "TIMEOUT") {
              msg = t("donor_nav_err_timeout") || "Location request timed out. Please try again.";
            }
            setNavError({ id: location.id, message: msg });
          });
        return;
      }

      // 2. Web Browser
      if (typeof window === "undefined" || !navigator.geolocation) {
        setNavLoadingId(null);
        setNavError({
          id: location.id,
          message: t("donor_nav_err_unsupported") || "Location is not supported by this browser.",
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setNavLoadingId(null);
          const { latitude: userLat, longitude: userLng } = pos.coords;
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destParam}`;
          window.open(mapsUrl, "_blank", "noopener,noreferrer");
        },
        (geoErr) => {
          setNavLoadingId(null);
          let msg = t("donor_nav_err_generic") || "Unable to get your current location. Please try again.";

          switch (geoErr.code) {
            case geoErr.PERMISSION_DENIED:
              msg = t("donor_nav_err_denied") || "Location permission is required for navigation.";
              break;
            case geoErr.POSITION_UNAVAILABLE:
              msg = t("donor_nav_err_unavailable") || "Unable to get your current location. Please try again.";
              break;
            case geoErr.TIMEOUT:
              msg = t("donor_nav_err_timeout") || "Location request timed out. Please try again.";
              break;
          }

          setNavError({ id: location.id, message: msg });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    },
    [navLoadingId, t]
  );

  return {
    navLoadingId,
    navError,
    navigateToHospital,
  };
}
