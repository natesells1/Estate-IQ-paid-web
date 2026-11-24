import type { Property } from "./types";

/** Placeholder formula: 50 + equity / 4000, clamped 8-97. */
export function equityScore(p: Pick<Property, "kind" | "fairMarketValue" | "mortgage" | "finalJudgment">): number {
  const owed = p.kind === "lis_pendens" ? p.mortgage : p.finalJudgment ?? p.mortgage;
  const equity = p.fairMarketValue - owed;
  return Math.max(8, Math.min(97, Math.round(50 + equity / 4000)));
}

export type EquityBand = "great" | "good" | "fair" | "weak";

export function equityBand(score: number): EquityBand {
  if (score >= 80) return "great";
  if (score >= 70) return "good";
  if (score >= 45) return "fair";
  return "weak";
}

export const EQUITY_LABEL: Record<EquityBand, string> = {
  great: "Great",
  good: "Good",
  fair: "Fair",
  weak: "Weak",
};

/** Free users only see scores at or above this. */
export const FREE_SCORE_FLOOR = 70;
