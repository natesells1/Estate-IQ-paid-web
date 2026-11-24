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
county, rounded map position, and the Equity Score when it is 70+. The blurred text on cards is fixed
placeholder text, not the real values. Auction history is public in full.

Everyone is Free until accounts exist. For local testing only: set `ALLOW_DEMO_PRO=1` and visit
`/api/demo-plan?plan=pro` (or `?plan=free`).

## Deploy

Railway builds with `npm run build` and starts with `npm start` (see `railway.json`).
Set `SITE_URL` to the public domain so the sitemap and canonical links are right.
