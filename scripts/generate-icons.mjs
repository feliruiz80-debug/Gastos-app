import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const publicIcons = path.join(root, "public", "icons");

/** Full-bleed square: Money / Manager como el título de la app. */
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" fill="none">
  <defs>
    <linearGradient id="bg" x1="80" y1="0" x2="960" y2="1024" gradientUnits="userSpaceOnUse">
      <stop stop-color="#221c18"/>
      <stop offset="0.5" stop-color="#14110f"/>
      <stop offset="1" stop-color="#0a0908"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(320 260) rotate(95) scale(580 520)">
      <stop stop-color="#1f8a4c" stop-opacity="0.34"/>
      <stop offset="1" stop-color="#1f8a4c" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="name" x1="180" y1="420" x2="860" y2="700" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f7efe3"/>
      <stop offset="0.45" stop-color="#e8d7bc"/>
      <stop offset="1" stop-color="#c4a574"/>
    </linearGradient>
    <linearGradient id="line" x1="280" y1="0" x2="744" y2="0" gradientUnits="userSpaceOnUse">
      <stop stop-color="#c4a574" stop-opacity="0"/>
      <stop offset="0.25" stop-color="#c4a574"/>
      <stop offset="0.5" stop-color="#3ecf7a"/>
      <stop offset="0.75" stop-color="#c4a574"/>
      <stop offset="1" stop-color="#c4a574" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>

  <!-- MONEY -->
  <text
    x="512"
    y="430"
    text-anchor="middle"
    fill="#b6aa9c"
    font-family="Inter, ui-sans-serif, system-ui, sans-serif"
    font-size="78"
    font-weight="650"
    letter-spacing="28"
  >MONEY</text>

  <!-- Manager -->
  <text
    x="512"
    y="590"
    text-anchor="middle"
    fill="url(#name)"
    font-family="Inter, ui-sans-serif, system-ui, sans-serif"
    font-size="148"
    font-weight="750"
    letter-spacing="-4"
  >Manager</text>

  <!-- Accent line -->
  <rect x="300" y="640" width="424" height="6" rx="3" fill="url(#line)"/>
</svg>`;

/** Maskable: texto un poco más chico dentro del safe zone. */
const maskableSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" fill="none">
  <defs>
    <linearGradient id="bg" x1="80" y1="0" x2="960" y2="1024" gradientUnits="userSpaceOnUse">
      <stop stop-color="#221c18"/>
      <stop offset="0.5" stop-color="#14110f"/>
      <stop offset="1" stop-color="#0a0908"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(320 260) rotate(95) scale(580 520)">
      <stop stop-color="#1f8a4c" stop-opacity="0.34"/>
      <stop offset="1" stop-color="#1f8a4c" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="name" x1="180" y1="420" x2="860" y2="700" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f7efe3"/>
      <stop offset="0.45" stop-color="#e8d7bc"/>
      <stop offset="1" stop-color="#c4a574"/>
    </linearGradient>
    <linearGradient id="line" x1="280" y1="0" x2="744" y2="0" gradientUnits="userSpaceOnUse">
      <stop stop-color="#c4a574" stop-opacity="0"/>
      <stop offset="0.25" stop-color="#c4a574"/>
      <stop offset="0.5" stop-color="#3ecf7a"/>
      <stop offset="0.75" stop-color="#c4a574"/>
      <stop offset="1" stop-color="#c4a574" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  <g transform="translate(512 512) scale(0.78) translate(-512 -512)">
    <text x="512" y="430" text-anchor="middle" fill="#b6aa9c" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="78" font-weight="650" letter-spacing="28">MONEY</text>
    <text x="512" y="590" text-anchor="middle" fill="url(#name)" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="148" font-weight="750" letter-spacing="-4">Manager</text>
    <rect x="300" y="640" width="424" height="6" rx="3" fill="url(#line)"/>
  </g>
</svg>`;

async function render(svgSource, filePath, size) {
  const buffer = await sharp(Buffer.from(svgSource))
    .resize(size, size, { fit: "fill" })
    .flatten({ background: "#14110f" })
    .png()
    .toBuffer();
  await writeFile(filePath, buffer);
  console.log("wrote", path.relative(root, filePath), `${size}x${size}`);
}

await mkdir(publicIcons, { recursive: true });
await writeFile(path.join(publicIcons, "logo.svg"), svg);

await render(svg, path.join(root, "src/app/icon.png"), 32);
await render(svg, path.join(root, "src/app/apple-icon.png"), 180);
await render(svg, path.join(publicIcons, "icon-192.png"), 192);
await render(svg, path.join(publicIcons, "icon-512.png"), 512);
await render(svg, path.join(publicIcons, "icon-1024.png"), 1024);
await render(maskableSvg, path.join(publicIcons, "maskable-512.png"), 512);
await render(svg, path.join(publicIcons, "favicon-16.png"), 16);
await render(svg, path.join(publicIcons, "favicon-32.png"), 32);
await render(svg, path.join(root, "public", "apple-touch-icon.png"), 180);
console.log("done");
