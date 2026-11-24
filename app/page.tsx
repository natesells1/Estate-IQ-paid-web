import Link from "next/link";
import { Hero } from "@/components/Hero";
import { FloridaMap } from "@/components/FloridaMap";
import { LisPendensSection } from "@/components/LisPendensSection";
import { CountyMap } from "@/components/CountyMap";
import { AuctionResultsTable } from "@/components/AuctionResultsTable";
import { AlertsSignup } from "@/components/AlertsSignup";
import { Plans } from "@/components/Plans";
import { Icon } from "@/components/Icon";
import { countyStats, countyMapRecords, newFilingsByCounty, recentAuctionResults } from "@/lib/data/queries";
import { COUNTIES, COUNTY_BY_SLUG } from "@/lib/data/counties";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const viewer = await getViewer();
  const stats = countyStats();
  const hot = COUNTIES.filter((c) => c.hot).map((c) => ({ slug: c.slug, name: c.name }));
  const filings = newFilingsByCounty(viewer, 4);
  const lee = COUNTY_BY_SLUG.lee;
  const leeRecords = countyMapRecords(viewer, "lee");
  const results = recentAuctionResults(viewer, 12);

  return (
    <>
      <Hero />

      {/* Florida hot counties */}
      <section className="section fl-section">
        <div className="wrap">
          <div className="section-head">
            <h2 className="h-sm">Florida · hot counties</h2>
            <span className="muted small">Last 30 days</span>
          </div>
          <div className="fl-layout">
            <div className="card fl-card">
              <FloridaMap stats={stats} />
              <div className="fl-legend">
                <span><span className="dot dot-lp" /> Lis pendens</span>
                <span><span className="dot dot-fc" /> Auction results</span>
                <span><span className="dot dot-td" /> Tax deeds</span>
              </div>
            </div>
            <ul className="card fl-list">
              <li className="fl-list-head"><span>County</span><span className="fl-list-counts"><span>LP</span><span>Results</span><span>TD</span></span></li>
              {stats.map((s) => (
                <li key={s.slug}>
                  <Link href={`/lis-pendens?county=${s.slug}`}>
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
          <div className="type-cards">
            <Link href="/auctions?type=foreclosure" className="card type-card"><span className="dot dot-fc" /><b>Foreclosure auctions</b><span className="muted small">Judgment, bid and sale date.</span></Link>
            <Link href="/auctions?type=tax_deed" className="card type-card"><span className="dot dot-td" /><b>Tax deed sales</b><span className="muted small">Certificates and opening bids.</span></Link>
            <Link href="/lis-pendens" className="card type-card"><span className="dot dot-lp" /><b>Lis pendens</b><span className="muted small">New filings every weekday.</span></Link>
          </div>
        </div>
      </section>

      <LisPendensSection counties={hot} filings={filings} initial="lee" />

      {/* Lee County property map */}
      <section className="section" id="property-map">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="eyebrow">Property map</div>
              <h2>{lee.name} County on the map</h2>
              <p>This week&apos;s filings and the next two weeks of auctions. Tap a pin to see the property.</p>
            </div>
          </div>
          <CountyMap records={leeRecords} countyName={lee.name} center={[lee.lat, lee.lng]} />
        </div>
      </section>

      {/* Recent auction results */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="eyebrow">Always free</div>
              <h2>Recent auction results</h2>
              <p>Every finished sale, every county. Click an address to open that day on the auction calendar.</p>
            </div>
            <Link href="/auctions" className="btn btn-ghost desk-only">Auction calendar <Icon name="arrow" size={16} /></Link>
          </div>
          <AuctionResultsTable rows={results} />
        </div>
      </section>

      {/* Equity Score + plans */}
      <section className="section" id="plans">
        <div className="wrap">
          <div className="equity-explainer card">
            <div>
              <div className="eyebrow">Equity Score</div>
              <h2>Know which deals are worth a call.</h2>
              <p className="muted">
                Every property gets a score from 1 to 100 based on fair market value minus what&apos;s owed (the mortgage on a lis pendens,
                the final judgment at auction). Higher means more equity left for you and the owner.
              </p>
            </div>
            <div className="eq-scale">
              <div className="eq-bar"><span style={{ background: "var(--eq-weak)", flex: 45 }} /><span style={{ background: "var(--eq-fair)", flex: 25 }} /><span style={{ background: "var(--eq-good)", flex: 10 }} /><span style={{ background: "var(--eq-great)", flex: 20 }} /></div>
              <div className="eq-bands">
                <span><b style={{ color: "var(--eq-weak)" }}>Weak</b> under 45</span>
                <span><b style={{ color: "var(--eq-fair)" }}>Fair</b> 45-69</span>
                <span><b style={{ color: "var(--eq-good)" }}>Good</b> 70-79</span>
                <span><b style={{ color: "var(--eq-great)" }}>Great</b> 80+</span>
              </div>
              <p className="small muted">Free accounts see the Equity Score when it&apos;s 70 or higher. Pro shows it on every property.</p>
            </div>
          </div>
          <h2 className="plans-title">Plans</h2>
          <Plans />
        </div>
      </section>

      {/* About */}
      <section className="section" id="about">
        <div className="wrap about">
          <div>
            <div className="eyebrow">About us</div>
            <h2>Built by Florida investors, for Florida investors.</h2>
          </div>
          <div className="about-body">
            <p>
              Estate IQ pulls new lis pendens filings, foreclosure auctions and tax deed sales from county clerks and property appraisers
              every day, checks each file is complete, and puts it on one map with an Equity Score.
            </p>
            <p>
              We only show a property once its file is complete, so you aren&apos;t chasing bad addresses or missing case numbers.
              Auction history stays free for everyone.
            </p>
            <div className="about-stats">
              <div><b>{hot.length}</b><span className="muted small">hot counties</span></div>
              <div><b>Daily</b><span className="muted small">new filings</span></div>
              <div><b>1-100</b><span className="muted small">Equity Score</span></div>
            </div>
          </div>
        </div>
      </section>

      <AlertsSignup counties={hot} />
    </>
  );
}
