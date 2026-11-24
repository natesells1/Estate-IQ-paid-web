"use client";
import { useActionState } from "react";
import { subscribeAlerts, type AlertState } from "@/app/actions";
import { Icon } from "./Icon";

export function AlertsSignup({ counties }: { counties: { slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState<AlertState, FormData>(subscribeAlerts, { ok: false, message: "" });
  return (
    <section className="section" id="alerts">
      <div className="wrap">
        <div className="card alerts">
          <div>
            <div className="eyebrow"><Icon name="bell" size={14} /> Email alerts</div>
            <h2>Get new filings in your inbox every morning.</h2>
            <p className="muted">One email a day with new lis pendens filings and upcoming auctions in the county you pick.</p>
          </div>
          {state.ok ? (
            <p className="alerts-done" role="status"><Icon name="check" /> {state.message}</p>
          ) : (
            <form action={action} className="alerts-form">
              <label className="sr-only" htmlFor="alert-email">Email</label>
              <input id="alert-email" className="input" type="email" name="email" placeholder="you@email.com" required />
              <label className="sr-only" htmlFor="alert-county">County</label>
              <select id="alert-county" className="input" name="county" defaultValue="lee">
                {counties.map((c) => <option key={c.slug} value={c.slug}>{c.name} County</option>)}
              </select>
              <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Get alerts"}</button>
              {state.message && <p className="small" style={{ color: "var(--canceled)" }} role="alert">{state.message}</p>}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
