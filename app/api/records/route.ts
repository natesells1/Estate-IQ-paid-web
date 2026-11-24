import { findById, toView } from "@/lib/data/queries";
import { getViewer } from "@/lib/viewer";

// Saved properties: returns the given ids, redacted for the viewer like every other page.
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 100);
  const viewer = await getViewer();
  const records = ids.map((id) => findById(id)).filter((p) => !!p).map((p) => toView(p!, viewer));
  return Response.json({ records }, { headers: { "Cache-Control": "private, no-store" } });
}
