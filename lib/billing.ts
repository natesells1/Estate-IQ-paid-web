import "server-only";
import Stripe from "stripe";
import { q } from "./db";
import type { User } from "./auth";
import { PRO_PRICE_CENTS, SERVICES, TRIAL_DAYS, type ServiceKind } from "./config";

let client: Stripe | null = null;

/** Null until STRIPE_SECRET_KEY is set in Railway. */
export function stripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return (client ??= new Stripe(key));
}

export function billingReady() {
  return !!process.env.STRIPE_SECRET_KEY;
}

async function customerFor(s: Stripe, user: User): Promise<string> {
  if (user.stripe_customer_id) return user.stripe_customer_id;
  const c = await s.customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } });
  await q("update users set stripe_customer_id = $1 where id = $2", [c.id, user.id]);
  return c.id;
}

/** Stripe Checkout for Pro: $49/month, 7-day trial for first-time subscribers. */
export async function proCheckoutUrl(user: User, origin: string, returnTo = "/account"): Promise<string> {
  const s = stripe();
  if (!s) throw new Error("Payments are not set up yet.");
  const customer = await customerFor(s, user);
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: PRO_PRICE_CENTS,
          recurring: { interval: "month" },
          product_data: { name: "Estate IQ Pro" },
        },
      },
    ],
    subscription_data: {
      metadata: { userId: user.id },
      ...(user.had_trial ? {} : { trial_period_days: TRIAL_DAYS }),
    },
    allow_promotion_codes: true,
    success_url: `${origin}/account?welcome=1&next=${encodeURIComponent(returnTo)}`,
    cancel_url: `${origin}/account?canceled=1`,
  });
  return session.url!;
}

/** Stripe Checkout for a one-time service on a property. */
export async function serviceCheckoutUrl(user: User, kind: ServiceKind, propertyId: string, origin: string): Promise<string> {
  const s = stripe();
  if (!s) throw new Error("Payments are not set up yet.");
  const svc = SERVICES[kind];
  const customer = await customerFor(s, user);
  const session = await s.checkout.sessions.create({
    mode: "payment",
    customer,
    client_reference_id: user.id,
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: svc.cents, product_data: { name: svc.name, description: `Property ${propertyId}` } } }],
    metadata: { userId: user.id, kind, propertyId },
    success_url: `${origin}/account?ordered=${kind}`,
    cancel_url: `${origin}/property/${encodeURIComponent(propertyId)}`,
  });
  await q("insert into orders (user_id, kind, property_id, amount_cents, stripe_session_id) values ($1, $2, $3, $4, $5)", [user.id, kind, propertyId, svc.cents, session.id]);
  return session.url!;
}

export async function portalUrl(user: User, origin: string): Promise<string> {
  const s = stripe();
  if (!s || !user.stripe_customer_id) throw new Error("No billing account yet.");
  const p = await s.billingPortal.sessions.create({ customer: user.stripe_customer_id, return_url: `${origin}/account` });
  return p.url;
}

/** Copy a Stripe subscription's state onto the user row. */
export async function syncSubscription(sub: Stripe.Subscription) {
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  // current_period_end moved onto subscription items in newer API versions
  const item = sub.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined;
  const periodEnd = item?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end ?? null;
  await q(
    `update users set stripe_subscription_id = $1, subscription_status = $2, trial_ends_at = $3, current_period_end = $4,
       had_trial = had_trial or $5
     where stripe_customer_id = $6`,
    [
      sub.id,
      sub.status,
      sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      periodEnd ? new Date(periodEnd * 1000) : null,
      !!sub.trial_end,
      customer,
    ],
  );
}

/** Pull the latest subscription from Stripe (used right after Checkout, before the webhook lands). */
export async function refreshFromStripe(user: User): Promise<void> {
  const s = stripe();
  if (!s || !user.stripe_customer_id) return;
  const subs = await s.subscriptions.list({ customer: user.stripe_customer_id, status: "all", limit: 1 });
  if (subs.data[0]) await syncSubscription(subs.data[0]);
}
