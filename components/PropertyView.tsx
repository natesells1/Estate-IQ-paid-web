"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FullRecord, ViewRecord } from "@/lib/types";
import type { CourtDoc } from "@/lib/documents";
import { fmtDate, fmtMoney } from "@/lib/dates";
import { equityBand, EQUITY_LABEL } from "@/lib/equity";
import { KIND_LABEL } from "./RecordBits";
import { Icon } from "./Icon";
import { orderService } from "@/app/actions";

type Props = { r: ViewRecord; isPro: boolean; docs: CourtDoc[]; backHref: string };
type Tab = "summary" | "forms" | "dd" | "contacts";

const BAND_COLOR = { great: "var(--eq-great)", good: "var(--eq-good)", fair: "var(--eq-fair)", weak: "var(--eq-weak)" };
const DD_ITEMS = [
  "Order a title search",
  "Check HOA and code-enforcement liens",
  "Check property taxes owed",
  "Drive by and photograph the property",
  "Check if the property is occupied",
  "Pull comparable sales",
  "Set my max bid",
];
const longDate = (iso: string) => fmtDate(iso, { month: "short", day: "numeric", year: "numeric" });
const yesNo = (b: boolean) => (b ? "Yes" : "No");
const acres = (sqft: number) => (sqft ? `${(sqft / 43560).toFixed(2)} acres` : "—");

function useLocal<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setV(JSON.parse(raw));
    } catch {}
  }, [key]);
  return [v, (nv: T) => { setV(nv); try { localStorage.setItem(key, JSON.stringify(nv)); } catch {} }];
}

/** Blurred placeholder for values a free user can't see (the real value is never sent). */
const Lock = ({ w = "$000,000" }: { w?: string }) => <span className="blur" aria-hidden="true">{w}</span>;

