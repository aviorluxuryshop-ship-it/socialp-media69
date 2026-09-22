import * as THREE from 'three'
import { BODY_BOTTOM_Y, BODY_TOP_Y, CAN_HEIGHT, CAN_RADIUS, WALL_BOTTOM_Y, WALL_TOP_Y } from './canGeometry'

/**
 * Builds the wraparound label texture for the can body.
 *
 * Geometry UVs are height-true (V = y / CAN_HEIGHT, see canGeometry), so a
 * canvas row maps to a fixed height on the can: row = (1 - y/H) * HEIGHT
 * (CanvasTexture's default flipY puts canvas row 0 at V=1, the can's top).
 *
 * Around the can, U follows the angle. The front faces the camera at u=0.5
 * (ProductModel applies the phase offset), so:
 *   u=0.50 FRONT · u=0.75 RIGHT (viewer's right) · u=0.00 BACK · u=0.25 LEFT
 *
 * REAL PACKAGING: drop the four product photos into /public/textures as
 * onden.jpg, sagdan.jpg, arkadan.jpg, soldan.jpg — each cropped tight to the
 * can's left/right edges and to the top of the rim / bottom of the base.
 * They are unwrapped onto the cylinder (a photo's column at x sees the
 * surface at angle asin(2x-1), so columns are resampled by that, not
 * stretched flat) and cross-faded at the seams. No code changes needed.
 *
 * Until then a placeholder label is drawn using only the brand's own stated
 * copy — GAZA / Portakallı ve Çay Aromalı İçecek / 330 ml — and its orange.
 * No invented logo mark, claims, nutrition values or ingredients.
 */

/**
 * Artwork is laid out in a 2048-wide design space; the canvas is rendered
 * at `scale` × that (1 on phones, 1.5 on desktop so the macro shots stay
 * sharp). HEIGHT gives the same pixel density along the can as around it.
 */
const WIDTH = 2048
const HEIGHT = Math.round((WIDTH * CAN_HEIGHT) / (2 * Math.PI * CAN_RADIUS) / 8) * 8

const rowAt = (y: number) => (1 - y / CAN_HEIGHT) * HEIGHT

/** Artwork stays on the straight wall, clear of the neck and the base taper. */
const WALL_TOP = rowAt(WALL_TOP_Y) + 24
const WALL_BOTTOM = rowAt(WALL_BOTTOM_Y) - 24
const WALL_MID = (WALL_TOP + WALL_BOTTOM) / 2
const NECK_ROW = rowAt(BODY_TOP_Y)
const BASE_ROW = rowAt(BODY_BOTTOM_Y)

const GAZA_ORANGE = '#FF6A13'
const GAZA_ORANGE_DEEP = '#E0560A'
const CREAM = '#FBF6EE'

const PHOTO_FILES = {
  front: '/textures/onden.jpg',
  right: '/textures/sagdan.jpg',
  back: '/textures/arkadan.jpg',
  left: '/textures/soldan.jpg',
} as const

type Photos = Record<keyof typeof PHOTO_FILES, HTMLImageElement>

function tryLoadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

async function loadReferencePhotos(): Promise<Photos | null> {
  const entries = await Promise.all(
    Object.entries(PHOTO_FILES).map(async ([key, src]) => [key, await tryLoadImage(src)] as const),
  )
  if (entries.some(([, img]) => !img)) return null
  return Object.fromEntries(entries) as Photos
}

/** The body is printed all over: the brand orange, deepening where the wall turns into the neck and base. */
function printedGround(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, NECK_ROW, 0, BASE_ROW)
  const neck = (WALL_TOP - NECK_ROW) / (BASE_ROW - NECK_ROW)
  const base = (WALL_BOTTOM - NECK_ROW) / (BASE_ROW - NECK_ROW)
  grad.addColorStop(0, GAZA_ORANGE_DEEP)
  grad.addColorStop(neck, GAZA_ORANGE)
  grad.addColorStop(base, GAZA_ORANGE)
  grad.addColorStop(1, GAZA_ORANGE_DEEP)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
}

