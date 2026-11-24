import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const next = sp.next?.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/account";
  if (await currentUser()) redirect(next);
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 460 }}>
        <LoginForm next={next} />
      </div>
    </section>
  );
}
