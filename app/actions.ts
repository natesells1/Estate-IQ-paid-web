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
  console.log(`[alerts] new subscriber for ${c.name}`);
  return { ok: true, message: `You're on the list for ${c.name} County.` };
}
