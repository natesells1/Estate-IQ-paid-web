import type { Metadata } from "next";
import { ComingNext } from "@/components/ComingNext";

export const metadata: Metadata = { title: "Lis pendens filings by day" };

export default function Page() {
  return <ComingNext title="Lis pendens by day"><p>New filings for each county, one day at a time, on a map with property cards.</p></ComingNext>;
}
