import sharp from "sharp";

const svg = (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 512 512">
<defs>
  <radialGradient id="g" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#1a0a2e"/><stop offset="1" stop-color="#000"/></radialGradient>
  <filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10"/></filter>
</defs>
<rect width="512" height="512" fill="url(#g)"/>
<g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="40">
  <path d="M120 390 L256 118 L392 390" stroke="#00ff66" filter="url(#b)" opacity=".8"/>
  <path d="M120 390 L256 118 L392 390" stroke="#00ff66"/>
  <path d="M176 296 H336" stroke="#8a2be2"/>
</g>
</svg>`;

for (const [file, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["apple-touch-icon.png", 180]]) {
  await sharp(Buffer.from(svg(size))).png().toFile(`public/${file}`);
}
console.log("icons ok");
