// SAMPLE DATA ONLY. Generated deterministically so every page agrees.
// Replace `loadAllProperties()` in ./source.ts with the real county feed.
import type { AuctionStatus, Kind, Property } from "../types";
import { COUNTIES } from "./counties";
import { addDays, floridaToday, isWeekend } from "../dates";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STREETS = [
  "Palm Bay Dr", "Coral Way", "Pelican Ln", "Mangrove Ct", "Heron Ave", "Sabal Palm Rd", "Gulfview Blvd",
  "Cypress Lake Dr", "Orange Blossom Trl", "Manatee Ave", "Banyan St", "Sandpiper Cir", "Osprey Ln",
  "Royal Poinciana Dr", "Seagrape Ct", "Tarpon Way", "Magnolia St", "Live Oak Dr", "Citrus Ave", "Egret Pl",
  "Hibiscus Ln", "Flamingo Dr", "Bayshore Rd", "Lakeview Ter", "Marsh Wren Ct", "Sunset Blvd", "Dolphin St",
];
const FIRST = ["James", "Maria", "Robert", "Linda", "Carlos", "Patricia", "Michael", "Jennifer", "David", "Ana", "William", "Susan", "Jose", "Karen", "Thomas", "Nancy"];
const LAST = ["Alvarez", "Brennan", "Carter", "Delgado", "Ellison", "Fowler", "Garcia", "Hensley", "Ingram", "Jacobs", "Kowalski", "Lambert", "Moreno", "Nash", "Ortega", "Pruitt", "Quinn", "Reyes"];
// Fictional lenders for sample data
const LENDERS = [
  "Sunshine Federal Bank", "Gulfstream Mortgage Trust", "Harborline Lending LLC", "Coastal Home Loans NA",
  "Peninsula Savings Bank", "Tidewater Mortgage Corp", "Keystone Servicing LLC",
];
const TYPES = ["Single family", "Single family", "Single family", "Condo", "Townhouse", "Duplex"];

function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)];
}
function between(r: () => number, lo: number, hi: number) {
  return lo + r() * (hi - lo);
}
const round = (n: number, to: number) => Math.round(n / to) * to;

function baseProperty(id: string, kind: Kind, countySlug: string, date: string, r: () => number): Property {
  const county = COUNTIES.find((c) => c.slug === countySlug)!;
  const city = pick(r, county.cities);
  const type = pick(r, TYPES);
  const beds = type === "Condo" ? 1 + Math.floor(r() * 2) : 2 + Math.floor(r() * 3);
  const baths = Math.max(1, beds - 1 + (r() > 0.5 ? 0.5 : 0) + (r() > 0.6 ? 1 : 0));
  const sqft = round(type === "Condo" ? between(r, 700, 1400) : between(r, 1100, 2800), 10);
  const fmv = round(sqft * between(r, 150, 290), 1000);
  const year = 1965 + Math.floor(r() * 58);
  const lastSaleYear = Math.max(year + 1, 2004 + Math.floor(r() * 18));
  const owner = `${pick(r, FIRST)} ${pick(r, LAST)}`;
  const yy = date.slice(2, 4);
  const caseNumber =
    kind === "tax_deed"
      ? `${yy}-TD-${String(Math.floor(r() * 90000) + 10000)}`
      : `${yy}-CA-${String(Math.floor(r() * 9000) + 1000).padStart(6, "0")}`;

  return {
    id,
    kind,
    countySlug,
    caseNumber,
    parcelId: `${Math.floor(r() * 90 + 10)}-${Math.floor(r() * 90 + 10)}-${Math.floor(r() * 90 + 10)}-${String(Math.floor(r() * 9000) + 1000)}-${String(Math.floor(r() * 900) + 100)}`,
    address: `${Math.floor(between(r, 100, 9999))} ${pick(r, STREETS)}`,
    city: city.name,
    zip: city.zip,
    lat: +(city.lat + between(r, -0.05, 0.05)).toFixed(5),
    lng: +(city.lng + between(r, -0.06, 0.06)).toFixed(5),
    photoUrl: `/api/photo/${id}?v=2`,
    beds,
    baths,
    sqft,
    lotSqft: round(type === "Condo" ? 0 : between(r, 5000, 14000), 50),
    yearBuilt: year,
    propertyType: type,
    owner,
    ownerPhone: `(${pick(r, ["239", "941", "813", "727", "407", "305", "954", "561", "904", "352", "386", "321", "863"])}) 555-${String(Math.floor(r() * 9000) + 1000)}`,
    mortgage: 0,
    fairMarketValue: fmv,
    lastSalePrice: round(fmv * between(r, 0.45, 0.85), 1000),
    lastSaleDate: `${lastSaleYear}-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-${String(1 + Math.floor(r() * 28)).padStart(2, "0")}`,
    plaintiff: kind === "tax_deed" ? `${county.name} County Tax Collector` : pick(r, LENDERS),
    date,
    details: sampleDetails(id, kind, type, sqft, fmv, county.slug),
    // ~7% of files are incomplete and must never show
    compliant: r() > 0.07,
  };
}

