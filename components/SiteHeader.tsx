"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, LogoMark } from "./Icon";

export const NAV = [
  { href: "/#property-map", label: "Property map", match: "" },
  { href: "/auctions", label: "Auctions", match: "/auctions" },
  { href: "/lis-pendens", label: "Lis pendens", match: "/lis-pendens" },
  { href: "/signup#plans", label: "Pricing", match: "/signup" },
  { href: "/#about", label: "About us", match: "" },
];

export type HeaderAccount = { firstName: string; isPro: boolean } | null;

export function SiteHeader({ account }: { account: HeaderAccount }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="logo" aria-label="Estate IQ home">
          <LogoMark />
          Estate IQ
        </Link>
        <nav className="main-nav" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} aria-current={n.match && path.startsWith(n.match) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          {account ? (
            <Link href="/account" className="login" aria-current={path.startsWith("/account") ? "page" : undefined}>{account.firstName}{account.isPro && <span className="pro-tag">PRO</span>}</Link>
          ) : (
            <Link href="/login" className="login">Log in</Link>
          )}
          {!path.startsWith("/signup") && !account?.isPro && (
            <Link href="/signup?plan=pro" className="btn btn-primary">{account ? "Upgrade" : "Start free trial"}</Link>
          )}
          <button className="menu-btn" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
            <Icon name={open ? "close" : "menu"} size={22} />
          </button>
        </div>
      </div>
      <nav className="mobile-menu" data-open={open} aria-label="Mobile">
        {NAV.map((n) => (
          <Link key={n.label} href={n.href} onClick={() => setOpen(false)}>{n.label}</Link>
        ))}
        {account ? <Link href="/account">Your account</Link> : <Link href="/login">Log in</Link>}
      </nav>
    </header>
  );
}

const TABS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/lis-pendens", label: "Lis pendens", icon: "file" },
  { href: "/auctions", label: "Auctions", icon: "calendar" },
  { href: "/saved", label: "Saved", icon: "star" },
];

export function TabBar() {
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label="Sections">
      {TABS.map((t) => {
        const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined}>
            <Icon name={t.icon} size={20} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
