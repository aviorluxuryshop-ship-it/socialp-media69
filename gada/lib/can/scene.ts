import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

import type { FlavorId, Product } from '@/data/products'
import { BOTTOM_Y, CAN_HEIGHT, buildCanGeometry, buildTabGeometry } from './profile'
import type { Pose } from './pose'

const FOV = 20
const CAMERA_Z = 22
/** A hair above eye level, like the reference renders (≈3°). */
const CAMERA_LIFT = 1.1

export interface CanSceneOptions {
  /** Small screens get the 1K label, fewer segments and a lower pixel ratio. */
  compact: boolean
}

interface CanObject {
  base: THREE.Group
  tilt: THREE.Group
  spin: THREE.Group
  shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  label: THREE.MeshPhysicalMaterial
  texture: THREE.Texture
}

function loadTexture(loader: THREE.TextureLoader, url: string) {
  return new Promise<THREE.Texture>((resolve, reject) => {
    loader.load(url, resolve, undefined, () => reject(new Error(`Etiket yüklenemedi: ${url}`)))
  })
}

/** Soft elliptical shadow drawn once into a canvas. */
function shadowTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (context) {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(40,30,10,0.55)')
    gradient.addColorStop(0.45, 'rgba(40,30,10,0.22)')
    gradient.addColorStop(1, 'rgba(40,30,10,0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, size, size)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * One renderer, one camera, one can per flavour.
 *
 * The scene never animates on its own: callers set poses and ask for a
 * frame. Nothing is redrawn while nothing moves, which is what kept the old
 * hero from stuttering on laptop GPUs.
 */
export class CanScene {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100)
  readonly cans = new Map<FlavorId, CanObject>()
  private readonly geometry
  private readonly tab: THREE.BufferGeometry
  private readonly metal: THREE.MeshPhysicalMaterial
  private readonly shadowMap: THREE.Texture
  private readonly envTarget: THREE.WebGLRenderTarget
  private width = 1
  private height = 1

  constructor(canvas: HTMLCanvasElement, private readonly options: CanSceneOptions) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    // Neutral keeps the brand yellow and orange where the print has them;
    // filmic curves pushed the yellow toward mustard.
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.compact ? 1.5 : 1.75))

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.envTarget = pmrem.fromScene(new RoomEnvironment(), 0.035)
    this.scene.environment = this.envTarget.texture
    // Turned so the studio's brightest panel lands front-left, where the
    // reference renders carry their highlight, and kept low so the edges
    // roll off into the print's own colour instead of washing out.
    this.scene.environmentIntensity = 0.5
    this.scene.environmentRotation.y = THREE.MathUtils.degToRad(-50)
    pmrem.dispose()

    const key = new THREE.DirectionalLight(0xffffff, 1.62)
    key.position.set(-4, 5, 6)
    const rim = new THREE.DirectionalLight(0xfff4e0, 1.43)
    rim.position.set(5, 3, -4)
    const fill = new THREE.DirectionalLight(0xffffff, 0.35)
    fill.position.set(3, -1, 5)
    this.scene.add(key, rim, fill)

    this.camera.position.set(0, CAMERA_LIFT, CAMERA_Z)
    this.camera.lookAt(0, 0, 0)

    this.geometry = buildCanGeometry(options.compact ? 96 : 160)
    this.tab = buildTabGeometry()
    this.metal = new THREE.MeshPhysicalMaterial({
      color: 0xd6d9dd,
      metalness: 1,
      roughness: 0.26,
      envMapIntensity: 1.1,
    })
    this.shadowMap = shadowTexture()
  }

  async load(products: Product[]) {
    const loader = new THREE.TextureLoader()
    const anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
    await Promise.all(
      products.map(async (product) => {
        const texture = await loadTexture(loader, this.options.compact ? product.label.srcSmall : product.label.src)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        texture.offset.x = product.label.frontU
        texture.anisotropy = anisotropy
        this.cans.set(product.id, this.buildCan(texture))
      }),
    )
    // Compile every program now rather than on the first scroll that shows it.
    await this.renderer.compileAsync(this.scene, this.camera)
  }

  private buildCan(texture: THREE.Texture): CanObject {
    // Ink printed straight onto aluminium: a coloured metal under a clear
    // varnish, which is where the soft vertical highlights come from.
    const label = new THREE.MeshPhysicalMaterial({
      map: texture,
      metalness: 0.25,
      roughness: 0.34,
      clearcoat: 0.3,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.7,
    })
    const spin = new THREE.Group()
    spin.add(
      new THREE.Mesh(this.geometry.label, label),
      new THREE.Mesh(this.geometry.top, this.metal),
      new THREE.Mesh(this.geometry.bottom, this.metal),
      new THREE.Mesh(this.tab, this.metal),
    )
    const tilt = new THREE.Group()
    tilt.add(spin)

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 3.4),
      new THREE.MeshBasicMaterial({ map: this.shadowMap, transparent: true, depthWrite: false, toneMapped: false }),
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = BOTTOM_Y - 0.02
    shadow.renderOrder = -1

    const base = new THREE.Group()
    base.add(shadow, tilt)
    base.visible = false
    this.scene.add(base)
    return { base, tilt, spin, shadow, label, texture }
  }

  setSize(width: number, height: number) {
    this.width = Math.max(1, width)
    this.height = Math.max(1, height)
    this.renderer.setSize(this.width, this.height, false)
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
  }

  /** Frame size in world units at the can's depth. */
  private frame() {
    const h = 2 * Math.hypot(CAMERA_Z, CAMERA_LIFT) * Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    return { w: h * this.camera.aspect, h }
  }

  applyPose(id: FlavorId, pose: Pose | null) {
    const can = this.cans.get(id)
    if (!can) return
    const frame = this.frame()
    // A can that has slid fully out of frame costs nothing to skip.
    const off = !pose || Math.abs(pose.x) > 1 + (pose.h * frame.h * 0.25) / (frame.w / 2) + 0.02
    can.base.visible = !off
    if (!pose || off) return
    const scale = (pose.h * frame.h) / CAN_HEIGHT
    can.base.position.set((pose.x * frame.w) / 2, (pose.y * frame.h) / 2, 0)
    can.base.scale.setScalar(scale)
    can.tilt.rotation.set(THREE.MathUtils.degToRad(pose.pitch), 0, THREE.MathUtils.degToRad(pose.roll))
    can.spin.rotation.y = THREE.MathUtils.degToRad(pose.yaw)
    can.shadow.material.opacity = pose.shadow
    can.shadow.visible = pose.shadow > 0.01
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    for (const can of this.cans.values()) {
      can.label.dispose()
      can.texture.dispose()
      can.shadow.geometry.dispose()
      can.shadow.material.dispose()
    }
    this.cans.clear()
    this.geometry.dispose()
    this.tab.dispose()
    this.metal.dispose()
    this.shadowMap.dispose()
    this.envTarget.dispose()
    this.renderer.dispose()
  }
}
