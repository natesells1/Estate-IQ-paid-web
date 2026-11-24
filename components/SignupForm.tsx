"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { signUp, type SignupState } from "@/app/actions";
import { PRO_PRICE_LABEL, TRIAL_DAYS } from "@/lib/config";

export function SignupForm({ plan, next }: { plan: "free" | "pro"; next: string }) {
  const [state, action, pending] = useActionState<SignupState, FormData>(signUp, { ok: false, message: "" });
  const [show, setShow] = useState(false);
  const f = state.fields ?? {};

  return (
    <form action={action} className="su-card" noValidate key={JSON.stringify(state.values ?? {})}>
      <h2>{plan === "free" ? "Create your free account" : "Start your free trial"}</h2>
      <p className="muted small">
        {plan === "free" ? "Free forever. Upgrade to Pro anytime." : `${TRIAL_DAYS} days free, then ${PRO_PRICE_LABEL}/month. Cancel anytime.`}
      </p>
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="next" value={next} />
      {state.message && <p className="su-error" role="alert">{state.message}</p>}

      <label className="su-field">
        <span>Full name</span>
        <input className="input" name="name" defaultValue={state.values?.name} autoComplete="name" required aria-invalid={!!f.name} aria-describedby={f.name ? "err-name" : undefined} />
        {f.name && <em id="err-name">{f.name}</em>}
      </label>
      <label className="su-field">
        <span>Email</span>
        <input className="input" name="email" defaultValue={state.values?.email} type="email" autoComplete="email" required aria-invalid={!!f.email} aria-describedby={f.email ? "err-email" : undefined} />
        {f.email && <em id="err-email">{f.email}</em>}
      </label>
      <label className="su-field">
        <span>Password</span>
        <div className="su-pw">
          <input className="input" name="password" type={show ? "text" : "password"} autoComplete="new-password" minLength={8} required aria-invalid={!!f.password} aria-describedby={f.password ? "err-pw" : "pw-hint"} />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</button>
        </div>
        {f.password ? <em id="err-pw">{f.password}</em> : <small id="pw-hint" className="muted">At least 8 characters.</small>}
      </label>

      <button className="btn btn-primary su-submit" disabled={pending}>
        {pending ? "One moment…" : plan === "free" ? "Create free account" : "Start free trial"}
      </button>
      {plan === "pro" && <p className="small muted su-login">You&apos;ll add a card on the next step. You won&apos;t be charged until the trial ends.</p>}
      <p className="small su-login">Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-link small">Log in</Link></p>
    </form>
  );
}
