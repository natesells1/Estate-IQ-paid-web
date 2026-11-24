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
    // Owner names and phone are Pro-only, even on public auction history
    owner: isPro ? p.owner : "",
    ownerPhone: isPro ? p.ownerPhone : "",
    details: { ...p.details, coOwner: isPro ? p.details.coOwner : "" },
    contactsLocked: !isPro,
    locked: false,
    countyName: COUNTY_BY_SLUG[p.countySlug]?.name ?? p.countySlug,
    equityScore: isPro || score >= FREE_SCORE_FLOOR ? score : null,
  };
}

/**
 * The score a viewer is allowed to sort by. Hidden scores count as 0 so the
 * order of locked records never hints at their real Equity Score.
 */
function rankScore(p: Property, viewer: Viewer): number {
  const s = equityScore(p);
  return viewer.isPro || s >= FREE_SCORE_FLOOR ? s : 0;
}

export function toView(p: Property, viewer: Viewer): ViewRecord {
  const score = equityScore(p);
  if (viewer.isPro || isPublicRecord(p)) return toFull(p, score, viewer.isPro);
  return toTeaser(p, score);
}

export interface CountyStat {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  /** New lis pendens filings, last 30 days */
  lisPendens: number;
  /** Foreclosure auctions still scheduled (upcoming) */
  scheduledAuctions: number;
  /** Tax deed sales still scheduled (upcoming) */
  taxDeeds: number;
}

/** Counts for the hero map's hot counties. Counts reveal nothing private, so they are the same for everyone. */
export function countyStats(): CountyStat[] {
  const today = floridaToday();
  const monthAgo = addDays(today, -30);
  const all = rows();
  return COUNTIES.filter((c) => c.hot).map((c) => {
    const mine = all.filter((p) => p.countySlug === c.slug);
    return {
      slug: c.slug,
      name: c.name,
      lat: c.lat,
      lng: c.lng,
      lisPendens: mine.filter((p) => p.kind === "lis_pendens" && p.date >= monthAgo).length,
      scheduledAuctions: mine.filter((p) => p.kind === "foreclosure" && p.status === "scheduled" && p.date >= today).length,
      taxDeeds: mine.filter((p) => p.kind === "tax_deed" && p.status === "scheduled" && p.date >= today).length,
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
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : rankScore(b, viewer) - rankScore(a, viewer)))
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
    .sort((a, b) => rankScore(b, viewer) - rankScore(a, viewer) || (a.date < b.date ? 1 : -1))
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
    .sort((a, b) => rankScore(b, viewer) - rankScore(a, viewer) || (a.date < b.date ? 1 : -1))[0];
  return best && toView(best, viewer);
}

export interface FilingDay {
  date: string;
  count: number;
  /** Weekend: clerk closed */
  closed: boolean;
  isToday: boolean;
}

/** One county's lis pendens filings for the last `days` days (newest first) plus per-day counts. */
export function countyFilings(viewer: Viewer, countySlug: string, days = 30): { records: ViewRecord[]; days: FilingDay[] } {
  const today = floridaToday();
  const from = addDays(today, -days);
  const mine = rows()
    .filter((p) => p.kind === "lis_pendens" && p.countySlug === countySlug && p.date > from)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.caseNumber.localeCompare(a.caseNumber)));
  const strip: FilingDay[] = [];
  for (let d = days - 1; d >= 0; d--) {
    const date = addDays(today, -d);
    const dow = new Date(date + "T12:00:00Z").getUTCDay();
    strip.push({ date, count: mine.filter((p) => p.date === date).length, closed: dow === 0 || dow === 6, isToday: d === 0 });
  }
  return { records: mine.map((p) => toView(p, viewer)), days: strip };
}

/**
 * Search one county's filings. Free users match on case # only; Pro also matches
 * address, owner (defendant), plaintiff and parcel. Returns matching ids.
 */
