import type { Metadata } from "next";
import { ComingNext } from "@/components/ComingNext";

export const metadata: Metadata = { title: "Florida foreclosure and tax deed auction calendar" };

export default function Page() {
  return <ComingNext title="Auction calendar"><p>Every foreclosure auction and tax deed sale by day, with results grouped by county.</p></ComingNext>;
}
