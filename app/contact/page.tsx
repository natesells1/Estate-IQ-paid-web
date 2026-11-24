import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = { title: "Contact us", description: "Questions about Estate IQ, your plan, or a property? Send us a message." };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  return (
    <section className="section">
      <div className="wrap legal-grid">
        <div>
          <div className="eyebrow">Contact</div>
          <h1 className="legal-h1">How can we help?</h1>
          <p className="legal-lead">Questions about a property, your plan, an order, or resetting your password: send a message and we&apos;ll reply within one business day.</p>
          <ul className="legal-points">
            <li>Billing changes and cancellations can also be done any time from your account.</li>
            <li>For a data issue, include the case number so we can find the file fast.</li>
          </ul>
        </div>
        <ContactForm topic={topic ?? "general"} />
      </div>
    </section>
  );
}
