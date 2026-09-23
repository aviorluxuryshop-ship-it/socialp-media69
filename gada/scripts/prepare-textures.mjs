/**
 * Cuts the client's 4-view product sheets into the files the site uses.
 *
 *   media-source/<flavor>-4-gorunum.jpg    one sheet per flavor: ÖN · ARKA · SAĞ · SOL, left to right,
 *                                          on white, captions underneath
 *   → public/textures/<flavor>/<view>.jpg  the can body, cropped tight (rim top → base, edge → edge) and
 *                                          with the studio shading flattened out, which canLabelTexture
 *                                          unwraps onto the 3D can (the 3D lights add shading back)
 *   → public/products/<flavor>-<view>.webp the untouched photo with breathing room, for the 2D catalog
 *   → src/lib/photo-metrics.json           measured can proportions and each flavor's printed colour,
 *                                          so the 3D can and the site palette match the photos
 *
 * Run with `npm run textures` after replacing a sheet.
 */
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const FLAVORS = ['limon', 'seftali']
/** Order of the views on each sheet, left to right. */
const VIEWS = ['onden', 'arkadan', 'sagdan', 'soldan']
/** Captions sit under the cans; ignore everything below this fraction of the sheet height. */
const CAN_AREA_BOTTOM = 0.89
/** A pixel counts as "can" when any channel is darker than this (the sheet is near-white). */
const WHITE_THRESHOLD = 232
/** Rows used to measure a column's printed colour: clear of the rim and the base. */
const BODY_ROWS = [0.06, 0.94]
/** How far the shading correction may push a column, so dark edges don't blow out. */
const GAIN_LIMITS = [0.75, 1.6]

function findCanBox(data, width, height, channels, x0, x1) {
  const yMax = Math.floor(height * CAN_AREA_BOTTOM)
  const colCounts = new Array(width).fill(0)
  const rowCounts = new Array(height).fill(0)
  for (let y = 0; y < yMax; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * channels
      if (data[i] < WHITE_THRESHOLD || data[i + 1] < WHITE_THRESHOLD || data[i + 2] < WHITE_THRESHOLD) {
        colCounts[x]++
        rowCounts[y]++
      }
    }
  }
  // a run threshold so specks of JPEG noise on the white don't stretch the box
  const minRun = 12
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (let x = x0; x < x1; x++) if (colCounts[x] > minRun) ((minX = Math.min(minX, x)), (maxX = Math.max(maxX, x)))
  for (let y = 0; y < yMax; y++) if (rowCounts[y] > minRun) ((minY = Math.min(minY, y)), (maxY = Math.max(maxY, y)))
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

function median(values) {
  const sorted = Float64Array.from(values).sort()
  return sorted[Math.floor(sorted.length / 2)]
}

/**
 * The printed ground dominates every column of the can, so a column's median colour is the
 * ground colour as lit in that column — the studio shading, sampled per column. Its ratio to
 * the flavor's reference colour is the gain that flattens the column without touching the art.
 */
function columnMedians(pixels, width, height) {
  const y0 = Math.floor(height * BODY_ROWS[0])
  const y1 = Math.floor(height * BODY_ROWS[1])
  const medians = []
  for (let x = 0; x < width; x++) {
    const channels = [[], [], []]
    for (let y = y0; y < y1; y++) {
      const i = (y * width + x) * 3
      channels[0].push(pixels[i])
      channels[1].push(pixels[i + 1])
      channels[2].push(pixels[i + 2])
    }
    medians.push(channels.map(median))
  }
  return medians
}

const toHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()

const metrics = { heightToWidth: 0, flavors: {} }
const ratios = []

for (const flavor of FLAVORS) {
  const src = join(root, 'media-source', `${flavor}-4-gorunum.jpg`)
  const sheet = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: sheetW, height: sheetH, channels } = sheet.info
  const quarter = sheetW / 4

  await mkdir(join(root, 'public', 'textures', flavor), { recursive: true })
  await mkdir(join(root, 'public', 'products'), { recursive: true })

  const crops = []
  for (let v = 0; v < VIEWS.length; v++) {
    const box = findCanBox(sheet.data, sheetW, sheetH, channels, Math.round(v * quarter), Math.round((v + 1) * quarter))
    ratios.push(box.height / box.width)
    const pixels = await sharp(src).removeAlpha().extract(box).raw().toBuffer()
    crops.push({ view: VIEWS[v], box, pixels, medians: columnMedians(pixels, box.width, box.height) })

    const pad = Math.round(box.width * 0.18)
    const left = Math.max(0, box.left - pad)
    const top = Math.max(0, box.top - pad)
    const padded = {
      left,
      top,
      width: Math.min(sheetW - left, box.width + pad * 2),
      height: Math.min(Math.floor(sheetH * CAN_AREA_BOTTOM) - top, box.height + pad * 2),
    }
    await sharp(src).extract(padded).webp({ quality: 88 }).toFile(join(root, 'public', 'products', `${flavor}-${VIEWS[v]}.webp`))
  }

  // reference colour: the middle fifth of every view, where the studio light is most even
  const centre = []
  for (const crop of crops) {
    const w = crop.box.width
    for (let x = Math.floor(w * 0.4); x < Math.ceil(w * 0.6); x++) centre.push(crop.medians[x])
  }
  const reference = [0, 1, 2].map((c) => median(centre.map((m) => m[c])))

  for (const crop of crops) {
    const { width: w, height: h } = crop.box
    const out = Buffer.alloc(w * h * 3)
    for (let x = 0; x < w; x++) {
      const gain = [0, 1, 2].map((c) => Math.min(GAIN_LIMITS[1], Math.max(GAIN_LIMITS[0], reference[c] / Math.max(1, crop.medians[x][c]))))
      for (let y = 0; y < h; y++) {
        const i = (y * w + x) * 3
        for (let c = 0; c < 3; c++) out[i + c] = Math.min(255, Math.round(crop.pixels[i + c] * gain[c]))
      }
    }
    await sharp(out, { raw: { width: w, height: h, channels: 3 } })
      .jpeg({ quality: 95 })
      .toFile(join(root, 'public', 'textures', flavor, `${crop.view}.jpg`))
    console.log(flavor, crop.view, crop.box)
  }

  metrics.flavors[flavor] = { printedColor: toHex(reference) }
  console.log(flavor, 'printed colour', toHex(reference))
}

metrics.heightToWidth = Number((ratios.reduce((a, b) => a + b, 0) / ratios.length).toFixed(4))
await writeFile(join(root, 'src', 'lib', 'photo-metrics.json'), JSON.stringify(metrics, null, 2) + '\n')
console.log('height / width', metrics.heightToWidth)
