/** One site-wide notice while the site runs on example data. Turn off with DEMO_DATA=0. */
export function DemoBanner() {
  if (process.env.DEMO_DATA === "0") return null;
  return (
    <div className="demo-banner" role="note">
      <b>Demo data.</b> Addresses, owners and values shown are examples until live county feeds are connected.
    </div>
  );
}
