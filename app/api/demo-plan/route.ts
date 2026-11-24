import { NextResponse } from "next/server";

// Demo only: toggles the Pro view before real accounts exist. Disabled unless ALLOW_DEMO_PRO=1.
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (process.env.ALLOW_DEMO_PRO !== "1") return new NextResponse("Not found", { status: 404 });
  const plan = url.searchParams.get("plan") === "pro" ? "pro" : "free";
  const res = NextResponse.redirect(new URL("/", url));
  res.cookies.set("eiq_plan", plan, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
