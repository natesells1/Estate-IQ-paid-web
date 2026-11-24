import type { Kind, AuctionStatus } from "./types";

export interface CourtDoc {
  name: string;
  date: string;
  /** Who files it */
  source: string;
}

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Court documents for a case. SAMPLE: built from the case type and dates.
 * Replace with the clerk's document index when live data is connected.
 */
export function courtDocuments(kind: Kind, date: string, status?: AuctionStatus): CourtDoc[] {
  if (kind === "lis_pendens") {
    return [
      { name: "Notice of lis pendens", date, source: "Clerk of Court" },
      { name: "Complaint to foreclose mortgage", date, source: "Plaintiff" },
      { name: "Summons issued", date: addDays(date, 2), source: "Clerk of Court" },
    ];
  }
  if (kind === "tax_deed") {
    const docs: CourtDoc[] = [
      { name: "Tax deed application", date: addDays(date, -90), source: "Certificate holder" },
      { name: "Notice of tax deed sale", date: addDays(date, -30), source: "Clerk of Court" },
    ];
    if (status === "sold_third_party" || status === "back_to_plaintiff") docs.push({ name: "Tax deed issued", date: addDays(date, 2), source: "Clerk of Court" });
    return docs;
  }
  const docs: CourtDoc[] = [
    { name: "Notice of lis pendens", date: addDays(date, -240), source: "Clerk of Court" },
    { name: "Final judgment of foreclosure", date: addDays(date, -35), source: "Court" },
    { name: "Notice of sale", date: addDays(date, -28), source: "Clerk of Court" },
  ];
  if (status === "sold_third_party" || status === "back_to_plaintiff") docs.push({ name: "Certificate of sale", date, source: "Clerk of Court" });
  if (status === "canceled") docs.push({ name: "Order canceling sale", date: addDays(date, -1), source: "Court" });
  if (status === "rescheduled") docs.push({ name: "Order rescheduling sale", date: addDays(date, -2), source: "Court" });
  return docs;
}
