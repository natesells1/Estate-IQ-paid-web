"use client";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Kind, ViewRecord } from "@/lib/types";
import { EquityBadge, KindChip, RecordCard, KIND_LABEL } from "./RecordBits";
import type { Map as LMap, LayerGroup } from "leaflet";

const LETTER: Record<Kind, string> = { foreclosure: "F", tax_deed: "T", lis_pendens: "L" };
const FILTERS: { value: Kind | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "foreclosure", label: "Foreclosure" },
  { value: "tax_deed", label: "Tax deed" },
  { value: "lis_pendens", label: "Lis pendens" },
];

function recordHref(r: ViewRecord) {
  if (r.locked) return `/signup?from=${r.id}`;
  return r.kind === "lis_pendens" ? `/lis-pendens?county=${r.countySlug}&date=${r.date}&id=${r.id}` : `/auctions?county=${r.countySlug}&date=${r.date}&id=${r.id}`;
}

export function CountyMap({ records, countyName, center }: { records: ViewRecord[]; countyName: string; center: [number, number] }) {
  const [filter, setFilter] = useState<Kind | "all">("all");
  const visible = useMemo(() => (filter === "all" ? records : records.filter((r) => r.kind === filter)), [filter, records]);
  const [selectedId, setSelectedId] = useState<string | null>(records[0]?.id ?? null);
  const selected = visible.find((r) => r.id === selectedId) ?? visible[0];

  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const fitted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || map.current) return;
      const m = L.map(el.current, { scrollWheelZoom: false, zoomControl: true }).setView(center, 10);
      // TODO before heavy traffic: switch to a keyed tile provider (MapTiler, Stadia, Mapbox).
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        className: "osm-tiles",
      }).addTo(m);
      map.current = m;
      layer.current = L.layerGroup().addTo(m);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, [center]);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const g = layer.current!;
      g.clearLayers();
      for (const r of visible) {
        const isSel = r.id === selected?.id;
        const icon = L.divIcon({
          className: "",
          html: `<span class="pin pin-${r.kind}${isSel ? " is-sel" : ""}">${LETTER[r.kind]}</span>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
        const title = r.locked ? `Case ${r.caseNumber}` : r.address;
        const sub = `${KIND_LABEL[r.kind]} · ${r.date}`;
        const marker = L.marker([r.lat, r.lng], { icon, zIndexOffset: isSel ? 1000 : 0, keyboard: true, title: `Case ${r.caseNumber}` });
        marker.bindPopup(
          `<div class="pop"><b>${escapeHtml(title)}</b><div>${escapeHtml(r.countyName)} County · ${escapeHtml(sub)}</div>${
            r.locked ? `<a href="/signup?from=${encodeURIComponent(r.id)}">Sign up</a> to see the full file` : `<a href="${recordHref(r)}">Open</a>`
          }</div>`,
          { closeButton: false, offset: [0, -8] },
        );
        marker.on("click", () => setSelectedId(r.id));
        marker.addTo(g);
      }
      if (!fitted.current && visible.length) {
        fitted.current = true;
        map.current!.fitBounds(L.latLngBounds(visible.map((r) => [r.lat, r.lng] as [number, number])), { padding: [30, 30], maxZoom: 13 });
      }
    })();
  }, [ready, visible, selected?.id]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: records.length };
    for (const r of records) c[r.kind] = (c[r.kind] ?? 0) + 1;
    return c;
  }, [records]);

  return (
    <div className="cmap">
      <div className="cmap-filters scroll-x" role="group" aria-label="Filter pins">
        {FILTERS.map((f) => (
          <button key={f.value} type="button" className="pill" aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.value !== "all" && <span className={`dot dot-${f.value === "foreclosure" ? "fc" : f.value === "tax_deed" ? "td" : "lp"}`} />}
            {f.label} <span className="count">{counts[f.value] ?? 0}</span>
          </button>
        ))}
      </div>
      <div className="cmap-body">
        <div className="cmap-map card">
          <div ref={el} className="cmap-canvas" aria-label={`Map of ${countyName} County properties`} />
          <div className="cmap-legend">
            <span><span className="pin pin-sm pin-foreclosure">F</span>Foreclosure</span>
            <span><span className="pin pin-sm pin-tax_deed">T</span>Tax deed</span>
            <span><span className="pin pin-sm pin-lis_pendens">L</span>Lis pendens</span>
          </div>
        </div>
        <aside className="cmap-side card">
          {selected ? (
            <div className="cmap-selected">
              <div className="rec-label" style={{ marginBottom: 8 }}>Selected property</div>
              <RecordCard r={selected} href={recordHref(selected)} />
            </div>
          ) : (
            <p className="muted" style={{ padding: 20 }}>No properties for this filter.</p>
          )}
          <div className="cmap-list-head">
            <b>{visible.length}</b> in {countyName} County
          </div>
          <ul className="cmap-list">
            {visible.map((r) => (
              <li key={r.id}>
                <button type="button" className={r.id === selected?.id ? "is-sel" : ""} onClick={() => {
                  setSelectedId(r.id);
                  map.current?.panTo([r.lat, r.lng]);
                }}>
                  <span className={`pin pin-sm pin-${r.kind}`}>{LETTER[r.kind]}</span>
                  <span className="cmap-li-main">
                    <b>{r.locked ? `Case ${r.caseNumber}` : r.address}</b>
                    <KindChip kind={r.kind} date={r.date} />
                  </span>
                  <EquityBadge score={r.equityScore} locked={r.locked} />
                </button>
              </li>
            ))}
          </ul>
          <Link href={`/auctions`} className="cmap-more">Open the auction calendar →</Link>
        </aside>
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
