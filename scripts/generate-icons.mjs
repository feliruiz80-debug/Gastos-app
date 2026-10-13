import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const publicIcons = path.join(root, "public", "icons");

/** Full-bleed square mark (iOS/Android apply their own mask). */
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" fill="none">
  <defs>
    <linearGradient id="bg" x1="120" y1="0" x2="920" y2="1024" gradientUnits="userSpaceOnUse">
      <stop stop-color="#201c18"/>
      <stop offset="0.45" stop-color="#14110f"/>
      <stop offset="1" stop-color="#0a0908"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(340 280) rotate(95) scale(560 500)">
      <stop stop-color="#1f8a4c" stop-opacity="0.38"/>
      <stop offset="1" stop-color="#1f8a4c" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ring" x1="220" y1="170" x2="820" y2="860" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f0d7a4"/>
      <stop offset="0.45" stop-color="#c4a574"/>
      <stop offset="1" stop-color="#7a6238"/>
    </linearGradient>
    <linearGradient id="m" x1="300" y1="250" x2="740" y2="780" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fffaf3"/>
      <stop offset="1" stop-color="#e7ddd0"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>

  <!-- Outer coin -->
  <circle cx="512" cy="512" r="346" fill="#171310" stroke="url(#ring)" stroke-width="34" filter="url(#soft)"/>
  <circle cx="512" cy="512" r="308" stroke="#f6f1e8" stroke-opacity="0.1" stroke-width="8"/>

  <!-- Bold M -->
  <path
    fill="url(#m)"
    d="M300 720V320c0-18 14-32 32-32h68c13 0 25 7 31 18l86 165c4 8 12 12 20 12s16-4 20-12l86-165c6-11 18-18 31-18h68c18 0 32 14 32 32v400c0 18-14 32-32 32h-70c-18 0-32-14-32-32V458c0-11-13-17-22-11l-66 120c-7 13-21 21-36 21h-16c-15 0-29-8-36-21l-66-120c-9-6-22 0-22 11v262c0 18-14 32-32 32h-70c-18 0-32-14-32-32Z"
  />

  <!-- Growth accent -->
  <path
    stroke="#3ecf7a"
    stroke-width="30"
    stroke-linecap="round"
    stroke-linejoin="round"
    d="M648 648 738 558 818 618"
  />
</svg>`;

/** Maskable: keep mark inside ~80% safe zone. */
const maskableSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" fill="none">
  <defs>
    <linearGradient id="bg" x1="120" y1="0" x2="920" y2="1024" gradientUnits="userSpaceOnUse">
      <stop stop-color="#201c18"/>
      <stop offset="0.45" stop-color="#14110f"/>
      <stop offset="1" stop-color="#0a0908"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(340 280) rotate(95) scale(560 500)">
      <stop stop-color="#1f8a4c" stop-opacity="0.38"/>
      <stop offset="1" stop-color="#1f8a4c" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ring" x1="220" y1="170" x2="820" y2="860" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f0d7a4"/>
      <stop offset="0.45" stop-color="#c4a574"/>
      <stop offset="1" stop-color="#7a6238"/>
    </linearGradient>
    <linearGradient id="m" x1="300" y1="250" x2="740" y2="780" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fffaf3"/>
      <stop offset="1" stop-color="#e7ddd0"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  <g transform="translate(512 512) scale(0.78) translate(-512 -512)">
    <circle cx="512" cy="512" r="346" fill="#171310" stroke="url(#ring)" stroke-width="34"/>
    <circle cx="512" cy="512" r="308" stroke="#f6f1e8" stroke-opacity="0.1" stroke-width="8"/>
    <path
      fill="url(#m)"
      d="M300 720V320c0-18 14-32 32-32h68c13 0 25 7 31 18l86 165c4 8 12 12 20 12s16-4 20-12l86-165c6-11 18-18 31-18h68c18 0 32 14 32 32v400c0 18-14 32-32 32h-70c-18 0-32-14-32-32V458c0-11-13-17-22-11l-66 120c-7 13-21 21-36 21h-16c-15 0-29-8-36-21l-66-120c-9-6-22 0-22 11v262c0 18-14 32-32 32h-70c-18 0-32-14-32-32Z"
    />
    <path stroke="#3ecf7a" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" d="M648 648 738 558 818 618"/>
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
console.log("done");
