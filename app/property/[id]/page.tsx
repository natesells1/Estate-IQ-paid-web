import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findById, toView } from "@/lib/data/queries";
import { getViewer } from "@/lib/viewer";
import { RecordCard } from "@/components/RecordBits";

type Params = { params: Promise<{ id: string }> };

// Full property card is the next build step. This page already gives every
// public address a crawlable URL with the right title.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const p = findById(id);
  if (!p) return { title: "Property not found" };
  const v = toView(p, { isPro: false });
  if (v.locked) return { title: `Case ${v.caseNumber}, ${v.countyName} County`, robots: { index: false } };
  return {
    title: { absolute: `${v.address}, ${v.city}, FL ${v.zip} - Estate IQ` },
    description: `${v.address}, ${v.city}, FL ${v.zip}: auction result, final judgment, fair market value and Equity Score.`,
    alternates: { canonical: `/property/${id}` },
  };
}

export default async function PropertyPage({ params }: Params) {
  const { id } = await params;
  const p = findById(id);
  if (!p) notFound();
  const viewer = await getViewer();
  const v = toView(p, viewer);
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 640 }}>
        <Link href="/" className="btn btn-ghost btn-pill" style={{ marginBottom: 16 }}>← Back</Link>
        <h1 style={{ fontSize: 28, marginBottom: 16 }}>
          {v.locked ? `Case ${v.caseNumber}` : `${v.address}, ${v.city}, FL ${v.zip}`}
        </h1>
        <RecordCard r={v} href={v.locked ? undefined : `/auctions?county=${v.countySlug}&date=${v.date}&id=${v.id}`} />
        <p className="muted small" style={{ marginTop: 16 }}>The full property card (photos, deal calculator, forms and contacts) is the next page we build.</p>
      </div>
    </section>
  );
}
