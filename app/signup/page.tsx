import type { Metadata } from "next";
import { Plans } from "@/components/Plans";

export const metadata: Metadata = { title: "Start your free trial" };

export default function Page() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="eyebrow">Sign up</div>
        <h1 style={{ fontSize: 40, margin: "6px 0 10px" }}>See every address, owner and Equity Score.</h1>
        <p className="muted" style={{ maxWidth: 620 }}>The full sign-up page is next. Plans below.</p>
        <h2 className="plans-title" id="plans">Plans</h2>
        <Plans />
      </div>
    </section>
  );
}
