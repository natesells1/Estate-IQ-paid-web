import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findById, toView } from "@/lib/data/queries";
import { getViewer } from "@/lib/viewer";
import { courtDocuments } from "@/lib/documents";
import { PropertyView } from "@/components/PropertyView";

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const p = findById(id);
  if (!p) return { title: "Property not found" };
  // Metadata uses the free view so locked addresses never reach page titles
  const v = toView(p, { isPro: false });
  if (v.locked) return { title: `Case ${v.caseNumber}, ${v.countyName} County`, robots: { index: false } };
  return {
    title: { absolute: `${v.address}, ${v.city}, FL ${v.zip} - Estate IQ` },
    description: `${v.address}, ${v.city}, FL ${v.zip} (${v.countyName} County): auction result, final judgment, fair market value and property details.`,
    alternates: { canonical: `/property/${id}` },
  };
}

export default async function PropertyPage({ params }: Params) {
  const { id } = await params;
  const p = findById(id);
  if (!p) notFound();
  const viewer = await getViewer();
  const v = toView(p, viewer);
  const backHref = p.kind === "lis_pendens" ? `/lis-pendens/${p.countySlug}?date=${p.date}&id=${p.id}` : `/auctions?county=${p.countySlug}&date=${p.date}&id=${p.id}`;
  return (
    <section className="section lp-section page-wide">
      <div className="wrap">
        <PropertyView r={v} isPro={viewer.isPro} docs={courtDocuments(p.kind, p.date, p.status)} backHref={backHref} />
      </div>
    </section>
  );
}
