import "server-only";
import { cookies } from "next/headers";
import type { Viewer } from "./types";

/**
 * Who is looking. Until real accounts exist everyone is Free.
 * For local testing, set ALLOW_DEMO_PRO=1 and visit /api/demo-plan?plan=pro.
 */
export async function getViewer(): Promise<Viewer> {
  if (process.env.ALLOW_DEMO_PRO !== "1") return { isPro: false };
  const jar = await cookies();
  return { isPro: jar.get("eiq_plan")?.value === "pro" };
}
