// Dates are plain ISO strings (yyyy-mm-dd) in Florida (Eastern) time.

export function floridaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(iso: string, n: number): string {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function isWeekend(iso: string): boolean {
  const day = parse(iso).getUTCDay();
  return day === 0 || day === 6;
}

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" }).format(parse(iso));
}

export function fmtMoney(n: number | undefined | null): string {
  if (n == null) return "—";
  return "$" + Math.round(n).toLocaleString("en-US");
}
