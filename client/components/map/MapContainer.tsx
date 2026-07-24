"use client";

import React, { useRef, useEffect } from "react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import MapFallback from "./MapFallback";
import { MapBloodBank, MapHospital, LatLng } from "@/types";

// ─── Custom SVG Marker Icons ──────────────────────────────────────────────────

const BLOOD_BANK_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#00000040"/>
  </filter>
  <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z"
        fill="#DC2626" filter="url(#shadow)"/>
  <circle cx="18" cy="18" r="11" fill="white" opacity="0.2"/>
  <text x="18" y="23" text-anchor="middle" font-size="14" fill="white" font-weight="bold">🩸</text>
</svg>`;

const HOSPITAL_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#00000040"/>
  </filter>
  <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z"
        fill="#2563EB" filter="url(#shadow)"/>
  <circle cx="18" cy="18" r="11" fill="white" opacity="0.2"/>
  <text x="18" y="23" text-anchor="middle" font-size="14" fill="white" font-weight="bold">🏥</text>
</svg>`;

const USER_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" fill="#3B82F6" opacity="0.3"/>
  <circle cx="12" cy="12" r="6" fill="#3B82F6"/>
  <circle cx="12" cy="12" r="3" fill="white"/>
</svg>`;

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// ─── Info Window HTML builder ─────────────────────────────────────────────────

function buildBloodBankInfoHTML(bank: MapBloodBank): string {
  const badgeHtml = bank.available.map((bg) => `
    <span style="display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:6px;background:#FEE2E2;color:#B91C1C;font-size:11px;font-weight:700">${bg}</span>
  `).join("");
  const statusHtml = bank.open
    ? `<span style="color:#059669;font-weight:600;font-size:11px">● Open</span>`
    : `<span style="color:#6B7280;font-weight:600;font-size:11px">● Closed</span>`;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(bank.name + " " + bank.address)}`;
  return `
    <div style="font-family:Inter,sans-serif;min-width:220px;max-width:260px;padding:4px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <strong style="font-size:13px;color:#0F172A;line-height:1.3">${bank.name}</strong>
        ${statusHtml}
      </div>
      <p style="font-size:11px;color:#64748B;margin:0 0 4px 0">${bank.address}, ${bank.district}</p>
      <p style="font-size:11px;color:#64748B;margin:0 0 8px 0">📏 ${bank.distance} away</p>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">${badgeHtml}</div>
      <div style="display:flex;gap:6px">
        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
           style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;padding:6px;border-radius:8px;background:#DC2626;color:white;font-size:11px;font-weight:600;text-decoration:none">
          🧭 Navigate
        </a>
        <a href="tel:${bank.phone}"
           style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;padding:6px;border-radius:8px;background:#F1F5F9;color:#334155;font-size:11px;font-weight:600;text-decoration:none">
          📞 Call
        </a>
      </div>
    </div>`;
}

