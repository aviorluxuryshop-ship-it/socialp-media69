import * as THREE from 'three'

export type ParticleTheme = 'peach' | 'citrus'

const THEME_COLORS: Record<ParticleTheme, string[]> = {
  peach: ['#F4842E', '#F7B267', '#FCE3C7', '#12741F'],
  citrus: ['#F7DC30', '#FBEE9E', '#DCEFA0', '#317D29'],
}

function makeSprite(): THREE.CanvasTexture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.55)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

interface Seed {
  radius: number
  height: number
  speed: number
  phase: number
  bob: number
  size: number
}

const VERTEX_SHADER = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  uniform float uTime;
  uniform float uEnvelope;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    float twinkle = 0.7 + 0.3 * sin(uTime * 1.4 + aPhase);
    vAlpha = uEnvelope * twinkle;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (220.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    gl_FragColor = vec4(vColor, 1.0) * tex.a * vAlpha;
  }
`

/**
 * Soft glowing motes drifting around the can — never the product itself.
 * Motion is continuous ambient drift (time-based), independent of scroll;
 * only the shared `uEnvelope` uniform is driven by the act envelope, via
 * `setEnvelope`. That split is what keeps this from reading as "autoplay":
 * nothing about the product rotates or advances on its own, only the
 * atmosphere breathes.
 */
export class ParticleField {
  readonly points: THREE.Points
  private readonly seeds: Seed[]
  private readonly geometry: THREE.BufferGeometry
  private readonly material: THREE.ShaderMaterial
  private readonly sprite: THREE.CanvasTexture

  constructor(theme: ParticleTheme, count: number, spread: number) {
    const palette = THEME_COLORS[theme]!.map((hex) => new THREE.Color(hex))
    this.seeds = Array.from({ length: count }, () => ({
      radius: spread * (0.45 + Math.random() * 0.85),
      height: (Math.random() - 0.35) * spread * 1.6,
      speed: (0.04 + Math.random() * 0.05) * (Math.random() < 0.5 ? 1 : -1),
      phase: Math.random() * Math.PI * 2,
      bob: 0.02 + Math.random() * 0.05,
      size: 10 + Math.random() * 18,
    }))

    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)

    this.seeds.forEach((seed, i) => {
      positions[i * 3] = seed.radius
      positions[i * 3 + 1] = seed.height
      positions[i * 3 + 2] = 0
      palette[i % palette.length]!.toArray(colors, i * 3)
      sizes[i] = seed.size
      phases[i] = seed.phase
    })

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    this.geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))

    this.sprite = makeSprite()
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uEnvelope: { value: 0 },
        uPixelRatio: { value: 1 },
        uMap: { value: this.sprite },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.points.frustumCulled = false
  }

  setPixelRatio(ratio: number) {
    this.material.uniforms.uPixelRatio!.value = ratio
  }

  /** 0–1, how present the atmosphere should be for the current act. */
  setEnvelope(value: number) {
    this.material.uniforms.uEnvelope!.value = value
  }

  update(time: number) {
    const position = this.geometry.getAttribute('position') as THREE.BufferAttribute

    this.seeds.forEach((seed, i) => {
      const angle = seed.phase + time * seed.speed
      position.setXYZ(
        i,
        Math.cos(angle) * seed.radius,
        seed.height + Math.sin(time * 0.6 + seed.phase) * seed.bob,
        Math.sin(angle) * seed.radius,
      )
    })

    position.needsUpdate = true
    this.material.uniforms.uTime!.value = time
  }

  dispose() {
    this.geometry.dispose()
    this.sprite.dispose()
    this.material.dispose()
  }
}
