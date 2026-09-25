'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { buildCanGeometry } from '@/lib/canGeometry'
import { createCanMaterials, loadLabelTexture } from '@/lib/canMaterials'
import { createStudioEnvironment } from '@/lib/envMap'
import { sampleAngleTurns, sampleColor, sampleNumber } from '@/lib/keyframes'
import { ParticleField } from '@/lib/particles'
import type { FlavorConfig } from '@/lib/flavors'
import {
  BACKGROUND_WARMTH_TRACK,
  CAMERA_ANGLE_TRACK,
  CAMERA_DISTANCE_TRACK,
  CAMERA_HEIGHT_TRACK,
  KEY_LIGHT_WARMTH_TRACK,
  PARTICLE_ENVELOPE_TRACK,
} from './sceneConfig'

export type SceneQuality = 'high' | 'low'

export interface CanSceneHandle {
  /** Mutate directly from a ScrollTrigger onUpdate — no React re-render per scroll tick. */
  progress: number
}

const VOID_COLOR = new THREE.Color('#0a0a0b')

export function CanScene({
  flavor,
  quality,
  progressRef,
}: {
  flavor: FlavorConfig
  quality: SceneQuality
  progressRef: React.RefObject<CanSceneHandle>
}) {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let disposed = false
    let frameId = 0

    const isHigh = quality === 'high'
    const dprCap = isHigh ? 2 : 1.5
    const radialSegments = isHigh ? 128 : 56
    const particleCount = isHigh ? 56 : 22

    const renderer = new THREE.WebGLRenderer({
      antialias: isHigh,
      alpha: false,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = VOID_COLOR.clone()

    // A long-lens FOV on purpose: a cylinder viewed through a wide lens at
    // close range shows nearly half its own circumference at once (that's
    // geometry, not a texture bug), which meant a "front" checkpoint was
    // already revealing a slice of the neighbouring photographed face at
    // its edges. A tighter, more distant "product photography" lens keeps
    // each checkpoint reading as the one clean, undistorted face it is.
    const camera = new THREE.PerspectiveCamera(16, 1, 0.01, 6)

    const { geometry, height } = buildCanGeometry(radialSegments)
    const lookAtY = height * 0.55
    const canGroup = new THREE.Group()
    canGroup.position.y = 0
    scene.add(canGroup)

    let envTexture: THREE.Texture | null = null

    // A plain, untextured aluminium can from the very first frame — the
    // photographed label and the studio envmap load in, but there is never
    // a blank gap while they do (slow connections included).
    const placeholderMaterial = new THREE.MeshPhysicalMaterial({
      color: flavor.palette.accent,
      metalness: 0.5,
      roughness: 0.45,
    })
    const mesh = new THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>(
      geometry,
      placeholderMaterial,
    )
    canGroup.add(mesh)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
    keyLight.position.set(0.4, 0.6, 0.5)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xcfd8ff, 0.6)
    fillLight.position.set(-0.5, 0.1, -0.3)
    scene.add(fillLight)

    const rimLight = new THREE.PointLight(new THREE.Color(flavor.palette.leaf), 1.6, 3, 2)
    rimLight.position.set(-0.25, 0.35, -0.45)
    scene.add(rimLight)

    const hemi = new THREE.HemisphereLight(0x3a3a44, 0x0a0a0b, 0.32)
    scene.add(hemi)

    const particles = new ParticleField(flavor.particleTheme, particleCount, height * 2.6)
    particles.points.position.y = lookAtY
    scene.add(particles.points)

    // Bounds are keyed to the camera's own distance track (≈1.1–1.6m for the
    // long-lens framing above), not the can's height — fog distance is
    // measured from the *camera*, so a bound sized off the object's own
    // small scale put the can itself deep inside the fogged range and
    // crushed the label towards the background colour at every checkpoint.
    // `near` stays comfortably past the farthest camera distance so the can
    // is never fogged; only what's well behind it fades.
    const fog = new THREE.Fog(VOID_COLOR.clone(), 2.1, 4.8)
    scene.fog = fog

    Promise.all([
      loadLabelTexture(renderer, flavor.texture.label),
      Promise.resolve().then(() => createStudioEnvironment(renderer, flavor.palette.accent)),
    ])
      .then(([labelTexture, env]) => {
        if (disposed) {
          labelTexture.dispose()
          env.dispose()
          return
        }
        envTexture = env
        scene.environment = env
        mesh.material = createCanMaterials(labelTexture, env)
        placeholderMaterial.dispose()
      })
      .catch(() => {
        // Texture failed to load (offline, blocked asset) — the untextured
        // placeholder can stays up rather than the scene going empty.
      })

    const resize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / Math.max(h, 1)
      camera.updateProjectionMatrix()
      particles.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap))
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)

    const clock = new THREE.Clock()
    let displayProgress = 0
    const bgColor = new THREE.Color()
    const keyColor = new THREE.Color()

    const tick = () => {
      frameId = requestAnimationFrame(tick)
      const dt = Math.min(clock.getDelta(), 0.05)
      const time = clock.elapsedTime

      const target = progressRef.current?.progress ?? 0
      // Exponential smoothing, framerate-independent: this is what makes the
      // camera glide rather than snap to the raw scroll value, while staying
      // a pure function of `target` — scroll back and it retraces exactly.
      const smoothing = 1 - Math.pow(0.001, dt)
      displayProgress += (target - displayProgress) * smoothing

      const angle = sampleAngleTurns(CAMERA_ANGLE_TRACK, displayProgress) * Math.PI * 2
      // On the narrow layout every section is centre-aligned (see
      // SceneSection), so the can and the copy share the same column —
      // pulling the can back further keeps it from crowding text and info
      // panels that a wide layout would have set beside it instead.
      const distance = sampleNumber(CAMERA_DISTANCE_TRACK, displayProgress) * (isHigh ? 1 : 1.45)
      const camY = sampleNumber(CAMERA_HEIGHT_TRACK, displayProgress)

      camera.position.set(Math.cos(angle) * distance, lookAtY + camY, Math.sin(angle) * distance)
      camera.lookAt(0, lookAtY, 0)

      // A very small continuous breathing motion — never a rotation, never
      // tied to scroll, just enough to keep the opening frame from feeling
      // static before the visitor has done anything at all.
      canGroup.position.y = Math.sin(time * 0.55) * 0.004
      canGroup.rotation.y = Math.sin(time * 0.35) * 0.006

      const warmth = sampleNumber(BACKGROUND_WARMTH_TRACK, displayProgress)
      sampleColor(
        [
          { at: 0, value: '#0a0a0b' },
          { at: 1, value: flavor.palette.deep },
        ],
        warmth,
        bgColor,
      )
      scene.background = bgColor
      fog.color.copy(bgColor)

      const keyWarmth = sampleNumber(KEY_LIGHT_WARMTH_TRACK, displayProgress)
      sampleColor(
        [
          { at: 0, value: '#ffffff' },
          { at: 1, value: flavor.palette.accent },
        ],
        keyWarmth,
        keyColor,
      )
      keyLight.color.copy(keyColor)

      const envelope = sampleNumber(PARTICLE_ENVELOPE_TRACK, displayProgress)
      particles.setEnvelope(envelope)
      particles.update(time)

      renderer.render(scene, camera)
    }
    frameId = requestAnimationFrame(tick)

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      particles.dispose()
      geometry.dispose()
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m) => {
        if (m instanceof THREE.MeshPhysicalMaterial) m.map?.dispose()
        m.dispose()
      })
      envTexture?.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
    // Intentionally mount-once: flavor/quality changes remount the whole
    // scene (see key= on <CanScene> in ProductExperience) rather than
    // diffing a live Three.js graph — simpler and it only happens on
    // navigation between product pages, never mid-scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={mountRef} className="scene-stage" aria-hidden="true" />
}