export function PropertyView({ r, docs, backHref }: Props) {
  const router = useRouter();
  const full = r.locked ? null : (r as FullRecord);
  const isLp = r.kind === "lis_pendens";
  const isSold = !!full && (full.status === "sold_third_party" || full.status === "back_to_plaintiff");
  const [tab, setTab] = useState<Tab>("summary");
  const [saved, setSaved] = useLocal<string[]>("eiq_saved", []);
  const [maxBid, setMaxBid] = useLocal<number | null>(`eiq_maxbid_${r.id}`, null);
  const [editingBid, setEditingBid] = useState(false);
  const [dd, setDd] = useLocal<Record<string, boolean>>(`eiq_dd_${r.id}`, {});
  const defaultRehab = full ? Math.round((full.sqft * 16) / 1000) * 1000 : 0;
  const [repair, setRepair] = useLocal<number>(`eiq_repair_${r.id}`, defaultRehab);
  const [slide, setSlide] = useState(0);

  // Deal calculator: prefilled from public records when the viewer may see them
  const [calc, setCalc] = useState(() => ({
    fmv: full?.fairMarketValue ?? 0,
    m1: full ? (isLp ? full.mortgage : full.finalJudgment ?? full.mortgage) : 0,
    m2: full?.details.secondMortgage ?? 0,
    hoa: full?.details.hoaLien ?? 0,
    liens: 0,
    taxes: full?.details.taxesOwed ?? 0,
    cash: 0,
  }));
  const total = calc.m1 + calc.m2 + calc.hoa + calc.liens + calc.taxes + calc.cash + repair;
  const remaining = calc.fmv - total;
  const isSaved = saved.includes(r.id);
  const signup = `/signup?from=${r.id}`;

  const title = full ? full.address : null;
  const typeTag = `${KIND_LABEL[r.kind]} · ${longDate(r.date)}`;

  function back() {
    if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) router.back();
    else router.push(backHref);
  }

  const score = r.equityScore;
  const band = score != null ? equityBand(score) : null;

  const tiles = useMemo(
    () => [
      { icon: "bed", label: "Beds", value: full ? String(full.beds) : null },
      { icon: "bath", label: "Baths", value: full ? String(full.baths) : null },
      { icon: "ruler", label: "Sq ft", value: full ? full.sqft.toLocaleString() : null },
      { icon: "lot", label: "Lot", value: full ? acres(full.lotSqft) : null },
      { icon: "calendar", label: "Built", value: full ? String(full.yearBuilt) : null },
      { icon: "home", label: "Type", value: full ? full.propertyType : null },
    ],
    [full],
  );

  return (
    <div className="pc">
      {/* Crumbs */}
      <div className="pc-crumbs">
        <button type="button" className="pc-back" onClick={back}>← Back</button>
        <Link href={isLp ? `/lis-pendens/${r.countySlug}` : `/auctions?county=${r.countySlug}`} className="pc-county">{r.countyName} County</Link>
        <span className="muted small">Case {r.caseNumber}</span>
      </div>

      {r.locked && (
        <div className="pc-lockbar">
          <Icon name="lock" size={16} />
          <span>This is a {isLp ? "new lis pendens filing" : "scheduled auction"}. Sign up to see the address, owner, values and documents.</span>
          <Link href={signup} className="btn btn-primary btn-pill">See full file</Link>
        </div>
      )}

      {/* Photos + header card */}
      <div className="pc-top">
        <div className="pc-photos" onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
          <figure className="pc-photo">
            <img src={r.photoUrl} alt={title ? `Front of ${title}` : "Front of the property"} />
            <figcaption className="pc-photo-tag">FRONT</figcaption>
          </figure>
          <figure className="pc-photo">
            <img src={`/api/aerial/${r.id}`} alt="Aerial view of the lot" />
            <figcaption className="pc-photo-tag">LOT</figcaption>
            <span className="pc-photo-note">Aerial imagery</span>
          </figure>
        </div>
        <div className="pc-dots mob-only" aria-hidden="true"><span className={slide === 0 ? "on" : ""} /><span className={slide === 1 ? "on" : ""} /></div>

        <div className="pc-head card">
          <div className="pc-head-row">
            <div style={{ minWidth: 0 }}>
              {full ? <h1>{full.address}</h1> : <h1 className="blur" aria-label={`Case ${r.caseNumber}`}>0000 Xxxxx Xxx Xx</h1>}
              <p className="muted">{full ? `${full.city}, FL ${full.zip} · ${r.countyName} County` : <><Lock w="Xxxx Xxxxx, FL 00000" /> · {r.countyName} County</>}</p>
            </div>
            <button type="button" className={`btn btn-ghost pc-save${isSaved ? " is-on" : ""}`} aria-pressed={isSaved} onClick={() => setSaved(isSaved ? saved.filter((x) => x !== r.id) : [...saved, r.id])}>
              <Icon name="star" size={15} />{isSaved ? "Saved" : "Save to CRM"}
            </button>
          </div>
          <div className="rec-tags">
            <span className={`chip ${isLp ? "chip-lp" : r.kind === "foreclosure" ? "chip-fc" : "chip-td"}`}>{typeTag}</span>
            {full && <span className="chip chip-lock">{isLp ? "Mortgage" : full.status === "scheduled" ? "Scheduled" : isSold ? "Sold" : full.status === "canceled" ? "Canceled" : "Rescheduled"}</span>}
            <span className="chip pc-chip-file">Property file</span>
          </div>
          <div className="pc-tiles">
            {tiles.map((t) => (
              <div key={t.label} className="pc-tile">
                <span className="pc-tile-icon"><Icon name={t.icon} size={16} /></span>
                <div>{t.value ? <b>{t.value}</b> : <Lock w="0,000" />}<span className="rec-label">{t.label}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key numbers */}
      <div className="pc-keys card">
        <div><span className="rec-label">Case #</span><b className="pc-key-big">{r.caseNumber}</b></div>
        <div><span className="rec-label">Final judgment</span>{isLp ? <span className="muted">Not yet entered</span> : full ? <b>{fmtMoney(full.finalJudgment)}</b> : <Lock />}</div>
        <div><span className="rec-label">Fair market value</span>{full ? <b>{fmtMoney(full.fairMarketValue)}</b> : <Lock />}</div>
        <div><span className="rec-label">Plaintiff max bid</span>{isLp ? <span className="muted">Set before sale</span> : full ? <b>{fmtMoney(full.plaintiffMaxBid)}</b> : <Lock />}</div>
        <div>
          <span className="rec-label">My max bid</span>
          {editingBid ? (
            <MoneyInput autoFocus value={maxBid ?? 0} onChange={(v) => setMaxBid(v || null)} onBlur={() => setEditingBid(false)} label="My max bid" />
          ) : maxBid ? (
            <button type="button" className="pc-link" onClick={() => setEditingBid(true)}><b>{fmtMoney(maxBid)}</b> <span className="small">Edit</span></button>
          ) : (
            <button type="button" className="pc-link" onClick={() => setEditingBid(true)}>+ Set my max bid</button>
          )}
        </div>
        <div className="pc-key-eq">
          <span className="rec-label">Equity Score</span>
          {score != null ? <b style={{ color: BAND_COLOR[band!] }}>{score} · {EQUITY_LABEL[band!]}</b> : <Link href={signup} className="pc-link"><Icon name="lock" size={13} /> Unlock with Pro</Link>}
        </div>
      </div>

      {/* Tabs + services */}
      <div className="pc-bar">
        <div className="pc-tabs scroll-x" role="tablist" aria-label="Property file">
          {([["summary", "Summary"], ["forms", "Forms"], ["dd", "Due diligence"], ["contacts", "Contacts"]] as [Tab, string][]).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>
        <div className="pc-services">
          <ServiceButton kind="title-search" id={r.id} className="btn btn-primary pc-svc"><span>Title search</span><span>$99</span></ServiceButton>
          <ServiceButton kind="skip-trace" id={r.id} className="btn btn-ghost pc-svc"><span>Skip trace</span><span>$1.50</span></ServiceButton>
        </div>
      </div>

      <div className="pc-body">
        <div className="pc-main">
          {tab === "summary" && (
            <>
              <section className="card pc-sec">
                <h2 className="pc-eyebrow">Property details</h2>
                <dl className="pc-dl">
                  <Row k="Bed / bath" v={full && `${full.beds} / ${full.baths}`} />
                  <Row k="Strap #" v={full?.parcelId} />
                  <Row k="Under air" v={full && `${full.sqft.toLocaleString()} sq ft`} />
                  <Row k="Year built" v={full && String(full.yearBuilt)} />
                  <Row k="Total building" v={full && `${full.details.totalBuildingSqft.toLocaleString()} sq ft`} />
                  <Row k="Taxes owed" v={full && (full.details.taxesOwed ? fmtMoney(full.details.taxesOwed) : "None")} />
                  <Row k="Garage" v={full?.details.garage} />
                  <Row k="Pool" v={full && yesNo(full.details.pool)} />
                  <Row k="Carport" v={full && yesNo(full.details.carport)} />
                  <Row k="Lot size" v={full && acres(full.lotSqft)} />
                  <Row k="Seawall" v={full && yesNo(full.details.seawall)} />
                  <Row k="Boat dock" v={full && yesNo(full.details.boatDock)} />
                </dl>
              </section>
              <section className="card pc-sec">
                <h2 className={`pc-eyebrow ${isLp ? "tone-lp" : r.kind === "tax_deed" ? "tone-td" : "tone-fc"}`}>
                  {isLp ? "Foreclosure · Lis pendens" : r.kind === "tax_deed" ? "Tax deed · Sale" : "Foreclosure · Auction"}
                </h2>
                <dl className="pc-dl">
                  <Row k="Case #" v={r.caseNumber} />
                  <Row k={isLp ? "Filing type" : "Sale date"} v={isLp ? full?.details.filingType : longDate(r.date)} />
                  {!isLp && <Row k="Status" v={full ? (isSold ? `Sold to ${full.status === "sold_third_party" ? "3rd party" : full.kind === "tax_deed" ? "county" : "plaintiff"}` : full.status === "scheduled" ? "Scheduled" : full.status === "canceled" ? "Canceled" : "Rescheduled") : "Scheduled"} />}
                  {!isLp && isSold && <Row k="Winning bid" v={fmtMoney(full!.soldAmount)} />}
                  <Row k="Fair market value" v={full && fmtMoney(full.fairMarketValue)} />
                  <Row k={isLp ? "Mortgage" : "Final judgment"} v={full && fmtMoney(isLp ? full.mortgage : full.finalJudgment)} />
                  <Row k="Plaintiff" v={full?.plaintiff} />
                  <Row k="Defendant" v={full ? (full.contactsLocked ? null : full.owner) : null} lockText={full?.contactsLocked ? "Owner names unlock with Pro" : undefined} />
                  <Row k={isLp ? "LP recorded" : "Assessed value"} v={isLp ? longDate(r.date) : full && fmtMoney(full.details.assessedValue)} />
                  {isLp && <Row k="Assessed value" v={full && fmtMoney(full.details.assessedValue)} />}
                  <Row k="Last sale date" v={full && longDate(full.lastSaleDate)} />
                  <Row k="Last sale amount" v={full && fmtMoney(full.lastSalePrice)} />
                </dl>
              </section>
            </>
          )}

          {tab === "forms" && (
            <section className="card pc-sec">
              <h2 className="pc-eyebrow">Court documents</h2>
              <ul className="pc-docs">
                {docs.map((d) => (
                  <li key={d.name}>
                    <span className="pc-doc-icon"><Icon name="file" size={16} /></span>
                    <div className="pc-doc-main"><b>{d.name}</b><span className="muted small">{d.source} · {longDate(d.date)}</span></div>
                    {r.locked ? <Link href={signup} className="eq-locked"><Icon name="lock" size={12} />Pro</Link> : <span className="chip chip-gray">Clerk record</span>}
                  </li>
                ))}
              </ul>
              <p className="muted small">Document copies open from the county clerk once live data is connected.</p>
            </section>
          )}

          {tab === "dd" && (
            <section className="card pc-sec">
              <h2 className="pc-eyebrow">Due diligence</h2>
              <p className="muted small" style={{ marginBottom: 12 }}>Your checklist for this property. It saves in this browser.</p>
              <ul className="pc-check">
                {DD_ITEMS.map((item) => (
                  <li key={item}>
                    <label>
                      <input type="checkbox" checked={!!dd[item]} onChange={(e) => setDd({ ...dd, [item]: e.target.checked })} />
                      <span>{item}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <div className="pc-repair">
                <label htmlFor="repair"><b>Repair estimate</b><span className="muted small">Feeds Estimated rehab in the deal calculator.</span></label>
                <MoneyInput id="repair" value={repair} onChange={setRepair} label="Repair estimate" />
              </div>
              <p className="small muted">{Object.values(dd).filter(Boolean).length} of {DD_ITEMS.length} done</p>
            </section>
          )}

          {tab === "contacts" && (
            <section className="card pc-sec">
              <h2 className="pc-eyebrow">Contacts</h2>
              <div className="pc-contacts">
                <div className="pc-contact">
                  <span className="rec-label">Owner (defendant)</span>
                  {full && !full.contactsLocked ? (
                    <><b>{full.owner}</b>{full.details.coOwner && <span>{full.details.coOwner}</span>}<span className="muted">{full.ownerPhone}</span></>
                  ) : (
                    <><Lock w="Xxxxx Xxxxxxx" /><Lock w="(000) 000-0000" /><Link href={signup} className="pc-link small"><Icon name="lock" size={12} /> Unlock owner contact with Pro</Link></>
                  )}
                </div>
                <div className="pc-contact">
                  <span className="rec-label">Plaintiff</span>
                  {full ? <b>{full.plaintiff}</b> : <Lock w="Xxxxxxx Xxxxxx Xxxx" />}
                  <span className="muted small">{r.kind === "tax_deed" ? "Tax collector / certificate holder" : "Lender filing the foreclosure"}</span>
                </div>
              </div>
              <p className="muted small">Need a phone number that isn&apos;t on file? Run a skip trace for $1.50.</p>
            </section>
          )}
        </div>

        {/* Right column */}
        <aside className="pc-side">
          <section className="card pc-calc">
            <h2>Deal calculator</h2>
            <div className="pc-calc-grid">
              <MoneyInput label="Fair market value" value={calc.fmv} onChange={(v) => setCalc({ ...calc, fmv: v })} />
              <MoneyInput label="1st mortgage" value={calc.m1} onChange={(v) => setCalc({ ...calc, m1: v })} />
              <MoneyInput label="2nd mortgage" value={calc.m2} onChange={(v) => setCalc({ ...calc, m2: v })} />
              <MoneyInput label="HOA" value={calc.hoa} onChange={(v) => setCalc({ ...calc, hoa: v })} />
              <MoneyInput label="Other liens" value={calc.liens} onChange={(v) => setCalc({ ...calc, liens: v })} />
              <MoneyInput label="Property taxes" value={calc.taxes} onChange={(v) => setCalc({ ...calc, taxes: v })} />
              <MoneyInput label="Cash to owner" value={calc.cash} onChange={(v) => setCalc({ ...calc, cash: v })} />
              <MoneyInput label="Estimated rehab" value={repair} onChange={setRepair} />
            </div>
            <p className="muted small">Cash to owner is what you pay the owner to sign over the deed. Estimated rehab comes from the Due Diligence repair estimate.</p>
            <div className="pc-result" aria-live="polite">
              <div><span className="rec-label">Total purchase price</span><b>{fmtMoney(total)}</b></div>
              <div><span className="rec-label">Remaining equity</span><b className={remaining >= 0 ? "st-sold" : "st-canceled"}>{remaining < 0 ? "-" : ""}{fmtMoney(Math.abs(remaining))}</b></div>
              <p className="small muted">Remaining equity = fair market value minus the total purchase price.</p>
            </div>
            <p className="muted small">{r.locked ? "Values are blank until you unlock the file. You can type your own numbers." : "Mortgage and lien amounts are original amounts from public records, not payoffs."}</p>
          </section>

          <section className="card pc-eq">
            <div className="pc-eq-head"><h2>Equity Score</h2>{score == null && <span className="pc-pro">PRO</span>}</div>
            {score != null ? (
              <>
                <div className="pc-eq-score"><b style={{ color: BAND_COLOR[band!] }}>{score}</b><span>{EQUITY_LABEL[band!]}</span></div>
                <div className="eq-track"><span style={{ width: `${score}%`, background: BAND_COLOR[band!] }} /></div>
                <p className="small muted">Fair market value against {isLp ? "the mortgage" : "the final judgment"}. 80+ Great · 70–79 Good · 45–69 Fair · under 45 Weak.</p>
              </>
            ) : (
              <>
                <div className="pc-eq-locked"><span className="pc-eq-ghost" /><p className="small">See how much equity this owner has, scored 1–100, so you know which deals are worth a call.</p></div>
                <Link href={signup} className="btn btn-primary pc-wide">Unlock Equity Score &amp; owner contact</Link>
              </>
            )}
          </section>

          <Link href={`/signup?from=${r.id}&alert=auction`} className="btn btn-ghost pc-wide pc-alert">
            <Icon name="bell" size={16} />{isLp ? "Alert me if this goes to auction" : isSold ? "Alert me about similar properties" : "Alert me before this sale"}
          </Link>
        </aside>
      </div>

      {/* Mobile: services pinned above the tab bar */}
      <div className="pc-pinned mob-only">
        <ServiceButton kind="title-search" id={r.id} className="btn btn-primary">Title search · $99</ServiceButton>
        <ServiceButton kind="skip-trace" id={r.id} className="btn btn-ghost">Skip trace · $1.50</ServiceButton>
      </div>
    </div>
  );
}

/** Starts Stripe Checkout for a service (or sends signed-out visitors to sign up). */
function ServiceButton({ kind, id, className, children }: { kind: string; id: string; className: string; children: React.ReactNode }) {
  return (
    <form action={orderService} className="pc-svc-form">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="propertyId" value={id} />
      <button className={className}>{children}</button>
    </form>
  );
}

function Row({ k, v, lockText }: { k: string; v: string | null | undefined | false; lockText?: string }) {
  return (
    <div className="pc-row">
      <dt className="rec-label">{k}</dt>
      <dd>{v ? <b>{v}</b> : lockText ? <span className="muted">{lockText}</span> : <Lock w="Xxxxxxx 000" />}</dd>
    </div>
  );
}

function MoneyInput({ label, value, onChange, id, autoFocus, onBlur }: { label: string; value: number; onChange: (v: number) => void; id?: string; autoFocus?: boolean; onBlur?: () => void }) {
  const inputId = id ?? `m-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="pc-money">
      {!id && <label htmlFor={inputId} className="rec-label">{label}</label>}
      <div className="pc-money-box">
        <span>$</span>
        <input
          id={inputId}
          inputMode="numeric"
          autoFocus={autoFocus}
          onBlur={onBlur}
          aria-label={id ? label : undefined}
          value={value ? value.toLocaleString("en-US") : "0"}
          onChange={(e) => onChange(Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>
    </div>
  );
}
