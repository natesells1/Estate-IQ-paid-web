"use client";
import Link from "next/link";
import { useActionState } from "react";
import { logIn, type LoginState } from "@/app/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(logIn, { message: "" });
  return (
    <form action={action} className="su-card" key={state.email ?? ""}>
      <h1 className="su-h1">Log in</h1>
      <input type="hidden" name="next" value={next} />
      {state.message && <p className="su-error" role="alert">{state.message}</p>}
      <label className="su-field">
        <span>Email</span>
        <input className="input" name="email" type="email" autoComplete="email" defaultValue={state.email} required />
      </label>
      <label className="su-field">
        <span>Password</span>
        <input className="input" name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className="btn btn-primary su-submit" disabled={pending}>{pending ? "Logging in…" : "Log in"}</button>
      <p className="small su-login">New to Estate IQ? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-link small">Start free trial</Link></p>
      <p className="small muted su-login">Forgot your password? Email support and we&apos;ll reset it. [Self-serve reset comes with the email service.]</p>
    </form>
  );
}
