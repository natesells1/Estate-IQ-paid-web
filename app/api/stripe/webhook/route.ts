import type Stripe from "stripe";
import { stripe, syncSubscription } from "@/lib/billing";
import { q } from "@/lib/db";

// Stripe sends subscription and payment events here. Set the endpoint in Stripe to
// https://<your domain>/api/stripe/webhook and put its signing secret in STRIPE_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) return new Response("Billing not configured", { status: 503 });

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(body, sig ?? "", secret);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const cs = event.data.object as Stripe.Checkout.Session;
        const customer = typeof cs.customer === "string" ? cs.customer : cs.customer?.id;
        if (cs.client_reference_id && customer) {
          await q("update users set stripe_customer_id = coalesce(stripe_customer_id, $1) where id = $2", [customer, cs.client_reference_id]);
        }
        if (cs.mode === "subscription" && cs.subscription) {
          const subId = typeof cs.subscription === "string" ? cs.subscription : cs.subscription.id;
          await syncSubscription(await s.subscriptions.retrieve(subId));
        } else if (cs.mode === "payment") {
          await q("update orders set status = $1 where stripe_session_id = $2", [cs.payment_status === "paid" ? "paid" : cs.payment_status, cs.id]);
        }
        break;
      }
      case "checkout.session.expired": {
        const cs = event.data.object as Stripe.Checkout.Session;
        await q("update orders set status = 'expired' where stripe_session_id = $1 and status = 'pending'", [cs.id]);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
    }
  } catch (e) {
    console.error("[stripe] webhook handling failed", event.type, (e as Error).message);
    return new Response("Handler error", { status: 500 });
  }
  return Response.json({ received: true });
}
