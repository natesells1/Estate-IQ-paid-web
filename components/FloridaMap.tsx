import Link from "next/link";
import type { CountyStat } from "@/lib/data/queries";
import { COUNTY_BY_SLUG } from "@/lib/data/counties";

// Simplified Florida outline (lng, lat), clockwise from the Alabama line.
const OUTLINE: [number, number][] = [
  [-87.6, 31.0], [-85.0, 31.0], [-84.86, 30.71], [-83.2, 30.64], [-82.21, 30.57], [-82.03, 30.75], [-81.45, 30.71],
  [-81.4, 30.33], [-81.28, 29.88], [-81.0, 29.2], [-80.6, 28.6], [-80.56, 28.4], [-80.37, 27.6], [-80.07, 26.95],
  [-80.03, 26.7], [-80.1, 26.1], [-80.13, 25.77], [-80.3, 25.4], [-80.45, 25.2], [-80.9, 25.13], [-81.1, 25.35],
  [-81.37, 25.85], [-81.8, 26.14], [-81.96, 26.45], [-82.26, 26.75], [-82.45, 27.1], [-82.58, 27.35], [-82.75, 27.6],
  [-82.68, 27.75], [-82.83, 27.98], [-82.8, 28.17], [-82.7, 28.9], [-83.05, 29.15], [-83.4, 29.6], [-84.0, 30.08],
  [-84.2, 30.0], [-84.6, 29.9], [-84.98, 29.72], [-85.35, 29.68], [-85.4, 29.9], [-85.7, 30.1], [-86.5, 30.39],
  [-87.2, 30.33], [-87.5, 30.28],
];

const px = (lng: number) => (lng + 87.7) * 88;
const py = (lat: number) => (31.1 - lat) * 100;
const PATH = "M" + OUTLINE.map(([lng, lat]) => `${px(lng).toFixed(1)},${py(lat).toFixed(1)}`).join("L") + "Z";
const LAKE = { cx: px(-80.83), cy: py(26.95), rx: 22, ry: 18 };

// Hand-placed bubble rows (x of the first bubble, y) and label side, so nothing overlaps.
const PLACE: Record<string, { x: number; y: number; label: "left" | "right" }> = {
  duval: { x: 560, y: 80, label: "right" },
  polk: { x: 528, y: 300, label: "right" },
  manatee: { x: 486, y: 360, label: "right" },
  lee: { x: 520, y: 438, label: "right" },
  broward: { x: 632, y: 486, label: "right" },
  "miami-dade": { x: 624, y: 548, label: "right" },
};
const R = 19;
const GAP = 42;
const COLORS = ["#8B5CF6", "#1E3A8A", "#EA7317"];

export function FloridaMap({ stats }: { stats: CountyStat[] }) {
  return (
    <div className="fl-map">
      {/* Desktop: three count bubbles per county */}
      <svg className="fl-desk" viewBox="220 30 665 545" role="group" aria-label="Florida hot counties: new lis pendens filings, auction results and tax deeds in the last 30 days">
        <rect x="0" y="0" width="900" height="640" fill="var(--water)" />
        <path d={PATH} fill="var(--land)" stroke="#e2dccd" strokeWidth="2" strokeLinejoin="round" />
        <ellipse {...LAKE} fill="var(--water)" />
        {stats.map((s) => {
          const at = PLACE[s.slug];
          if (!at) return null;
          const counts = [s.lisPendens, s.auctionResults, s.taxDeeds];
          const label = COUNTY_BY_SLUG[s.slug].name.toUpperCase();
          const lw = label.length * 9.5 + 18;
          const lx = at.label === "right" ? at.x + GAP * 2 + R + 10 : at.x - R - 10 - lw;
          return (
            <Link key={s.slug} href={`/lis-pendens/${s.slug}`} className="fl-county">
              <title>{`${label}: ${counts[0]} lis pendens, ${counts[1]} auction results, ${counts[2]} tax deeds`}</title>
              {counts.map((n, i) => (
                <g key={i}>
                  <circle cx={at.x + i * GAP} cy={at.y} r={R} fill={COLORS[i]} stroke="#fff" strokeWidth="3" />
                  <text x={at.x + i * GAP} y={at.y + 4.5} textAnchor="middle" className="fl-bubble">{n}</text>
                </g>
              ))}
              <rect x={lx} y={at.y - 13} width={lw} height="26" rx="5" fill="#fff" fillOpacity="0.92" />
              <text x={lx + lw / 2} y={at.y + 4.5} textAnchor="middle" className="fl-label">{label}</text>
            </Link>
          );
        })}
      </svg>

      {/* Mobile: one dot per county with a name chip; counts are in the list below */}
      <svg className="fl-mob" viewBox="190 20 540 580" role="img" aria-label="Map of Florida hot counties">
        <rect x="0" y="0" width="900" height="620" fill="var(--water)" />
        <path d={PATH} fill="var(--land)" stroke="#e2dccd" strokeWidth="2" strokeLinejoin="round" />
        <ellipse {...LAKE} fill="var(--water)" />
        {stats.map((s) => {
          const c = COUNTY_BY_SLUG[s.slug];
          const dx = px(c.lng), dy = py(c.lat);
          const label = `${s.name.toUpperCase()} · ${s.lisPendens + s.auctionResults + s.taxDeeds}`;
          const w = label.length * 11 + 20;
          return (
            <g key={s.slug}>
              <rect x={dx - 18 - w} y={dy - 16} width={w} height="32" rx="7" fill="#fff" />
              <text x={dx - 18 - w / 2} y={dy + 6} textAnchor="middle" className="fl-chip">{label}</text>
              <circle cx={dx} cy={dy} r="11" fill="var(--ink)" stroke="#fff" strokeWidth="3" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
