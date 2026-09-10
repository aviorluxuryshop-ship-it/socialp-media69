/**
 * Bayburt Store — source media preparation.
 *
 * Takes the supplied product shots and the kit-free campaign backdrop and
 * turns them into what the site needs: kits cut out of their white studio
 * background with anti-aliased edges, and the two hero plates — the
 * landscape backdrop itself, and a portrait composition built from it.
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
 * The backdrop has a shop button painted into its foot, and the page draws a
 * real one of its own — two buttons, one of them dead. This lifts the painted
 * one out.
 *
 * The ground under it is flat obsidian with a slow vertical fall, so each row
 * is refilled by blending the colour just left of the box into the colour just
 * right of it, and the seam is feathered back into the original.
 */
const SHOP_BUTTON = { left: 0.4019, top: 0.8779, right: 0.5975, bottom: 0.9578 }
const FEATHER = 7

async function eraseShopButton(source) {
  const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  const x0 = Math.round(SHOP_BUTTON.left * width)
  const x1 = Math.round(SHOP_BUTTON.right * width)
  const y0 = Math.round(SHOP_BUTTON.top * height)
  const y1 = Math.round(SHOP_BUTTON.bottom * height)
  const SAMPLE = 20

  const median = (values) => {
    values.sort((a, b) => a - b)
    return values[values.length >> 1] ?? 0
  }

  const sample = (y, from) => {
    const channelValues = [[], [], []]
    for (let x = from; x < from + SAMPLE; x += 1) {
      const i = (y * width + Math.min(Math.max(x, 0), width - 1)) * channels
      for (let c = 0; c < 3; c += 1) channelValues[c].push(data[i + c])
    }
    return channelValues.map(median)
  }

  for (let y = y0; y <= y1; y += 1) {
    const left = sample(y, x0 - SAMPLE - 2)
    const right = sample(y, x1 + 3)
    const edgeY = Math.min(y - y0, y1 - y, FEATHER) / FEATHER

    for (let x = x0; x <= x1; x += 1) {
      const t = (x - x0) / Math.max(x1 - x0, 1)
      const edgeX = Math.min(x - x0, x1 - x, FEATHER) / FEATHER
      const blend = Math.min(edgeX, edgeY)
      const i = (y * width + x) * channels
      for (let c = 0; c < 3; c += 1) {
        const fill = left[c] + (right[c] - left[c]) * t
        data[i + c] = Math.round(data[i + c] + (fill - data[i + c]) * blend)
      }
    }
  }

  return sharp(data, { raw: { width, height, channels } }).jpeg({ quality: 96 }).toBuffer()
}

/**
 * Hero plate: the kit-free backdrop, shipped whole.
 *
 * media-source/banner.jpg is the campaign artwork with no kits in it — the
 * castle, the valley, the river, the city and the patterned right edge, and
 * nothing standing in front of them. The three kits are drawn live over it,
 * so there is nothing here to cut out or paint over.
 *
 * media-source/banner-placement.jpg is the same frame with the kits painted
 * in. It is the placement reference the live layout is calibrated against
 * and is never used as a background — nothing reads it at build time.
 */
async function buildHeroPlate(file) {
  const source = join(SOURCE, file)
  const meta = await sharp(source).metadata()
  const width = meta.width ?? 1600
  const height = meta.height ?? 901

  const cleaned = await eraseShopButton(source)
  const plate = sharp(cleaned)

  await plate.clone().jpeg({ quality: 84, mozjpeg: true }).toFile(join(HERO_DIR, 'plate.jpg'))
  await plate.clone().webp({ quality: 80 }).toFile(join(HERO_DIR, 'plate.webp'))
  console.log(`hero    plate ${width}x${height}`)

  await buildMobilePlate(cleaned, width, height)
}

/**
 * Portrait plate.
 *
 * The landscape backdrop crops to nothing usable on a phone — at that width a
 * cover crop keeps about a third of the frame and throws the valley away. So
 * portrait is composed from the same artwork instead: the valley, the river
 * and the mountains across the upper half, the castle down one edge, the tile
 * motif down the other, and the site's obsidian ground beneath for the kit to
 * stand on.
 *
 * Every crop stops short of the backdrop's baked typesetting — the wordmark
 * at the top, the kit names and the credit line at the foot — because the
 * page sets all of that live.
 */
