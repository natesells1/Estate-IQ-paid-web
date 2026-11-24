import type { Metadata } from "next";
import Link from "next/link";
import { PRO_PRICE_LABEL, SERVICES, TRIAL_DAYS, money } from "@/lib/config";

export const metadata: Metadata = { title: "Terms of service", description: "The terms for using Estate IQ." };

const UPDATED = "November 23, 2026";

export default function TermsPage() {
  return (
    <section className="section">
      <div className="wrap legal">
        <div className="eyebrow">Legal</div>
        <h1 className="legal-h1">Terms of service</h1>
        <p className="muted small">Last updated {UPDATED}</p>

        <h2>1. What Estate IQ is</h2>
        <p>
          Estate IQ collects Florida public records (lis pendens filings, foreclosure auctions and tax deed sales) from county clerks and
          property appraisers and presents them with an Equity Score. By using the site you agree to these terms.
        </p>

        <h2>2. Information, not advice</h2>
        <p>
          Records come from public sources and can contain errors, delays or omissions. The Equity Score is an estimate, not an appraisal.
          Nothing on Estate IQ is legal, financial, tax or real-estate advice. Verify every property (title, liens, occupancy, condition and
          court records) before you bid, buy or contact anyone. You are responsible for your decisions.
        </p>

        <h2>3. Your account</h2>
        <p>
          Keep your password private and tell us if you think someone else has used your account. You must be at least 18 and give accurate
          information. One account is for one person; don&apos;t share it or resell our data.
        </p>

        <h2>4. Plans, trials and billing</h2>
        <p>
          Free accounts can browse auction history and limited details on new filings and upcoming auctions. Pro costs {PRO_PRICE_LABEL} per month
          and starts with a {TRIAL_DAYS}-day free trial for first-time subscribers. Unless you cancel before the trial ends, your card is charged
          and the plan renews monthly until you cancel. You can cancel any time from your account; Pro stays active until the end of the
          paid period. Title searches ({money(SERVICES["title-search"].cents)}) and skip traces ({money(SERVICES["skip-trace"].cents)}) are one-time
          purchases. Payments are processed by Stripe. Prices may change with notice before your next renewal.
        </p>

        <h2>5. Contacting property owners</h2>
        <p>
          If you use owner contact details, you must follow all laws that apply to you, including the Telephone Consumer Protection Act,
          do-not-call rules, Florida law on foreclosure-related rescue transactions, and fair-housing laws. Don&apos;t harass, mislead or
          pressure anyone.
        </p>

        <h2>6. Acceptable use</h2>
        <p>
          Don&apos;t scrape, copy in bulk, resell, or redistribute Estate IQ data or content, try to bypass plan limits, or interfere with the
          site. We may suspend accounts that do.
        </p>

        <h2>7. Liability</h2>
        <p>
          Estate IQ is provided &quot;as is&quot;. To the extent the law allows, we aren&apos;t liable for indirect or consequential losses, and our
          total liability is limited to what you paid us in the 12 months before the claim.
        </p>

        <h2>8. Changes and law</h2>
        <p>
          We may update these terms and will post the new date above. Florida law governs these terms. Questions? <Link href="/contact" className="text-link">Contact us</Link>.
        </p>
      </div>
    </section>
  );
}
