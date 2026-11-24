// Placeholder aerial lot image (SVG) until real aerial imagery is wired in.
// Takes only the id; reveals nothing about the property.
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = hash(id);
  const water = h % 3 === 0;
  const shift = (h >>> 4) % 30;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">
<rect width="320" height="180" fill="#9db28f"/>
${water ? `<path d="M230 0 C 200 60 250 110 215 180 L 320 180 L 320 0 Z" fill="#7d9fb0"/>` : `<rect x="250" y="0" width="70" height="180" fill="#a9bb98"/>`}
<rect x="0" y="${118 + (shift % 10)}" width="320" height="12" fill="#d9d4c3"/>
<rect x="${95 + shift}" y="0" width="12" height="180" fill="#d9d4c3"/>
<rect x="28" y="22" width="48" height="36" fill="#ece6d8"/>
<rect x="28" y="148" width="52" height="26" fill="#ece6d8"/>
<rect x="${135 + shift}" y="148" width="46" height="26" fill="#ece6d8"/>
<rect x="${138 + shift}" y="24" width="62" height="44" fill="#ece6d8"/>
<rect x="${128 + shift}" y="14" width="82" height="66" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="7 5"/>
<circle cx="${214 + (shift % 8)}" cy="40" r="13" fill="#5f8a55"/>
<circle cx="${58 + (shift % 12)}" cy="88" r="11" fill="#5f8a55"/>
<circle cx="${196 + shift / 2}" cy="96" r="12" fill="#5f8a55"/>
</svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400, immutable" } });
}
