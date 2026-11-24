import Link from "next/link";
import { COUNTIES } from "@/lib/data/counties";
import { LogoMark } from "./Icon";

export function SiteFooter() {
  const hot = COUNTIES.filter((c) => c.hot);
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Link href="/" className="logo"><LogoMark />Estate IQ</Link>
            <p className="muted small" style={{ marginTop: 12, maxWidth: 320 }}>
              New lis pendens filings, foreclosure auctions and tax deed sales across Florida, with an Equity Score on every property.
            </p>
          </div>
          <div>
            <h2 className="footer-h">Product</h2>
            <ul>
              <li><Link href="/lis-pendens">Lis pendens</Link></li>
              <li><Link href="/auctions">Auction calendar</Link></li>
              <li><Link href="/#property-map">Property map</Link></li>
              <li><Link href="/signup#plans">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="footer-h">Counties</h2>
            <ul>
              {hot.map((c) => (
                <li key={c.slug}><Link href={`/auctions?county=${c.slug}`}>{c.name} County</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="footer-h">Company</h2>
            <ul>
              <li><Link href="/#about">About us</Link></li>
              <li><Link href="/#alerts">Email alerts</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/login">Log in</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-base">
          <span>© {new Date().getFullYear()} Estate IQ. Florida public records data. Not legal or financial advice.</span>
          <span className="footer-legal"><Link href="/terms">Terms of service</Link><Link href="/privacy">Privacy policy</Link><Link href="/contact">Contact</Link></span>
        </div>
      </div>
    </footer>
  );
}
