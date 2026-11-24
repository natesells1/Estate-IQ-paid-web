import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { SiteHeader, TabBar } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { siteUrl } from "@/lib/site";
import { currentUser, isProUser } from "@/lib/auth";
import "./globals.css";
import "./home.css";
import "./lis-pendens.css";
import "./auctions.css";
import "./property.css";
import "./signup.css";

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
  openGraph: { type: "website", siteName: "Estate IQ", locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

// Every page shows the signed-in state in the header, so pages render per visitor
export const dynamic = "force-dynamic";

export const viewport: Viewport = { themeColor: "#ffffff", colorScheme: "light" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const account = user ? { firstName: user.name.split(" ")[0], isPro: isProUser(user) } : null;
  return (
    <html lang="en" className={`${inter.variable} ${space.variable}`}>
      <body>
        <SiteHeader account={account} />
        <main>{children}</main>
        <SiteFooter />
        <TabBar />
      </body>
    </html>
  );
}
