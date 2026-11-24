import { currentUser, sameOrigin } from "@/lib/auth";
import { q } from "@/lib/db";
import { findById } from "@/lib/data/queries";

const TABLE = { saved: "saved_properties", watch: "property_watches" } as const;
type List = keyof typeof TABLE;

/** The signed-in user's saved and watched property ids. */
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ signedIn: false, saved: [], watch: [] }, { headers: { "Cache-Control": "private, no-store" } });
  const [saved, watch] = await Promise.all([
    q<{ property_id: string }>("select property_id from saved_properties where user_id = $1 order by created_at desc", [user.id]),
    q<{ property_id: string }>("select property_id from property_watches where user_id = $1 order by created_at desc", [user.id]),
  ]);
  return Response.json(
    { signedIn: true, saved: saved.map((r) => r.property_id), watch: watch.map((r) => r.property_id) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

/** Add or remove ids: { list: "saved" | "watch", ids: string[], on: boolean } */
export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return new Response("Forbidden", { status: 403 });
  const user = await currentUser();
  if (!user) return new Response("Sign in first", { status: 401 });
  let body: { list?: string; ids?: unknown; on?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const list = body.list as List;
  if (!(list in TABLE) || !Array.isArray(body.ids)) return new Response("Bad request", { status: 400 });
  const ids = (body.ids as unknown[]).filter((x): x is string => typeof x === "string" && !!findById(x)).slice(0, 200);
  for (const id of ids) {
    if (body.on) await q(`insert into ${TABLE[list]} (user_id, property_id) values ($1, $2) on conflict do nothing`, [user.id, id]);
    else await q(`delete from ${TABLE[list]} where user_id = $1 and property_id = $2`, [user.id, id]);
  }
  return Response.json({ ok: true });
}
