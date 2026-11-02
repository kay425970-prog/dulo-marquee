/**
 * Regenerates every icon/PWA asset from one vector master so artwork is
 * reproducible instead of being hand-committed binary blobs.
 *
 *   node scripts/generate-icons.mjs
 *
 * Requires `sharp` (already a dependency of the Next.js image pipeline).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const MARK = `
  <mask id="mark">
    <rect width="512" height="512" fill="#000"/>
    <circle cx="222" cy="300" r="118" fill="#fff"/>
    <rect x="288" y="106" width="64" height="312" rx="32" fill="#fff"/>
    <circle cx="398" cy="386" r="36" fill="#fff"/>
    <circle cx="222" cy="300" r="51" fill="#000"/>
  </mask>`;

function svg({ radius = 0.225, fg = "#ffffff", bg = true } = {}) {
  const r = (radius * 512).toFixed(2);
  const sw = (512 * 0.014).toFixed(2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff3b3b"/>
      <stop offset="52%" stop-color="#da1b1b"/>
      <stop offset="100%" stop-color="#8a0d0d"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.20"/>
      <stop offset="48%" stop-color="#ffffff" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    ${MARK}
  </defs>
  ${bg ? `<rect width="512" height="512" rx="${r}" ry="${r}" fill="url(#bg)"/><rect width="512" height="512" rx="${r}" ry="${r}" fill="url(#sheen)"/>` : ""}
  <rect width="512" height="512" fill="${fg}" mask="url(#mark)"/>
  ${bg ? `<rect x="${sw}" y="${sw}" width="${512 - sw * 2}" height="${512 - sw * 2}" rx="${r}" ry="${r}" fill="none" stroke="#ffffff" stroke-opacity="0.15" stroke-width="${sw}"/>` : ""}
</svg>`;
}

function ico(pngs, sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  const entries = [];
  let offset = 6 + 16 * sizes.length;
  sizes.forEach((size, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(pngs[i].length, 8);
    e.writeUInt32LE(offset, 12);
    offset += pngs[i].length;
    entries.push(e);
  });
  return Buffer.concat([header, ...entries, ...pngs]);
}

const master = await sharp(Buffer.from(svg())).resize(1024, 1024).png().toBuffer();
const png = (size) => sharp(master).resize(size, size).png().toBuffer();

for (const dir of ["public", "src/app", "electron/build"]) {
  mkdirSync(dir, { recursive: true });
}

// Web / PWA
writeFileSync("public/icon-192.png", await png(192));
writeFileSync("public/icon-512.png", await png(512));
writeFileSync("public/icon-1024.png", await png(1024));
writeFileSync("public/favicon-16x16.png", await png(16));
writeFileSync("public/favicon-32x32.png", await png(32));
writeFileSync("public/logo.svg", svg());
writeFileSync("public/favicon.svg", svg());
writeFileSync(
  "public/icon-maskable-512.png",
  await sharp(Buffer.from(svg({ radius: 0.5 }))).resize(512, 512).png().toBuffer()
);

// Next.js app-dir metadata icons
writeFileSync("src/app/icon.svg", svg());
writeFileSync("src/app/apple-icon.png", await png(180));

// Multi-resolution .ico (tab + bookmarks + taskbar)
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
writeFileSync(
  "public/favicon.ico",
  ico(await Promise.all(icoSizes.map((s) => png(s))), icoSizes)
);

// Desktop (Electron) + Android TV banner
writeFileSync("electron/build/icon.png", await png(512));
writeFileSync(
  "electron/build/icon.ico",
  ico(await Promise.all(icoSizes.map((s) => png(s))), icoSizes)
);

console.log("✔ icons regenerated (public/, src/app/, electron/build/)");
