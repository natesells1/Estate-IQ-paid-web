import Link from "next/link";
import { FAQ } from "@/lib/faq";
import { PRO_PRICE_LABEL, TRIAL_DAYS } from "@/lib/config";
import { Icon } from "./Icon";

/** Dark full-width numbers band under the hero. */
export function StatsBand({ counties, filingsThisWeek, auctionsThisMonth }: { counties: number; filingsThisWeek: number; auctionsThisMonth: number }) {
  const items = [
    { n: counties.toLocaleString(), l: "Florida counties covered" },
    { n: filingsThisWeek.toLocaleString(), l: "new lis pendens this week" },
    { n: auctionsThisMonth.toLocaleString(), l: "auctions this month" },
    { n: "Daily", l: "new filings every weekday" },
  ];
  return (
    <section className="stats-band" aria-label="Estate IQ in numbers">
      <div className="wrap stats-grid">
        {items.map((i) => (
          <div key={i.l} className="stat">
            <b>{i.n}</b>
            <span>{i.l}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { icon: "pin", title: "Pick your county", text: "See every new lis pendens filing, foreclosure auction and tax deed sale on one map, updated every weekday." },
  { icon: "chart", title: "Spot the equity", text: "Each property gets an Equity Score from 1 to 100, so the deals worth a call rise to the top." },
  { icon: "bell", title: "Reach the owner first", text: "Pro unlocks the owner, address and numbers, so you can negotiate before the property hits the auction." },
];

export function HowItWorks() {
  return (
    <section className="section band-white" id="how-it-works">
      <div className="wrap">
        <div className="section-head center">
          <div>
            <div className="eyebrow">How it works</div>
            <h2>From new filing to signed deal, in three steps.</h2>
          </div>
        </div>
        <ol className="how-grid">
          {STEPS.map((s, i) => (
            <li key={s.title} className="how-step">
              <span className="how-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="feature-icon tone-soft-green"><Icon name={s.icon} size={20} /></span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section className="section band-white" id="faq">
      <div className="wrap faq-wrap">
        <div>
          <div className="eyebrow">Questions</div>
          <h2 className="faq-title">Frequently asked questions</h2>
          <p className="muted">Still have a question? <Link href="/contact" className="text-link">Contact us</Link></p>
        </div>
        <div className="su-faq-list">
          {FAQ.map((f) => (
            <details key={f.q} className="card">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="cta-band">
      <div className="wrap cta-inner">
        <div>
          <h2>Find your next deal before it hits the auction.</h2>
          <p>Start with a {TRIAL_DAYS}-day free trial of Pro, then {PRO_PRICE_LABEL}/month. Cancel anytime.</p>
        </div>
        <div className="cta-actions">
          <Link href="/signup?plan=pro" className="btn btn-white">Start free trial</Link>
          <Link href="/auctions" className="btn btn-outline-white">Browse free auction results</Link>
        </div>
      </div>
    </section>
  );
}
