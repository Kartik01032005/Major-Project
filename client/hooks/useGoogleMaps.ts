"use client";

interface UseGoogleMapsReturn {
  isLoaded: boolean;
  loadError: boolean;
  hasApiKey: boolean;
}

export function useGoogleMaps(): UseGoogleMapsReturn {
  return { isLoaded: false, loadError: false, hasApiKey: false };
}

