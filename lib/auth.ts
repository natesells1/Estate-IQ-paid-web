import "server-only";
import { cookies, headers } from "next/headers";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { q } from "./db";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const COOKIE = "eiq_session";
const SESSION_DAYS = 30;

export interface User {
  id: string;
  email: string;
  name: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  trial_ends_at: Date | null;
  current_period_end: Date | null;
  had_trial: boolean;
}
const USER_COLS = "u.id, u.email, u.name, u.stripe_customer_id, u.stripe_subscription_id, u.subscription_status, u.trial_ends_at, u.current_period_end, u.had_trial";

/** Pro = an active or trialing Stripe subscription. */
export function isProUser(u: User | null): boolean {
  return !!u && (u.subscription_status === "active" || u.subscription_status === "trialing");
}

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [alg, saltB64, hashB64] = stored.split("$");
  if (alg !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(pw, Buffer.from(saltB64, "base64"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  await q("insert into sessions (token_hash, user_id, expires_at) values ($1, $2, $3)", [sha256(token), userId, expires]);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await q("delete from sessions where token_hash = $1", [sha256(token)]);
  jar.delete(COOKIE);
}

/** The signed-in user, or null. Never throws (a DB outage shows everyone the Free view). */
export async function currentUser(): Promise<User | null> {
  // Read cookies outside the try so Next.js still marks the page as per-visitor
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const rows = await q<User>(
      `select ${USER_COLS} from sessions s join users u on u.id = s.user_id where s.token_hash = $1 and s.expires_at > now()`,
      [sha256(token)],
    );
    return rows[0] ?? null;
  } catch (e) {
    console.error("[auth] session lookup failed", (e as Error).message);
    return null;
  }
}

export async function findUserByEmail(email: string) {
  const rows = await q<User & { password_hash: string }>(`select ${USER_COLS}, u.password_hash from users u where u.email = $1`, [email]);
  return rows[0] ?? null;
}

export async function getUserById(id: string) {
  const rows = await q<User>(`select ${USER_COLS} from users u where u.id = $1`, [id]);
  return rows[0] ?? null;
}

/* Simple in-memory rate limit for log-in / sign-up attempts (per instance). */
const attempts = new Map<string, { n: number; until: number }>();
export async function rateLimited(kind: string, key: string, max = 10, windowMs = 15 * 60e3): Promise<boolean> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const k = `${kind}:${ip}:${key}`;
  const now = Date.now();
  const a = attempts.get(k);
  if (!a || a.until < now) {
    attempts.set(k, { n: 1, until: now + windowMs });
    return false;
  }
  a.n++;
  return a.n > max;
}

/** Same-origin check for POST route handlers (server actions do this themselves). */
export async function sameOrigin(req: Request): Promise<boolean> {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
