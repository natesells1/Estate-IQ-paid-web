import { redirect } from "next/navigation";
import { COUNTY_BY_SLUG } from "@/lib/data/counties";

// Old-style links (/lis-pendens?county=lee&date=...&id=...) go to the county page.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const county = sp.county && COUNTY_BY_SLUG[sp.county] ? sp.county : "lee";
  const rest = new URLSearchParams();
  for (const k of ["date", "id", "q"]) if (sp[k]) rest.set(k, sp[k]!);
  const qs = rest.toString();
  redirect(`/lis-pendens/${county}${qs ? `?${qs}` : ""}`);
}
