import Link from "next/link";
import type { FullRecord } from "@/lib/types";
import { fmtMoney } from "@/lib/dates";
import { EquityCell, STATUS_COLOR, STATUS_LABEL, usDate } from "./RecordBits";

function calHref(r: FullRecord) {
  return `/auctions?county=${r.countySlug}&date=${r.date}&id=${r.id}`;
}

export function AuctionResultsTable({ rows }: { rows: FullRecord[] }) {
  return (
    <>
      <div className="card table-card desk-only">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Photo</th>
              <th>Address</th>
              <th>County</th>
              <th>Status</th>
              <th>Sold to</th>
              <th className="num">Amount</th>
              <th className="num">Final judgment</th>
              <th className="num">Fair market value</th>
              <th>Equity Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="nowrap">{usDate(r.date)}</td>
                <td><img className="thumb" src={r.photoUrl} alt="" width={56} height={40} loading="lazy" /></td>
                <td className="addr-cell">
                  <Link href={calHref(r)}><b>{r.address.toUpperCase()}</b> <span className="muted">{r.city.toUpperCase()}, FL {r.zip}</span></Link>
                  <span className="muted small">Case {r.caseNumber}</span>
                </td>
                <td>{r.countyName}</td>
                <td><b style={{ color: STATUS_COLOR[r.status!] }}>{STATUS_LABEL[r.status!]}</b></td>
                <td className="nowrap">{r.soldTo ?? ""}</td>
                <td className="num"><b>{r.soldAmount ? fmtMoney(r.soldAmount) : ""}</b></td>
                <td className="num">{fmtMoney(r.finalJudgment)}</td>
                <td className="num">{fmtMoney(r.fairMarketValue)}</td>
                <td><EquityCell score={r.equityScore} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mob-only result-cards">
        {rows.map((r) => (
          <Link key={r.id} href={calHref(r)} className="card result-card">
            <div className="result-top">
              <img className="thumb" src={r.photoUrl} alt="" width={56} height={44} loading="lazy" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <b className="ellipsis">{r.address.toUpperCase()}</b>
                <div className="muted small">{r.city}, FL {r.zip} · {r.countyName}</div>
              </div>
              <b style={{ color: STATUS_COLOR[r.status!] }}>{STATUS_LABEL[r.status!]}</b>
            </div>
            <div className="result-grid">
              <div><span className="rec-label">Sold to</span><b>{r.soldTo ?? "—"}</b></div>
              <div><span className="rec-label">Amount</span><b>{r.soldAmount ? fmtMoney(r.soldAmount) : "—"}</b></div>
              <div><span className="rec-label">Judgment</span><b>{fmtMoney(r.finalJudgment)}</b></div>
              <div><span className="rec-label">Market value</span><b>{fmtMoney(r.fairMarketValue)}</b></div>
              <div><span className="rec-label">Equity Score</span><EquityCell score={r.equityScore} /></div>
              <div><span className="rec-label">Date</span><b>{usDate(r.date)}</b></div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
