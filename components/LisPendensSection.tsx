"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ViewRecord } from "@/lib/types";
import { RecordCard } from "./RecordBits";
import { Icon } from "./Icon";

type Props = {
  counties: { slug: string; name: string }[];
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
    <section className="section" id="lis-pendens">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: "var(--lp-deep)" }}>New every weekday</div>
            <h2>Track the new Lis Pendens filings</h2>
            <p>Find, contact and negotiate a deal before the auction.</p>
          </div>
          <Link href={`/lis-pendens?county=${county}`} className="btn btn-ghost desk-only">
            All {current.name} filings <Icon name="arrow" size={16} />
          </Link>
        </div>

        <div className="lp-controls">
          <label className="search-field lp-search">
            <span className="sr-only">Find a county</span>
            <Icon name="pin" />
            <input
              className="input"
              placeholder="Search a county"
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
          <div className="scroll-x" role="group" aria-label="County">
            {shown.map((c) => (
              <button key={c.slug} type="button" className="pill" aria-pressed={c.slug === county} onClick={() => setCounty(c.slug)}>
                {c.name}
              </button>
            ))}
            {shown.length === 0 && <span className="muted small" style={{ alignSelf: "center" }}>No hot county matches “{q}”.</span>}
          </div>
        </div>

        <div className="card-grid">
          {cards.map((r) => (
            <RecordCard
              key={r.id}
              r={r}
              href={r.locked ? undefined : `/lis-pendens?county=${r.countySlug}&date=${r.date}&id=${r.id}`}
            />
          ))}
        </div>
        <Link href={`/lis-pendens?county=${county}`} className="btn btn-ghost mob-only" style={{ width: "100%", marginTop: 16 }}>
          All {current.name} filings <Icon name="arrow" size={16} />
        </Link>
      </div>
    </section>
  );
}