async function buildMobilePlate(source, width, height) {
  const W = 900
  const H = 1600
  const EDGE = 300
  const SCENE_H = 580
  const SCENE_TOP = 150

  const ground = Buffer.from(
    `<svg width="${W}" height="${H}"><defs>` +
      `<radialGradient id="g" cx="0.5" cy="0.42" r="0.78">` +
      '<stop offset="0%" stop-color="#1B1713"/>' +
      '<stop offset="52%" stop-color="#0C0C0D"/>' +
      '<stop offset="100%" stop-color="#050505"/>' +
      `</radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`,
  )

  const fade = (direction) =>
    Buffer.from(
      `<svg width="${EDGE}" height="${H}"><defs><linearGradient id="f" x1="${
        direction === 'left' ? 0 : 1
      }" x2="${direction === 'left' ? 1 : 0}" y1="0" y2="0">` +
        '<stop offset="0%" stop-color="#fff" stop-opacity="1"/>' +
        '<stop offset="55%" stop-color="#fff" stop-opacity="0.66"/>' +
        '<stop offset="100%" stop-color="#fff" stop-opacity="0"/>' +
        `</linearGradient></defs><rect width="${EDGE}" height="${H}" fill="url(#f)"/></svg>`,
    )

  // The columns are cropped at full height so the side copy keeps its size and
  // stays whole; this washes their foot out before the backdrop's credit line
  // can be dragged into frame as half a word.
  const footFade = Buffer.from(
    `<svg width="${EDGE}" height="${H}"><defs><linearGradient id="b" x1="0" x2="0" y1="0" y2="1">` +
      '<stop offset="0%" stop-color="#fff" stop-opacity="1"/>' +
      '<stop offset="60%" stop-color="#fff" stop-opacity="1"/>' +
      '<stop offset="76%" stop-color="#fff" stop-opacity="0.16"/>' +
      '<stop offset="85%" stop-color="#fff" stop-opacity="0"/>' +
      `</linearGradient></defs><rect width="${EDGE}" height="${H}" fill="url(#b)"/></svg>`,
  )

  // The valley: wide enough to keep the river and the town, and cropped clear
  // of the backdrop's own typesetting — below the wordmark, above the names.
  const scene = await sharp(source)
    .extract({
      left: Math.round(width * 0.24),
      top: Math.round(height * 0.33),
      width: Math.round(width * 0.52),
      height: Math.round(height * 0.45),
    })
    .resize(W, SCENE_H, { fit: 'cover', position: 'centre' })
    // Feathered on all four sides. A hard-edged band reads as a rectangle
    // pasted over the ground, and its edge cuts across the side copy.
    .composite([
      {
        input: Buffer.from(
          `<svg width="${W}" height="${SCENE_H}"><defs><linearGradient id="s" x1="0" x2="0" y1="0" y2="1">` +
            '<stop offset="0%" stop-color="#fff" stop-opacity="0"/>' +
            '<stop offset="22%" stop-color="#fff" stop-opacity="0.6"/>' +
            '<stop offset="60%" stop-color="#fff" stop-opacity="0.6"/>' +
            '<stop offset="100%" stop-color="#fff" stop-opacity="0"/>' +
            `</linearGradient></defs><rect width="${W}" height="${SCENE_H}" fill="url(#s)"/></svg>`,
        ),
        blend: 'dest-in',
      },
      {
        input: Buffer.from(
          `<svg width="${W}" height="${SCENE_H}"><defs><linearGradient id="h" x1="0" x2="1" y1="0" y2="0">` +
            '<stop offset="0%" stop-color="#fff" stop-opacity="0"/>' +
            '<stop offset="26%" stop-color="#fff" stop-opacity="1"/>' +
            '<stop offset="74%" stop-color="#fff" stop-opacity="1"/>' +
            '<stop offset="100%" stop-color="#fff" stop-opacity="0"/>' +
            `</linearGradient></defs><rect width="${W}" height="${SCENE_H}" fill="url(#h)"/></svg>`,
        ),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer()

  // The castle occupies the backdrop's left quarter; the tile motif its right.
  const castle = await sharp(source)
    .extract({ left: 0, top: 0, width: Math.round(width * 0.25), height })
    .resize(EDGE, H, { fit: 'cover', position: 'left' })
    .composite([
      { input: fade('left'), blend: 'dest-in' },
      { input: footFade, blend: 'dest-in' },
    ])
    .png()
    .toBuffer()

  const tile = await sharp(source)
    .extract({
      left: width - Math.round(width * 0.14),
      top: 0,
      width: Math.round(width * 0.14),
      height,
    })
    .resize(EDGE, H, { fit: 'cover', position: 'right' })
    .composite([
      { input: fade('right'), blend: 'dest-in' },
      { input: footFade, blend: 'dest-in' },
    ])
    .png()
    .toBuffer()

  const vignette = Buffer.from(
    `<svg width="${W}" height="${H}"><defs><linearGradient id="v" x1="0" x2="0" y1="0" y2="1">` +
      '<stop offset="0%" stop-color="#050505" stop-opacity="0.93"/>' +
      '<stop offset="13%" stop-color="#050505" stop-opacity="0.66"/>' +
      '<stop offset="26%" stop-color="#050505" stop-opacity="0.18"/>' +
      '<stop offset="38%" stop-color="#050505" stop-opacity="0"/>' +
      '<stop offset="72%" stop-color="#050505" stop-opacity="0"/>' +
      '<stop offset="100%" stop-color="#050505" stop-opacity="0.8"/>' +
      `</linearGradient></defs><rect width="${W}" height="${H}" fill="url(#v)"/></svg>`,
  )

  const mobile = sharp(ground).composite([
    { input: scene, left: 0, top: SCENE_TOP },
    { input: castle, left: 0, top: 0 },
    { input: tile, left: W - EDGE, top: 0 },
    { input: vignette, left: 0, top: 0 },
  ])

  await mobile.clone().jpeg({ quality: 84, mozjpeg: true }).toFile(join(HERO_DIR, 'plate-mobile.jpg'))
  console.log(`hero    plate-mobile ${W}x${H}`)
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
