import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const alt = "BloodLink – Smart Blood Donor Finder";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#090d16",
          backgroundImage: "radial-gradient(circle at 80% 20%, rgba(220, 38, 38, 0.22) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(185, 28, 28, 0.15) 0%, transparent 45%)",
          padding: "70px 80px",
          color: "white",
          fontFamily: "sans-serif",
          boxSizing: "border-box",
        }}
      >
        {/* Top bar: Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              backgroundColor: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 25px -5px rgba(220, 38, 38, 0.5)",
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <span style={{ fontSize: "38px", fontWeight: 800, letterSpacing: "-0.5px" }}>
            Blood<span style={{ color: "#ef4444" }}>Link</span>
          </span>
          <div
            style={{
              marginLeft: "16px",
              padding: "6px 14px",
              borderRadius: "999px",
              backgroundColor: "rgba(220, 38, 38, 0.15)",
              border: "1px solid rgba(220, 38, 38, 0.35)",
              color: "#f87171",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            Smart Donor Finder
          </div>
        </div>

        {/* Center: Main message */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "980px" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-1px",
            }}
          >
            Connecting Donors, Hospitals &amp; Blood Banks in Real Time
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "#94a3b8",
              lineHeight: 1.5,
              fontWeight: 400,
            }}
          >
            Real GPS Matching • OpenStreetMap &amp; Overpass Integration • Live Blood Inventory • Emergency Socket.IO Alerts
          </div>
        </div>

        {/* Footer info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            paddingTop: "24px",
            fontSize: "18px",
            color: "#64748b",
          }}
        >
          <span>bloodlink.vercel.app</span>
          <span>Verified Project • Mysore, Karnataka</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
