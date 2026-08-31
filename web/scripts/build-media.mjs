/**
 * Builds the optimised public/media library from the brand's original assets.
 *
 * Source images are the full-resolution originals published on Socialp Media's own
 * site (up to 3840x5120). We derive responsive AVIF + WebP renditions, tiny LQIP
 * placeholders, and transparent white marks for the logo / brand-strip lockups.
 *
 * Run: npm run media
 */
import sharp from 'sharp';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'media-src');
const OUT = path.join(ROOT, 'public', 'media');
const MARKS_OUT = path.join(ROOT, 'public', 'marks');

const WIDTHS = [400, 800, 1280, 1920];
const cfg = JSON.parse(await readFile(path.join(ROOT, 'scripts', 'assets.json'), 'utf8'));

sharp.cache(false);
sharp.concurrency(4);

await rm(OUT, { recursive: true, force: true });
await rm(MARKS_OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await mkdir(MARKS_OUT, { recursive: true });

/** 16px-wide WebP data URI used as a blur-up placeholder (prevents flash + CLS). */
async function lqip(input) {
  const buf = await sharp(input).resize(16).webp({ quality: 30 }).toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

const manifest = { images: {}, marks: {} };

for (const a of cfg.assets) {
  const file = path.join(SRC, a.src);
  if (!existsSync(file)) {
    console.warn(`  ! missing source: ${a.src}`);
    continue;
  }
  const meta = await sharp(file).metadata();
  const widths = WIDTHS.filter((w) => w <= meta.width);
  if (widths.length === 0) widths.push(meta.width);

  for (const w of widths) {
    const base = sharp(file).resize({ width: w, withoutEnlargement: true });
    await base.clone().avif({ quality: 52, effort: 4 }).toFile(path.join(OUT, `${a.id}-${w}.avif`));
    await base.clone().webp({ quality: 78 }).toFile(path.join(OUT, `${a.id}-${w}.webp`));
  }

  manifest.images[a.id] = {
    width: meta.width,
    height: meta.height,
    widths,
    kind: a.kind,
    cat: a.cat,
    blur: await lqip(file),
  };
  console.log(`  ok ${a.id.padEnd(22)} ${meta.width}x${meta.height} -> ${widths.join(',')}`);
}

/**
 * Brand marks and the wordmark ship as white-on-black artwork. We map luminance to
 * alpha so a single asset renders correctly on any surface, then trim the padding.
 */
async function whiteMark(file, outPath) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = info.width * info.height;
  const out = Buffer.alloc(px * 4);
  for (let i = 0; i < px; i++) {
    const r = data[i * info.channels];
    const g = data[i * info.channels + 1];
    const b = data[i * info.channels + 2];
    // Rec. 709 luma doubles as the alpha channel for white artwork on black.
    const luma = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    out[i * 4] = 255;
    out[i * 4 + 1] = 255;
    out[i * 4 + 2] = 255;
    out[i * 4 + 3] = luma;
  }

  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 6 })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  return sharp(outPath).metadata();
}

for (const m of cfg.marks) {
  const file = path.join(SRC, m.src);
  if (!existsSync(file)) {
    console.warn(`  ! missing mark: ${m.src}`);
    continue;
  }
  const meta = await whiteMark(file, path.join(MARKS_OUT, `${m.id}.png`));
  manifest.marks[m.id] = { label: m.label, width: meta.width, height: meta.height };
  console.log(`  ok mark ${m.id.padEnd(17)} ${meta.width}x${meta.height}`);
}

const logoMeta = await whiteMark(path.join(SRC, cfg.logo.src), path.join(MARKS_OUT, 'socialp.png'));
manifest.logo = { width: logoMeta.width, height: logoMeta.height };
console.log(`  ok logo ${logoMeta.width}x${logoMeta.height}`);

await writeFile(
  path.join(ROOT, 'src', 'lib', 'media-manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(`\nDone. ${Object.keys(manifest.images).length} images, ${Object.keys(manifest.marks).length} marks.`);
