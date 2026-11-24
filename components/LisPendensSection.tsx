"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ViewRecord } from "@/lib/types";
import { LpTile } from "./Tiles";
import { Icon } from "./Icon";

type Props = {
  counties: { slug: string; name: string; count: number }[];
  filings: Record<string, ViewRecord[]>;
  initial: string;
};

export function LisPendensSection({ counties, filings, initial }: Props) {
  const [county, setCounty] = useState(initial);
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase().replace(/ county$/, "");
    return n ? counties.filter((c) => c.name.toLowerCase().includes(n)) : counties;
  }, [q, counties]);
  const current = counties.find((c) => c.slug === county)!;
  const cards = filings[county] ?? [];

  return (
    <section className="section band-white" id="lis-pendens">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">Pre-foreclosure leads · {current.name} County</div>
            <h2>Track the new Lis Pendens filings</h2>
            <p>Find, contact and negotiate a deal before the auction.</p>
          </div>
          <Link href={`/lis-pendens?county=${county}`} className="text-link desk-only">All {current.name} County filings →</Link>
        </div>

        <label className="search-field lp-search">
          <span className="sr-only">Search counties</span>
          <Icon name="search" size={16} />
          <input
            className="input"
            placeholder="Search counties"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && shown[0]) {
                setCounty(shown[0].slug);
                setQ("");
              }
            }}
          />
        </label>
        <div className="scroll-x lp-pills" role="group" aria-label="County">
          {shown.map((c) => (
            <button key={c.slug} type="button" className="pill pill-sm" aria-pressed={c.slug === county} onClick={() => setCounty(c.slug)}>
              {c.name} <span className="count">{c.count}</span>
            </button>
          ))}
          {shown.length === 0 && <span className="muted small" style={{ alignSelf: "center" }}>No county matches “{q}”.</span>}
        </div>

        <div className="tile-grid">
          {cards.map((r) => (
            <LpTile key={r.id} r={r} href={r.locked ? undefined : `/lis-pendens?county=${r.countySlug}&date=${r.date}&id=${r.id}`} />
          ))}
          {cards.length === 0 && <p className="muted">No new filings in {current.name} County this week.</p>}
        </div>
        <Link href={`/lis-pendens?county=${county}`} className="text-link mob-only" style={{ marginTop: 16 }}>All {current.name} County filings →</Link>
      </div>
    </section>
  );
}
