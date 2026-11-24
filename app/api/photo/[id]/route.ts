// Placeholder house photo (SVG) until real street-view photos are wired in.
// Takes only the id; reveals nothing about the property.
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const SKIES = [["#cfe3e8", "#e9f1ef"], ["#d6e2ea", "#eef2ee"], ["#dfe6dc", "#f2f1e8"], ["#e4dccd", "#f1ede4"]];
const WALLS = ["#f5f1e8", "#eef0f2", "#f3ebe0", "#e9efe9"];
const ROOFS = ["#8d8f93", "#9a8576", "#7f8a93", "#a39283"];
const GRASS = ["#9cbf8c", "#a6c493", "#93b688", "#b1c79c"];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = hash(id);
  const [s1, s2] = SKIES[h % SKIES.length];
  const wall = WALLS[(h >>> 3) % WALLS.length];
  const roof = ROOFS[(h >>> 6) % ROOFS.length];
  const grass = GRASS[(h >>> 9) % GRASS.length];
  const shift = ((h >>> 12) % 40) - 20;
  const tree = (h >>> 15) % 2 === 0;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient></defs>
<rect width="320" height="240" fill="url(#s)"/>
<rect y="168" width="320" height="72" fill="${grass}"/>
${tree ? `<circle cx="${40 + shift}" cy="140" r="38" fill="#7aa36a"/><circle cx="${290 - shift}" cy="146" r="32" fill="#86ad74"/>` : `<circle cx="${280 - shift}" cy="138" r="40" fill="#7aa36a"/>`}
<g transform="translate(${shift} 0)">
<rect x="98" y="110" width="124" height="74" fill="${wall}"/>
<path d="M86 114 160 64l74 50z" fill="${roof}"/>
<rect x="150" y="138" width="20" height="46" fill="#8a6a50"/>
<rect x="110" y="128" width="28" height="20" fill="#b8cfdc" stroke="#fff" stroke-width="3"/>
<rect x="182" y="128" width="28" height="20" fill="#b8cfdc" stroke="#fff" stroke-width="3"/>
<path d="M150 184 140 240h40l-10-56z" fill="#e2dccd"/>
</g></svg>`;

  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400, immutable" },
  });
}
