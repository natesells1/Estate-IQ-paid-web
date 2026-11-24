import "server-only";
import { currentUser, isProUser } from "./auth";
import type { Viewer } from "./types";

/** Who is looking: Pro means an active or trialing Stripe subscription. */
export async function getViewer(): Promise<Viewer> {
  const user = await currentUser();
  return { isPro: isProUser(user), signedIn: !!user };
}
