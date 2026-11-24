"use client";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Kind, ViewRecord } from "@/lib/types";
import type { Map as LMap, MarkerClusterGroup } from "leaflet";
import { fmtDate, fmtMoney } from "@/lib/dates";
import { KIND_LABEL } from "./RecordBits";
import { Icon } from "./Icon";

const LETTER: Record<Kind, string> = { foreclosure: "F", tax_deed: "T", lis_pendens: "L" };
const TONE: Record<Kind, string> = { foreclosure: "fc", tax_deed: "td", lis_pendens: "lp" };
const FILTERS: { value: Kind | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "foreclosure", label: "Foreclosure" },
  { value: "tax_deed", label: "Tax deed" },
  { value: "lis_pendens", label: "Lis pendens" },
];

function recordHref(r: ViewRecord) {
  if (r.locked) return `/signup?from=${r.id}`;
  return r.kind === "lis_pendens" ? `/lis-pendens/${r.countySlug}?date=${r.date}&id=${r.id}` : `/auctions?county=${r.countySlug}&date=${r.date}&id=${r.id}`;
}

function longDate(iso: string) {
  return fmtDate(iso, { month: "short", day: "numeric", year: "numeric" });
}

export function CountyMap({ records, countyName, center }: { records: ViewRecord[]; countyName: string; center: [number, number] }) {
  const [filter, setFilter] = useState<Kind | "all">("all");
  const visible = useMemo(() => (filter === "all" ? records : records.filter((r) => r.kind === filter)), [filter, records]);
  const [selectedId, setSelectedId] = useState<string | null>(records[0]?.id ?? null);
  const [inView, setInView] = useState<Set<string> | null>(null);
  const selected = visible.find((r) => r.id === selectedId) ?? visible[0];
  const listed = inView ? visible.filter((r) => inView.has(r.id)) : visible;

  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const cluster = useRef<MarkerClusterGroup | null>(null);
  const fitted = useRef(false);
  const [ready, setReady] = useState(false);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | undefined;
    (async () => {
      const L = (await import("leaflet")).default;
      (window as unknown as { L: typeof L }).L = L;
      await import("leaflet.markercluster");
      if (cancelled || !el.current || map.current) return;
      const m = L.map(el.current, { scrollWheelZoom: false, zoomControl: false }).setView(center, 10);
      L.control.zoom({ position: "topright" }).addTo(m);
      // TODO before heavy traffic: switch to a keyed tile provider (MapTiler, Stadia, Mapbox).
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
        className: "osm-tiles",
      }).addTo(m);
      const group = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 48,
        iconCreateFunction: (c) => {
          const tally: Record<string, number> = {};
          for (const k of c.getAllChildMarkers()) {
            const kind = (k.options as { kind?: Kind }).kind ?? "foreclosure";
            tally[kind] = (tally[kind] ?? 0) + 1;
          }
          const top = (Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "foreclosure") as Kind;
          const n = c.getChildCount();
          const size = n >= 100 ? 48 : n >= 20 ? 42 : 36;
          return L.divIcon({ className: "", html: `<span class="cluster cluster-${TONE[top]}" style="width:${size}px;height:${size}px">${n}</span>`, iconSize: [size, size] });
        },
      });
      m.addLayer(group);
      m.on("moveend", () => {
        const b = m.getBounds();
        setInView(new Set(visibleRef.current.filter((r) => b.contains([r.lat, r.lng])).map((r) => r.id)));
      });
      map.current = m;
      cluster.current = group;
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
  }, [center]);

  // Redraw pins when the filter or selection changes
  useEffect(() => {
    if (!ready) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const g = cluster.current;
      if (!g || !map.current) return;
      g.clearLayers();
      g.addLayers(
        visible.map((r) => {
          const isSel = r.id === selected?.id;
          const icon = L.divIcon({
            className: "",
            html: `<span class="pin pin-${r.kind}${isSel ? " is-sel" : ""}">${LETTER[r.kind]}</span>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          });
          const mk = L.marker([r.lat, r.lng], { icon, zIndexOffset: isSel ? 1000 : 0, title: `Case ${r.caseNumber}`, kind: r.kind } as L.MarkerOptions);
          mk.on("click", () => setSelectedId(r.id));
          return mk;
        }),
      );
      const m = map.current;
      if (!m) return;
      if (!fitted.current && visible.length) {
        fitted.current = true;
        m.fitBounds(L.latLngBounds(visible.map((r) => [r.lat, r.lng] as [number, number])), { padding: [24, 24], maxZoom: 13 });
      }
      const b = m.getBounds();
      setInView(new Set(visible.filter((r) => b.contains([r.lat, r.lng])).map((r) => r.id)));
    })();
  }, [ready, visible, selected?.id]);

  return (
    <>
      <div className="section-head map-head">
        <div>
          <div className="eyebrow">The map</div>
          <h2>Every filing, pinned.</h2>
          <p>Filter by sale type, zoom into a neighborhood, and click any pin to see the numbers that matter before you bid.</p>
        </div>
        <div className="scroll-x map-filters" role="group" aria-label="Filter pins">
          {FILTERS.map((f) => (
            <button key={f.value} type="button" className="pill pill-sm" aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
              {f.value === "all" ? <span className="ring" /> : <span className={`dot dot-${TONE[f.value]}`} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cmap-body">
        <div className="cmap-map">
          <div ref={el} className="cmap-canvas" aria-label={`Map of ${countyName} County properties`} />
          <div className="cmap-tags">
            <span className="map-tag">{countyName} County, FL</span>
          </div>
          <div className="cmap-legend">
            <span><span className="pin pin-sm pin-foreclosure">F</span>Foreclosure</span>
            <span><span className="pin pin-sm pin-tax_deed">T</span>Tax deed</span>
            <span><span className="pin pin-sm pin-lis_pendens">L</span>Lis pendens</span>
          </div>
        </div>

        <aside className="cmap-side">
          {selected ? <SelectedCard r={selected} /> : <div className="sel-card"><p className="muted" style={{ padding: 16 }}>No properties for this filter.</p></div>}
          <div className="sel-list">
            <div className="sel-list-head">{listed.length} {listed.length === 1 ? "property" : "properties"} in view</div>
            <ul>
              {listed.map((r) => (
                <li key={r.id}>
                  <button type="button" className={r.id === selected?.id ? "is-sel" : ""} onClick={() => setSelectedId(r.id)}>
                    <span className={`pin pin-sm pin-${r.kind}`}>{LETTER[r.kind]}</span>
                    <span className="sel-li-main">
                      <b>{r.locked ? `Case ${r.caseNumber}` : r.address}</b>
                      <span className="muted">
                        {KIND_LABEL[r.kind]}
                        {r.equityScore != null && r.equityScore >= 70 ? ` · High equity ${r.equityScore}` : ""} · {longDate(r.date)}
                      </span>
                    </span>
                    {r.locked ? <span className="blur sel-li-val" aria-hidden="true">$000,000</span> : <b className="sel-li-val">{fmtMoney(r.fairMarketValue)}</b>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}

function SelectedCard({ r }: { r: ViewRecord }) {
  const isLp = r.kind === "lis_pendens";
  return (
    <div className="sel-card">
      <div className="sel-photo">
        <img src={r.photoUrl} alt="" />
        <span className={`tile-type tone-${TONE[r.kind]}`}>{KIND_LABEL[r.kind].toUpperCase()}</span>
      </div>
      <div className="sel-body">
        <div className="rec-label">Case {r.caseNumber}</div>
        {r.locked ? (
          <div aria-hidden="true">
            <div className="blur sel-addr">0000 Xxxxxxx Xxxx Xx</div>
            <div className="blur small">Xxxx Xxxxx, FL 00000</div>
            <div className="sel-stats">
              <div><span className="rec-label">Est. value</span><span className="blur">$000,000</span></div>
              <div><span className="rec-label">{isLp ? "Mortgage" : "Opening bid"}</span><span className="blur">$000,000</span></div>
              <div><span className="rec-label">{isLp ? "Filed" : "Auction date"}</span><span className="blur">Xxx 00, 0000</span></div>
              <div><span className="rec-label">Parcel #</span><span className="blur">00-00-00-0000</span></div>
            </div>
            <div className="blur small">0 bd · 0 ba · 0,000 sqft</div>
          </div>
        ) : (
          <>
            <div className="sel-addr">{r.address}</div>
            <div className="muted small">{r.city}, FL {r.zip}</div>
            <div className="sel-stats">
              <div><span className="rec-label">Est. value</span><b>{fmtMoney(r.fairMarketValue)}</b></div>
              <div><span className="rec-label">{isLp ? "Mortgage" : "Opening bid"}</span><b>{fmtMoney(isLp ? r.mortgage : r.plaintiffMaxBid)}</b></div>
              <div><span className="rec-label">{isLp ? "Filed" : "Auction date"}</span><b>{longDate(r.date)}</b></div>
              <div><span className="rec-label">Parcel #</span><b>{r.parcelId}</b></div>
            </div>
            <div className="muted small">{r.beds} bd · {r.baths} ba · {r.sqft.toLocaleString()} sqft</div>
          </>
        )}
        {r.equityScore == null ? (
          <div className="eq-lockbox">
            <div className="eq-lockbox-top"><span><Icon name="lock" size={13} /> Equity Score</span><span className="eq-ghost" /></div>
            <p className="small muted">See how much equity sits behind this property before you bid.</p>
            <Link href={`/signup?from=${r.id}`} className="text-link small">Unlock with Pro →</Link>
          </div>
        ) : (
          <div className="eq-lockbox eq-open">
            <div className="eq-lockbox-top"><span>Equity Score</span><b>{r.equityScore}</b></div>
            <div className="eq-track"><span style={{ width: `${r.equityScore}%` }} /></div>
          </div>
        )}
        <Link href={recordHref(r)} className="btn btn-primary sel-cta">{r.locked ? "Sign up to see the full file" : "Open the full file"}</Link>
      </div>
    </div>
  );
}
