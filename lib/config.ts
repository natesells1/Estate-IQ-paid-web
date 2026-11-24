// Prices and trial length live here, and only here.
export const PRO_PRICE_CENTS = 4900;
export const TRIAL_DAYS = 7;
export const SERVICES = {
  "title-search": { name: "Title search", cents: 9900 },
  "skip-trace": { name: "Skip trace", cents: 150 },
} as const;
export type ServiceKind = keyof typeof SERVICES;

export const PRO_PRICE_LABEL = `$${PRO_PRICE_CENTS / 100}`;
export const TRIAL_LABEL = `${TRIAL_DAYS}-day`;
export function money(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
}

/** Social profiles shown as icons in the footer. Add each profile URL to make its icon a link. */
export const SOCIALS: { network: "facebook" | "instagram" | "x" | "youtube" | "tiktok"; label: string; url: string }[] = [
  { network: "facebook", label: "Facebook", url: "" },
  { network: "instagram", label: "Instagram", url: "" },
  { network: "x", label: "X", url: "" },
  { network: "youtube", label: "YouTube", url: "" },
  { network: "tiktok", label: "TikTok", url: "" },
];
