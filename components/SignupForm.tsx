"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { startTrial, type SignupState } from "@/app/actions";
import { Icon } from "./Icon";

export function SignupForm({ plan }: { plan: "free" | "pro" }) {
  const [state, action, pending] = useActionState<SignupState, FormData>(startTrial, { ok: false, message: "" });
  const [show, setShow] = useState(false);
  const f = state.fields ?? {};

  if (state.ok) {
    return (
      <div className="su-card su-done" role="status">
        <span className="su-done-icon"><Icon name="check" size={22} stroke={2.4} /></span>
        <h2>You&apos;re on the list</h2>
        <p>{state.message}</p>
        <Link href="/auctions" className="btn btn-outline">Browse free auction results</Link>
      </div>
    );
  }

  return (
    <form action={action} className="su-card" noValidate key={JSON.stringify(state.values ?? {})}>
      <h2>{plan === "free" ? "Create your free account" : "Start your free trial"}</h2>
      <p className="muted small">{plan === "free" ? "Free forever. Upgrade to Pro anytime." : "[Trial length] free, then [$XX]/month. Cancel anytime."}</p>
      <input type="hidden" name="plan" value={plan} />

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

      <button className="btn btn-primary su-submit" disabled={pending}>{pending ? "Starting…" : plan === "free" ? "Create free account" : "Start free trial"}</button>
      <p className="small su-login">Already have an account? <Link href="/login" className="text-link small">Log in</Link></p>
    </form>
  );
}
