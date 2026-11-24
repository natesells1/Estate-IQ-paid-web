"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LMap, Marker } from "leaflet";
import type { CountyStat } from "@/lib/data/queries";

const FLORIDA: [[number, number], [number, number]] = [[24.4, -87.7], [31.05, -78.2]];
const DOT = 14; // county dot size (px)
const GAP = 8; // space between a dot and its buttons

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function markerHtml(s: CountyStat) {
  const name = esc(s.name);
  const btn = (href: string, n: number, cls: string, what: string) =>
    `<a class="hm-btn ${cls}" href="${href}" aria-label="${name} County: ${n} ${what}">${n}</a>`;
  return `<span class="hm-dot"></span>
<span class="hm-group" title="${name} County">
  ${btn(`/lis-pendens/${s.slug}`, s.lisPendens, "hm-lp", "new lis pendens filings")}
  ${btn(`/auctions?county=${s.slug}&type=foreclosure`, s.scheduledAuctions, "hm-fc", "foreclosures scheduled for auction")}
  ${btn(`/auctions?county=${s.slug}&type=tax_deed`, s.taxDeeds, "hm-td", "tax deed sales scheduled")}
</span>`;
}

type Box = { x: number; y: number; w: number; h: number };
const hit = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Place each county's button row next to its dot so that no row overlaps another
 * row, any county dot, the legend, or the map edge. Tries right, left, above and
 * below, with small vertical nudges, and takes the first spot that fits.
 */
function layout(m: LMap, markers: { stat: CountyStat; marker: Marker }[], container: HTMLElement) {
  const size = m.getSize();
  const cRect = container.getBoundingClientRect();
  const legendEl = container.parentElement?.querySelector(".fl-legend-box") as HTMLElement | null;
  const blocked: Box[] = [];
  if (legendEl && getComputedStyle(legendEl).display !== "none") {
    const r = legendEl.getBoundingClientRect();
    blocked.push({ x: r.left - cRect.left - 4, y: r.top - cRect.top - 4, w: r.width + 8, h: r.height + 8 });
  }
  const pts = markers.map(({ stat }) => m.latLngToContainerPoint([stat.lat, stat.lng]));
  for (const p of pts) blocked.push({ x: p.x - DOT / 2 - 2, y: p.y - DOT / 2 - 2, w: DOT + 4, h: DOT + 4 });

  markers.forEach(({ marker }, i) => {
    const group = marker.getElement()?.querySelector(".hm-group") as HTMLElement | null;
    if (!group) return;
    const gw = group.offsetWidth;
    const gh = group.offsetHeight;
    const p = pts[i];
    const half = DOT / 2;
    // Candidate spots: beside the dot (right/left), or above/below it, at several heights and shifts.
    const candidates: { dx: number; dy: number }[] = [];
    for (let k = -10; k <= 10; k++) {
      const dy = -gh / 2 + (k * gh) / 4;
      candidates.push({ dx: half + GAP, dy }, { dx: -half - GAP - gw, dy });
    }
    for (const sx of [-gw / 2, -gw + half, -half, -gw * 0.75, -gw * 0.25]) {
      candidates.push({ dx: sx, dy: -half - GAP - gh }, { dx: sx, dy: half + GAP });
    }
    const margin = 4;
    let pick = candidates[0];
    let best = Infinity;
    for (const c of candidates) {
      const box = { x: p.x + c.dx, y: p.y + c.dy, w: gw, h: gh };
      const inside = box.x >= margin && box.y >= margin && box.x + gw <= size.x - margin && box.y + gh <= size.y - margin - 14;
      if (!inside || blocked.some((b) => hit(box, b))) continue;
      // Prefer the spot whose nearest edge is closest to the county dot
      const nx = Math.max(box.x - p.x, 0, p.x - (box.x + gw));
      const ny = Math.max(box.y - p.y, 0, p.y - (box.y + gh));
      const d = nx * nx + ny * ny;
      if (d < best) {
        best = d;
        pick = c;
      }
    }
    // Position relative to the 14px marker icon, whose centre is the county
    group.style.left = `${half + pick.dx}px`;
    group.style.top = `${half + pick.dy}px`;
    blocked.push({ x: p.x + pick.dx - 2, y: p.y + pick.dy - 2, w: gw + 4, h: gh + 4 });
  });
}

/** Florida hot-counties map for the hero: real map tiles, colour-coded count buttons by each county. */
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
      // Place the busiest counties first so they get the best spots
      const ordered = [...stats].sort((a, b) => b.lisPendens + b.scheduledAuctions + b.taxDeeds - (a.lisPendens + a.scheduledAuctions + a.taxDeeds));
      const markers = ordered.map((stat) => ({
        stat,
        marker: L.marker([stat.lat, stat.lng], {
          interactive: false,
          keyboard: false,
          icon: L.divIcon({ className: "hm-marker", html: markerHtml(stat), iconSize: [DOT, DOT], iconAnchor: [DOT / 2, DOT / 2] }),
        }).addTo(m),
      }));
      map.current = m;
      const relayout = () => requestAnimationFrame(() => layout(m, markers, container));
      relayout();
      ro = new ResizeObserver(() => {
        m.invalidateSize();
        m.fitBounds(FLORIDA, { padding: [8, 8] });
        relayout();
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
