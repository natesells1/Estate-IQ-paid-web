"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LMap, LayerGroup, Marker } from "leaflet";
import type { ViewRecord } from "@/lib/types";
import { fmtDate, fmtMoney } from "@/lib/dates";

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function popupHtml(r: ViewRecord) {
  const head = `<b>Case ${esc(r.caseNumber)}</b><div>${esc(r.countyName)} County · Filed ${fmtDate(r.date)}</div>`;
  if (r.locked) return `<div class="pop">${head}<div>Mortgage <a href="/signup?from=${encodeURIComponent(r.id)}">Sign up</a></div></div>`;
  return `<div class="pop">${head}<div>${esc(r.address)}, ${esc(r.city)}</div><div>Mortgage <b>${fmtMoney(r.mortgage)}</b></div></div>`;
}

/** Map with one pin per filing for the selected day. */
export function DayMap({
  pins,
  selectedId,
  onSelect,
  center,
  fitKey,
  legend,
}: {
  pins: ViewRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  center: [number, number];
  /** Changes when the day changes, so the map refits to the new pins */
  fitKey: string;
  legend: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const markers = useRef<Map<string, Marker>>(new Map());
  const [ready, setReady] = useState(false);
  const lastFit = useRef("");
  const [lat, lng] = center;

  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | undefined;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || map.current) return;
      const m = L.map(el.current, { scrollWheelZoom: false }).setView([lat, lng], 11);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
        className: "osm-tiles",
      }).addTo(m);
      layer.current = L.layerGroup().addTo(m);
      map.current = m;
      ro = new ResizeObserver(() => m.invalidateSize());
      ro.observe(el.current);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      ro?.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, [lat, lng]);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const g = layer.current;
      if (!g || !map.current) return;
      g.clearLayers();
      markers.current.clear();
      for (const r of pins) {
        const sel = r.id === selectedId;
        const icon = L.divIcon({
          className: "",
          html: sel ? `<span class="lp-pin is-sel">LP</span>` : `<span class="lp-pin"></span>`,
          iconSize: sel ? [36, 36] : [18, 18],
          iconAnchor: sel ? [18, 18] : [9, 9],
        });
        const mk = L.marker([r.lat, r.lng], { icon, zIndexOffset: sel ? 1000 : 0, title: `Case ${r.caseNumber}` });
        mk.bindPopup(popupHtml(r), { closeButton: false, offset: [0, sel ? -14 : -6], autoPan: false });
        mk.on("click", () => onSelect(r.id));
        mk.addTo(g);
        markers.current.set(r.id, mk);
      }
      const m = map.current!;
      m.invalidateSize();
      if (lastFit.current !== fitKey && pins.length && m.getSize().x > 0) {
        lastFit.current = fitKey;
        m.fitBounds(L.latLngBounds(pins.map((r) => [r.lat, r.lng] as [number, number])), { padding: [48, 48], maxZoom: 13 });
      }
      if (selectedId) markers.current.get(selectedId)?.openPopup();
    })();
    // onSelect is stable enough; redraw only when pins/selection/day change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pins, selectedId, fitKey]);

  return (
    <div className="day-map">
      <div ref={el} className="day-map-canvas" aria-label="Map of this day's filings" />
      <div className="day-map-legend">
        <span><span className="lp-dot" />{legend}</span>
        <span><span className="lp-dot lp-dot-sel" />Selected</span>
      </div>
    </div>
  );
}
