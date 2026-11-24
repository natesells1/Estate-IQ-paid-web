// Vertical cards used on the Home page. No hooks: safe in server and client components.
import Link from "next/link";
import type { ViewRecord } from "@/lib/types";
import { fmtDate, fmtMoney } from "@/lib/dates";
import { EquityBadge, KIND_LABEL } from "./RecordBits";
import { Icon } from "./Icon";

const KIND_TONE = { lis_pendens: "tone-lp", foreclosure: "tone-fc", tax_deed: "tone-td" } as const;

export function filedLabel(r: ViewRecord) {
  return r.kind === "lis_pendens" ? `Filed ${fmtDate(r.date)}` : `Sale ${fmtDate(r.date)}`;
}

/** A filing tile: photo on top, case # and Equity Score, blurred details, sign-up footer. */
export function LpTile({ r, href }: { r: ViewRecord; href?: string }) {
  const link = href ?? (r.locked ? `/signup?from=${r.id}` : `/property/${r.id}`);
  return (
    <Link href={link} className="tile" aria-label={r.locked ? `Case ${r.caseNumber}. Sign up to see the full file.` : `${r.address}, ${r.city}`}>
      <div className="tile-photo">
        <img src={r.photoUrl} alt="" loading="lazy" />
        <span className={`tile-type ${KIND_TONE[r.kind]}`}>{KIND_LABEL[r.kind].toUpperCase()}</span>
        <span className="tile-date">{filedLabel(r)}</span>
      </div>
      <div className="tile-body">
        <div className="rec-label">Case #</div>
        <div className="tile-case">{r.caseNumber}</div>
        <div><EquityBadge score={r.equityScore} /></div>
        {r.locked ? (
          <div className="tile-hidden" aria-hidden="true">
            <div className="blur tile-l1">0000 Xxxxxxx Xxxx Xx</div>
            <div className="blur">Xxxx Xxxxx, FL 00000</div>
            <div className="blur">Xxxxx Xxxxxx Xxxxxxxxx · $000,000 XXX</div>
          </div>
        ) : (
          <div className="tile-hidden">
            <div className="tile-l1">{r.address}</div>
            <div className="muted">{r.city}, FL {r.zip}</div>
            <div className="muted">{r.owner} · {fmtMoney(r.mortgage)} mortgage</div>
          </div>
        )}
      </div>
      <div className="tile-foot">
        {r.locked ? (
          <>
            <span className="tile-msg"><Icon name="lock" size={13} />Sign up to see the address and owner</span>
            <span className="btn btn-primary tile-btn">See full file</span>
          </>
        ) : (
          <span className="btn btn-primary tile-btn">Open property card</span>
        )}
      </div>
    </Link>
  );
}

/** The floating sample card that overlaps the hero map. */
export function HeroSampleCard({ r }: { r: ViewRecord }) {
  const score = r.equityScore;
  return (
    <Link href={r.locked ? `/signup?from=${r.id}` : `/property/${r.id}`} className="hero-sample">
      <div className="hero-sample-photo"><img src={r.photoUrl} alt="" /><span className="hero-sample-tag">Sample</span></div>
      <div className="hero-sample-body">
        <span className="hero-sample-kind">{KIND_LABEL[r.kind].toUpperCase()} · {filedLabel(r).toUpperCase()}</span>
        <b className="hero-sample-case">Case {r.caseNumber}</b>
        {r.locked ? <div className="blur small">0000 Xxxxx Xxx Xx, Xxxx Xxxxx</div> : <div className="small muted">{r.address}, {r.city}</div>}
      </div>
      <div className="hero-sample-eq">
        <div className="hero-sample-eqrow">
          <span className="small">Equity Score</span>
          <EquityBadge score={score} />
        </div>
        <div className="eq-track"><span style={{ width: `${score ?? 0}%` }} /></div>
      </div>
    </Link>
  );
}
