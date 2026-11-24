import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, getUserById, isProUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { billingReady, refreshFromStripe } from "@/lib/billing";
import { PRO_PRICE_LABEL, SERVICES, TRIAL_DAYS, money, type ServiceKind } from "@/lib/config";
import { findById } from "@/lib/data/queries";
import { logOut, openPortal, upgrade } from "@/app/actions";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };
export const dynamic = "force-dynamic";

type SP = { welcome?: string; canceled?: string; ordered?: string; checkout?: string; payments?: string; portal?: string; next?: string };

const fmt = (d: Date | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

export default async function AccountPage({ searchParams }: { searchParams: Promise<SP> }) {
  let user = await currentUser();
  if (!user) redirect("/login?next=/account");
  const sp = await searchParams;
  // Just back from Stripe: don't wait for the webhook to show Pro
  if (sp.welcome && !isProUser(user)) {
    try {
      await refreshFromStripe(user);
      user = (await getUserById(user.id)) ?? user;
    } catch (e) {
      console.error("[account] refresh failed", (e as Error).message);
    }
  }
  const pro = isProUser(user);
  const orders = await q<{ id: string; kind: string; property_id: string; amount_cents: number; status: string; created_at: Date }>(
    "select id, kind, property_id, amount_cents, status, created_at from orders where user_id = $1 and status <> 'pending' order by created_at desc limit 50",
    [user.id],
  );
  const next = sp.next?.startsWith("/") && !sp.next.startsWith("//") ? sp.next : null;

  let notice: { tone: "ok" | "warn"; text: string } | null = null;
  if (sp.welcome) notice = { tone: "ok", text: pro ? "You're on Pro. Every address, owner and Equity Score is unlocked." : "Thanks! Your payment is being confirmed. This page updates within a minute." };
  else if (sp.ordered) notice = { tone: "ok", text: `Thanks, your ${SERVICES[sp.ordered as ServiceKind]?.name.toLowerCase() ?? "order"} is paid. We'll email the results to ${user.email}.` };
  else if (sp.canceled) notice = { tone: "warn", text: "Checkout was canceled. You're still on the Free plan." };
  else if (sp.payments) notice = { tone: "warn", text: "Payments aren't switched on yet, so nothing was charged. You're on the Free plan for now." };
  else if (sp.checkout || sp.portal) notice = { tone: "warn", text: "We couldn't open Stripe just now. Please try again in a minute." };

  const status = user.subscription_status;
  const planLine = pro
    ? status === "trialing"
      ? `Pro · free trial until ${fmt(user.trial_ends_at)}, then ${PRO_PRICE_LABEL}/month`
      : `Pro · ${PRO_PRICE_LABEL}/month${user.current_period_end ? ` · renews ${fmt(user.current_period_end)}` : ""}`
    : status === "past_due" || status === "unpaid"
      ? "Pro is paused: your last payment didn't go through"
      : status === "canceled"
        ? "Free (Pro was canceled)"
        : "Free";

  return (
    <section className="section">
      <div className="wrap acct">
        <div className="acct-head">
          <div>
            <h1>Your account</h1>
            <p className="muted">{user.name} · {user.email}</p>
          </div>
          <form action={logOut}><button className="btn btn-ghost">Log out</button></form>
        </div>

        {notice && <p className={`acct-notice ${notice.tone}`} role="status">{notice.text}</p>}
        {next && pro && <p><Link href={next} className="text-link">Continue where you left off →</Link></p>}

        <div className="acct-grid">
          <div className="card acct-card">
            <span className="rec-label">Plan</span>
            <h2>{planLine}</h2>
            {pro ? (
              <p className="muted">Full file on every new filing and upcoming auction, owner contact, and the Equity Score on every property.</p>
            ) : (
              <p className="muted">Upgrade to see every address, owner and Equity Score. {user.had_trial ? "" : `Starts with a ${TRIAL_DAYS}-day free trial.`}</p>
            )}
            <div className="acct-actions">
              {!pro && (
                <form action={upgrade}>
                  <input type="hidden" name="next" value={next ?? "/account"} />
                  <button className="btn btn-primary" disabled={!billingReady()}>{user.had_trial ? `Upgrade to Pro · ${PRO_PRICE_LABEL}/mo` : "Start free trial"}</button>
                </form>
              )}
              {user.stripe_customer_id && (
                <form action={openPortal}><button className="btn btn-ghost">Manage billing</button></form>
              )}
            </div>
            {!billingReady() && <p className="small muted">Payments are being switched on. Check back shortly.</p>}
          </div>

          <div className="card acct-card">
            <span className="rec-label">Orders</span>
            <h2>Title searches and skip traces</h2>
            {orders.length === 0 ? (
              <p className="muted">No orders yet. Order a title search ({money(SERVICES["title-search"].cents)}) or skip trace ({money(SERVICES["skip-trace"].cents)}) from any property card.</p>
            ) : (
              <ul className="acct-orders">
                {orders.map((o) => {
                  const p = findById(o.property_id);
                  return (
                    <li key={o.id}>
                      <div>
                        <b>{SERVICES[o.kind as ServiceKind]?.name ?? o.kind}</b>
                        <Link href={`/property/${o.property_id}`} className="muted small">Case {p?.caseNumber ?? o.property_id}</Link>
                      </div>
                      <span className="small">{money(o.amount_cents)} · {o.status === "paid" ? "Paid" : o.status} · {fmt(o.created_at)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
