import { ImageResponse } from "next/og";

export const alt = "Estate IQ: track Florida lis pendens, foreclosure auctions and tax deed sales";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#F6F7F5", color: "#0F1B2D", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 40, fontWeight: 700 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#0B7A55", display: "flex" }} />
          Estate IQ
        </div>
        <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 950 }}>Your #1 data source to track all distressed properties.</div>
        <div style={{ display: "flex", gap: 16, fontSize: 28 }}>
          <span style={{ background: "#F1EBFE", color: "#5B2DB8", padding: "8px 18px", borderRadius: 12 }}>Lis pendens</span>
          <span style={{ background: "#E8EDF8", color: "#1E3A8A", padding: "8px 18px", borderRadius: 12 }}>Foreclosure auctions</span>
          <span style={{ background: "#FDF0E4", color: "#9A4508", padding: "8px 18px", borderRadius: 12 }}>Tax deed sales</span>
        </div>
      </div>
    ),
    size,
  );
}
