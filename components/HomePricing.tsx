import Link from "next/link";
import { Icon } from "./Icon";
import { PRO_PRICE_LABEL, TRIAL_DAYS } from "@/lib/config";

const FREE = ["Property map and county search", "Auction dates, case numbers and sale results", "Public property pages"];
const PRO: React.ReactNode[] = [
  <><b>Owner contact on new Lis Pendens filings</b>, so you can negotiate before the auction</>,
  <b key="eq">Equity Score on every property</b>,
  "Filter and sort the map by Equity Score",
  "Owner, judgment and lien details",
  "Daily alerts for high-score properties",
  "Export lead lists to CSV",
];
// Bands follow the Equity Score spec (80+ / 70-79 / 45-69 / under 45).
const BANDS = [
  { range: "80+", name: "Great", text: "wide spread between value and what's owed", color: "var(--eq-great)" },
  { range: "70–79", name: "Good", text: "worth a closer look", color: "var(--eq-good)", ink: "var(--ink)" },
  { range: "45–69", name: "Fair", text: "thin margin, check liens", color: "var(--eq-fair)", ink: "var(--ink)" },
  { range: "<45", name: "Weak", text: "owed is likely above value", color: "var(--eq-weak)" },
];

export function HomePricing() {
  return (
    <section className="section band-white" id="plans">
      <div className="wrap">
        <div className="section-head">
          <div style={{ maxWidth: 520 }}>
            <div className="eyebrow">Equity Score</div>
            <h2>Know which deals are worth your bid.</h2>
            <p>
              Every property gets a 1–100 Equity Score that weighs fair market value against the mortgage or the final judgment.
              Browse free, then upgrade to see the score on every property.
            </p>
          </div>
        </div>
        <div className="price-grid">
          <div className="price-card">
            <h3>Free</h3>
            <p className="muted small">Search and browse every county we cover.</p>
            <div className="price">$0</div>
            <ul>
              {FREE.map((f) => <li key={f}><Icon name="check" size={15} />{f}</li>)}
              <li className="muted"><Icon name="lock" size={15} />Owner contact and Equity Score locked</li>
            </ul>
            <Link href="/signup?plan=free" className="btn btn-outline">Create free account</Link>
          </div>
          <div className="price-card price-pro">
            <span className="price-flag">Most popular</span>
            <h3>Pro</h3>
            <p className="muted small">Everything in Free, plus the numbers that decide a bid.</p>
            <div className="price">{PRO_PRICE_LABEL}<span> / month · {TRIAL_DAYS}-day free trial</span></div>
            <ul>
              {PRO.map((f, i) => <li key={i}><Icon name="check" size={15} /><span>{f}</span></li>)}
            </ul>
            <Link href="/signup?plan=pro" className="btn btn-primary">Start free trial</Link>
          </div>
          <div className="score-panel">
            <div className="rec-label">How the score reads</div>
            <ul>
              {BANDS.map((b) => (
                <li key={b.range}>
                  <span className="score-chip" style={{ background: b.color, color: (b as { ink?: string }).ink ?? "#fff" }}>{b.range}</span>
                  <span><b>{b.name}</b>: {b.text}</span>
                </li>
              ))}
            </ul>
            <p className="small muted score-note">Free accounts see the score when it&apos;s 70 or higher. Placeholder formula: 50 + equity ÷ 4,000. [Final formula to be defined.]</p>
          </div>
        </div>
      </div>
    </section>
  );
}
