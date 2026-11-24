import type { MetadataRoute } from "next";
import { publicRecords } from "@/lib/data/queries";
import { COUNTIES } from "@/lib/data/counties";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const pages = ["", "/auctions", "/signup"].map((p) => ({ url: `${base}${p}`, changeFrequency: "daily" as const }));
  const counties = COUNTIES.flatMap((c) => [
    { url: `${base}/lis-pendens/${c.slug}`, changeFrequency: "daily" as const },
    { url: `${base}/auctions?county=${c.slug}`, changeFrequency: "daily" as const },
  ]);
  const props = publicRecords().map((p) => ({ url: `${base}/property/${p.id}`, lastModified: p.date, changeFrequency: "weekly" as const }));
  return [...pages, ...counties, ...props];
}
