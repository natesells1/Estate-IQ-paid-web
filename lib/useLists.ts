"use client";
import { useEffect, useState } from "react";

// Saved + watched properties. Signed in: stored on the account. Signed out: this browser only.
type Lists = { signedIn: boolean; saved: string[]; watch: string[] };
const LOCAL_KEY = "eiq_saved";

let state: Lists | null = null;
let loading: Promise<Lists> | null = null;
const listeners = new Set<(l: Lists) => void>();

function readLocal(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
  } catch {
    return [];
  }
}

async function load(): Promise<Lists> {
  const res = await fetch("/api/lists", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ signedIn: false, saved: [], watch: [] }));
  if (!res.signedIn) return { signedIn: false, saved: readLocal(), watch: [] };
  // First visit after signing in: move this browser's saved properties onto the account
  const local = readLocal().filter((id) => !res.saved.includes(id));
  if (local.length) {
    await fetch("/api/lists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ list: "saved", ids: local, on: true }) });
    localStorage.removeItem(LOCAL_KEY);
    res.saved = [...local, ...res.saved];
  }
  return res;
}

function publish(next: Lists) {
  state = next;
  listeners.forEach((l) => l(next));
}

export function useLists() {
  const [lists, setLists] = useState<Lists | null>(state);
  useEffect(() => {
    listeners.add(setLists);
    if (!state) (loading ??= load()).then(publish);
    return () => void listeners.delete(setLists);
  }, []);

  async function toggle(list: "saved" | "watch", id: string) {
    const cur = state ?? (await (loading ??= load()));
    const on = !cur[list].includes(id);
    const next = { ...cur, [list]: on ? [id, ...cur[list]] : cur[list].filter((x) => x !== id) };
    publish(next);
    if (cur.signedIn) {
      await fetch("/api/lists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ list, ids: [id], on }) });
    } else if (list === "saved") {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next.saved));
    }
  }

  return { lists, toggle };
}
