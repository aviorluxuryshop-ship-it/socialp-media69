/**
 * Bayburt Store — source media preparation.
 *
 * Takes the supplied product shots and campaign banner and turns them into
 * what the site needs: kits cut out of their white studio background with
 * anti-aliased edges, and a hero plate whose centre is soft so the kits read
 * against it while the castle and tile motif stay sharp at the edges.
 *
 *   npm run media -- <kaynak-klasörü>
 */

import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const JERSEY_DIR = join(ROOT, 'public', 'images', 'jerseys')
const HERO_DIR = join(ROOT, 'public', 'images', 'hero')

const SOURCE = process.argv[2]
if (!SOURCE) {
  console.error('Kullanım: node scripts/prepare-media.mjs <kaynak-klasörü>')
  process.exit(1)
}

/**
 * Studio white sits at 254–255. The threshold has to stay above the
 * specular highlights on the white kit's shoulder, which reach 248 and let
 * the fill leak into the garment; anti-aliased backdrop pixels just below it
 * are handled by the edge ramp instead.
 */
const BACKGROUND_MIN = 253
const NEUTRAL_TOLERANCE = 4
const EDGE_BAND = 5
const OUTPUT_MAX = 1100

const KITS = [
  { slug: 'hisar', file: 'hisar.jpg' },
  { slug: 'coruh', file: 'coruh.jpg' },
  { slug: 'cinimacin', file: 'cinimacin.jpg' },
]

const luminance = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b

/**
 * Flood fill the studio background from the borders, so the pale body of the
 * white kit is never mistaken for backdrop: it is enclosed, the backdrop is
 * not.
 */
function backgroundMask(data, width, height, channels) {
  const outside = new Uint8Array(width * height)
  const stack = []

  const isBackdrop = (index) => {
    const i = index * channels
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (r < BACKGROUND_MIN || g < BACKGROUND_MIN || b < BACKGROUND_MIN) return false
    return Math.max(r, g, b) - Math.min(r, g, b) <= NEUTRAL_TOLERANCE
  }

  for (let x = 0; x < width; x += 1) {
    stack.push(x, (height - 1) * width + x)
  }
  for (let y = 0; y < height; y += 1) {
    stack.push(y * width, y * width + width - 1)
  }

  while (stack.length) {
    const index = stack.pop()
    if (outside[index] || !isBackdrop(index)) continue
    outside[index] = 1
    const x = index % width
    const y = (index - x) / width
    if (x > 0) stack.push(index - 1)
    if (x < width - 1) stack.push(index + 1)
    if (y > 0) stack.push(index - width)
    if (y < height - 1) stack.push(index + width)
  }

  return outside
}

/** Distance-limited band inward from the cut, where edges get feathered. */
function edgeBand(outside, width, height) {
  const band = new Uint8Array(width * height)
  let front = []

  for (let index = 0; index < outside.length; index += 1) {
    if (!outside[index]) continue
    const x = index % width
    const y = (index - x) / width
    const neighbours = [
      x > 0 ? index - 1 : -1,
      x < width - 1 ? index + 1 : -1,
      y > 0 ? index - width : -1,
      y < height - 1 ? index + width : -1,
    ]
    for (const n of neighbours) {
      if (n >= 0 && !outside[n] && !band[n]) {
        band[n] = 1
        front.push(n)
      }
    }
  }

  for (let step = 1; step < EDGE_BAND; step += 1) {
    const next = []
    for (const index of front) {
      const x = index % width
      const y = (index - x) / width
      const neighbours = [
        x > 0 ? index - 1 : -1,
        x < width - 1 ? index + 1 : -1,
        y > 0 ? index - width : -1,
        y < height - 1 ? index + width : -1,
      ]
      for (const n of neighbours) {
        if (n >= 0 && !outside[n] && !band[n]) {
          band[n] = 1
          next.push(n)
        }
      }
    }
    front = next
  }

  return band
}

async function cutOutKit(slug, file) {
  const source = join(SOURCE, file)
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  const outside = backgroundMask(data, width, height, channels)
  const band = edgeBand(outside, width, height)

  const rgba = Buffer.alloc(width * height * 4)
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0

  for (let index = 0; index < width * height; index += 1) {
    const s = index * channels
    const d = index * 4
    const r = data[s]
    const g = data[s + 1]
    const b = data[s + 2]

    let alpha = 255
    if (outside[index]) {
      alpha = 0
    } else if (band[index]) {
      // Ramp the last few pixels so the cut is not a hard staircase.
      alpha = Math.round(Math.min(1, Math.max(0, (252 - luminance(r, g, b)) / 10)) * 255)
    }

    // Cut pixels are written black, not left as the studio's white. Their
    // colour still reaches the screen wherever something samples or blends
    // across the edge — a texture filter, or multisample coverage along a
    // polygon border — and white bleeds visibly against a dark stage.
    const keep = alpha > 0
    rgba[d] = keep ? r : 0
    rgba[d + 1] = keep ? g : 0
    rgba[d + 2] = keep ? b : 0
    rgba[d + 3] = alpha

    if (alpha > 8) {
      const x = index % width
      const y = (index - x) / width
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.03)
  const left = Math.max(0, minX - pad)
  const top = Math.max(0, minY - pad)
  const cropWidth = Math.min(width - left, maxX - minX + pad * 2)
  const cropHeight = Math.min(height - top, maxY - minY + pad * 2)

  // Written at the garment's own aspect, with no padding. The 3D stage
  // builds its plane from the file's dimensions, so the alpha cutout lands on
  // the silhouette instead of somewhere out in a transparent margin.
  const out = join(JERSEY_DIR, `${slug}.png`)
  const info2 = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize(OUTPUT_MAX, OUTPUT_MAX, { fit: 'inside', withoutEnlargement: false })
    .png({ compressionLevel: 9 })
    .toFile(out)

  console.log(`kesildi  ${slug}  ${cropWidth}x${cropHeight} -> ${info2.width}x${info2.height}`)
}

/**
 * Hero plate: the banner with its centre softened, and the castle and tile
 * motif restored sharp at the edges. The kits are drawn live on top, so the
 * artwork baked into the middle of the banner is deliberately blurred away.
 */
async function buildHeroPlate(file) {
  const source = join(SOURCE, file)
  const meta = await sharp(source).metadata()
  const width = meta.width ?? 1672
  const height = meta.height ?? 941

  // The centre of the banner has kits, a wordmark and labels baked into it,
  // all of which the live page draws itself. Rather than blurring them into
  // recognisable ghosts, the centre is rebuilt from a clean vertical strip of
  // the valley — the one part of the frame no artwork sits on.
  // The banner ships as-is. Its castle, mountains, river and tile motif are
  // the whole reason it looks expensive, and every attempt to mask the kits
  // baked into it also killed the landscape behind them. The live kits are
  // drawn over the baked ones instead — same photographs, so they cover.
  const plate = sharp(source)

  await plate.clone().jpeg({ quality: 84, mozjpeg: true }).toFile(join(HERO_DIR, 'plate.jpg'))
  await plate.clone().webp({ quality: 80 }).toFile(join(HERO_DIR, 'plate.webp'))
  console.log(`hero    plate ${width}x${height}`)
}

async function main() {
  for (const dir of [JERSEY_DIR, HERO_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }

  for (const kit of KITS) {
    await cutOutKit(kit.slug, kit.file)
  }
  await buildHeroPlate('banner.jpg')
}

await main()
