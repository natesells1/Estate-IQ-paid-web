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
// Popular counties (counties only). Links follow the selected type tab.
const POPULAR = [
  { slug: "lee", name: "Lee County" },
  { slug: "miami-dade", name: "Miami-Dade County" },
  { slug: "broward", name: "Broward County" },
  { slug: "duval", name: "Duval County" },
  { slug: "manatee", name: "Manatee County" },
  { slug: "polk", name: "Polk County" },
];
function popularHref(slug: string, type: string) {
  if (type === "foreclosure" || type === "tax_deed") return `/auctions?county=${slug}&type=${type}`;
  return `/lis-pendens/${slug}`;
}

/** Type tabs, search box and popular links (the only interactive part of the hero). */
export function HeroSearch() {
  const [type, setType] = useState("");
  return (
    <>
      <div className="scroll-x hero-tabs" role="group" aria-label="Property type">
        {TYPES.map((t) => (
          <button key={t.value} type="button" className="tab-btn" aria-pressed={type === t.value} onClick={() => setType(t.value)}>
            {t.label}
          </button>
        ))}
      </div>
      <form className="hero-search" action="/search" method="get" role="search">
        <input type="hidden" name="type" value={type} />
        <label className="search-field">
          <span className="sr-only">Search</span>
          <Icon name="search" />
          <input className="input" name="q" placeholder="Address, case #, parcel #, ZIP or county" autoComplete="off" />
        </label>
        <button className="btn btn-primary" type="submit">Search</button>
      </form>
      <div className="hero-popular">
        <span className="muted small">Popular:</span>
        <div className="scroll-x">
          {POPULAR.map((p) => (
            <Link key={p.slug} href={popularHref(p.slug, type)} className="pop-link">{p.name}</Link>
          ))}
        </div>
      </div>
    </>
  );
}
