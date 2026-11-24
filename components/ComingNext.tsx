import Link from "next/link";

export function ComingNext({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <section className="section">
      <div className="wrap">
        <div className="card" style={{ padding: 32, maxWidth: 720 }}>
          <div className="eyebrow">Coming next</div>
          <h1 style={{ fontSize: 32, margin: "6px 0 10px" }}>{title}</h1>
          <div className="muted" style={{ display: "grid", gap: 8 }}>{children}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <Link href="/" className="btn btn-ghost">Back home</Link>
            <Link href="/signup" className="btn btn-primary">Start free trial</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
