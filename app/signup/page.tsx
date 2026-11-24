import type { Metadata } from "next";
import { Plans } from "@/components/Plans";
import { SignupForm } from "@/components/SignupForm";
import { EquityBadge, KIND_LABEL } from "@/components/RecordBits";
import { findById, toView, topFiling } from "@/lib/data/queries";
import { currentUser, isProUser } from "@/lib/auth";
import { upgrade } from "@/app/actions";
import { PRO_PRICE_LABEL, TRIAL_DAYS } from "@/lib/config";
import type { ViewRecord } from "@/lib/types";
import { FAQ } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Start your free trial",
  description: "See every address, owner and Equity Score on new lis pendens filings and upcoming Florida auctions.",
};
export const dynamic = "force-dynamic";

type SP = { from?: string; plan?: string; order?: string; alert?: string; next?: string };

const BENEFITS = [
  "New Lis Pendens filings every day, with owner contact",
  "Full details on every upcoming auction",
  "Equity Score on every property",
  "Auction history is always free",
];

function eyebrowFor(sp: SP, r: ViewRecord | undefined) {
  if (sp.order === "title-search") return "Order a title search";
  if (sp.order === "skip-trace") return "Run a skip trace";
  if (sp.alert) return "Get an auction alert";
  if (r?.equityScore != null && r.equityScore >= 70) return "High equity property found";
  return "Property found";
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  // The preview is always the free (redacted) view: this page is for people who aren't Pro yet
  const free = { isPro: false };
  const user = await currentUser();
  const pro = isProUser(user);
  const p = sp.from ? findById(sp.from) : undefined;
  const preview = p ? toView(p, free) : topFiling(free, "lee");
  const plan = sp.plan === "free" ? "free" : "pro";
  const next = sp.next?.startsWith("/") && !sp.next.startsWith("//") ? sp.next : sp.from && p ? `/property/${p.id}` : "/account";


  return (
    <>
      <section className="section su-hero">
        <div className="wrap su-grid">
          <div className="su-copy">
            <span className="su-eyebrow">{eyebrowFor(sp, preview)}</span>
            <h1>See every address, owner and Equity Score.</h1>
            <p className="su-sub">
              Find the deal before it hits the auction. Pro unlocks the full file on every new Lis Pendens filing and every upcoming
              auction, so you can contact the owner and negotiate first.
            </p>
            {preview && (
              <div className="su-preview card">
                <img src={preview.photoUrl} alt="" width={88} height={60} />
                <div className="su-preview-main">
                  <span className="muted small">Case {preview.caseNumber} · {KIND_LABEL[preview.kind]}</span>
                  {preview.locked ? <span className="blur su-preview-addr" aria-hidden="true">0000 Xxxxxx Xxxx Xx</span> : <b className="su-preview-addr">{preview.address}</b>}
                  <span><EquityBadge score={preview.equityScore} /></span>
                </div>
              </div>
            )}
            <ul className="su-benefits">
              {BENEFITS.map((b) => <li key={b}><span aria-hidden="true">✓</span>{b}</li>)}
            </ul>
          </div>
          <div className="su-form-col">
            {pro ? (
              <div className="su-card"><h2>You&apos;re on Pro</h2><p className="muted">You already see every address, owner and Equity Score.</p><a href={next} className="btn btn-primary su-submit">Continue</a></div>
            ) : user ? (
              <form action={upgrade} className="su-card">
                <h2>Upgrade to Pro</h2>
                <p className="muted small">Signed in as {user.email}. {user.had_trial ? `${PRO_PRICE_LABEL}/month. Cancel anytime.` : `${TRIAL_DAYS} days free, then ${PRO_PRICE_LABEL}/month. Cancel anytime.`}</p>
                <input type="hidden" name="next" value={next} />
                <button className="btn btn-primary su-submit">{user.had_trial ? "Upgrade to Pro" : "Start free trial"}</button>
              </form>
            ) : (
              <SignupForm plan={plan} next={next} />
            )}
          </div>
        </div>
      </section>

      <section className="section su-plans" id="plans">
        <div className="wrap">
          <h2 className="su-h2">Plans</h2>
          <Plans />
        </div>
      </section>

      <section className="section su-faq">
        <div className="wrap">
          <h2 className="su-h2">Questions</h2>
          <div className="su-faq-list">
            {FAQ.map((f) => (
              <details key={f.q} className="card">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
