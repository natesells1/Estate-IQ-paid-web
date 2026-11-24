"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LMap } from "leaflet";
import type { CountyStat } from "@/lib/data/queries";

// Framed on the peninsula + Jacksonville, where the hot counties are, so each county has room
const FLORIDA: [[number, number], [number, number]] = [[25.15, -83.4], [30.75, -79.3]];
const GAP = 2;
/** Within each county the highest count gets the biggest circle, the next a little smaller, the lowest smallest. */
const RANK_SIZES = [40, 32, 25];
const RANK_FONT = [13.5, 12, 10.5];

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Three count circles in a row (lis pendens, scheduled auctions, tax deeds), centred exactly on the county. */
function markerHtml(s: CountyStat) {
  const name = esc(s.name);
  const items = [
    { n: s.lisPendens, cls: "hm-lp", href: `/lis-pendens/${s.slug}`, what: "new lis pendens filings" },
    { n: s.scheduledAuctions, cls: "hm-fc", href: `/auctions?county=${s.slug}&type=foreclosure`, what: "foreclosures scheduled for auction" },
    { n: s.taxDeeds, cls: "hm-td", href: `/auctions?county=${s.slug}&type=tax_deed`, what: "tax deed sales scheduled" },
  ];
  // Equal counts share a size
  const ranked = [...new Set(items.map((it) => it.n))].sort((a, b) => b - a);
  const sized = items.map((it) => {
    const r = ranked.indexOf(it.n);
    return { ...it, size: RANK_SIZES[r], font: RANK_FONT[r] };
  });
  const w = sized.reduce((t, it) => t + it.size, 0) + GAP * 2;
  const h = Math.max(...sized.map((it) => it.size));
  let x = 0;
  const circles = sized
    .map((it) => {
      const html = `<a class="hm-btn ${it.cls}" href="${it.href}" style="width:${it.size}px;height:${it.size}px;left:${x}px;top:${(h - it.size) / 2}px;font-size:${it.font}px"aria-label="${name} County: ${it.n} ${it.what}">${it.n}</a>`;
      x += it.size + GAP;
      return html;
    })
    .join("");
  return `<span class="hm-group" style="width:${w}px;height:${h}px;left:${-w / 2}px;top:${-h / 2}px" title="${name} County">${circles}</span>`;
}

/** Florida hot-counties map for the hero, in the same style as the property map's clusters. */
export function HeroMap({ stats }: { stats: CountyStat[] }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | undefined;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || map.current) return;
      const container = el.current;
      const m = L.map(container, {
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
      for (const stat of stats) {
        L.marker([stat.lat, stat.lng], {
          interactive: false,
          keyboard: false,
          icon: L.divIcon({ className: "hm-marker", html: markerHtml(stat), iconSize: [0, 0], iconAnchor: [0, 0] }),
        }).addTo(m);
      }
      map.current = m;
      ro = new ResizeObserver(() => {
        m.invalidateSize();
        m.fitBounds(FLORIDA, { padding: [8, 8] });
      });
      ro.observe(container);
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
