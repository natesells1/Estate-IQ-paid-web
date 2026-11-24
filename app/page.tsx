import Link from "next/link";
import { HeroSearch } from "@/components/Hero";
import { FloridaMap } from "@/components/FloridaMap";
import { LisPendensSection } from "@/components/LisPendensSection";
import { CountyMap } from "@/components/CountyMap";
import { AuctionResultsTable } from "@/components/AuctionResultsTable";
import { AlertsSignup } from "@/components/AlertsSignup";
import { HomePricing } from "@/components/HomePricing";
import { HeroSampleCard } from "@/components/Tiles";
import { Icon } from "@/components/Icon";
import { FaqSection, FinalCta, HowItWorks, StatsBand } from "@/components/Marketing";
import { auctionMonth, countyStats, countyMapRecords, filingCounts, newFilingsByCounty, soldResults, topFiling } from "@/lib/data/queries";
import { floridaToday } from "@/lib/dates";
import { COUNTIES, COUNTY_BY_SLUG } from "@/lib/data/counties";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// County pills in the Lis Pendens section, in this order
const LP_COUNTIES = ["lee", "manatee", "polk", "charlotte", "hillsborough", "orange", "duval", "broward", "miami-dade"];

const FEATURES = [
  { icon: "gavel", tone: "fc", title: "Foreclosure auctions", text: "Upcoming sale dates, judgments and opening bids." },
  { icon: "file", tone: "td", title: "Tax deed sales", text: "Certificate numbers, parcel IDs and minimum bids." },
  { icon: "clock", tone: "lp", title: "Lis pendens filings", text: "Pre-foreclosure leads the day they're filed." },
  { icon: "chart", tone: "green", title: "Sold results", text: "Who won, for how much, and the equity left." },
];

export default async function HomePage() {
  const viewer = await getViewer();
  const stats = countyStats();
  const counts = filingCounts(7);
  const lpCounties = LP_COUNTIES.map((s) => ({ slug: s, name: COUNTY_BY_SLUG[s].name, count: counts[s] ?? 0 }));
  const filings = newFilingsByCounty(viewer, 4);
  const lee = COUNTY_BY_SLUG.lee;
  const leeRecords = countyMapRecords(viewer, "lee");
  const results = soldResults(viewer, "lee", 8);
  const sample = topFiling(viewer, "lee");
  const alertCounties = COUNTIES.filter((c) => c.hot).map((c) => ({ slug: c.slug, name: c.name }));
  const filingsThisWeek = Object.values(counts).reduce((a, b) => a + b, 0);
  const auctionsThisMonth = auctionMonth(floridaToday().slice(0, 7), null, "all").totals.all;

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="hero-badge"><span className="dot" style={{ background: "var(--green)" }} />Foreclosures · Tax deeds · Lis pendens</span>
            <h1>Your #1 data source to track all distressed properties.</h1>
            <p className="hero-sub">
              Estate IQ pulls county foreclosure auctions, tax deed sales and lis pendens filings onto one map, with owner, value, equity
              and case details on every property.
            </p>
            <HeroSearch />
            <div className="hero-trust">
              <span><Icon name="check" size={15} stroke={2.4} />Auction history free</span>
              <span><Icon name="check" size={15} stroke={2.4} />{COUNTIES.length} Florida counties</span>
              <span><Icon name="check" size={15} stroke={2.4} />Updated every weekday</span>
              <a href="#how-it-works" className="text-link">See how it works ↓</a>
            </div>
          </div>

          <div className="hero-map">
            <div className="mob-only fl-mob-head">
              <h2>Florida · hot counties</h2>
              <span className="muted small">Last 30 days</span>
            </div>
            <div className="fl-card">
              <FloridaMap stats={stats} />
              <div className="fl-legend-box desk-only">
                <b>Florida · hot counties</b>
                <span><span className="dot dot-lp" />Lis pendens filings</span>
                <span><span className="dot dot-fc" />Auction results</span>
                <span><span className="dot dot-td" />Tax deeds</span>
              </div>
            </div>
            {sample && <div className="desk-only"><HeroSampleCard r={sample} /></div>}
            <div className="mob-only fl-legend">
              <span><span className="dot dot-lp" /> Lis pendens</span>
              <span><span className="dot dot-fc" /> Auction results</span>
              <span><span className="dot dot-td" /> Tax deeds</span>
            </div>
            <ul className="card fl-list mob-only">
              {stats.map((s) => (
                <li key={s.slug}>
                  <Link href={`/lis-pendens/${s.slug}`}>
                    <b>{s.name}</b>
                    <span className="fl-list-counts">
                      <span className="count-pill count-lp">{s.lisPendens}</span>
                      <span className="count-pill count-fc">{s.auctionResults}</span>
                      <span className="count-pill count-td">{s.taxDeeds}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* What we track */}
      <section className="features band-white">
        <div className="wrap features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature">
              <span className={`feature-icon tone-soft-${f.tone}`}><Icon name={f.icon} size={18} /></span>
              <div>
                <b>{f.title}</b>
                <p className="muted small">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <StatsBand counties={COUNTIES.length} filingsThisWeek={filingsThisWeek} auctionsThisMonth={auctionsThisMonth} />

      <HowItWorks />

      <LisPendensSection counties={lpCounties} filings={filings} initial="lee" />

      <section className="section band-white" id="property-map">
        <div className="wrap">
          <CountyMap records={leeRecords} countyName={lee.name} center={[lee.lat, lee.lng]} />
        </div>
      </section>

      <section className="section band-white">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="eyebrow">Sale results</div>
              <h2>Recent auction results</h2>
              <p>Click an address to see it on the auction calendar.</p>
            </div>
            <Link href="/auctions?county=lee" className="text-link">All {lee.name} County results →</Link>
          </div>
          <AuctionResultsTable rows={results} />
        </div>
      </section>

      <HomePricing />

      <section className="section" id="about">
        <div className="wrap about">
          <div>
            <div className="eyebrow">About Estate IQ</div>
            <h2>Built by Florida investors, for Florida investors.</h2>
            <p className="about-body">
              Estate IQ pulls new lis pendens filings, foreclosure auctions and tax deed sales from county clerks and property appraisers
              every day, checks each file is complete, and puts it on one map with an Equity Score. Auction history stays free for everyone.
            </p>
          </div>
          <div className="about-cards">
            <div className="card about-card">
              <span className="feature-icon tone-soft-green"><Icon name="check" size={18} /></span>
              <b>Complete files only</b>
              <p className="muted small">A property shows up once its file is complete, so you aren&apos;t chasing bad addresses or missing case numbers.</p>
            </div>
            <div className="card about-card">
              <span className="feature-icon tone-soft-fc"><Icon name="calendar" size={18} /></span>
              <b>Updated every day</b>
              <p className="muted small">New filings load each weekday, and auction results load for every day a sale runs.</p>
            </div>
          </div>
        </div>
      </section>

      <FaqSection />

      <AlertsSignup counties={alertCounties} />

      <FinalCta />
    </>
  );
}
