import type { Metadata } from "next";
import { SavedList } from "@/components/SavedList";

export const metadata: Metadata = { title: "Saved properties", robots: { index: false } };

export default function SavedPage() {
  return (
    <section className="section">
      <div className="wrap">
        <h1 style={{ fontSize: 30, marginBottom: 6 }}>Saved properties</h1>
        <p className="muted" style={{ marginBottom: 18 }}>Properties you starred. They&apos;re saved in this browser.</p>
        <SavedList />
      </div>
    </section>
  );
}
