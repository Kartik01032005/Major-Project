import { useState, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";

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

      if (typeof window === "undefined" || !navigator.geolocation) {
        setNavError({
          id: location.id,
          message: t("donor_nav_err_unsupported") || "Location is not supported by this browser.",
        });
        return;
      }

      setNavLoadingId(location.id);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setNavLoadingId(null);
          const { latitude: userLat, longitude: userLng } = pos.coords;

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
