"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AuctionStatus, FullRecord, ViewRecord } from "@/lib/types";
import type { AuctionType, MonthDay, MonthTotals } from "@/lib/data/queries";
import { fmtDate, fmtMoney } from "@/lib/dates";
import { EquityCell, KIND_LABEL } from "./RecordBits";
import { Icon } from "./Icon";

type Props = {
  month: string; // yyyy-mm
  date: string | null; // selected day (null while searching)
  today: string;
  county: string | null;
  type: AuctionType;
  q: string;
  counties: { slug: string; name: string }[];
  monthDays: Record<string, MonthDay>;
  totals: MonthTotals;
  records: ViewRecord[];
  highlightId: string | null;
  isPro: boolean;
};

type StatusKey = "all" | "sold_third_party" | "back_to_plaintiff" | "canceled" | "rescheduled" | "scheduled";
const STATUS_CHIPS: { key: StatusKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sold_third_party", label: "Sold to 3rd party" },
  { key: "back_to_plaintiff", label: "Back to plaintiff" },
  { key: "canceled", label: "Canceled" },
  { key: "rescheduled", label: "Rescheduled" },
  { key: "scheduled", label: "Scheduled" },
];
const STATUS_TEXT: Record<AuctionStatus, string> = {
  sold_third_party: "Sold",
  back_to_plaintiff: "Sold",
  canceled: "Canceled",
  rescheduled: "Rescheduled",
  scheduled: "Scheduled",
};
const STATUS_CLASS: Record<AuctionStatus, string> = {
  sold_third_party: "st-sold",
  back_to_plaintiff: "st-sold",
  canceled: "st-canceled",
  rescheduled: "st-rescheduled",
  scheduled: "st-scheduled",
};
const TAG_TEXT: Record<AuctionStatus, string> = {
  sold_third_party: "Sold · 3rd party",
  back_to_plaintiff: "Back to plaintiff",
  canceled: "Canceled",
  rescheduled: "Rescheduled",
  scheduled: "Scheduled",
};

