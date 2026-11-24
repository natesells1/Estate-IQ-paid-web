import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy policy", description: "What Estate IQ collects and how it is used." };

const UPDATED = "November 23, 2026";

export default function PrivacyPage() {
  return (
    <section className="section">
      <div className="wrap legal">
        <div className="eyebrow">Legal</div>
        <h1 className="legal-h1">Privacy policy</h1>
        <p className="muted small">Last updated {UPDATED}</p>

        <h2>What we collect</h2>
        <ul>
          <li><b>Account details:</b> your name, email and a scrambled (hashed) version of your password. We never store your password itself.</li>
          <li><b>Billing:</b> handled by Stripe. We store your Stripe customer ID and plan status, never your card number.</li>
          <li><b>Activity you create:</b> saved properties, alerts, orders and messages you send us.</li>
          <li><b>Email alert sign-ups:</b> your email and the counties you choose.</li>
        </ul>

        <h2>Public records</h2>
        <p>
          The properties, case details and owner information on Estate IQ come from Florida public records kept by county clerks and property
          appraisers. If you believe a record is wrong, <Link href="/contact?topic=data" className="text-link">tell us</Link> and we&apos;ll review it.
        </p>

        <h2>Cookies</h2>
        <p>
          We use one essential cookie to keep you signed in. Saved properties may also be kept in your browser&apos;s local storage until you
          sign in. We don&apos;t use advertising cookies.
        </p>

        <h2>How we use your information</h2>
        <p>
          To run your account, process payments, send the alerts and receipts you ask for, answer your messages and keep the site secure.
          We don&apos;t sell your personal information.
        </p>

        <h2>Who we share it with</h2>
        <p>
          Only the services that run Estate IQ: our hosting provider (Railway), our payment processor (Stripe) and, once connected, our email
          provider. They may use it only to provide those services.
        </p>

        <h2>Your choices</h2>
        <p>
          You can update or cancel your plan from your account, unsubscribe from alerts at any time, and ask us to delete your account and data
          through our <Link href="/contact" className="text-link">contact page</Link>.
        </p>
      </div>
    </section>
  );
}
