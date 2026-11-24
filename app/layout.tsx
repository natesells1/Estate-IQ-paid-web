import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { SiteHeader, TabBar } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { siteUrl } from "@/lib/site";
import "./globals.css";
import "./home.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space", display: "swap", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Estate IQ - Florida lis pendens, foreclosure auctions and tax deed sales",
    template: "%s - Estate IQ",
  },
  description:
    "Your #1 data source to track all distressed properties in Florida: new lis pendens filings, foreclosure auctions and tax deed sales, with an Equity Score on every property.",
};

export const viewport: Viewport = { themeColor: "#ffffff", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable}`}>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <TabBar />
      </body>
    </html>
  );
}
