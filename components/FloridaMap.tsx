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
// Lake Okeechobee
const LAKE = { cx: px(-80.83), cy: py(26.95), rx: 22, ry: 18 };

const LABEL_W = 184;
const LABEL_H = 56;
const LEFT_X = 190;
const RIGHT_X = 700;

export function FloridaMap({ stats }: { stats: CountyStat[] }) {
  return (
    <div className="fl-map">
      {/* Desktop: name + three counts in callouts outside the coastline */}
      <svg className="fl-desk" viewBox="170 30 730 590" role="img" aria-label="Map of Florida hot counties with new lis pendens, auction results and tax deed counts">
        <rect width="900" height="620" fill="var(--water)" />
        <path d={PATH} fill="var(--land)" stroke="#e2dccd" strokeWidth="2" strokeLinejoin="round" />
        <ellipse {...LAKE} fill="var(--water)" />
        {stats.map((s) => {
          const c = COUNTY_BY_SLUG[s.slug];
          const dx = px(c.lng), dy = py(c.lat);
          const left = c.labelSide === "left";
          const lx = left ? LEFT_X : RIGHT_X;
          const ly = c.labelY;
          const anchorX = left ? lx + LABEL_W : lx;
          const counts = [
            { n: s.lisPendens, fill: "var(--lp-soft)", ink: "var(--lp-deep)" },
            { n: s.auctionResults, fill: "var(--fc-soft)", ink: "var(--fc)" },
            { n: s.taxDeeds, fill: "var(--td-soft)", ink: "#b4540a" },
          ];
          return (
            <Link key={s.slug} href={`/lis-pendens?county=${s.slug}`} className="fl-county">
              <line x1={anchorX} y1={ly + LABEL_H / 2} x2={dx} y2={dy} stroke="var(--ink)" strokeOpacity="0.35" strokeWidth="1.5" />
              <circle cx={dx} cy={dy} r="9" fill="var(--ink)" stroke="#fff" strokeWidth="3" />
              <g transform={`translate(${lx} ${ly})`}>
                <rect width={LABEL_W} height={LABEL_H} rx="10" fill="#fff" stroke="var(--border)" />
                <text x="12" y="21" className="fl-name">{s.name}</text>
                {counts.map((k, i) => (
                  <g key={i} transform={`translate(${12 + i * 56} 29)`}>
                    <rect width="50" height="20" rx="5" fill={k.fill} />
                    <text x="25" y="14.5" textAnchor="middle" className="fl-count" fill={k.ink}>{k.n}</text>
                  </g>
                ))}
              </g>
            </Link>
          );
        })}
      </svg>

      {/* Mobile: dots with a compact name chip; full counts are in the list below */}
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