const WATER_COUNTIES = new Set(["lee", "collier", "charlotte", "sarasota", "manatee", "pinellas", "brevard", "palm-beach", "broward", "miami-dade"]);

function sampleDetails(id: string, kind: Kind, type: string, sqft: number, fmv: number, countySlug: string) {
  const r = rng(id + "d");
  const waterfront = WATER_COUNTIES.has(countySlug) && r() > 0.7;
  const condo = type === "Condo";
  return {
    totalBuildingSqft: round(sqft * between(r, 1.15, 1.35), 10),
    garage: condo ? "None" : pick(r, ["1-car attached", "2-car attached", "2-car attached", "None", "Carport only"]),
    pool: !condo && r() > 0.55,
    carport: r() > 0.85,
    seawall: waterfront,
    boatDock: waterfront && r() > 0.4,
    taxesOwed: kind === "tax_deed" ? round(between(r, 2500, 18000), 10) : r() > 0.8 ? round(between(r, 800, 6000), 10) : 0,
    assessedValue: round(fmv * between(r, 0.78, 0.92), 100),
    filingType: kind === "tax_deed" ? "Tax deed application" : pick(r, ["Mortgage foreclosure", "Mortgage foreclosure", "Mortgage foreclosure", "HOA lien foreclosure"]),
    secondMortgage: r() > 0.8 ? round(between(r, 15000, 60000), 1000) : 0,
    hoaLien: condo || r() > 0.85 ? round(between(r, 1500, 9000), 100) : 0,
    coOwner: r() > 0.5 ? `${pick(r, FIRST)} ${pick(r, LAST)}` : "",
  };
}

function generate(): Property[] {
  const today = floridaToday();
  const out: Property[] = [];

  for (const county of COUNTIES) {
    // New lis pendens filings: last 30 days, clerk closed on weekends
    for (let d = 0; d < 31; d++) {
      const date = addDays(today, -d);
      if (isWeekend(date)) continue;
      const r = rng(`lp:${county.slug}:${date}`);
      const n = 2 + Math.floor(r() * 6);
      for (let i = 0; i < n; i++) {
        const id = `lp-${county.slug}-${date.replace(/-/g, "")}-${i}`;
        const p = baseProperty(id, "lis_pendens", county.slug, date, rng(id));
        const pr = rng(id + "m");
        p.mortgage = round(p.fairMarketValue * between(pr, 0.25, 1.1), 1000);
        out.push(p);
      }
    }

    // Auctions: 30 days back, 30 days forward
    for (let d = -30; d <= 30; d++) {
      const date = addDays(today, d);
      if (isWeekend(date)) continue;
      const r = rng(`au:${county.slug}:${date}`);
      // Foreclosure sales most weekdays, tax deed sales roughly weekly
      const fc = r() > 0.35 ? 1 + Math.floor(r() * 5) : 0;
      const td = r() > 0.8 ? 1 + Math.floor(r() * 4) : 0;
      const past = d < 0;
      for (let i = 0; i < fc + td; i++) {
        const kind: Kind = i < fc ? "foreclosure" : "tax_deed";
        const id = `${kind === "foreclosure" ? "fc" : "td"}-${county.slug}-${date.replace(/-/g, "")}-${i}`;
        const p = baseProperty(id, kind, county.slug, date, rng(id));
        const ar = rng(id + "a");
        p.mortgage = round(p.fairMarketValue * between(ar, 0.3, 1.0), 1000);
        p.finalJudgment =
          kind === "tax_deed"
            ? round(between(ar, 2500, 28000), 100)
            : round(p.fairMarketValue * between(ar, 0.3, 1.05), 100);
        p.plaintiffMaxBid = round(p.finalJudgment * between(ar, 0.7, 1.0), 100);
        if (past) {
          const roll = ar();
          let status: AuctionStatus;
          if (roll < 0.45) status = "sold_third_party";
          else if (roll < 0.7) status = "back_to_plaintiff";
          else if (roll < 0.87) status = "canceled";
          else status = "rescheduled";
          p.status = status;
          if (status === "sold_third_party") {
            p.soldTo = "3rd party bidder";
            p.soldAmount = round(p.finalJudgment * between(ar, 1.0, 1.6), 100);
          } else if (status === "back_to_plaintiff") {
            p.soldTo = kind === "tax_deed" ? "County" : "Plaintiff";
            p.soldAmount = 100;
          }
        } else {
          p.status = "scheduled";
        }
        out.push(p);
      }
    }
  }
  return out;
}

let cache: { day: string; rows: Property[] } | null = null;

/** All sample properties, regenerated once per Florida calendar day. */
export function sampleProperties(): Property[] {
  const day = floridaToday();
  if (!cache || cache.day !== day) cache = { day, rows: generate() };
  return cache.rows;
}
