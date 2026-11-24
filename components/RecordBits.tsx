// Presentational pieces shared by server and client components. No hooks.
import Link from "next/link";
import type { Kind, ViewRecord, FullRecord, AuctionStatus } from "@/lib/types";
import { equityBand, EQUITY_LABEL } from "@/lib/equity";
import { fmtMoney } from "@/lib/dates";
import { Icon } from "./Icon";

export const KIND_SHORT: Record<Kind, string> = { lis_pendens: "LP", foreclosure: "FC", tax_deed: "TD" };
export const KIND_LABEL: Record<Kind, string> = { lis_pendens: "Lis pendens", foreclosure: "Foreclosure", tax_deed: "Tax deed" };
export const KIND_CHIP: Record<Kind, string> = { lis_pendens: "chip-lp", foreclosure: "chip-fc", tax_deed: "chip-td" };

export const STATUS_LABEL: Record<AuctionStatus, string> = {
  scheduled: "Scheduled",
  sold_third_party: "Sold",
  back_to_plaintiff: "Sold",
  canceled: "Canceled",
  rescheduled: "Rescheduled",
};
export const STATUS_COLOR: Record<AuctionStatus, string> = {
  scheduled: "var(--scheduled)",
  sold_third_party: "var(--sold)",
  back_to_plaintiff: "var(--sold)",
  canceled: "var(--canceled)",
  rescheduled: "var(--rescheduled)",
};

export function usDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}/${y}`;
}

const BAND_COLOR = { great: "var(--eq-great)", good: "var(--eq-good)", fair: "var(--eq-fair)", weak: "var(--eq-weak)" };
/** Text colour that stays readable on each band colour (dark on the lighter Good/Fair). */
export const BAND_INK = { great: "#fff", good: "var(--ink)", fair: "var(--ink)", weak: "#fff" };

/** Badge for cards. null = locked (free user, score under 70). */
export function EquityBadge({ score }: { score: number | null; locked?: boolean }) {
  if (score == null) {
    return (
      <span className="chip chip-lock"><Icon name="lock" size={11} stroke={2.2} />Equity Score · Pro</span>
    );
  }
  const band = equityBand(score);
  const text = score >= 70 ? `High equity · ${score}` : `Equity Score · ${score} ${EQUITY_LABEL[band]}`;
  return <span className="chip chip-eq" style={{ background: BAND_COLOR[band], color: BAND_INK[band] }}>{text}</span>;
}

/** Compact square score for tables. */
export function EquityCell({ score }: { score: number | null }) {
  if (score == null) {
    return (
      <span className="eq-locked"><Icon name="lock" size={12} stroke={2.2} />Pro</span>
    );
  }
  return <span className="eq-num" style={{ background: BAND_COLOR[equityBand(score)], color: BAND_INK[equityBand(score)] }} title={`Equity Score ${score} (${EQUITY_LABEL[equityBand(score)]})`}>{score}</span>;
}

export function KindChip({ kind, date }: { kind: Kind; date: string }) {
  return <span className={`chip ${KIND_CHIP[kind]}`}>{KIND_SHORT[kind]} {usDate(date)}</span>;
}

/**
 * The teaser / full card used for new filings and upcoming auctions.
 * Locked records render fixed placeholder text under a blur; the real values never reach the browser.
 */
export function RecordCard({ r, href, highlight }: { r: ViewRecord; href?: string; highlight?: boolean }) {
  if (r.locked) {
    return (
      <Link href={href ?? `/signup?from=${r.id}`} className={`rec-card${highlight ? " is-hl" : ""}`}>
        <div className="rec-top">
          <img className="rec-photo" src={r.photoUrl} alt="" width={88} height={80} loading="lazy" />
          <div className="rec-id">
            <div className="rec-label">Case #</div>
            <div className="rec-case">{r.caseNumber}</div>
            <div className="rec-tags">
              <KindChip kind={r.kind} date={r.date} />
              <EquityBadge score={r.equityScore} locked />
            </div>
          </div>
        </div>
        <div className="rec-hidden" aria-hidden="true">
          <div className="blur rec-line-lg">0000 Xxxxxxx Xxxx Xx · Xxxx Xxxxx, FL 00000</div>
          <div className="rec-grid3 blur"><span>$000,000</span><span>$000,000</span><span>$000,000</span></div>
          <div className="blur rec-line">Xxxxxxxxx Xxxxxxxx MORTGAGE · XXXXXX, XXXX</div>
        </div>
        <div className="rec-foot">
          <span className="muted small rec-foot-msg"><Icon name="lock" size={13} />Sign up to see the address, owner and numbers</span>
          <span className="btn btn-primary btn-pill">See full file</span>
        </div>
      </Link>
    );
  }
  return <FullRecordCard r={r} href={href} highlight={highlight} />;
}

function FullRecordCard({ r, href, highlight }: { r: FullRecord; href?: string; highlight?: boolean }) {
  const owed = r.kind === "lis_pendens" ? r.mortgage : r.finalJudgment;
  return (
    <Link href={href ?? `/property/${r.id}`} className={`rec-card${highlight ? " is-hl" : ""}`}>
      <div className="rec-top">
        <img className="rec-photo" src={r.photoUrl} alt={`${r.address}, ${r.city}`} width={88} height={80} loading="lazy" />
        <div className="rec-id">
          <div className="rec-addr">{r.address}</div>
          <div className="muted small">{r.city}, FL {r.zip} · {r.countyName} County</div>
          <div className="rec-tags">
            <KindChip kind={r.kind} date={r.date} />
            <EquityBadge score={r.equityScore} />
          </div>
        </div>
      </div>
      <div className="rec-grid3 rec-stats">
        <div><div className="rec-label">Fair market value</div><b>{fmtMoney(r.fairMarketValue)}</b></div>
        <div><div className="rec-label">{r.kind === "lis_pendens" ? "Mortgage" : "Final judgment"}</div><b>{fmtMoney(owed)}</b></div>
        <div><div className="rec-label">Case #</div><b>{r.caseNumber}</b></div>
      </div>
      <div className="rec-foot">
        <span className="muted small">{r.owner ? `${r.owner} · ` : ""}{r.plaintiff}</span>
        <span className="btn btn-primary btn-pill">Property card</span>
      </div>
    </Link>
  );
}
