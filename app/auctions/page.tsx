import type { Metadata } from "next";
import { COUNTIES, COUNTY_BY_SLUG } from "@/lib/data/counties";
import { auctionDay, auctionMonth, latestResultDay, searchAuctions, type AuctionType } from "@/lib/data/queries";
import { floridaToday, fmtDate } from "@/lib/dates";
import { getViewer } from "@/lib/viewer";
import { AuctionCalendar } from "@/components/AuctionCalendar";

type SP = { county?: string; type?: string; date?: string; month?: string; id?: string; q?: string };

export const dynamic = "force-dynamic";

function parse(sp: SP) {
  const county = sp.county && COUNTY_BY_SLUG[sp.county] ? sp.county : null;
  const type: AuctionType = sp.type === "foreclosure" || sp.type === "tax_deed" ? sp.type : "all";
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : null;
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : null;
  const q = (sp.q ?? "").slice(0, 80).trim();
  return { county, type, date, month, q };
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const { county, date } = parse(await searchParams);
  const where = county ? `${COUNTY_BY_SLUG[county].name} County` : "Florida";
  const when = date ? ` on ${fmtDate(date, { month: "long", day: "numeric", year: "numeric" })}` : "";
  return {
    title: `${where} foreclosure and tax deed auctions${when}`,
    description: `Foreclosure auction and tax deed sale results and upcoming sales in ${where}: winning bids, final judgments, fair market value and Equity Score.`,
    alternates: { canonical: county ? `/auctions?county=${county}` : "/auctions" },
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { county, type, q } = parse(sp);
  let { date, month } = parse(sp);
  const viewer = await getViewer();
  const today = floridaToday();

  // Pick the day: explicit date, else the first auction day of a chosen month, else the latest results day
  if (!date && !q) {
    if (month && month !== today.slice(0, 7)) {
      const { days } = auctionMonth(month, county, type);
      date = Object.keys(days).sort()[0] ?? `${month}-01`;
    } else {
      date = latestResultDay(county, type);
    }
  }
  month = date ? date.slice(0, 7) : month ?? today.slice(0, 7);

  const { days, totals } = auctionMonth(month, county, type);
  const records = q ? searchAuctions(viewer, q, county, type) : auctionDay(viewer, date!, county, type);
  const highlightId = sp.id && records.some((r) => r.id === sp.id) ? sp.id : null;

  return (
    <section className="section lp-section page-wide">
      <div className="wrap">
        <AuctionCalendar
          month={month}
          date={q ? null : date}
          today={today}
          county={county}
          type={type}
          q={q}
          counties={COUNTIES.map((c) => ({ slug: c.slug, name: c.name }))}
          monthDays={days}
          totals={totals}
          records={records}
          highlightId={highlightId}
          isPro={viewer.isPro}
        />
      </div>
    </section>
  );
}
