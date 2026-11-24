import Link from "next/link";

const FREE = [
  "Full auction history, every county",
  "New Lis Pendens filings: photo and case #",
  "Upcoming auctions: photo and case #",
  "Equity Score shown on high-equity properties",
];
const PRO = [
  "Everything in Free",
  "Full file on every new Lis Pendens filing, updated daily",
  "Owner name, phone and mailing address",
  "Full upcoming auction details: judgment, max bid, values",
  "Equity Score on every property",
  "[Title search and skip trace pricing]",
];

export function Plans() {
  return (
    <div className="plans">
      <div className="plan card">
        <div className="plan-name">Free</div>
        <div className="plan-price">$0</div>
        <ul>
          {FREE.map((f) => <li key={f}>✓ {f}</li>)}
          <li className="muted">— Address, owner, mortgage and values blurred</li>
        </ul>
        <Link href="/signup?plan=free" className="btn btn-outline">Create free account</Link>
      </div>
      <div className="plan plan-pro">
        <span className="plan-badge">Most popular</span>
        <div className="plan-name">Pro</div>
        <div className="plan-price">[$XX]<span> / month</span></div>
        <ul>{PRO.map((f) => <li key={f}>✓ {f}</li>)}</ul>
        <Link href="/signup?plan=pro" className="btn btn-primary">Start free trial</Link>
      </div>
    </div>
  );
}
