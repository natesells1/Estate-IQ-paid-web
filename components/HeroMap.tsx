"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LMap } from "leaflet";
import type { CountyStat } from "@/lib/data/queries";

// Where each county's buttons sit relative to its dot (hand-placed so nothing overlaps).
// side: buttons to the right or left of the dot; dy: vertical nudge in px.
const PLACE: Record<string, { side: "left" | "right"; dy: number; mSide: "left" | "right"; mDy: number }> = {
  duval: { side: "right", dy: 0, mSide: "left", mDy: 0 },
  polk: { side: "right", dy: 0, mSide: "right", mDy: 0 },
  manatee: { side: "left", dy: -6, mSide: "left", mDy: -14 },
  lee: { side: "left", dy: 6, mSide: "left", mDy: -12 },
  broward: { side: "right", dy: -16, mSide: "left", mDy: 6 },
  "miami-dade": { side: "right", dy: 14, mSide: "left", mDy: 20 },
};

const FLORIDA: [[number, number], [number, number]] = [[24.4, -87.7], [31.05, -78.2]];

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function markerHtml(s: CountyStat) {
  const p = PLACE[s.slug] ?? { side: "right", dy: 0, mSide: "right", mDy: 0 };
  const name = esc(s.name);
  const btn = (href: string, n: number, cls: string, what: string) =>
    `<a class="hm-btn ${cls}" href="${href}" aria-label="${name} County: ${n} ${what}">${n}</a>`;
  const total = s.lisPendens + s.scheduledAuctions + s.taxDeeds;
  return `<span class="hm-dot"></span>
<span class="hm-group hm-${p.side}" style="--dy:${p.dy}px">
  <span class="hm-name">${name.toUpperCase()}</span>
  <span class="hm-btns">
    ${btn(`/lis-pendens/${s.slug}`, s.lisPendens, "hm-lp", "new lis pendens filings")}
    ${btn(`/auctions?county=${s.slug}&type=foreclosure`, s.scheduledAuctions, "hm-fc", "foreclosures scheduled for auction")}
    ${btn(`/auctions?county=${s.slug}&type=tax_deed`, s.taxDeeds, "hm-td", "tax deed sales scheduled")}
  </span>
</span>
<a class="hm-mini hm-${p.mSide}" style="--dy:${p.mDy}px" href="/lis-pendens/${s.slug}" aria-label="${name} County: ${total} properties">${name.toUpperCase()} · ${total}</a>`;
}

/** Florida hot-counties map for the hero: real map tiles, colour-coded count buttons over each county. */
export function HeroMap({ stats }: { stats: CountyStat[] }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | undefined;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || map.current) return;
      const m = L.map(el.current, {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
        zoomSnap: 0.1,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
        className: "osm-tiles",
      }).addTo(m);
      m.fitBounds(FLORIDA, { padding: [8, 8] });
      for (const s of stats) {
        L.marker([s.lat, s.lng], {
          interactive: false,
          keyboard: false,
          icon: L.divIcon({ className: "hm-marker", html: markerHtml(s), iconSize: [14, 14], iconAnchor: [7, 7] }),
        }).addTo(m);
      }
      map.current = m;
      ro = new ResizeObserver(() => {
        m.invalidateSize();
        m.fitBounds(FLORIDA, { padding: [8, 8] });
      });
      ro.observe(el.current);
    })();
    return () => {
      cancelled = true;
      ro?.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, [stats]);

  return <div ref={el} className="hm-canvas" role="region" aria-label="Map of Florida hot counties with lis pendens, scheduled auction and tax deed counts" />;
}
