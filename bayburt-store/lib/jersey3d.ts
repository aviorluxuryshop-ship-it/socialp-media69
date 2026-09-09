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
  back: THREE.BufferGeometry
  frontTexture: THREE.Texture
  backTexture: THREE.Texture
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

function drawToCanvas(image: HTMLImageElement, size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('2D bağlamı alınamadı')
  context.drawImage(image, 0, 0, size, size)
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
  mirrorU: boolean,
) {
  const geometry = new THREE.PlaneGeometry(1, 1, SEGMENTS, SEGMENTS)
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

    if (mirrorU) uv.setX(i, 1 - u)
  }

  position.needsUpdate = true
  uv.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

/**
 * Build the front and back shells for one kit. `depth` is in plane units,
 * so 0.13 inflates the shirt to roughly a quarter of its width front-to-back.
 */
export async function buildJersey(
  frontSrc: string,
  backSrc: string,
  depth = 0.13,
): Promise<JerseyMeshes> {
  const [frontImage, backImage] = await Promise.all([loadImage(frontSrc), loadImage(backSrc)])

  const fieldCanvas = drawToCanvas(frontImage, FIELD_SIZE)
  const field = buildField(fieldCanvas)

  const frontTexture = new THREE.Texture(drawToCanvas(frontImage, 1024))
  const backTexture = new THREE.Texture(drawToCanvas(backImage, 1024))
  for (const texture of [frontTexture, backTexture]) {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    texture.needsUpdate = true
  }

  const front = buildPanel(field, depth, 1, false)
  const back = buildPanel(field, depth, -1, true)

  return {
    front,
    back,
    frontTexture,
    backTexture,
    dispose: () => {
      front.dispose()
      back.dispose()
      frontTexture.dispose()
      backTexture.dispose()
    },
  }
}
