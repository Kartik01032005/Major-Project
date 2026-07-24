"use client";

import { useState, useEffect } from "react";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

// ─── Module-level singletons to avoid loading the script more than once ───────
let scriptState: "idle" | "loading" | "loaded" | "error" = "idle";
const pendingCallbacks: Array<() => void> = [];
const errorCallbacks: Array<() => void> = [];

function loadScript(): void {
  if (scriptState !== "idle") return;
  scriptState = "loading";

  // Expose the callback for Maps to call when ready
  window.__gmapsLoaded = () => {
    scriptState = "loaded";
    pendingCallbacks.forEach((cb) => cb());
    pendingCallbacks.length = 0;
  };

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&callback=__gmapsLoaded`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    scriptState = "error";
    errorCallbacks.forEach((cb) => cb());
    errorCallbacks.length = 0;
  };
  document.head.appendChild(script);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseGoogleMapsReturn {
  /** True when google.maps is available */
  isLoaded: boolean;
  /** True if the script failed to load */
  loadError: boolean;
  /** True when a valid API key exists */
  hasApiKey: boolean;
}

export function useGoogleMaps(): UseGoogleMapsReturn {
  const hasApiKey = MAPS_KEY.length > 0;

  const [isLoaded, setIsLoaded] = useState<boolean>(
    hasApiKey && scriptState === "loaded"
  );
  const [loadError, setLoadError] = useState<boolean>(
    scriptState === "error"
  );

  useEffect(() => {
    if (!hasApiKey) return;

    if (scriptState === "loaded" || scriptState === "error") {
      return;
    }

    // Register callbacks
    const onLoad = () => setIsLoaded(true);
    const onError = () => setLoadError(true);

    pendingCallbacks.push(onLoad);
    errorCallbacks.push(onError);

    // Start loading if not already
    loadScript();

    return () => {
      const li = pendingCallbacks.indexOf(onLoad);
      if (li > -1) pendingCallbacks.splice(li, 1);
      const ei = errorCallbacks.indexOf(onError);
      if (ei > -1) errorCallbacks.splice(ei, 1);
    };
  }, [hasApiKey]);

  return { isLoaded: isLoaded && hasApiKey, loadError, hasApiKey };
}
