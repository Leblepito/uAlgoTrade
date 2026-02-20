import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const size = {
  width: 1200,
  height: 600,
};

export const alt = `${SITE_NAME}: Indicators Workbench`;

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#000000",
          backgroundImage:
            "radial-gradient(900px 600px at 20% 20%, rgba(34, 211, 238, 0.20), rgba(0,0,0,0)), radial-gradient(900px 600px at 80% 45%, rgba(59, 130, 246, 0.18), rgba(0,0,0,0))",
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
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", fontSize: 56, fontWeight: 900, color: "#ffffff", letterSpacing: -1.5 }}>
            {SITE_NAME}: Indicators Workbench
          </div>
          <div style={{ display: "flex", marginTop: 16, fontSize: 22, color: "rgba(148,163,184,0.95)" }}>
            Support/Resistance • Order Blocks • Elliott Wave • Backtests
          </div>
        </div>
      </div>
    ),
    size
  );
}

