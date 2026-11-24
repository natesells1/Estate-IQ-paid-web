"use server";
import { COUNTY_BY_SLUG } from "@/lib/data/counties";

export type AlertState = { ok: boolean; message: string };

/**
 * Email alert sign-up. TODO: store in the real database / email tool.
 * For now it validates and logs so the flow works end to end.
 */
export async function subscribeAlerts(_prev: AlertState, form: FormData): Promise<AlertState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const county = String(form.get("county") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return { ok: false, message: "Enter a valid email address." };
  }
  const c = COUNTY_BY_SLUG[county];
  if (!c) return { ok: false, message: "Pick a county." };
  // Recorded in the server log until an email tool is connected, so no subscriber is lost
  console.log(`[alerts] ${JSON.stringify({ email, county: c.slug })}`);
  return { ok: true, message: `You're on the list for ${c.name} County.` };
}

export type SignupState = { ok: boolean; message: string; fields?: { name?: string; email?: string; password?: string }; values?: { name: string; email: string } };

/**
 * Free-trial sign-up. Accounts and billing are not built yet, so this validates,
 * records the name + email in the server log (never the password) so no sign-up
 * is lost, and tells the visitor plainly what happens next.
 * TODO: create the account with the chosen auth provider and start the trial.
 */
export async function startTrial(_prev: SignupState, form: FormData): Promise<SignupState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const plan = form.get("plan") === "free" ? "free" : "pro";
  const fields: SignupState["fields"] = {};
  if (name.length < 2 || name.length > 120) fields.name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) fields.email = "Enter a valid email address.";
  if (password.length < 8) fields.password = "Use at least 8 characters.";
  else if (password.length > 200) fields.password = "That password is too long.";
  if (Object.keys(fields).length) return { ok: false, message: "", fields, values: { name, email } };

  console.log(`[signup] ${plan} ${JSON.stringify({ name, email })}`);
  return {
    ok: true,
    message: `Thanks, ${name.split(" ")[0]}. Accounts are opening shortly. We'll email ${email} as soon as your ${plan === "pro" ? "free trial" : "free account"} is ready.`,
  };
}
