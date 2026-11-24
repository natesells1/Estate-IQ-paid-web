import type { Metadata } from "next";
import { searchRecords } from "@/lib/data/queries";
import { getViewer } from "@/lib/viewer";
import { RecordCard } from "@/components/RecordBits";
import { Icon } from "@/components/Icon";
import type { Kind } from "@/lib/types";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

const KINDS: Kind[] = ["lis_pendens", "foreclosure", "tax_deed"];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 100);
  const kind = KINDS.includes(sp.type as Kind) ? (sp.type as Kind) : undefined;
  const viewer = await getViewer();
  const results = searchRecords(viewer, q, kind);

  return (
    <section className="section">
      <div className="wrap">
        <form className="hero-search" action="/search" method="get" role="search" style={{ marginTop: 0 }}>
          {kind && <input type="hidden" name="type" value={kind} />}
          <label className="search-field">
            <span className="sr-only">Search</span>
            <Icon name="search" />
            <input className="input" name="q" defaultValue={q} placeholder="Address, case #, parcel, ZIP or county" />
          </label>
          <button className="btn btn-primary" type="submit">Search</button>
        </form>
        <p className="muted small" style={{ margin: "14px 0 20px" }}>
          {q ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q}”.` : "Type an address, case #, parcel, ZIP or county."}
          {!viewer.isPro && q && " Free accounts can find new filings and upcoming auctions by case # only."}
        </p>
        <div className="card-grid">
          {results.map((r) => <RecordCard key={r.id} r={r} />)}
        </div>
      </div>
    </section>
  );
}
