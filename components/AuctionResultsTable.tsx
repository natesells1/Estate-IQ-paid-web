import Link from "next/link";
import type { FullRecord } from "@/lib/types";
import { fmtDate, fmtMoney } from "@/lib/dates";
import { KIND_LABEL } from "./RecordBits";

const TONE = { lis_pendens: "lp", foreclosure: "fc", tax_deed: "td" } as const;

function calHref(r: FullRecord) {
  return `/auctions?county=${r.countySlug}&date=${r.date}&id=${r.id}`;
}
function winner(r: FullRecord) {
  return r.status === "sold_third_party" ? "Third party" : r.kind === "tax_deed" ? "County" : "Plaintiff";
}

/** Finished auctions. Public records, free in full. */
export function AuctionResultsTable({ rows }: { rows: FullRecord[] }) {
  return (
    <div className="results card">
      <table className="results-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Address</th>
            <th>Type</th>
            <th>Winner</th>
            <th className="num">Winning bid</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="nowrap">{fmtDate(r.date)}</td>
              <td>
                <Link href={calHref(r)} className="res-addr">{r.address}</Link>
                <div className="muted small">{r.city}, FL {r.zip}</div>
              </td>
              <td className="nowrap"><span className={`dot dot-${TONE[r.kind]}`} /> {KIND_LABEL[r.kind]}</td>
              <td className="nowrap">{winner(r)}</td>
              <td className="num"><b>{fmtMoney(r.soldAmount)}</b></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
