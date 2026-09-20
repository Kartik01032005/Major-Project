"use client";

import React, { useEffect, useState, useRef } from "react";
import { MapBloodBank, MapHospital, LatLng, UserLocationState, SearchLocationState } from "@/types";

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
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
  <circle cx="14" cy="14" r="13" fill="#3B82F6" opacity="0.25"/>
  <circle cx="14" cy="14" r="8" fill="#2563EB"/>
  <circle cx="14" cy="14" r="4" fill="white"/>
</svg>`;

const SEARCH_TARGET_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
  <filter id="shadow-search" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#00000040"/>
  </filter>
  <path d="M17 0C7.61 0 0 7.61 0 17c0 12.8 17 25 17 25s17-12.2 17-25C34 7.61 26.39 0 17 0z"
        fill="#D97706" filter="url(#shadow-search)"/>
  <circle cx="17" cy="17" r="10" fill="white" opacity="0.25"/>
  <text x="17" y="22" text-anchor="middle" font-size="13" fill="white" font-weight="bold">🔎</text>
</svg>`;

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// ─── Info Popup HTML builders ──────────────────────────────────────────────────

function buildBloodBankInfoHTML(
  bank: MapBloodBank & { isBloodLinkRegistered?: boolean; openingHours?: string },
  userLocation?: UserLocationState | null
): string {
  const badgeHtml = bank.available && bank.available.length > 0
    ? bank.available.map((bg) => `
        <span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:6px;background:#FEE2E2;color:#B91C1C;font-size:10px;font-weight:700">${bg}</span>
      `).join("")
    : "";

  const statusHtml = bank.open
    ? `<span style="color:#059669;font-weight:600;font-size:11px">● Open</span>`
    : `<span style="color:#6B7280;font-weight:600;font-size:11px">● Closed</span>`;

  const regBadge = bank.isBloodLinkRegistered
    ? `<div style="display:inline-block;margin-bottom:6px;padding:2px 7px;border-radius:6px;background:#FEE2E2;color:#DC2626;font-size:10px;font-weight:700">✓ BloodLink Registered</div>`
    : "";

  // Navigation URL with exact user GPS origin if available
  const originParam = userLocation && !userLocation.isFallback
    ? `origin=${userLocation.latitude},${userLocation.longitude}&`
    : "";
  const navUrl = `https://www.google.com/maps/dir/?api=1&${originParam}destination=${bank.position.lat},${bank.position.lng}`;
  const osmMapUrl = `https://www.openstreetmap.org/?mlat=${bank.position.lat}&mlon=${bank.position.lng}#map=16/${bank.position.lat}/${bank.position.lng}`;

  const phoneHtml = bank.phone
    ? `<a href="tel:${bank.phone}" style="flex:1;display:flex;align-items:center;justify-content:center;gap:3px;padding:5px;border-radius:8px;background:#F1F5F9;color:#334155;font-size:11px;font-weight:600;text-decoration:none">📞 Call</a>`
    : `<span style="flex:1;display:flex;align-items:center;justify-content:center;padding:5px;border-radius:8px;background:#F8FAFC;color:#94A3B8;font-size:10px;">No Phone</span>`;

  const safeEncodedName = encodeURIComponent(bank.name).replace(/'/g, "%27");

  return `
    <div style="font-family:Inter,sans-serif;min-width:220px;max-width:270px;padding:4px">
      ${regBadge}
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
        <strong style="font-size:13px;color:#0F172A;line-height:1.3">${bank.name}</strong>
        ${statusHtml}
      </div>
      <p style="font-size:11px;color:#64748B;margin:0 0 3px 0">📍 ${bank.address || ""}</p>
      ${bank.distance ? `<p style="font-size:11px;color:#64748B;margin:0 0 6px 0">📏 ${bank.distance} away</p>` : ""}
      ${badgeHtml ? `<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:8px">${badgeHtml}</div>` : ""}
      <div style="display:flex;gap:5px;margin-top:6px">
        <a href="${navUrl}" target="_blank" rel="noopener noreferrer"
           onclick="if(window.__bloodlinkNavigate){window.__bloodlinkNavigate(${bank.position.lat}, ${bank.position.lng}, '${safeEncodedName}'); return false;}"
           style="flex:1;display:flex;align-items:center;justify-content:center;gap:3px;padding:6px;border-radius:8px;background:#DC2626;color:white;font-size:11px;font-weight:600;text-decoration:none">
          🧭 Navigate
        </a>
        <a href="${osmMapUrl}" target="_blank" rel="noopener noreferrer"
           style="flex:1;display:flex;align-items:center;justify-content:center;gap:3px;padding:6px;border-radius:8px;background:#F1F5F9;color:#1E293B;font-size:11px;font-weight:600;text-decoration:none">
          🗺️ Open Map
        </a>
        ${phoneHtml}
      </div>
    </div>`;
}

function buildHospitalInfoHTML(
  h: MapHospital & { distance?: string; open?: boolean; openingHours?: string; isBloodLinkRegistered?: boolean },
  userLocation?: UserLocationState | null
): string {
  const osmMapUrl = `https://www.openstreetmap.org/?mlat=${h.position.lat}&mlon=${h.position.lng}#map=16/${h.position.lat}/${h.position.lng}`;

  // Navigation URL with exact user GPS origin if available
  const originParam = userLocation && !userLocation.isFallback
    ? `origin=${userLocation.latitude},${userLocation.longitude}&`
    : "";
  const navUrl = `https://www.google.com/maps/dir/?api=1&${originParam}destination=${h.position.lat},${h.position.lng}`;

  const statusHtml = h.open
    ? `<span style="color:#059669;font-weight:600;font-size:11px">● Open</span>`
    : `<span style="color:#6B7280;font-weight:600;font-size:11px">● Closed</span>`;

  const regBadge = h.isBloodLinkRegistered
    ? `<div style="display:inline-block;margin-bottom:6px;padding:2px 7px;border-radius:6px;background:#EFF6FF;color:#1D4ED8;font-size:10px;font-weight:700">✓ BloodLink Registered</div>`
    : "";

  const phoneHtml = h.phone
    ? `<a href="tel:${h.phone}" style="flex:1;display:flex;align-items:center;justify-content:center;gap:3px;padding:5px;border-radius:8px;background:#F1F5F9;color:#334155;font-size:11px;font-weight:600;text-decoration:none">📞 Call</a>`
    : `<span style="flex:1;display:flex;align-items:center;justify-content:center;padding:5px;border-radius:8px;background:#F8FAFC;color:#94A3B8;font-size:10px;">No Phone</span>`;

  const safeEncodedName = encodeURIComponent(h.name).replace(/'/g, "%27");

  return `
    <div style="font-family:Inter,sans-serif;min-width:220px;max-width:270px;padding:4px">
      ${regBadge}
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
        <strong style="font-size:13px;color:#0F172A;line-height:1.3">${h.name}</strong>
        ${statusHtml}
      </div>
      <p style="font-size:11px;color:#64748B;margin:0 0 3px 0">📍 ${h.address || ""}</p>
      ${h.distance ? `<p style="font-size:11px;color:#64748B;margin:0 0 3px 0">📏 ${h.distance} away</p>` : ""}
      ${h.openingHours ? `<p style="font-size:10px;color:#64748B;margin:0 0 6px 0">🕒 ${h.openingHours}</p>` : ""}
      <div style="display:flex;gap:5px;margin-top:8px">
        <a href="${navUrl}" target="_blank" rel="noopener noreferrer"
           onclick="if(window.__bloodlinkNavigate){window.__bloodlinkNavigate(${h.position.lat}, ${h.position.lng}, '${safeEncodedName}'); return false;}"
           style="flex:1;display:flex;align-items:center;justify-content:center;gap:3px;padding:6px;border-radius:8px;background:#2563EB;color:white;font-size:11px;font-weight:600;text-decoration:none">
          🧭 Navigate
        </a>
        <a href="${osmMapUrl}" target="_blank" rel="noopener noreferrer"
           style="flex:1;display:flex;align-items:center;justify-content:center;gap:3px;padding:6px;border-radius:8px;background:#F1F5F9;color:#1E293B;font-size:11px;font-weight:600;text-decoration:none">
          🗺️ Open Map
        </a>
        ${phoneHtml}
      </div>
    </div>`;
}

// ─── Dynamic Client-Only Leaflet Map Implementation ───────────────────────────

interface MapControllerProps {
  center: LatLng;
  zoom: number;
  bloodBanks: MapBloodBank[];
  hospitals: MapHospital[];
  searchCenter?: LatLng | null;
  radiusKm?: number;
  selectedId?: string | null;
  markerRefs: React.MutableRefObject<Record<string, import("leaflet").Marker>>;
  L: typeof import("leaflet");
  useMap: () => import("leaflet").Map;
}

function MapController({
  center,
  zoom,
  bloodBanks,
  hospitals,
  searchCenter,
  radiusKm,
  selectedId,
  markerRefs,
  L,
  useMap,
}: MapControllerProps) {
  const map = useMap();

  // Invalidate map size on window resize / orientation change
  useEffect(() => {
    if (!map) return;
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", handleResize);
    // Initial invalidate to ensure tiles load seamlessly
    const timer = setTimeout(handleResize, 150);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [map]);

  useEffect(() => {
    if (center && map) {
      map.setView([center.lat, center.lng], zoom, { animate: true });
    }
  }, [map, center, zoom]);

  useEffect(() => {
    if (!L || !map) return;

    if (selectedId) {
      const selected =
        bloodBanks.find((b) => b.id === selectedId)?.position ||
        hospitals.find((h) => h.id === selectedId)?.position;
      if (selected) {
        map.setView([selected.lat, selected.lng], Math.max(map.getZoom(), 16), { animate: true });
        // Programmatically open popup on selected marker
        const timer = setTimeout(() => {
          if (markerRefs.current[selectedId]) {
            markerRefs.current[selectedId].openPopup();
          }
        }, 50);
        return () => clearTimeout(timer);
      }
    }

    if (searchCenter && radiusKm) {
      // Use exact radius in meters to fit the radius circle nicely
      const circleBounds = L.latLng(searchCenter.lat, searchCenter.lng).toBounds(radiusKm * 1000);
      map.fitBounds(circleBounds, { padding: [25, 25], maxZoom: 15, animate: true });
      return;
    }

    const allPoints: [number, number][] = [
      ...bloodBanks.map((b) => [b.position.lat, b.position.lng] as [number, number]),
      ...hospitals.map((h) => [h.position.lat, h.position.lng] as [number, number]),
    ];
    if (allPoints.length > 1) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [map, bloodBanks, hospitals, searchCenter, radiusKm, selectedId, markerRefs, L]);

  return null;
}

export interface MapContainerProps {
  center: LatLng;
  zoom?: number;
  height?: string;
  bloodBanks?: MapBloodBank[];
  hospitals?: MapHospital[];
  userLocation?: UserLocationState | null;
  userPosition?: LatLng | null; // Backwards compatibility for dashboard/nearby
  userPositionLabel?: string;
  userPositionSub?: string;
  searchLocation?: SearchLocationState | null;
  radiusKm?: number;
  selectedId?: string | null;
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
  userLocation = null,
  userPosition = null,
  userPositionLabel,
  userPositionSub,
  searchLocation = null,
  radiusKm,
  selectedId = null,
  onBloodBankSelect,
  onHospitalSelect,
  className = "",
}: MapContainerProps) {
  const [L, setL] = useState<typeof import("leaflet") | null>(null);
  const markerRefs = useRef<Record<string, import("leaflet").Marker>>({});

  const effectiveUserLocation: UserLocationState | null =
    userLocation ||
    (userPosition
      ? {
          latitude: userPosition.lat,
          longitude: userPosition.lng,
          isFallback: false,
        }
      : null);

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
          <p className="text-xs text-slate-400">Loading map…</p>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const reactLeaflet = require("react-leaflet");
  const {
    MapContainer: ReactLeafletMap,
    TileLayer,
    Marker,
    Popup,
    Circle,
    useMap,
  } = reactLeaflet;

  const bloodBankIcon = L.icon({
    iconUrl: svgToDataUrl(BLOOD_BANK_ICON_SVG),
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -42],
  });

  const hospitalIcon = L.icon({
    iconUrl: svgToDataUrl(HOSPITAL_ICON_SVG),
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -42],
  });

  const userIcon = L.icon({
    iconUrl: svgToDataUrl(USER_ICON_SVG),
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

  const searchTargetIcon = L.icon({
    iconUrl: svgToDataUrl(SEARCH_TARGET_ICON_SVG),
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -40],
  });

  // Calculate search center: searchLocation coordinates take precedence if active, else user location
  const activeSearchCenter: LatLng | null = searchLocation
    ? { lat: searchLocation.latitude, lng: searchLocation.longitude }
    : effectiveUserLocation
    ? { lat: effectiveUserLocation.latitude, lng: effectiveUserLocation.longitude }
    : null;

  // Determine if search location is distinct from user GPS position
  const isSearchDistinctFromUser = Boolean(
    searchLocation &&
      effectiveUserLocation &&
      !effectiveUserLocation.isFallback &&
      (Math.abs(searchLocation.latitude - effectiveUserLocation.latitude) > 0.002 ||
        Math.abs(searchLocation.longitude - effectiveUserLocation.longitude) > 0.002)
  );

  return (
    <div className={`relative ${height} ${className} isolate z-0 rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800`}>
      <ReactLeafletMap
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        zoomControl={true}
        scrollWheelZoom={false}
      >
        <MapController
          center={center}
          zoom={zoom}
          bloodBanks={bloodBanks}
          hospitals={hospitals}
          searchCenter={activeSearchCenter}
          radiusKm={radiusKm}
          selectedId={selectedId}
          markerRefs={markerRefs}
          L={L}
          useMap={useMap}
        />
        {/* OpenStreetMap Tiles with required attribution */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Radius circle around active search center */}
        {activeSearchCenter && radiusKm && (
          <Circle
            center={[activeSearchCenter.lat, activeSearchCenter.lng]}
            radius={radiusKm * 1000}
            pathOptions={{
              color: "#DC2626",
              fillColor: "#DC2626",
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: "6, 6",
            }}
          />
        )}

        {/* 1. Actual User Location Marker (GPS) */}
        {effectiveUserLocation && !effectiveUserLocation.isFallback && (
          <Marker position={[effectiveUserLocation.latitude, effectiveUserLocation.longitude]} icon={userIcon}>
            <Popup>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", padding: "2px 4px" }}>
                <div style={{ fontWeight: "700", color: "#1D4ED8", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>🔵</span> {userPositionLabel || "Your Actual Location (GPS)"}
                </div>
                {userPositionSub ? (
                  <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>{userPositionSub}</div>
                ) : (
                  <div style={{ fontSize: "11px", color: "#64748B", marginTop: "3px" }}>
                    {effectiveUserLocation.latitude.toFixed(4)}°, {effectiveUserLocation.longitude.toFixed(4)}°
                  </div>
                )}
                {effectiveUserLocation.accuracy !== undefined && (
                  <div style={{ fontSize: "10px", color: "#64748B", marginTop: "1px" }}>
                    Accuracy: ±{Math.round(effectiveUserLocation.accuracy)}m
                  </div>
                )}
                {effectiveUserLocation.accuracy !== undefined && effectiveUserLocation.accuracy > 500 && (
                  <div style={{ fontSize: "10px", color: "#D97706", marginTop: "3px", fontWeight: "600" }}>
                    ⚠️ Low GPS accuracy. Move to open area.
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* 2. Searched Location Marker (when searching another area, e.g. Sirsi) */}
        {searchLocation && isSearchDistinctFromUser && (
          <Marker position={[searchLocation.latitude, searchLocation.longitude]} icon={searchTargetIcon}>
            <Popup>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", padding: "2px 4px" }}>
                <div style={{ fontWeight: "700", color: "#D97706", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>🔎</span> Search Center: {searchLocation.displayName}
                </div>
                <div style={{ fontSize: "11px", color: "#64748B", marginTop: "3px" }}>
                  Searching facilities within {radiusKm || 30} km radius
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Blood bank markers */}
        {bloodBanks.map((bank: MapBloodBank) => (
          <Marker
            key={bank.id}
            ref={(ref: import("leaflet").Marker | null) => {
              if (ref) markerRefs.current[bank.id] = ref;
            }}
            position={[bank.position.lat, bank.position.lng]}
            icon={bloodBankIcon}
            eventHandlers={{
              click: () => onBloodBankSelect?.(bank),
            }}
          >
            <Popup>
              <div dangerouslySetInnerHTML={{ __html: buildBloodBankInfoHTML(bank, effectiveUserLocation) }} />
            </Popup>
          </Marker>
        ))}

        {/* Hospital markers */}
        {hospitals.map((h: MapHospital) => (
          <Marker
            key={h.id}
            ref={(ref: import("leaflet").Marker | null) => {
              if (ref) markerRefs.current[h.id] = ref;
            }}
            position={[h.position.lat, h.position.lng]}
            icon={hospitalIcon}
            eventHandlers={{
              click: () => onHospitalSelect?.(h),
            }}
          >
            <Popup>
              <div dangerouslySetInnerHTML={{ __html: buildHospitalInfoHTML(h, effectiveUserLocation) }} />
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