/** Placeholder citrus mark — a stylised orange with two leaves. Swapped out by the real photos. */
function orangeGlyph(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(scale, scale)

  const orb = ctx.createRadialGradient(-16, -16, 6, 0, 0, 52)
  orb.addColorStop(0, '#FFE2B8')
  orb.addColorStop(0.4, '#FFB35C')
  orb.addColorStop(1, '#F26A00')
  ctx.fillStyle = orb
  ctx.beginPath()
  ctx.arc(0, 0, 50, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255,255,255,0.6)'
  ctx.lineWidth = 2.5
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6)
    ctx.lineTo(Math.cos(a) * 44, Math.sin(a) * 44)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(0, 0, 45, 0, Math.PI * 2)
  ctx.stroke()

  const leaf = (rot: number, len: number, color: string) => {
    ctx.save()
    ctx.rotate(rot)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, -46)
    ctx.quadraticCurveTo(len * 0.55, -46 - len * 0.45, len, -46 - len * 0.1)
    ctx.quadraticCurveTo(len * 0.5, -46 + len * 0.12, 0, -46)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(4, -46)
    ctx.quadraticCurveTo(len * 0.5, -46 - len * 0.2, len * 0.92, -46 - len * 0.1)
    ctx.stroke()
    ctx.restore()
  }
  leaf(0.1, 62, '#2F7D34')
  leaf(-0.55, 44, '#3E9443')

  ctx.restore()
}

function pill(ctx: CanvasRenderingContext2D, cx: number, y: number, w: number, h: number, text: string) {
  const r = h / 2
  ctx.fillStyle = 'rgba(10,10,11,0.88)'
  ctx.beginPath()
  ctx.roundRect(cx - w / 2, y, w, h, r)
  ctx.fill()
  ctx.fillStyle = CREAM
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '700 32px Inter, sans-serif'
  ctx.fillText(text, cx, y + h / 2 + 1)
  ctx.textBaseline = 'alphabetic'
}

function drawFront(ctx: CanvasRenderingContext2D, cx: number) {
  orangeGlyph(ctx, cx, WALL_TOP + 150, 1.25)

  ctx.textAlign = 'center'
  ctx.fillStyle = CREAM
  ctx.font = '900 184px Poppins, sans-serif'
  ctx.shadowColor = 'rgba(90,30,0,0.35)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 5
  ctx.fillText('GAZA', cx, WALL_MID + 70)
  ctx.shadowColor = 'transparent'

  ctx.font = '600 36px Inter, sans-serif'
  ctx.fillStyle = 'rgba(251,246,238,0.95)'
  ctx.letterSpacing = '4px'
  ctx.fillText('PORTAKALLI VE ÇAY', cx, WALL_MID + 150)
  ctx.fillText('AROMALI İÇECEK', cx, WALL_MID + 198)
  ctx.letterSpacing = '0px'

  pill(ctx, cx, WALL_BOTTOM - 110, 176, 62, '330 ml')
}

function drawSideMark(ctx: CanvasRenderingContext2D, cx: number) {
  orangeGlyph(ctx, cx, WALL_MID - 30, 2.1)
}

function drawVerticalWordmark(ctx: CanvasRenderingContext2D, cx: number) {
  ctx.save()
  ctx.translate(cx, WALL_MID)
  ctx.rotate(-Math.PI / 2)
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(251,246,238,0.92)'
  ctx.font = '900 150px Poppins, sans-serif'
  ctx.fillText('GAZA', 0, 52)
  ctx.restore()
}

function drawBack(ctx: CanvasRenderingContext2D, cx: number) {
  ctx.textAlign = 'center'
  ctx.fillStyle = CREAM
  ctx.font = '900 96px Poppins, sans-serif'
  ctx.fillText('GAZA', cx, WALL_MID - 40)
  ctx.font = '600 28px Inter, sans-serif'
  ctx.letterSpacing = '3px'
  ctx.fillStyle = 'rgba(251,246,238,0.9)'
  ctx.fillText('PORTAKALLI VE ÇAY', cx, WALL_MID + 20)
  ctx.fillText('AROMALI İÇECEK', cx, WALL_MID + 58)
  ctx.letterSpacing = '0px'
  pill(ctx, cx, WALL_MID + 100, 150, 54, '330 ml')
}

