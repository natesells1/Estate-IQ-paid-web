import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 620 }}>
        <div className="card" style={{ padding: 32 }}>
          <div className="eyebrow">Page not found</div>
          <h1 style={{ fontSize: 30, margin: "8px 0 10px" }}>We couldn&apos;t find that page.</h1>
          <p className="muted">The property may no longer be listed, or the link may be mistyped.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <Link href="/" className="btn btn-primary">Go home</Link>
            <Link href="/auctions" className="btn btn-ghost">Auction calendar</Link>
            <Link href="/lis-pendens/lee" className="btn btn-ghost">Lis pendens</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
