"use client";
import { useActionState } from "react";
import { sendContact, type ContactState } from "@/app/actions";

const TOPICS = [
  { v: "general", l: "General question" },
  { v: "billing", l: "Billing or my plan" },
  { v: "password", l: "Reset my password" },
  { v: "data", l: "A property or data issue" },
  { v: "orders", l: "Title search or skip trace order" },
];

export function ContactForm({ topic }: { topic: string }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, { ok: false, message: "" });
  if (state.ok) return <div className="su-card" role="status"><h2>Message sent</h2><p className="muted">{state.message}</p></div>;
  return (
    <form action={action} className="su-card">
      {state.message && <p className="su-error" role="alert">{state.message}</p>}
      <label className="su-field"><span>Name</span><input className="input" name="name" autoComplete="name" required /></label>
      <label className="su-field"><span>Email</span><input className="input" name="email" type="email" autoComplete="email" required /></label>
      <label className="su-field">
        <span>Topic</span>
        <select className="input" name="topic" defaultValue={TOPICS.some((t) => t.v === topic) ? topic : "general"}>
          {TOPICS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
        </select>
      </label>
      <label className="su-field"><span>Message</span><textarea className="input su-textarea" name="message" rows={5} required minLength={10} /></label>
      <button className="btn btn-primary su-submit" disabled={pending}>{pending ? "Sending…" : "Send message"}</button>
    </form>
  );
}
