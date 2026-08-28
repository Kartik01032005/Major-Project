"use client";

import React, { useEffect, useState } from "react";
import { MapBloodBank, MapHospital, LatLng } from "@/types";

// ─── Custom SVG Marker Icons for Leaflet ──────────────────────────────────────

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

// ─── Info Popup HTML builders ──────────────────────────────────────────────────

function buildBloodBankInfoHTML(bank: MapBloodBank): string {
  const badgeHtml = bank.available.map((bg) => `
    <span style="display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:6px;background:#FEE2E2;color:#B91C1C;font-size:11px;font-weight:700">${bg}</span>
  `).join("");
  const statusHtml = bank.open
    ? `<span style="color:#059669;font-weight:600;font-size:11px">● Open</span>`
    : `<span style="color:#6B7280;font-weight:600;font-size:11px">● Closed</span>`;
  const osmLiveUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;${bank.position.lat},${bank.position.lng}`;
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
        <a href="${osmLiveUrl}" target="_blank" rel="noopener noreferrer"
           style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;padding:6px;border-radius:8px;background:#DC2626;color:white;font-size:11px;font-weight:600;text-decoration:none">
          🧭 Directions
        </a>
        <a href="tel:${bank.phone}"
           style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;padding:6px;border-radius:8px;background:#F1F5F9;color:#334155;font-size:11px;font-weight:600;text-decoration:none">
          📞 Call
        </a>
      </div>
    </div>`;
}

function buildHospitalInfoHTML(h: MapHospital): string {
  const osmLiveUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;${h.position.lat},${h.position.lng}`;
  return `
    <div style="font-family:Inter,sans-serif;min-width:200px;max-width:240px;padding:4px">
      <strong style="font-size:13px;color:#0F172A;display:block;margin-bottom:6px">${h.name}</strong>
      <p style="font-size:11px;color:#64748B;margin:0 0 4px 0">📍 ${h.address}, ${h.district}, ${h.state}</p>
      <p style="font-size:11px;color:#64748B;margin:0 0 10px 0">📞 ${h.phone}</p>
      <a href="${osmLiveUrl}" target="_blank" rel="noopener noreferrer"
         style="display:flex;align-items:center;justify-content:center;gap:4px;padding:6px;border-radius:8px;background:#2563EB;color:white;font-size:11px;font-weight:600;text-decoration:none">
        🧭 Directions
      </a>
    </div>`;
}

// ─── Dynamic Client-Only Leaflet Map Implementation ───────────────────────────

// Controller component declared outside render to prevent state reset warnings
interface MapControllerProps {
  center: LatLng;
  zoom: number;
  bloodBanks: MapBloodBank[];
  hospitals: MapHospital[];
  L: typeof import("leaflet");
  useMap: () => import("leaflet").Map;
}

function MapController({ center, zoom, bloodBanks, hospitals, L, useMap }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (center && map) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [map, center, zoom]);

  useEffect(() => {
    const allPoints: [number, number][] = [
      ...bloodBanks.map((b) => [b.position.lat, b.position.lng] as [number, number]),
      ...hospitals.map((h) => [h.position.lat, h.position.lng] as [number, number]),
    ];
    if (allPoints.length > 1 && L && map) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [map, bloodBanks, hospitals, L]);

  return null;
}

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

function LeafletMapInner({
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
  const [L, setL] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    import("leaflet").then((leafletModule) => {
      setL(leafletModule.default || leafletModule);
    });
  }, []);

  if (!L) {
    return (
      <div className={`relative ${height} ${className} rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading OpenStreetMap…</p>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MapContainer: ReactLeafletMap, TileLayer, Marker, Popup, useMap } = require("react-leaflet");

  // Custom Icon instances
  const bloodBankIcon = L.icon({
    iconUrl: svgToDataUrl(BLOOD_BANK_ICON_SVG),
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -40],
  });

  const hospitalIcon = L.icon({
    iconUrl: svgToDataUrl(HOSPITAL_ICON_SVG),
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -40],
  });

  const userIcon = L.icon({
    iconUrl: svgToDataUrl(USER_ICON_SVG),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10],
  });

  return (
    <div className={`relative ${height} ${className} rounded-2xl overflow-hidden shadow-inner`}>
      <ReactLeafletMap
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
      >
        <MapController
          center={center}
          zoom={zoom}
          bloodBanks={bloodBanks}
          hospitals={hospitals}
          L={L}
          useMap={useMap}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User position marker */}
        {userPosition && (
          <Marker position={[userPosition.lat, userPosition.lng]} icon={userIcon}>
            <Popup>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: "600" }}>
                📍 Your Location
              </div>
            </Popup>
          </Marker>
        )}

        {/* Blood bank markers */}
        {bloodBanks.map((bank: MapBloodBank) => (
          <Marker
            key={bank.id}
            position={[bank.position.lat, bank.position.lng]}
            icon={bloodBankIcon}
            eventHandlers={{
              click: () => onBloodBankSelect?.(bank),
            }}
          >
            <Popup>
              <div dangerouslySetInnerHTML={{ __html: buildBloodBankInfoHTML(bank) }} />
            </Popup>
          </Marker>
        ))}

        {/* Hospital markers */}
        {hospitals.map((h: MapHospital) => (
          <Marker
            key={h.id}
            position={[h.position.lat, h.position.lng]}
            icon={hospitalIcon}
            eventHandlers={{
              click: () => onHospitalSelect?.(h),
            }}
          >
            <Popup>
              <div dangerouslySetInnerHTML={{ __html: buildHospitalInfoHTML(h) }} />
            </Popup>
          </Marker>
        ))}
      </ReactLeafletMap>
    </div>
  );
}

function useHydrated() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function MapContainer(props: MapContainerProps) {
  const isMounted = useHydrated();

  if (!isMounted) {
    return (
      <div className={`relative ${props.height || "h-72"} ${props.className || ""} rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading map…</p>
        </div>
      </div>
    );
  }

  return <LeafletMapInner {...props} />;
}
