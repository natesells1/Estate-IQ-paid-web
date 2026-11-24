import "server-only";
// Postgres on Railway (DATABASE_URL). Locally, with no DATABASE_URL, an embedded
// Postgres (PGlite) in .data/ is used so the site runs with zero setup.

type Result<T> = { rows: T[] };
interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<Result<T>>;
}

const SCHEMA = `
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  subscription_status text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  had_trial boolean not null default false
);
create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_idx on sessions(user_id);
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null,
  property_id text not null,
  amount_cents integer not null,
  status text not null default 'pending',
  stripe_session_id text unique,
  created_at timestamptz not null default now()
);
create index if not exists orders_user_idx on orders(user_id);
create table if not exists alert_subscribers (
  id serial primary key,
  email text not null,
  county text not null,
  created_at timestamptz not null default now(),
  unique (email, county)
);
`;

let ready: Promise<Db> | null = null;

async function connect(): Promise<Db> {
  let db: Db;
  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "1" ? { rejectUnauthorized: false } : undefined,
      max: 10,
    });
    db = { query: async (text, params) => ({ rows: (await pool.query(text, params as unknown[])).rows }) };
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const { mkdirSync } = await import("node:fs");
    mkdirSync("./.data", { recursive: true });
    const lite = new PGlite("./.data/pglite");
    db = { query: async (text, params) => ({ rows: (await lite.query(text, params as unknown[])).rows as never[] }) };
  }
  // Statements run one at a time so both drivers accept them
  for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) await db.query(stmt);
  return db;
}

export function db(): Promise<Db> {
  if (!ready) ready = connect().catch((e) => { ready = null; throw e; });
  return ready;
}

export async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await (await db()).query<T>(text, params)).rows;
}
