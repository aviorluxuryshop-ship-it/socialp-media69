import * as THREE from 'three'
import { CAN_HEIGHT, CAN_RADIUS } from './canGeometry'

/**
 * Builds a flavor's wraparound label from its four product photos.
 *
 * The photos (public/textures/<flavor>/onden|sagdan|arkadan|soldan.jpg) are
 * cropped rim-top to base and edge to edge, with the studio shading already
 * flattened by scripts/prepare-textures.mjs. Each is unwrapped onto the band
 * of the cylinder it shows: a straight-on photo's column at x sees the
 * surface at angle asin(2x − 1), so every texture column at angle θ from the
 * view's centre samples photo column x = 0.5 + 0.5·sin θ. Views cover ±50°
 * and cross-fade over their outer 10°, so neighbouring photos blend instead
 * of meeting at a seam.
 *
 * Texture layout. V = y / CAN_HEIGHT (canGeometry rewrites the body's UVs),
 * and CanvasTexture's default flipY puts canvas row 0 at the top of the can,
 * so canvas rows map 1:1 to photo rows. Around the can, the front faces the
 * camera at u = 0.5 (ProductModel applies the phase offset):
 *   u = 0.50 ÖN · 0.75 SAĞ (viewer's right) · 0.00 ARKA · 0.25 SOL
 */

const WIDTH = 2048
/** Same pixel density along the can as around it, so the photos aren't stretched. */
const HEIGHT = Math.round((WIDTH * CAN_HEIGHT) / (2 * Math.PI * CAN_RADIUS) / 8) * 8

const VIEWS = [
  { file: 'arkadan', centerU: 0 },
  { file: 'soldan', centerU: 0.25 },
  { file: 'sagdan', centerU: 0.75 },
  // front last, so it sits on top where it overlaps its neighbours
  { file: 'onden', centerU: 0.5 },
] as const

const CORE_DEG = 40
const FEATHER_DEG = 10

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`label photo missing: ${src}`))
    img.src = src
  })
}

function unwrapView(ctx: CanvasRenderingContext2D, img: HTMLImageElement, centerU: number) {
  const columns = Math.round(((CORE_DEG + FEATHER_DEG) / 360) * WIDTH)
  for (let c = -columns; c <= columns; c++) {
    const deg = (c / WIDTH) * 360
    const off = Math.abs(deg)
    const alpha = off <= CORE_DEG ? 1 : Math.max(0, 1 - (off - CORE_DEG) / FEATHER_DEG)
    if (alpha <= 0) continue
    const sx = Math.min(img.width - 1, Math.max(0, (0.5 + 0.5 * Math.sin((deg * Math.PI) / 180)) * img.width))
    const dx = (((Math.round(centerU * WIDTH) + c) % WIDTH) + WIDTH) % WIDTH
    ctx.globalAlpha = alpha
    ctx.drawImage(img, sx, 0, 1, img.height, dx, 0, 1, HEIGHT)
  }
  ctx.globalAlpha = 1
}

/**
 * How the finish varies across the print. Coloured ink over aluminium keeps
 * a metallic sheen; opaque white/dark ink doesn't. Treating the whole label
 * as one metal is what makes white type read grey.
 */
export const LABEL_FINISH = {
  tintedInk: { metalness: 0.55, roughness: 0.3 },
  opaqueInk: { metalness: 0.05, roughness: 0.42 },
}

/**
 * Metalness/roughness map (three reads roughness from G, metalness from B),
 * derived from the colour label: saturated pixels are tinted ink over
 * metal, unsaturated ones (white, black) are opaque ink. Half resolution.
 */
function buildFinishMap(source: HTMLCanvasElement) {
  const width = Math.round(source.width / 2)
  const height = Math.round(source.height / 2)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(source, 0, 0, width, height)
  const image = ctx.getImageData(0, 0, width, height)
  const px = image.data
  const { tintedInk, opaqueInk } = LABEL_FINISH
  for (let i = 0; i < px.length; i += 4) {
    const max = Math.max(px[i], px[i + 1], px[i + 2])
    const min = Math.min(px[i], px[i + 1], px[i + 2])
    const saturation = max === 0 ? 0 : (max - min) / max
    const s = Math.min(1, Math.max(0, (saturation - 0.15) / 0.45))
    px[i] = 255
    px[i + 1] = Math.round((opaqueInk.roughness + (tintedInk.roughness - opaqueInk.roughness) * s) * 255)
    px[i + 2] = Math.round((opaqueInk.metalness + (tintedInk.metalness - opaqueInk.metalness) * s) * 255)
    px[i + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

export type CanLabel = { map: THREE.CanvasTexture; finish: THREE.CanvasTexture }

/**
 * @param folder  e.g. "/textures/limon"
 * @param ground  printed colour, used as the base and as the whole label if the photos can't load
 */
export async function createCanLabel(folder: string, ground: string, maxAnisotropy = 8): Promise<CanLabel> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = ground
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  try {
    const images = await Promise.all(VIEWS.map((v) => loadImage(`${folder}/${v.file}.jpg`)))
    VIEWS.forEach((view, i) => unwrapView(ctx, images[i], view.centerU))
  } catch (error) {
    // a plain can in the right colour beats a broken page; never draw substitute artwork
    console.warn(error)
  }

  const map = new THREE.CanvasTexture(canvas)
  map.colorSpace = THREE.SRGBColorSpace
  const finish = new THREE.CanvasTexture(buildFinishMap(canvas))
  finish.colorSpace = THREE.NoColorSpace

  for (const texture of [map, finish]) {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.anisotropy = maxAnisotropy
    texture.needsUpdate = true
  }
  return { map, finish }
}
