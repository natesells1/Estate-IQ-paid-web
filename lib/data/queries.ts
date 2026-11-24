import "server-only";
// Every read the pages make goes through here, and every record leaves here
// already redacted for the viewer. Client components never see hidden fields.
import type { FullRecord, Kind, Property, TeaserRecord, ViewRecord, Viewer } from "../types";
import { COUNTIES, COUNTY_BY_SLUG } from "./counties";
import { loadAllProperties } from "./source";
import { equityScore, FREE_SCORE_FLOOR } from "../equity";
import { addDays, floridaToday } from "../dates";

function rows(): Property[] {
  return loadAllProperties().filter((p) => p.compliant);
}

/** Auction history (a finished sale) is free in full. Everything else is Pro. */
export function isPublicRecord(p: Property): boolean {
  return p.kind !== "lis_pendens" && !!p.status && p.status !== "scheduled";
}

function toTeaser(p: Property, score: number): TeaserRecord {
  return {
    locked: true,
    id: p.id,
    kind: p.kind,
    countySlug: p.countySlug,
    countyName: COUNTY_BY_SLUG[p.countySlug]?.name ?? p.countySlug,
    caseNumber: p.caseNumber,
    photoUrl: p.photoUrl,
    date: p.date,
    equityScore: score >= FREE_SCORE_FLOOR ? score : null,
    // ~1 km precision so a pin cannot be reverse-geocoded to the house
    lat: Math.round(p.lat * 100) / 100,
    lng: Math.round(p.lng * 100) / 100,
  };
}

function toFull(p: Property, score: number, isPro: boolean): FullRecord {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { compliant, ...rest } = p;
  return {
    ...rest,
    locked: false,
    countyName: COUNTY_BY_SLUG[p.countySlug]?.name ?? p.countySlug,
    equityScore: isPro || score >= FREE_SCORE_FLOOR ? score : null,
  };
}

export function toView(p: Property, viewer: Viewer): ViewRecord {
  const score = equityScore(p);
  if (viewer.isPro || isPublicRecord(p)) return toFull(p, score, viewer.isPro);
  return toTeaser(p, score);
}

export interface CountyStat {
  slug: string;
  name: string;
  lisPendens: number;
  auctionResults: number;
  taxDeeds: number;
}

/** Last-30-day counts for the Florida hot-counties map. Counts reveal nothing private, so they are the same for everyone. */
export function countyStats(): CountyStat[] {
  const today = floridaToday();
  const monthAgo = addDays(today, -30);
  const monthAhead = addDays(today, 30);
  const all = rows();
  return COUNTIES.filter((c) => c.hot).map((c) => {
    const mine = all.filter((p) => p.countySlug === c.slug);
    return {
      slug: c.slug,
      name: c.name,
      lisPendens: mine.filter((p) => p.kind === "lis_pendens" && p.date >= monthAgo).length,
      auctionResults: mine.filter((p) => p.kind === "foreclosure" && isPublicRecord(p) && p.date >= monthAgo).length,
      taxDeeds: mine.filter((p) => p.kind === "tax_deed" && p.date >= monthAgo && p.date <= monthAhead).length,
    };
  });
}

/** Newest lis pendens filings, `perCounty` per county. */
export function newFilingsByCounty(viewer: Viewer, perCounty = 4): Record<string, ViewRecord[]> {
  const all = rows().filter((p) => p.kind === "lis_pendens");
  const out: Record<string, ViewRecord[]> = {};
  for (const c of COUNTIES) {
    out[c.slug] = all
      .filter((p) => p.countySlug === c.slug)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : equityScore(b) - equityScore(a)))
      .slice(0, perCounty)
      .map((p) => toView(p, viewer));
  }
  return out;
}

/** Pins for a county map: this week's filings plus the next two weeks of auctions. */
export function countyMapRecords(viewer: Viewer, countySlug: string): ViewRecord[] {
  const today = floridaToday();
  const from = addDays(today, -7);
  const to = addDays(today, 14);
  return rows()
    .filter(
      (p) =>
        p.countySlug === countySlug &&
        ((p.kind === "lis_pendens" && p.date > from) || (p.status === "scheduled" && p.date <= to)),
    )
    .sort((a, b) => equityScore(b) - equityScore(a))
    .map((p) => toView(p, viewer));
}

/** Most recent finished auctions across all counties (free in full). */
export function recentAuctionResults(viewer: Viewer, limit = 12): FullRecord[] {
  return rows()
    .filter(isPublicRecord)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.countySlug.localeCompare(b.countySlug)))
    .slice(0, limit)
    .map((p) => toView(p, viewer) as FullRecord);
}

/**
 * Search. Public records match on address, parcel, ZIP, county or case #.
 * Locked records match on case # only, so search can't be used to unmask them.
 */
export function searchRecords(viewer: Viewer, q: string, kind?: Kind, limit = 40): ViewRecord[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  return rows()
    .filter((p) => !kind || p.kind === kind)
    .filter((p) => {
      if (p.caseNumber.toLowerCase().includes(needle)) return true;
      const county = COUNTY_BY_SLUG[p.countySlug]?.name.toLowerCase() ?? "";
      if (!(viewer.isPro || isPublicRecord(p))) return false;
      return (
        p.address.toLowerCase().includes(needle) ||
        p.parcelId.includes(needle) ||
        p.zip.startsWith(needle) ||
        p.city.toLowerCase().includes(needle) ||
        county.includes(needle.replace(/ county$/, ""))
      );
    })
    .slice(0, limit)
    .map((p) => toView(p, viewer));
}

/** New lis pendens filings per county over the last `days` days. */
export function filingCounts(days = 7): Record<string, number> {
  const from = addDays(floridaToday(), -days);
  const out: Record<string, number> = {};
  for (const p of rows()) {
    if (p.kind === "lis_pendens" && p.date > from) out[p.countySlug] = (out[p.countySlug] ?? 0) + 1;
  }
  return out;
}

/** Finished sales (sold to a third party or back to plaintiff) for one county, newest first. */
export function soldResults(viewer: Viewer, countySlug: string, limit = 8): FullRecord[] {
  return rows()
    .filter((p) => p.countySlug === countySlug && (p.status === "sold_third_party" || p.status === "back_to_plaintiff"))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit)
    .map((p) => toView(p, viewer) as FullRecord);
}

/** The highest-equity new filing in a county, for the hero sample card. */
export function topFiling(viewer: Viewer, countySlug: string): ViewRecord | undefined {
  const from = addDays(floridaToday(), -7);
  const best = rows()
    .filter((p) => p.kind === "lis_pendens" && p.countySlug === countySlug && p.date > from)
    .sort((a, b) => equityScore(b) - equityScore(a) || (a.date < b.date ? 1 : -1))[0];
  return best && toView(best, viewer);
}

export function findById(id: string): Property | undefined {
  return rows().find((p) => p.id === id);
}

export function publicRecords(): Property[] {
  return rows().filter(isPublicRecord);
}