function buildHospitalInfoHTML(h: MapHospital): string {
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(h.name + " " + h.address)}`;
  return `
    <div style="font-family:Inter,sans-serif;min-width:200px;max-width:240px;padding:4px">
      <strong style="font-size:13px;color:#0F172A;display:block;margin-bottom:6px">${h.name}</strong>
      <p style="font-size:11px;color:#64748B;margin:0 0 4px 0">📍 ${h.address}, ${h.district}, ${h.state}</p>
      <p style="font-size:11px;color:#64748B;margin:0 0 10px 0">📞 ${h.phone}</p>
      <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
         style="display:flex;align-items:center;justify-content:center;gap:4px;padding:6px;border-radius:8px;background:#2563EB;color:white;font-size:11px;font-weight:600;text-decoration:none">
        🧭 Navigate
      </a>
    </div>`;
}

// ─── Light & Dark Map Styles ──────────────────────────────────────────────────

const LIGHT_STYLE = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
];

const DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1e293b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f172a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#475569" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MapContainerProps {
  center: LatLng;
  zoom?: number;
  height?: string;
  bloodBanks?: MapBloodBank[];
  hospitals?: MapHospital[];
  userPosition?: LatLng | null;
  onBloodBankSelect?: (bank: MapBloodBank) => void;
  onHospitalSelect?: (hospital: MapHospital) => void;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MapContainer({
  center,
  zoom = 13,
  height = "h-72",
  bloodBanks = [],
  hospitals = [],
  userPosition = null,
  onBloodBankSelect,
  onHospitalSelect,
  className = "",
}: MapContainerProps) {
  const { isLoaded, hasApiKey, loadError } = useGoogleMaps();
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markersRef = useRef<GoogleMarkerInstance[]>([]);
  const infoWindowRef = useRef<GoogleInfoWindowInstance | null>(null);

  // Detect dark mode
  const isDark = () =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapDivRef.current) return;

    if (mapRef.current) return; // Already initialized

    mapRef.current = new window.google.maps.Map(mapDivRef.current, {
      center,
      zoom,
      styles: isDark() ? DARK_STYLE : LIGHT_STYLE,
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
    });

    infoWindowRef.current = new window.google.maps.InfoWindow();
  }, [isLoaded, center, zoom]);

  // Update center when prop changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setCenter(new window.google.maps.LatLng(center.lat, center.lng));
  }, [center]);

  // Manage blood bank markers
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    // Blood bank markers
    bloodBanks.forEach((bank) => {
      const marker = new window.google.maps.Marker({
        position: { lat: bank.position.lat, lng: bank.position.lng },
        map: mapRef.current!,
        title: bank.name,
        icon: {
          url: svgToDataUrl(BLOOD_BANK_ICON_SVG),
          scaledSize: new window.google.maps.Size(36, 44),
          anchor: new window.google.maps.Point(18, 44),
        },
        animation: window.google.maps.Animation.DROP,
      });

      marker.addListener("click", () => {
        infoWindowRef.current?.setContent(buildBloodBankInfoHTML(bank));
        infoWindowRef.current?.open(mapRef.current!, marker);
        onBloodBankSelect?.(bank);
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: bank.position.lat, lng: bank.position.lng });
      hasPoints = true;
    });

    // Hospital markers
    hospitals.forEach((h) => {
      const marker = new window.google.maps.Marker({
        position: { lat: h.position.lat, lng: h.position.lng },
        map: mapRef.current!,
        title: h.name,
        icon: {
          url: svgToDataUrl(HOSPITAL_ICON_SVG),
          scaledSize: new window.google.maps.Size(36, 44),
          anchor: new window.google.maps.Point(18, 44),
        },
        animation: window.google.maps.Animation.DROP,
      });

      marker.addListener("click", () => {
        infoWindowRef.current?.setContent(buildHospitalInfoHTML(h));
        infoWindowRef.current?.open(mapRef.current!, marker);
        onHospitalSelect?.(h);
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: h.position.lat, lng: h.position.lng });
      hasPoints = true;
    });

    // User position marker
    if (userPosition) {
      const userMarker = new window.google.maps.Marker({
        position: { lat: userPosition.lat, lng: userPosition.lng },
        map: mapRef.current!,
        title: "Your Location",
        icon: {
          url: svgToDataUrl(USER_ICON_SVG),
          scaledSize: new window.google.maps.Size(24, 24),
          anchor: new window.google.maps.Point(12, 12),
        },
        zIndex: 999,
      });
      markersRef.current.push(userMarker);
    }

    // Fit all markers into view if we have multiple points
    if (hasPoints && !bounds.isEmpty() && (bloodBanks.length + hospitals.length) > 1) {
      mapRef.current.fitBounds(bounds);
    }
  }, [isLoaded, bloodBanks, hospitals, userPosition, onBloodBankSelect, onHospitalSelect]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (!hasApiKey) {
    return <MapFallback reason="no-key" height={height} />;
  }

  if (loadError) {
    return <MapFallback reason="load-error" height={height} />;
  }

  return (
    <div className={`relative ${height} ${className} rounded-2xl overflow-hidden`}>
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading map…</p>
          </div>
        </div>
      )}

      {/* The map target div */}
      <div
        ref={mapDivRef}
        className="absolute inset-0 w-full h-full"
        aria-label="Interactive map"
        role="application"
      />
    </div>
  );
}
