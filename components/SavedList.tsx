"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ViewRecord } from "@/lib/types";
import { RecordCard } from "./RecordBits";

export function SavedList() {
  const [records, setRecords] = useState<ViewRecord[] | null>(null);
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    let saved: string[] = [];
    try {
      saved = JSON.parse(localStorage.getItem("eiq_saved") ?? "[]");
    } catch {}
    setIds(saved);
    if (!saved.length) return setRecords([]);
    fetch(`/api/records?ids=${encodeURIComponent(saved.join(","))}`)
      .then((r) => r.json())
      .then((d) => setRecords(d.records))
      .catch(() => setRecords([]));
  }, []);

  function remove(id: string) {
    const next = ids.filter((x) => x !== id);
    setIds(next);
    localStorage.setItem("eiq_saved", JSON.stringify(next));
    setRecords((rs) => rs?.filter((r) => r.id !== id) ?? null);
  }

  if (records === null) return <p className="muted">Loading your saved properties…</p>;
  if (!records.length)
    return (
      <div className="card" style={{ padding: 24 }}>
        <p>No saved properties yet. Tap the star on an auction card, or Save to CRM on a property card.</p>
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <Link href="/auctions" className="btn btn-primary">Auction calendar</Link>
          <Link href="/lis-pendens/lee" className="btn btn-ghost">Lis pendens</Link>
        </div>
      </div>
    );
  return (
    <div className="card-grid">
      {records.map((r) => (
        <div key={r.id} className="saved-item">
          <RecordCard r={r} />
          <button type="button" className="text-link small saved-remove" onClick={() => remove(r.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
