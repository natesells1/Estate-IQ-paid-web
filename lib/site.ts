export function siteUrl(): string {
  const fromEnv = process.env.SITE_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "");
  return (fromEnv || "http://localhost:3000").replace(/\/$/, "");
}
