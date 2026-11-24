import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import { SiteHeader, TabBar } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DemoBanner } from "@/components/DemoBanner";
import { siteUrl } from "@/lib/site";
import { currentUser, isProUser } from "@/lib/auth";
import "./globals.css";
import "./home.css";
import "./lis-pendens.css";
import "./auctions.css";
import "./property.css";
import "./signup.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", display: "swap", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Estate IQ - Florida lis pendens, foreclosure auctions and tax deed sales",
    template: "%s - Estate IQ",
  },
  description:
    "Be first to find the deals: new lis pendens filings, foreclosure auctions and tax deed sales across Florida, with an Equity Score on every property.",
  openGraph: { type: "website", siteName: "Estate IQ", locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

// Every page shows the signed-in state in the header, so pages render per visitor
export const dynamic = "force-dynamic";

export const viewport: Viewport = { themeColor: "#f6f4ee", colorScheme: "light" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const account = user ? { firstName: user.name.split(" ")[0], isPro: isProUser(user) } : null;
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body>
        <DemoBanner />
        <SiteHeader account={account} />
        <main>{children}</main>
        <SiteFooter />
        <TabBar />
      </body>
    </html>
  );
}
