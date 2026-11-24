"use server";
import { redirect } from "next/navigation";
import { COUNTY_BY_SLUG } from "@/lib/data/counties";
import { q } from "@/lib/db";
import { createSession, currentUser, destroySession, findUserByEmail, getUserById, hashPassword, rateLimited, siteOrigin, verifyPassword } from "@/lib/auth";
import { billingReady, portalUrl, proCheckoutUrl, serviceCheckoutUrl } from "@/lib/billing";
import { SERVICES, type ServiceKind } from "@/lib/config";
import { findById } from "@/lib/data/queries";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Only allow redirects back into this site. */
function safeNext(v: FormDataEntryValue | null, fallback: string) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : fallback;
}

/* ───────────── Email alerts ───────────── */

export type AlertState = { ok: boolean; message: string };

export async function subscribeAlerts(_prev: AlertState, form: FormData): Promise<AlertState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const county = String(form.get("county") ?? "");
  if (!EMAIL_RE.test(email) || email.length > 200) return { ok: false, message: "Enter a valid email address." };
  const c = COUNTY_BY_SLUG[county];
  if (!c) return { ok: false, message: "Pick a county." };
  if (await rateLimited("alerts", email, 20)) return { ok: false, message: "Too many tries. Please wait a few minutes." };
  try {
    await q("insert into alert_subscribers (email, county) values ($1, $2) on conflict (email, county) do nothing", [email, c.slug]);
  } catch (e) {
    console.error("[alerts] save failed", (e as Error).message);
    return { ok: false, message: "We couldn't save that right now. Please try again." };
  }
  return { ok: true, message: `You're on the list for ${c.name} County.` };
}

/* ───────────── Sign up ───────────── */

export type SignupState = {
  ok: boolean;
  message: string;
  fields?: { name?: string; email?: string; password?: string };
  values?: { name: string; email: string };
};

/**
 * Creates the account and signs the visitor in. Pro sign-ups continue to
 * Stripe Checkout for the free trial; free sign-ups go back where they came from.
 */
export async function signUp(_prev: SignupState, form: FormData): Promise<SignupState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const plan = form.get("plan") === "free" ? "free" : "pro";
  const next = safeNext(form.get("next"), "/account");

  const fields: SignupState["fields"] = {};
  if (name.length < 2 || name.length > 120) fields.name = "Enter your full name.";
  if (!EMAIL_RE.test(email) || email.length > 200) fields.email = "Enter a valid email address.";
  if (password.length < 8) fields.password = "Use at least 8 characters.";
  else if (password.length > 200) fields.password = "That password is too long.";
  const values = { name, email };
  if (Object.keys(fields).length) return { ok: false, message: "", fields, values };
  if (await rateLimited("signup", email, 10)) return { ok: false, message: "Too many tries. Please wait a few minutes.", values };

  let userId: string;
  try {
    if (await findUserByEmail(email)) {
      return { ok: false, message: "", fields: { email: "There's already an account with this email. Log in instead." }, values };
    }
    const rows = await q<{ id: string }>("insert into users (email, name, password_hash) values ($1, $2, $3) returning id", [email, name, await hashPassword(password)]);
    userId = rows[0].id;
    await createSession(userId);
  } catch (e) {
    console.error("[signup] failed", (e as Error).message);
    return { ok: false, message: "We couldn't create your account right now. Please try again.", values };
  }

  if (plan === "pro" && billingReady()) {
    let url: string;
    try {
      url = await proCheckoutUrl((await getUserById(userId))!, await siteOrigin(), next);
    } catch (e) {
      console.error("[signup] checkout failed", (e as Error).message);
      redirect("/account?checkout=failed");
    }
    redirect(url);
  }
  redirect(plan === "pro" ? "/account?payments=off" : next);
}

/* ───────────── Log in / out ───────────── */

export type LoginState = { message: string; email?: string };

export async function logIn(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = safeNext(form.get("next"), "/account");
  if (!email || !password) return { message: "Enter your email and password.", email };
  if (await rateLimited("login", email)) return { message: "Too many tries. Please wait 15 minutes and try again.", email };
  let ok = false;
  try {
    const user = await findUserByEmail(email);
    // Always run a hash check so response time doesn't reveal whether the email exists
    ok = user ? await verifyPassword(password, user.password_hash) : (await hashPassword(password), false);
    if (ok && user) await createSession(user.id);
  } catch (e) {
    console.error("[login] failed", (e as Error).message);
    return { message: "We couldn't log you in right now. Please try again.", email };
  }
  if (!ok) return { message: "That email and password don't match.", email };
  redirect(next);
}

export async function logOut() {
  await destroySession();
  redirect("/");
}

/** Upgrade an existing free account to Pro (Stripe Checkout). */
export async function upgrade(form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/account");
  const next = safeNext(form.get("next"), "/account");
  let url: string;
  try {
    url = await proCheckoutUrl(user, await siteOrigin(), next);
  } catch (e) {
    console.error("[upgrade] checkout failed", (e as Error).message);
    redirect(billingReady() ? "/account?checkout=failed" : "/account?payments=off");
  }
  redirect(url);
}

/** Stripe billing portal: change card, see invoices, cancel. */
export async function openPortal() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/account");
  let url: string;
  try {
    url = await portalUrl(user, await siteOrigin());
  } catch (e) {
    console.error("[portal] failed", (e as Error).message);
    redirect("/account?portal=failed");
  }
  redirect(url);
}

/** Pay for a title search or skip trace on a property. */
export async function orderService(form: FormData) {
  const kind = String(form.get("kind") ?? "");
  const propertyId = String(form.get("propertyId") ?? "");
  if (!(kind in SERVICES) || !findById(propertyId)) redirect("/");
  const user = await currentUser();
  if (!user) redirect(`/signup?from=${encodeURIComponent(propertyId)}&order=${kind}`);
  let url: string;
  try {
    url = await serviceCheckoutUrl(user, kind as ServiceKind, propertyId, await siteOrigin());
  } catch (e) {
    console.error("[order] checkout failed", (e as Error).message);
    redirect(billingReady() ? "/account?checkout=failed" : "/account?payments=off");
  }
  redirect(url);
}

/* ───────────── Contact ───────────── */

export type ContactState = { ok: boolean; message: string };

export async function sendContact(_prev: ContactState, form: FormData): Promise<ContactState> {
  const name = String(form.get("name") ?? "").trim().slice(0, 120);
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const topic = String(form.get("topic") ?? "general").slice(0, 40);
  const message = String(form.get("message") ?? "").trim();
  if (name.length < 2) return { ok: false, message: "Enter your name." };
  if (!EMAIL_RE.test(email) || email.length > 200) return { ok: false, message: "Enter a valid email address." };
  if (message.length < 10 || message.length > 4000) return { ok: false, message: "Write a message of at least 10 characters." };
  if (await rateLimited("contact", email, 5)) return { ok: false, message: "Too many messages. Please wait a few minutes." };
  try {
    await q("insert into contact_messages (name, email, topic, message) values ($1, $2, $3, $4)", [name, email, topic, message]);
  } catch (e) {
    console.error("[contact] save failed", (e as Error).message);
    return { ok: false, message: "We couldn't send that right now. Please try again." };
  }
  return { ok: true, message: `Thanks, ${name.split(" ")[0]}. We'll reply to ${email} within one business day.` };
}
