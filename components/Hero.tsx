"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "./Icon";

const TYPES = [
  { value: "", label: "All properties" },
  { value: "foreclosure", label: "Foreclosure auctions" },
  { value: "tax_deed", label: "Tax deeds" },
  { value: "lis_pendens", label: "Lis pendens" },
];
const POPULAR = ["Lee County", "Cape Coral", "Lehigh Acres", "Miami-Dade", "Broward"];

export function Hero() {
  const [type, setType] = useState("");
  return (
    <section className="hero">
      <div className="wrap">
        <h1>Your #1 data source to track all distressed properties.</h1>
        <p className="hero-sub">
          Foreclosure auctions, tax deed sales and lis pendens filings on one map, with owner, value and case details on every property.
        </p>
        <div className="scroll-x hero-tabs" role="group" aria-label="Property type">
          {TYPES.map((t) => (
            <button key={t.value} type="button" className="pill" aria-pressed={type === t.value} onClick={() => setType(t.value)}>
              {t.label}
            </button>
          ))}
        </div>
        <form className="hero-search" action="/search" method="get" role="search">
          <input type="hidden" name="type" value={type} />
          <label className="search-field">
            <span className="sr-only">Search</span>
            <Icon name="search" />
            <input className="input" name="q" placeholder="Address, case #, parcel, ZIP or county" autoComplete="off" />
          </label>
          <button className="btn btn-primary" type="submit">Search</button>
        </form>
        <div className="hero-popular">
          <span className="muted small">Popular:</span>
          <div className="scroll-x">
            {POPULAR.map((p) => (
              <Link key={p} href={`/search?q=${encodeURIComponent(p)}`} className="pop-chip">{p}</Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
