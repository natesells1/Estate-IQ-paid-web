"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LMap, Marker } from "leaflet";
import type { CountyStat } from "@/lib/data/queries";

const FLORIDA: [[number, number], [number, number]] = [[24.4, -87.7], [31.05, -78.2]];
const HALO = 5; // the soft ring around each circle, kept clear of neighbours

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Circle size grows with the count, like the clusters on the property map. */
const sizeFor = (n: number, small: boolean) => Math.round((n >= 100 ? 44 : n >= 20 ? 38 : 34) * (small ? 0.86 : 1));

/**
 * Three count circles in a tight triangle (lis pendens on top, scheduled
 * auctions bottom-left, tax deeds bottom-right), styled like map clusters.
 */
function markerHtml(s: CountyStat, small: boolean) {
  const name = esc(s.name);
  const a = sizeFor(s.lisPendens, small);
  const b = sizeFor(s.scheduledAuctions, small);
  const c = sizeFor(s.taxDeeds, small);
  const w = b + c + 2;
  const lowerTop = Math.round(a * 0.82);
  const h = lowerTop + Math.max(b, c);
  const circle = (href: string, n: number, cls: string, what: string, size: number, left: number, top: number) =>
    `<a class="hm-btn ${cls}" href="${href}" style="width:${size}px;height:${size}px;left:${left}px;top:${top}px" aria-label="${name} County: ${n} ${what}">${n}</a>`;
  return `<span class="hm-group" style="width:${w}px;height:${h}px" title="${name} County">
  ${circle(`/lis-pendens/${s.slug}`, s.lisPendens, "hm-lp", "new lis pendens filings", a, Math.round((w - a) / 2), 0)}
  ${circle(`/auctions?county=${s.slug}&type=foreclosure`, s.scheduledAuctions, "hm-fc", "foreclosures scheduled for auction", b, 0, lowerTop)}
  ${circle(`/auctions?county=${s.slug}&type=tax_deed`, s.taxDeeds, "hm-td", "tax deed sales scheduled", c, w - c, lowerTop)}
</span>`;
}

type Box = { x: number; y: number; w: number; h: number };
const hit = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Centre each county's cluster on the county. Where two counties are too close,
 * nudge the later one to the nearest free spot so clusters never overlap each
 * other, the legend or the map edge.
 */
function layout(m: LMap, markers: { stat: CountyStat; marker: Marker }[], container: HTMLElement) {
  const size = m.getSize();
  const cRect = container.getBoundingClientRect();
  const blocked: Box[] = [];
  const legendEl = container.parentElement?.querySelector(".fl-legend-box") as HTMLElement | null;
  if (legendEl && getComputedStyle(legendEl).display !== "none") {
    const r = legendEl.getBoundingClientRect();
    blocked.push({ x: r.left - cRect.left - 4, y: r.top - cRect.top - 4, w: r.width + 8, h: r.height + 8 });
  }
  for (const { stat, marker } of markers) {
    const group = marker.getElement()?.querySelector(".hm-group") as HTMLElement | null;
    if (!group) continue;
    const gw = group.offsetWidth;
    const gh = group.offsetHeight;
    const p = m.latLngToContainerPoint([stat.lat, stat.lng]);
    const margin = 4;
    let pick = { dx: -gw / 2, dy: -gh / 2 };
    let best = Infinity;
    // Search outward from "centred on the county" in small steps
    for (let ox = -gw * 1.6; ox <= gw * 1.6; ox += 6) {
      for (let oy = -gh * 1.6; oy <= gh * 1.6; oy += 6) {
        const dx = -gw / 2 + ox;
        const dy = -gh / 2 + oy;
        const box = { x: p.x + dx - HALO, y: p.y + dy - HALO, w: gw + HALO * 2, h: gh + HALO * 2 };
        if (box.x < margin || box.y < margin || box.x + box.w > size.x - margin || box.y + box.h > size.y - margin - 14) continue;
        if (blocked.some((b) => hit(box, b))) continue;
        const d = ox * ox + oy * oy;
        if (d < best) {
          best = d;
          pick = { dx, dy };
        }
      }
    }
    group.style.left = `${pick.dx}px`;
    group.style.top = `${pick.dy}px`;
    blocked.push({ x: p.x + pick.dx - HALO, y: p.y + pick.dy - HALO, w: gw + HALO * 2, h: gh + HALO * 2 });
  }
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
      // Busiest counties first so they sit exactly on their county
      const ordered = [...stats].sort((a, b) => b.lisPendens + b.scheduledAuctions + b.taxDeeds - (a.lisPendens + a.scheduledAuctions + a.taxDeeds));
      const small = container.clientWidth < 500;
      const markers = ordered.map((stat) => ({
        stat,
        marker: L.marker([stat.lat, stat.lng], {
          interactive: false,
          keyboard: false,
          icon: L.divIcon({ className: "hm-marker", html: markerHtml(stat, small), iconSize: [0, 0], iconAnchor: [0, 0] }),
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