export function searchCountyFilings(viewer: Viewer, countySlug: string, q: string, days = 30): string[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const from = addDays(floridaToday(), -days);
  return rows()
    .filter((p) => p.kind === "lis_pendens" && p.countySlug === countySlug && p.date > from)
    .filter((p) => {
      if (p.caseNumber.toLowerCase().includes(needle)) return true;
      if (!viewer.isPro) return false;
      return [p.address, p.owner, p.plaintiff, p.parcelId, p.city, p.zip].some((f) => f.toLowerCase().includes(needle));
    })
    .map((p) => p.id);
}

/* ───────────── Auction calendar ───────────── */

export type AuctionType = "all" | "foreclosure" | "tax_deed";

export interface MonthDay {
  fc: number;
  td: number;
}
export interface MonthTotals {
  all: number;
  foreclosure: number;
  taxDeed: number;
  soldThirdParty: number;
  backToPlaintiff: number;
  canceled: number;
  rescheduled: number;
  scheduled: number;
}

function auctionRows(county: string | null, type: AuctionType) {
  return rows().filter(
    (p) => p.kind !== "lis_pendens" && (!county || p.countySlug === county) && (type === "all" || p.kind === type),
  );
}

/** Per-day counts and status totals for one month (yyyy-mm). Counts are public. */
export function auctionMonth(month: string, county: string | null, type: AuctionType): { days: Record<string, MonthDay>; totals: MonthTotals } {
  const days: Record<string, MonthDay> = {};
  const totals: MonthTotals = { all: 0, foreclosure: 0, taxDeed: 0, soldThirdParty: 0, backToPlaintiff: 0, canceled: 0, rescheduled: 0, scheduled: 0 };
  // Type chip counts ignore the type filter so both chips always show their totals
  for (const p of auctionRows(county, "all")) {
    if (!p.date.startsWith(month)) continue;
    if (p.kind === "foreclosure") totals.foreclosure++;
    else totals.taxDeed++;
    if (type !== "all" && p.kind !== type) continue;
    totals.all++;
    const d = (days[p.date] ??= { fc: 0, td: 0 });
    if (p.kind === "foreclosure") d.fc++;
    else d.td++;
    if (p.status === "sold_third_party") totals.soldThirdParty++;
    else if (p.status === "back_to_plaintiff") totals.backToPlaintiff++;
    else if (p.status === "canceled") totals.canceled++;
    else if (p.status === "rescheduled") totals.rescheduled++;
    else totals.scheduled++;
  }
  if (type === "all") totals.all = totals.foreclosure + totals.taxDeed;
  return { days, totals };
}

/** One day's auctions, grouped-ready (sorted by county, then case #). */
export function auctionDay(viewer: Viewer, date: string, county: string | null, type: AuctionType): ViewRecord[] {
  return auctionRows(county, type)
    .filter((p) => p.date === date)
    .sort((a, b) => a.countySlug.localeCompare(b.countySlug) || a.caseNumber.localeCompare(b.caseNumber))
    .map((p) => toView(p, viewer));
}

/** Most recent day (before today) that has auction results, for the default view. */
export function latestResultDay(county: string | null, type: AuctionType): string {
  const today = floridaToday();
  let best = "";
  for (const p of auctionRows(county, type)) if (p.date < today && p.date > best) best = p.date;
  return best || today;
}

/**
 * Auction search. Finished sales (public) match on address, city, ZIP, case #, parcel or plaintiff.
 * Upcoming (locked) auctions match on case # only.
 */
export function searchAuctions(viewer: Viewer, q: string, county: string | null, type: AuctionType, limit = 60): ViewRecord[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  return auctionRows(county, type)
    .filter((p) => {
      if (p.caseNumber.toLowerCase().includes(needle)) return true;
      if (!(viewer.isPro || isPublicRecord(p))) return false;
      return [p.address, p.city, p.zip, p.parcelId, p.plaintiff].some((f) => f.toLowerCase().includes(needle));
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.countySlug.localeCompare(b.countySlug)))
    .slice(0, limit)
    .map((p) => toView(p, viewer));
}

export function findById(id: string): Property | undefined {
  return rows().find((p) => p.id === id);
}

export function publicRecords(): Property[] {
  return rows().filter(isPublicRecord);
}
