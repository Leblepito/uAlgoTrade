import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const size = {
  width: 1200,
  height: 630,
};

export const alt = `${SITE_NAME} - ${SITE_DESCRIPTION}`;

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#000000",
          backgroundImage:
            "radial-gradient(900px 600px at 15% 10%, rgba(34, 211, 238, 0.22), rgba(0,0,0,0)), radial-gradient(900px 600px at 85% 40%, rgba(59, 130, 246, 0.18), rgba(0,0,0,0))",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: 64,
            border: "1px solid rgba(255,255,255,0.08)",
            margin: 48,
            borderRadius: 32,
            backgroundColor: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                color: "#67e8f9",
                backgroundColor: "rgba(34, 211, 238, 0.10)",
                border: "1px solid rgba(34, 211, 238, 0.25)",
              }}
            >
              L
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>
                {SITE_NAME.toUpperCase()}
              </div>
              <div style={{ display: "flex", fontSize: 12, letterSpacing: 3, color: "rgba(148,163,184,0.9)" }}>
                BACKTEST & SIGNAL PLATFORM
              </div>
            </div>
          </div>

          <div style={{ marginTop: 42, display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                display: "flex",
                fontSize: 62,
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: -1.5,
                lineHeight: 1,
              }}
            >
              Crypto Trading
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 62,
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: -1.5,
                lineHeight: 1,
              }}
            >
              <span style={{ color: "#22d3ee" }}>Backtest & Signals</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontSize: 24,
              color: "rgba(148,163,184,0.95)",
              maxWidth: 860,
            }}
          >
            {SITE_DESCRIPTION}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
            {["Indicators", "Backtest", "Funding"].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  fontSize: 18,
                  color: "rgba(226,232,240,0.95)",
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.10)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
