import * as THREE from 'three'

/**
 * Turns a flat kit render into real 3D geometry.
 *
 * The artwork's own alpha channel drives everything: blurring it produces a
 * field that is 0 at the garment's silhouette and 1 deep inside the body, so
 * pushing vertices along Z by that field inflates the shirt into a closed
 * shell whose front and back panels meet exactly at the edge. Cloth folds are
 * layered on top and damped by the same field, which keeps the hem and cuffs
 * crisp instead of rippling.
 */

const FIELD_SIZE = 192
const SEGMENTS = 110
const BLUR_PASSES = 5
const BLUR_RADIUS = 5

export interface JerseyMeshes {
  front: THREE.BufferGeometry
  texture: THREE.Texture
  /** Width ÷ height of the kit artwork; the plane is built to match. */
  aspect: number
  dispose: () => void
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Görsel yüklenemedi: ${src}`))
    image.src = src
  })
}

/**
 * Draw the kit into a square working canvas, inset by a pixel so the
 * outermost texels are guaranteed transparent and clamped edge sampling can
 * never light the plane's border. The square stretch is undone by building
 * the plane at the artwork's own aspect.
 */
const INSET = 12

function drawToCanvas(image: HTMLImageElement, size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('2D bağlamı alınamadı')
  const inset = Math.max(1, Math.round((INSET * size) / 1024))
  context.drawImage(image, inset, inset, size - inset * 2, size - inset * 2)
  return canvas
}

/** Separable box blur over a single-channel field. */
function blur(
  field: Float32Array<ArrayBuffer>,
  size: number,
  radius: number,
): Float32Array<ArrayBuffer> {
  const temp = new Float32Array(field.length)
  const out = new Float32Array(field.length)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let sum = 0
      let count = 0
      for (let k = -radius; k <= radius; k += 1) {
        const sx = x + k
        if (sx < 0 || sx >= size) continue
        sum += field[y * size + sx] ?? 0
        count += 1
      }
      temp[y * size + x] = count ? sum / count : 0
    }
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let sum = 0
      let count = 0
      for (let k = -radius; k <= radius; k += 1) {
        const sy = y + k
        if (sy < 0 || sy >= size) continue
        sum += temp[sy * size + x] ?? 0
        count += 1
      }
      out[y * size + x] = count ? sum / count : 0
    }
  }

  return out
}

/** Alpha of the artwork, blurred into a soft inside-the-garment field. */
function buildField(canvas: HTMLCanvasElement): Float32Array<ArrayBuffer> {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('2D bağlamı alınamadı')

  const { data } = context.getImageData(0, 0, FIELD_SIZE, FIELD_SIZE)
  let field: Float32Array<ArrayBuffer> = new Float32Array(FIELD_SIZE * FIELD_SIZE)
  for (let i = 0; i < field.length; i += 1) {
    field[i] = (data[i * 4 + 3] ?? 0) / 255
  }

  for (let pass = 0; pass < BLUR_PASSES; pass += 1) {
    field = blur(field, FIELD_SIZE, BLUR_RADIUS)
  }

  // Re-normalise so the deepest point reaches full thickness.
  let max = 0
  for (const value of field) if (value > max) max = value
  if (max > 0) {
    for (let i = 0; i < field.length; i += 1) field[i] /= max
  }

  return field
}

function sampleField(field: Float32Array<ArrayBuffer>, u: number, v: number): number {
  const x = Math.min(FIELD_SIZE - 1, Math.max(0, Math.round(u * (FIELD_SIZE - 1))))
  // Texture space runs top-down; UV space runs bottom-up.
  const y = Math.min(FIELD_SIZE - 1, Math.max(0, Math.round((1 - v) * (FIELD_SIZE - 1))))
  return field[y * FIELD_SIZE + x] ?? 0
}

function buildPanel(
  field: Float32Array<ArrayBuffer>,
  depth: number,
  sign: number,
  aspect: number,
) {
  const geometry = new THREE.PlaneGeometry(aspect, 1, SEGMENTS, SEGMENTS)
  const position = geometry.attributes.position as THREE.BufferAttribute
  const uv = geometry.attributes.uv as THREE.BufferAttribute

  for (let i = 0; i < position.count; i += 1) {
    const u = uv.getX(i)
    const v = uv.getY(i)
    const inside = sampleField(field, u, v)

    // Torso volume, plus shallow vertical folds that fade out at the edges.
    const folds =
      Math.sin(u * 15 + v * 2.1) * 0.05 +
      Math.sin(u * 26 - v * 4.2) * 0.022 +
      Math.sin(v * 9 + u * 1.4) * 0.018

    const z = sign * depth * inside * (1 + folds) * (0.55 + 0.45 * inside)
    position.setZ(i, z)
  }

  position.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

/**
 * Build the inflated shell for one kit from its front view. `depth` is in
 * plane units, so 0.13 pushes the chest forward by roughly an eighth of the
 * shirt's width.
 */
export async function buildJersey(src: string, depth = 0.13): Promise<JerseyMeshes> {
  const image = await loadImage(src)

  const field = buildField(drawToCanvas(image, FIELD_SIZE))

  const texture = new THREE.Texture(drawToCanvas(image, 1024))
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  // No mipmaps. Where a fold turns the surface away from the camera the
  // sampler reaches for a high mip level, which averages the kit's opaque
  // pixels into the transparent margin and lights a hairline along the
  // plane's edge under the alpha cutout.
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  texture.needsUpdate = true

  const aspect = image.naturalWidth / image.naturalHeight
  const front = buildPanel(field, depth, 1, aspect)

  return {
    front,
    texture,
    aspect,
    dispose: () => {
      front.dispose()
      texture.dispose()
    },
  }
}
