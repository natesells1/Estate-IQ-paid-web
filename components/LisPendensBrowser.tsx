"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewRecord } from "@/lib/types";
import type { FilingDay } from "@/lib/data/queries";
import { fmtDate } from "@/lib/dates";
import { RecordCard } from "./RecordBits";
import { DayMap } from "./DayMap";
import { Icon } from "./Icon";

type Props = {
  county: { slug: string; name: string; lat: number; lng: number };
  counties: { slug: string; name: string }[];
  records: ViewRecord[];
  days: FilingDay[];
  initialDate: string | null;
  highlightId: string | null;
  search: { q: string; ids: string[] } | null;
  isPro: boolean;
};

type Sort = "newest" | "equity" | "case";
type EqFilter = "any" | "70" | "80";
const WINDOW = 8;

function weekday(iso: string, style: "short" | "long" = "short") {
  return fmtDate(iso, { weekday: style });
}
function plural(n: number, one: string, many = one + "s") {
  return `${n} ${n === 1 ? one : many}`;
}

export function LisPendensBrowser({ county, counties, records, days, initialDate, highlightId, search, isPro }: Props) {
  const router = useRouter();
  const latestOpen = [...days].reverse().find((d) => !d.closed && d.count > 0)?.date ?? days[days.length - 1].date;
  const [date, setDate] = useState(() => (initialDate && days.some((d) => d.date === initialDate) ? initialDate : latestOpen));
  const [selectedId, setSelectedId] = useState<string | null>(highlightId);
  const [sort, setSort] = useState<Sort>("newest");
  const [eq, setEq] = useState<EqFilter>("any");
  const [view, setView] = useState<"list" | "map">("list");
  const [showFilters, setShowFilters] = useState(false);
  const helpRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Day strip window: keep the selected day visible
  const idx = days.findIndex((d) => d.date === date);
  const [start, setStart] = useState(() => Math.max(0, Math.min(days.length - WINDOW, idx - WINDOW + 2)));
  const strip = days.slice(start, start + WINDOW);

  const searching = !!search;
  const dayRecords = useMemo(() => {
    let rs = searching ? records.filter((r) => search!.ids.includes(r.id)) : records.filter((r) => r.date === date);
    if (eq !== "any") rs = rs.filter((r) => (r.equityScore ?? 0) >= Number(eq));
    const out = [...rs];
    if (sort === "equity") out.sort((a, b) => (b.equityScore ?? 0) - (a.equityScore ?? 0));
    else if (sort === "case") out.sort((a, b) => a.caseNumber.localeCompare(b.caseNumber));
    else out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.caseNumber.localeCompare(a.caseNumber)));
    return out;
  }, [records, date, eq, sort, searching, search]);

  // Keep the URL shareable without a server round trip
  useEffect(() => {
    const u = new URL(window.location.href);
    if (!searching) u.searchParams.set("date", date);
    if (selectedId) u.searchParams.set("id", selectedId);
    else u.searchParams.delete("id");
    window.history.replaceState(null, "", u.toString());
  }, [date, selectedId, searching]);

  // Bring the highlighted card into view on arrival
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => document.getElementById(`card-${highlightId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 400);
    return () => clearTimeout(t);
  }, [highlightId]);

  // Keep the selected day visible in the sideways-scrolling strip (mobile)
  useEffect(() => {
    document.querySelector(".lp-day[aria-pressed='true']")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [date, start]);

  function pickDay(d: string) {
    setDate(d);
    setSelectedId(null);
    listRef.current?.scrollTo({ top: 0 });
  }
  function selectFromMap(id: string) {
    setSelectedId(id);
    const card = document.getElementById(`card-${id}`);
    if (card && listRef.current) listRef.current.scrollTo({ top: card.offsetTop - listRef.current.offsetTop - 8, behavior: "smooth" });
    if (view === "map") setView("list");
  }

  const dayInfo = days.find((d) => d.date === date)!;
  const longDay = fmtDate(date, { weekday: "long", month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="lp-page">
      {/* Title row */}
      <div className="lp-top">
        <h1>Lis pendens</h1>
        <form className="lp-q search-field" action={`/lis-pendens/${county.slug}`} method="get" role="search">
          <Icon name="search" size={16} />
          <label className="sr-only" htmlFor="lp-q">Search filings</label>
          <input id="lp-q" className="input" name="q" defaultValue={search?.q ?? ""} placeholder={isPro ? "Case #, address, owner, plaintiff, defendant" : "Search by case #"} />
        </form>
        <button type="button" className="btn btn-outline lp-tool" aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)}>
          <Icon name="filter" size={16} />Filters{eq !== "any" && <span className="lp-tool-dot" />}
        </button>
        <button type="button" className="btn btn-ghost lp-tool" onClick={() => helpRef.current?.showModal()}>
          <Icon name="play" size={16} />How it works
        </button>
      </div>

      {showFilters && (
        <div className="lp-filters card">
          <span className="rec-label">Equity Score</span>
          <div className="scroll-x" role="radiogroup" aria-label="Equity Score">
            {(["any", "70", "80"] as EqFilter[]).map((v) => (
              <button key={v} type="button" role="radio" aria-checked={eq === v} className="pill pill-sm" aria-pressed={eq === v} onClick={() => setEq(v)}>
                {v === "any" ? "Any" : `${v}+`}
              </button>
            ))}
          </div>
          {!isPro && <span className="muted small">Free accounts filter on Equity Scores of 70+. Pro adds mortgage, value and owner filters.</span>}
        </div>
      )}

      {/* County + day strip */}
      <div className="lp-strip card">
        <label className="lp-county">
          <Icon name="pin" size={15} />
          <span className="sr-only">County</span>
          <select value={county.slug} onChange={(e) => router.push(`/lis-pendens/${e.target.value}`)}>
            {counties.map((c) => <option key={c.slug} value={c.slug}>{c.name} County</option>)}
          </select>
        </label>
        <button type="button" className="lp-arrow" aria-label="Earlier days" disabled={start === 0} onClick={() => setStart(Math.max(0, start - 7))}>‹</button>
        <div className="lp-days scroll-x" role="group" aria-label="Filing day">
          {strip.map((d) => (
            <button
              key={d.date}
              type="button"
              className={`lp-day${d.closed ? " is-closed" : ""}`}
              aria-pressed={!searching && d.date === date}
              disabled={d.closed}
              onClick={() => pickDay(d.date)}
            >
              <span className="lp-day-wd">{weekday(d.date).toUpperCase()}</span>
              <b>{fmtDate(d.date)}</b>
              <span className="lp-day-n">{d.closed ? "Clerk closed" : d.isToday ? `${d.count} so far` : plural(d.count, "filing")}</span>
            </button>
          ))}
        </div>
        <button type="button" className="lp-arrow" aria-label="Later days" disabled={start + WINDOW >= days.length} onClick={() => setStart(Math.min(days.length - WINDOW, start + 7))}>›</button>
      </div>

      <p className="lp-caption muted small">
        {searching ? (
          <>
            {dayRecords.length === 1 ? "1 filing matches" : `${dayRecords.length} filings match`} “{search!.q}” in {county.name} County.{" "}
            <a href={`/lis-pendens/${county.slug}`} className="text-link small">Clear search</a>
          </>
        ) : (
          <>
            {plural(dayRecords.length, "filing")} on {longDay} in {county.name} County{dayInfo.isToday ? " so far" : ""}. Click a pin to find its card, then open the full file.
          </>
        )}
      </p>

      {/* Mobile switch */}
      <div className="lp-switch mob-only" role="tablist" aria-label="View">
        <button type="button" role="tab" aria-selected={view === "list"} onClick={() => setView("list")}>List</button>
        <button type="button" role="tab" aria-selected={view === "map"} onClick={() => setView("map")}>Map</button>
      </div>

      <div className={`lp-split view-${view}`}>
        <div className="lp-map-col">
          <DayMap
            pins={dayRecords}
            selectedId={selectedId}
            onSelect={selectFromMap}
            center={[county.lat, county.lng]}
            fitKey={`${searching ? `q:${search!.q}` : `${date}:${eq}`}:${view}`}
            legend={searching ? "Match" : `Filed ${fmtDate(date)}`}
          />
        </div>
        <div className="lp-list-col card">
          <div className="lp-list-head">
            <span><b>{dayRecords.length}</b> {searching ? "found" : `filed ${fmtDate(date)}`} in {county.name} County</span>
            <label className="lp-sort">
              <span className="muted small">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="newest">Newest filed</option>
                <option value="equity">Highest Equity Score</option>
                <option value="case">Case #</option>
              </select>
            </label>
          </div>
          <div className="lp-list" ref={listRef}>
            {dayRecords.map((r) => (
              <div key={r.id} id={`card-${r.id}`} onMouseEnter={() => setSelectedId(r.id)} onFocus={() => setSelectedId(r.id)}>
                <RecordCard r={r} highlight={r.id === selectedId} href={r.locked ? undefined : `/property/${r.id}`} />
              </div>
            ))}
            {dayRecords.length === 0 && (
              <p className="muted lp-empty">
                {dayInfo.closed ? "The clerk is closed on weekends." : eq !== "any" ? "No filings match this filter." : "No filings yet for this day."}
              </p>
            )}
          </div>
        </div>
      </div>

      <dialog ref={helpRef} className="lp-help" onClick={(e) => e.target === helpRef.current && helpRef.current?.close()}>
        <h2>How it works</h2>
        <ol>
          <li><b>Every weekday</b> we load that day&apos;s new lis pendens filings from the county clerk. Weekends are closed.</li>
          <li><b>Pick a county and a day.</b> The map shows only that day&apos;s properties.</li>
          <li><b>Click a pin</b> to jump to its card, or hover a card to find it on the map.</li>
          <li><b>Free</b> shows the photo, case #, filing date and the Equity Score when it&apos;s 70+. <b>Pro</b> unlocks the address, owner, mortgage and every score.</li>
        </ol>
        <p className="muted small">Only complete files are shown. Map pins for locked filings are approximate.</p>
        <button type="button" className="btn btn-primary" onClick={() => helpRef.current?.close()}>Got it</button>
      </dialog>
    </div>
  );
}
