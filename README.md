# Estate IQ (paid web)

Public website for Estate IQ: Florida lis pendens filings, foreclosure auctions and tax deed sales.
Next.js (App Router), light mode only, deployed on Railway.

## Run locally

```
npm install
npm run dev
```

Open http://localhost:3000.

## Where things live

| What | Where |
| --- | --- |
| **Data source (swap for real county data)** | `lib/data/source.ts` → `loadAllProperties()` |
| Sample data generator | `lib/data/sample.ts` |
| Hot counties, map label positions | `lib/data/counties.ts` |
| All reads + Free/Pro redaction | `lib/data/queries.ts` |
| Equity Score formula + bands | `lib/equity.ts` |
| Who is Free vs Pro | `lib/viewer.ts` |
| Design tokens | `app/globals.css` (`:root`) |

## Free vs Pro

Redaction happens on the server in `lib/data/queries.ts` (`toView`). For locked records (new lis pendens
filings and upcoming auctions) a free user's browser only ever receives: id, case #, photo, type/date,
county, rounded map position, and the Equity Score when it is 70+. Auction history is public, except owner
names and phone numbers, which are Pro-only everywhere.

Pro = an `active` or `trialing` Stripe subscription on the signed-in account (`lib/auth.ts`).

## Accounts and payments

- Accounts: email + password in Postgres (`lib/db.ts`, `lib/auth.ts`). Locally, with no `DATABASE_URL`,
  an embedded Postgres in `.data/` is used.
- Prices and trial: `lib/config.ts` (Pro $49/month, 7-day trial, title search $99, skip trace $1.50).
- Stripe: `lib/billing.ts` (Checkout, billing portal), webhook at `/api/stripe/webhook`.

### Turning on Stripe (test mode)

1. Stripe dashboard (Test mode) > Developers > API keys: copy the **Secret key** (`sk_test_...`).
   In Railway > Estate-IQ-paid-web service > Variables, add `STRIPE_SECRET_KEY`.
2. Stripe > Developers > Webhooks > Add endpoint:
   `https://estate-iq-paid-web-production.up.railway.app/api/stripe/webhook`
   Events: `checkout.session.completed`, `checkout.session.expired`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`.
   Copy its **Signing secret** (`whsec_...`) into Railway as `STRIPE_WEBHOOK_SECRET`.
3. Stripe > Settings > Billing > Customer portal: click **Save** once so "Manage billing" works.
4. Deploy the variable change in Railway, then sign up on the site with test card `4242 4242 4242 4242`.

Going live later: repeat with live keys and a live-mode webhook endpoint.

## Deploy

Railway builds with `npm run build` and starts with `npm start` (see `railway.json`).
The web service's `DATABASE_URL` references the project's Postgres service.
Set `SITE_URL` to the public domain so the sitemap and canonical links are right.