function drawPlaceholderLabel(ctx: CanvasRenderingContext2D) {
  printedGround(ctx)

  drawFront(ctx, WIDTH * 0.5)
  drawSideMark(ctx, WIDTH * 0.75)
  drawVerticalWordmark(ctx, WIDTH * 0.25)
  // the back straddles the u=0/1 seam: draw it on both edges so it wraps seamlessly
  drawBack(ctx, 0)
  drawBack(ctx, WIDTH)
}

/**
 * Resamples one straight-on photo of the can onto the band of U it covers.
 * Each texture column at angle θ from the view's centre reads the photo
 * column at x = 0.5 + 0.5·sin θ. Covers ±50° with the outer 10° feathered,
 * so neighbouring views cross-fade instead of meeting at a hard seam.
 */
function unwrapView(ctx: CanvasRenderingContext2D, img: HTMLImageElement, centerU: number) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const coreDeg = 40
  const featherDeg = 10
  const columns = Math.round(((coreDeg + featherDeg) / 360) * width)

  for (let c = -columns; c <= columns; c++) {
    const deg = (c / width) * 360
    const alpha = Math.abs(deg) <= coreDeg ? 1 : Math.max(0, 1 - (Math.abs(deg) - coreDeg) / featherDeg)
    if (alpha <= 0) continue

    const sx = Math.min(img.width - 1, Math.max(0, (0.5 + 0.5 * Math.sin((deg * Math.PI) / 180)) * img.width))
    const dx = (((Math.round(centerU * width) + c) % width) + width) % width

    ctx.globalAlpha = alpha
    ctx.drawImage(img, sx, 0, 1, img.height, dx, 0, 1, height)
  }
  ctx.globalAlpha = 1
}

function drawPhotoLabel(ctx: CanvasRenderingContext2D, photos: Photos, scale: number) {
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  printedGround(ctx)
  // the photos are resampled per real pixel column, so drop the design-space transform
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  unwrapView(ctx, photos.back, 0)
  unwrapView(ctx, photos.left, 0.25)
  unwrapView(ctx, photos.right, 0.75)
  unwrapView(ctx, photos.front, 0.5)
}

async function waitForFonts() {
  if (!document.fonts) return
  try {
    await Promise.all([
      document.fonts.load('900 184px Poppins'),
      document.fonts.load('600 36px Inter'),
      document.fonts.load('700 32px Inter'),
    ])
  } catch {
    // font loading API unavailable — the canvas falls back to system sans
  }
}

/**
 * How the finish varies across the can. Coloured ink over aluminium keeps
 * a metallic sheen; opaque white/dark ink doesn't; bare metal is a mirror.
 * Treating the whole label as one metal is what makes white type read grey.
 */
export const LABEL_FINISH = {
  tintedInk: { metalness: 0.7, roughness: 0.28 },
  opaqueInk: { metalness: 0.06, roughness: 0.42 },
}

/**
 * Derives a metalness/roughness map (three reads roughness from G, metalness
 * from B) from the finished colour label, so it works identically for the
 * placeholder and for the real photos: saturated pixels are tinted ink over
 * metal, unsaturated ones (white, black) are opaque ink. Half resolution is
 * plenty for a finish.
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

export async function createCanLabel({ scale = 1, maxAnisotropy = 8 } = {}): Promise<CanLabel> {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(WIDTH * scale)
  canvas.height = Math.round(HEIGHT * scale)
  const ctx = canvas.getContext('2d')!

  const [photos] = await Promise.all([loadReferencePhotos(), waitForFonts()])
  if (photos) {
    drawPhotoLabel(ctx, photos, scale)
  } else {
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    drawPlaceholderLabel(ctx)
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