/** Locked auction records are always upcoming (scheduled) ones. */
function statusOf(r: ViewRecord): AuctionStatus {
  return r.locked ? "scheduled" : (r.status ?? "scheduled");
}
function soldTo(r: FullRecord) {
  if (r.status === "sold_third_party") return "3rd party bidder";
  if (r.status === "back_to_plaintiff") return r.kind === "tax_deed" ? "County" : "Plaintiff";
  return "";
}
const WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function monthGrid(month: string) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const start = new Date(first);
  start.setUTCDate(1 - first.getUTCDay());
  const cells: { iso: string; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    cells.push({ iso, inMonth: d.getUTCMonth() === m - 1 });
  }
  // Drop a trailing week that is entirely next month
  while (cells.length > 35 && !cells.slice(-7).some((c) => c.inMonth)) cells.splice(-7);
  return cells;
}
function shiftMonth(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

export function AuctionCalendar(props: Props) {
  const { month, date, today, county, type, q, counties, monthDays, totals, records, highlightId, isPro } = props;
  const router = useRouter();
  const [status, setStatus] = useState<StatusKey>("all");
  const [eq, setEq] = useState<"any" | "70" | "80">("any");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(highlightId ?? records[0]?.id ?? null);
  const [saved, setSaved] = useState<string[]>([]);
  const helpRef = useRef<HTMLDialogElement>(null);
  const searching = !!q;

  useEffect(() => {
    setStatus("all");
    setSelectedId(highlightId ?? records[0]?.id ?? null);
  }, [records, highlightId]);
  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem("eiq_saved") ?? "[]"));
    } catch {}
  }, []);
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => document.getElementById(`ac-${highlightId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 400);
    return () => clearTimeout(t);
  }, [highlightId]);

  function toggleSave(id: string) {
    const next = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
    setSaved(next);
    localStorage.setItem("eiq_saved", JSON.stringify(next));
  }

  function href(over: Partial<{ month: string; date: string | null; county: string | null; type: AuctionType; id: string | null }>) {
    const p = new URLSearchParams();
    const c = over.county !== undefined ? over.county : county;
    const t = over.type ?? type;
    const d = over.date !== undefined ? over.date : date;
    if (c) p.set("county", c);
    if (t !== "all") p.set("type", t);
    if (d) p.set("date", d);
    else if (over.month) p.set("month", over.month);
    if (over.id) p.set("id", over.id);
    const s = p.toString();
    return `/auctions${s ? `?${s}` : ""}`;
  }

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: records.length };
    for (const r of records) c[statusOf(r)] = (c[statusOf(r)] ?? 0) + 1;
    return c;
  }, [records]);

  const shown = useMemo(() => {
    let rs = status === "all" ? records : records.filter((r) => statusOf(r) === status);
    if (eq !== "any") rs = rs.filter((r) => (r.equityScore ?? 0) >= Number(eq));
    return rs;
  }, [records, status, eq]);

  const groups = useMemo(() => {
    const m = new Map<string, ViewRecord[]>();
    for (const r of shown) {
      const k = r.countyName;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return [...m.entries()];
  }, [shown]);

  const countyName = county ? counties.find((c) => c.slug === county)?.name : null;
  const where = countyName ? `${countyName} County` : "all counties";
  const isPast = !!date && date < today;
  const soldCount = records.filter((r) => !r.locked && (r.status === "sold_third_party" || r.status === "back_to_plaintiff")).length;
  const cells = monthGrid(month);
  const monthLabel = fmtDate(`${month}-01`, { month: "long", year: "numeric" });

  return (
    <div className="ac-page">
      {/* Title + search row */}
      <div className="lp-top">
        <h1>Auction calendar</h1>
        <form className="lp-q search-field" action="/auctions" method="get" role="search">
          <Icon name="search" size={16} />
          <label className="sr-only" htmlFor="ac-q">Search auctions</label>
          {county && <input type="hidden" name="county" value={county} />}
          {type !== "all" && <input type="hidden" name="type" value={type} />}
          <input id="ac-q" className="input" name="q" defaultValue={q} placeholder="Case #, address, parcel, plaintiff" />
        </form>
        <label className="ac-county">
          <Icon name="pin" size={15} />
          <span className="sr-only">County</span>
          <select value={county ?? ""} onChange={(e) => router.push(href({ county: e.target.value || null, id: null }))}>
            <option value="">All counties</option>
            {counties.map((c) => <option key={c.slug} value={c.slug}>{c.name} County</option>)}
          </select>
        </label>
        <button type="button" className="btn btn-outline lp-tool" aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)}>
          <Icon name="filter" size={16} />Filters{eq !== "any" && <span className="lp-tool-dot" />}
        </button>
        <button type="button" className="btn btn-ghost lp-tool desk-only" onClick={() => helpRef.current?.showModal()}>
          <Icon name="play" size={16} />How it works
        </button>
      </div>

      {showFilters && (
        <div className="lp-filters card">
          <span className="rec-label">Equity Score</span>
          <div className="scroll-x">
            {(["any", "70", "80"] as const).map((v) => (
              <button key={v} type="button" className="pill pill-sm" aria-pressed={eq === v} onClick={() => setEq(v)}>{v === "any" ? "Any" : `${v}+`}</button>
            ))}
          </div>
          {!isPro && <span className="muted small">Free accounts see Equity Scores of 70+. Pro shows every score.</span>}
        </div>
      )}

      {/* Type chips + month totals */}
      <div className="ac-sub">
        <div className="scroll-x ac-types" role="group" aria-label="Auction type">
          <Link href={href({ type: "all", id: null })} className="pill" aria-current={type === "all" ? "page" : undefined}>All auctions <span className="count">{totals.foreclosure + totals.taxDeed}</span></Link>
          <Link href={href({ type: "foreclosure", id: null })} className="pill" aria-current={type === "foreclosure" ? "page" : undefined}><span className="dot dot-fc" />Foreclosure <span className="count">{totals.foreclosure}</span></Link>
          <Link href={href({ type: "tax_deed", id: null })} className="pill" aria-current={type === "tax_deed" ? "page" : undefined}><span className="dot dot-td" />Tax deed <span className="count">{totals.taxDeed}</span></Link>
        </div>
        <p className="ac-totals small">
          <b>{totals.soldThirdParty}</b> sold to third parties · <b>{totals.backToPlaintiff}</b> back to plaintiff · <b>{totals.canceled}</b> canceled · <b>{totals.scheduled}</b> still scheduled
        </p>
      </div>

      <div className="ac-split">
        {/* Month calendar */}
        <div className="ac-cal card">
          <div className="ac-cal-head">
            <Link href={href({ date: null, month: shiftMonth(month, -1), id: null })} className="ac-nav" aria-label="Previous month">‹</Link>
            <h2>{monthLabel}</h2>
            <Link href={href({ date: null, month: shiftMonth(month, 1), id: null })} className="ac-nav" aria-label="Next month">›</Link>
          </div>
          <div className="ac-grid">
            {WEEK.map((w) => <div key={w} className="ac-wd" aria-hidden="true">{w}</div>)}
            {cells.map((c) => {
              const d = monthDays[c.iso];
              const n = Number(c.iso.slice(8));
              const isSel = c.iso === date && !searching;
              const isToday = c.iso === today;
              const body = (
                <>
                  <span className="ac-num">{n}{isToday && <span className="ac-today">Today</span>}</span>
                  {c.inMonth && d?.fc ? <span className="ac-chip ac-fc"><span className="dot dot-fc" />{d.fc}<span className="ac-chip-k"> FC</span></span> : null}
                  {c.inMonth && d?.td ? <span className="ac-chip ac-td"><span className="dot dot-td" />{d.td}<span className="ac-chip-k"> TD</span></span> : null}
                </>
              );
              const cls = `ac-cell${c.inMonth ? "" : " is-out"}${isSel ? " is-sel" : ""}${d && c.inMonth ? " has" : ""}`;
              return c.inMonth && d ? (
                <Link key={c.iso} href={href({ date: c.iso, id: null })} className={cls} aria-current={isSel ? "date" : undefined}><span className="sr-only">{fmtDate(c.iso, { weekday: "long", month: "long" })} </span>{body}</Link>
              ) : (
                <div key={c.iso} className={cls} aria-hidden={!c.inMonth || undefined}>{body}</div>
              );
            })}
          </div>
          <div className="ac-legend small muted">
            <span><span className="dot dot-fc" /> FC = foreclosure auction</span>
            <span><span className="dot dot-td" /> TD = tax deed sale</span>
            <span>Past days show results. Upcoming days show what&apos;s scheduled.</span>
          </div>
        </div>

        {/* Selected day panel */}
        <div className="ac-panel card">
          <div className="ac-panel-head">
            <div className="ac-panel-title">
              <h2>{searching ? `Search: “${q}”` : `${fmtDate(date!, { weekday: "long", month: "short", day: "numeric" })} · ${isPast ? "results" : "scheduled"}`}</h2>
              <span className="muted small">{records.length} auctions · {where}</span>
            </div>
            <StatusChips counts={statusCounts} status={status} setStatus={setStatus} />
          </div>
          <div className="ac-panel-list">
            {shown.map((r) => (
              <AuctionCard key={r.id} r={r} selected={r.id === selectedId} onSelect={() => setSelectedId(r.id)} saved={saved.includes(r.id)} onSave={() => toggleSave(r.id)} />
            ))}
            {shown.length === 0 && <p className="muted ac-empty">{searching ? "No auctions match. Free accounts can find upcoming auctions by case # only." : "No auctions for this filter."}</p>}
          </div>
        </div>
      </div>

      {/* Day table, grouped by county */}
      <div className="ac-table card">
        <div className="ac-table-head">
          <h2>{searching ? `Matches for “${q}”` : `${fmtDate(date!, { weekday: "long", month: "long", day: "numeric" })}, ${where}`}</h2>
          <span className="ac-count-pill">{shown.length} auctions</span>
          {soldCount > 0 && <span className="muted small">{soldCount} sold</span>}
        </div>
        {/* Mobile repeats the status filters here, since the panel above is hidden */}
        <div className="mob-only ac-mob-status"><StatusChips counts={statusCounts} status={status} setStatus={setStatus} /></div>

        <table className="ac-tbl desk-only">
          <thead>
            <tr>
              <th>#</th><th>Photo</th><th>Address</th><th>County</th><th>Status</th><th>Sold to</th>
              <th className="num">Amount</th><th className="num">Final judgment</th><th className="num">Plaintiff max bid</th>
              <th className="num">Fair market value</th><th>Equity Score</th><th>Case #</th>
            </tr>
          </thead>
          {(() => {
            let n = 0;
            return groups.map(([name, rs]) => (
              <tbody key={name}>
                <tr className="ac-group"><td colSpan={12}><b>{name} County</b> <span className="ac-count-pill">{rs.length} {rs.length === 1 ? "auction" : "auctions"}</span></td></tr>
                {rs.map((r) => {
                  n++;
                  const st = statusOf(r);
                  return (
                    <tr key={r.id} id={`ac-${r.id}`} className={r.id === selectedId ? "is-sel" : ""} onClick={() => setSelectedId(r.id)}>
                      <td className="muted">{n}</td>
                      <td><img className="thumb" src={r.photoUrl} alt="" width={48} height={36} loading="lazy" /></td>
                      <td className="ac-addr">
                        {r.locked ? (
                          <Link href={`/signup?from=${r.id}`}><span className="blur">0000 XXXXXXX XXXX XX</span></Link>
                        ) : (
                          <Link href={`/property/${r.id}`}><b>{r.address.toUpperCase()}</b> <span className="muted">{r.city.toUpperCase()}, FL {r.zip}</span></Link>
                        )}
                        {searching && <div className="muted small">{fmtDate(r.date, { month: "short", day: "numeric", year: "numeric" })}</div>}
                      </td>
                      <td>{r.countyName}</td>
                      <td><b className={STATUS_CLASS[st]}>{STATUS_TEXT[st]}</b></td>
                      <td className="nowrap">{r.locked ? "" : soldTo(r)}</td>
                      <td className="num"><b>{r.locked ? "" : r.soldAmount ? fmtMoney(r.soldAmount) : ""}</b></td>
                      <td className="num">{r.locked ? <span className="blur">$000,000</span> : fmtMoney(r.finalJudgment)}</td>
                      <td className="num">{r.locked ? <span className="blur">$00,000</span> : fmtMoney(r.plaintiffMaxBid)}</td>
                      <td className="num">{r.locked ? <span className="blur">$000,000</span> : fmtMoney(r.fairMarketValue)}</td>
                      <td><EquityCell score={r.equityScore} /></td>
                      <td className="nowrap muted">{r.caseNumber}</td>
                    </tr>
                  );
                })}
              </tbody>
            ));
          })()}
        </table>

        {/* Mobile: stacked cards grouped by county */}
        <div className="mob-only ac-mob">
          {groups.map(([name, rs]) => (
            <div key={name} className="ac-mob-group">
              <div className="ac-mob-gh"><b>{name} County</b> <span className="ac-count-pill">{rs.length} {rs.length === 1 ? "auction" : "auctions"}</span></div>
              {rs.map((r) => <MobileRow key={r.id} r={r} selected={r.id === selectedId} />)}
            </div>
          ))}
          {shown.length === 0 && <p className="muted ac-empty">No auctions for this filter.</p>}
        </div>
      </div>

      <dialog ref={helpRef} className="lp-help" onClick={(e) => e.target === helpRef.current && helpRef.current?.close()}>
        <h2>How it works</h2>
        <ol>
          <li><b>Pick a day</b> on the calendar. Navy is foreclosure auctions, orange is tax deed sales.</li>
          <li><b>Past days</b> show results: who won, for how much, and the equity left. Results are free for everyone.</li>
          <li><b>Upcoming days</b> show what&apos;s scheduled. Free shows the photo and case #; Pro unlocks the address, judgment, max bid and values.</li>
          <li><b>Equity Score</b> shows when it&apos;s 70 or higher on a free account, and on every property with Pro.</li>
        </ol>
        <button type="button" className="btn btn-primary" onClick={() => helpRef.current?.close()}>Got it</button>
      </dialog>
    </div>
  );
}

function StatusChips({ counts, status, setStatus }: { counts: Record<string, number>; status: StatusKey; setStatus: (s: StatusKey) => void }) {
  return (
    <div className="ac-status" role="group" aria-label="Status">
      {STATUS_CHIPS.filter((c) => c.key === "all" || counts[c.key]).map((c) => (
        <button key={c.key} type="button" className="pill pill-sm" aria-pressed={status === c.key} onClick={() => setStatus(c.key)}>
          {c.label} · {counts[c.key] ?? 0}
        </button>
      ))}
    </div>
  );
}

function AuctionCard({ r, selected, onSelect, saved, onSave }: { r: ViewRecord; selected: boolean; onSelect: () => void; saved: boolean; onSave: () => void }) {
  const st = statusOf(r);
  const surplus = !r.locked && r.status === "sold_third_party" && (r.soldAmount ?? 0) > (r.finalJudgment ?? 0);
  return (
    <div id={`card-${r.id}`} className={`ac-card${selected ? " is-sel" : ""}`} onMouseEnter={onSelect} onFocus={onSelect}>
      <div className="ac-card-top">
        <img className="ac-card-photo" src={r.photoUrl} alt="" width={80} height={56} loading="lazy" />
        <div className="ac-card-id">
          {r.locked ? (
            <>
              <div className="rec-label">Case #</div>
              <b className="ac-card-title">{r.caseNumber}</b>
            </>
          ) : (
            <>
              <Link href={`/property/${r.id}`} className="ac-card-title">{r.address}</Link>
              <div className="muted small">{r.city}, FL {r.zip} · {r.countyName} County</div>
            </>
          )}
          <div className="rec-tags">
            <span className={`chip ${r.kind === "foreclosure" ? "chip-fc" : "chip-td"}`}>{KIND_LABEL[r.kind]}</span>
            <span className={`chip ac-tag-${st}`}>{TAG_TEXT[st]}</span>
          </div>
        </div>
        <button type="button" className={`ac-star${saved ? " is-on" : ""}`} aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save property"} onClick={onSave}>
          <Icon name="star" size={17} />
        </button>
      </div>

      {r.locked ? (
        <div className="ac-card-grid" aria-hidden="true">
          <div><span className="rec-label">Final judgment</span><span className="blur">$000,000</span></div>
          <div><span className="rec-label">Opening bid</span><span className="blur">$000,000</span></div>
          <div><span className="rec-label">Fair market value</span><span className="blur">$000,000</span></div>
          <div><span className="rec-label">Equity Score</span><EquityInline score={r.equityScore} /></div>
          <div><span className="rec-label">Address</span><span className="blur">0000 Xxxxx Xx</span></div>
          <div><span className="rec-label">Parcel</span><span className="blur">00-00-00-0000</span></div>
        </div>
      ) : (
        <div className="ac-card-grid">
          <div><span className="rec-label">Final judgment</span><b>{fmtMoney(r.finalJudgment)}</b></div>
          <div><span className="rec-label">{r.status === "sold_third_party" || r.status === "back_to_plaintiff" ? "Winning bid" : "Opening bid"}</span><b className={r.status === "sold_third_party" ? "st-sold" : ""}>{fmtMoney(r.soldAmount ?? r.plaintiffMaxBid)}</b></div>
          <div><span className="rec-label">Fair market value</span><b>{fmtMoney(r.fairMarketValue)}</b></div>
          <div><span className="rec-label">Equity Score</span><EquityInline score={r.equityScore} /></div>
          <div><span className="rec-label">Case #</span><b>{r.caseNumber}</b></div>
          <div><span className="rec-label">Parcel</span><b>{r.parcelId}</b></div>
          <div className="ac-span"><span className="rec-label">Plaintiff</span><b className="upper">{r.plaintiff}</b></div>
        </div>
      )}

      {selected && (
        <div className="ac-card-foot">
          <span className="muted small">{r.locked ? "Sign up to see the address, judgment and values" : surplus ? "Surplus may be available to the owner" : `${KIND_LABEL[r.kind]} · ${fmtDate(r.date, { month: "short", day: "numeric", year: "numeric" })}`}</span>
          <Link href={r.locked ? `/signup?from=${r.id}` : `/property/${r.id}`} className="btn btn-primary btn-pill">{r.locked ? "See full file" : "Property card"}</Link>
        </div>
      )}
    </div>
  );
}

function EquityInline({ score }: { score: number | null }) {
  if (score == null) return <span className="eq-locked"><Icon name="lock" size={12} stroke={2.2} />Pro</span>;
  return <b className="st-sold">{score}</b>;
}

function MobileRow({ r, selected }: { r: ViewRecord; selected: boolean }) {
  const st = statusOf(r);
  return (
    <div id={`m-${r.id}`} className={`ac-mcard${selected ? " is-sel" : ""}`}>
      <div className="ac-mcard-top">
        <img className="thumb" src={r.photoUrl} alt="" width={48} height={40} loading="lazy" />
        <div style={{ flex: 1, minWidth: 0 }}>
          {r.locked ? <b>Case {r.caseNumber}</b> : <b className="ellipsis">{r.address.toUpperCase()}</b>}
          <div className="muted small">{r.locked ? `${r.countyName} County` : `${r.city}, FL ${r.zip}`}</div>
        </div>
        <b className={STATUS_CLASS[st]}>{STATUS_TEXT[st]}</b>
      </div>
      <div className="ac-mcard-grid">
        {r.locked ? (
          <>
            <div><span className="rec-label">Judgment</span><span className="blur">$000,000</span></div>
            <div><span className="rec-label">Max bid</span><span className="blur">$00,000</span></div>
            <div><span className="rec-label">Equity Score</span><EquityInline score={r.equityScore} /></div>
          </>
        ) : (
          <>
            <div><span className="rec-label">Sold to</span><b>{soldTo(r) || "—"}</b></div>
            <div><span className="rec-label">Amount</span><b>{r.soldAmount ? fmtMoney(r.soldAmount) : "—"}</b></div>
            <div><span className="rec-label">Judgment</span><b>{fmtMoney(r.finalJudgment)}</b></div>
            <div><span className="rec-label">Max bid</span><b>{fmtMoney(r.plaintiffMaxBid)}</b></div>
            <div><span className="rec-label">Market value</span><b>{fmtMoney(r.fairMarketValue)}</b></div>
            <div><span className="rec-label">Equity Score</span><EquityInline score={r.equityScore} /></div>
          </>
        )}
      </div>
      <div className="ac-mcard-foot">
        <span className="muted small">{r.locked ? "" : `Case ${r.caseNumber}`}</span>
        <Link href={r.locked ? `/signup?from=${r.id}` : `/property/${r.id}`} className="btn btn-primary btn-pill">{r.locked ? "See full file" : "Property card"}</Link>
      </div>
    </div>
  );
}
