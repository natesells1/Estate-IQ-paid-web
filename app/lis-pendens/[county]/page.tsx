import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COUNTIES, COUNTY_BY_SLUG } from "@/lib/data/counties";
import { countyFilings, searchCountyFilings } from "@/lib/data/queries";
import { getViewer } from "@/lib/viewer";
import { LisPendensBrowser } from "@/components/LisPendensBrowser";

type Props = {
  params: Promise<{ county: string }>;
  searchParams: Promise<{ date?: string; id?: string; q?: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { county } = await params;
  const c = COUNTY_BY_SLUG[county];
  if (!c) return { title: "County not found" };
  return {
    title: `${c.name} County lis pendens filings by day`,
    description: `New lis pendens (pre-foreclosure) filings in ${c.name} County, Florida, every weekday, on a map with an Equity Score.`,
    alternates: { canonical: `/lis-pendens/${county}` },
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { county } = await params;
  const sp = await searchParams;
  const c = COUNTY_BY_SLUG[county];
  if (!c) notFound();
  const viewer = await getViewer();
  const { records, days } = countyFilings(viewer, county, 30);
  const q = (sp.q ?? "").slice(0, 80).trim();
  const search = q ? { q, ids: searchCountyFilings(viewer, county, q) } : null;
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : null;
  const id = sp.id && records.some((r) => r.id === sp.id) ? sp.id : null;

  return (
    <section className="section lp-section page-wide">
      <div className="wrap">
        <LisPendensBrowser
          county={{ slug: c.slug, name: c.name, lat: c.lat, lng: c.lng }}
          counties={COUNTIES.map((x) => ({ slug: x.slug, name: x.name }))}
          records={records}
          days={days}
          initialDate={date}
          highlightId={id}
          search={search}
          isPro={viewer.isPro}
        />
        <p className="muted small" style={{ marginTop: 16 }}>Sample data. Addresses, lenders and owners are made up.</p>
      </div>
    </section>
  );
}
