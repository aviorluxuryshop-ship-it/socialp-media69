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

const OUTPUT_MAX = 1100

const KITS = [
  { slug: 'hisar', file: 'hisar.webp' },
  { slug: 'coruh', file: 'coruh.png' },
  { slug: 'cinimacin', file: 'cinimacin.png' },
]

/**
 * Kits.
 *
 * The supplied product shots already come with a transparent background, so
 * nothing here touches a pixel of the garment: the frame is trimmed to the
 * artwork's own alpha bounds and the result is scaled down. The trim matters
 * because the stage maps the texture straight onto its quad — the texture has
 * to be the garment and nothing else, or the kit floats inside its own margin.
 */
async function prepareKit(slug, file) {
  const source = join(SOURCE, file)
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  let left = width
  let right = -1
  let top = height
  let bottom = -1
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * channels + 3] < 8) continue
      if (x < left) left = x
      if (x > right) right = x
      if (y < top) top = y
      if (y > bottom) bottom = y
    }
  }
  if (right < 0) throw new Error(`${file}: görselde şeffaf olmayan piksel yok`)

  const cropWidth = right - left + 1
  const cropHeight = bottom - top + 1
  const scale = Math.min(1, OUTPUT_MAX / Math.max(cropWidth, cropHeight))

  const trimmed = sharp(source)
    .ensureAlpha()
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize(Math.round(cropWidth * scale), Math.round(cropHeight * scale), { fit: 'fill' })

  const out = await trimmed.clone().png({ compressionLevel: 9 }).toFile(join(JERSEY_DIR, `${slug}.png`))

  // The 3D stage uploads the file to WebGL itself, so the image optimiser
  // never touches it — this is the copy it actually loads.
  await trimmed.clone().webp({ quality: 86, alphaQuality: 92 }).toFile(join(JERSEY_DIR, `${slug}.webp`))

  console.log(`forma  ${slug}  ${width}x${height} -> ${out.width}x${out.height}`)
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

  // The plate keeps its own proportion on desktop, so a wide window shows
  // ground either side of it. This is that ground: the same artwork reduced
  // to a smear of its colour, which the page darkens further.
  await sharp(cleaned)
    .resize(96, 54, { fit: 'cover' })
    .blur(6)
    .jpeg({ quality: 70 })
    .toFile(join(HERO_DIR, 'plate-ground.jpg'))
  console.log('hero    plate-ground 96x54')

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

  // The columns fade out well before their inner edge. The backdrop carries
  // TARİH ŞEHİR TAKIM BİZ down one side and KÜLTÜR MİRAS İNANÇ DAİMA down the
  // other, and on a phone the kit stands right on top of them — half a word
  // either side of a jersey. Fading the copy away is the whole point of where
  // these stops sit; the castle and the tile motif keep the outer half.
  const fade = (direction) =>
    Buffer.from(
      `<svg width="${EDGE}" height="${H}"><defs><linearGradient id="f" x1="${
        direction === 'left' ? 0 : 1
      }" x2="${direction === 'left' ? 1 : 0}" y1="0" y2="0">` +
        '<stop offset="0%" stop-color="#fff" stop-opacity="1"/>' +
        '<stop offset="22%" stop-color="#fff" stop-opacity="0.9"/>' +
        '<stop offset="38%" stop-color="#fff" stop-opacity="0.2"/>' +
        '<stop offset="50%" stop-color="#fff" stop-opacity="0"/>' +
        '<stop offset="100%" stop-color="#fff" stop-opacity="0"/>' +
        `</linearGradient></defs><rect width="${EDGE}" height="${H}" fill="url(#f)"/></svg>`,
    )

  // Head and foot of each column washed out: the backdrop's sky at the top,
  // which reads as a light leak against the obsidian, and its credit line at
  // the bottom, which would otherwise arrive as half a word.
  const footFade = Buffer.from(
    `<svg width="${EDGE}" height="${H}"><defs><linearGradient id="b" x1="0" x2="0" y1="0" y2="1">` +
      '<stop offset="0%" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset="10%" stop-color="#fff" stop-opacity="0.38"/>' +
      '<stop offset="21%" stop-color="#fff" stop-opacity="1"/>' +
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
      '<stop offset="0%" stop-color="#050505" stop-opacity="0.96"/>' +
      '<stop offset="13%" stop-color="#050505" stop-opacity="0.78"/>' +
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
    await prepareKit(kit.slug, kit.file)
  }
  await buildHeroPlate('banner.jpg')
}

await main()
