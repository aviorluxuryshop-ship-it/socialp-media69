import * as THREE from 'three'

/**
 * A small procedural studio environment for the can's aluminium to reflect.
 * No HDRI is fetched — a soft vertical gradient (bright key above, a dim
 * warm floor bounce below, and a tinted horizon band) painted to a canvas,
 * read as an equirectangular map and pre-filtered with PMREM. It is what
 * gives the metal "doğru ışık yansıması" instead of a flat matte tube: real
 * reflections, just not a downloaded ones.
 */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer, accentHex: string): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')!

  const accent = new THREE.Color(accentHex)
  const horizon = accent.clone().lerp(new THREE.Color('#ffffff'), 0.55)

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#e9e6e0') // soft overhead key
  gradient.addColorStop(0.32, '#c9c6c1')
  gradient.addColorStop(0.48, `#${horizon.getHexString()}`) // flavour-tinted horizon
  gradient.addColorStop(0.52, `#${horizon.getHexString()}`)
  gradient.addColorStop(0.68, '#232025')
  gradient.addColorStop(1, '#0a0a0b') // dark floor bounce

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Two soft studio "strip lights" as brighter bands, the way a real product
  // photography rig looks reflected in a metal can.
  ctx.globalCompositeOperation = 'lighter'
  for (const x of [canvas.width * 0.28, canvas.width * 0.74]) {
    const strip = ctx.createRadialGradient(x, canvas.height * 0.4, 2, x, canvas.height * 0.4, canvas.width * 0.16)
    strip.addColorStop(0, 'rgba(255,255,255,0.6)')
    strip.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = strip
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true

  const pmrem = new THREE.PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()
  const envRT = pmrem.fromEquirectangular(texture)
  texture.dispose()
  pmrem.dispose()

  return envRT.texture
}
