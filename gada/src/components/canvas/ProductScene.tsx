import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { LABEL_FRONT_OFFSET, ProductModel } from './ProductModel'
import { StudioEnvironment } from './StudioEnvironment'
import { AromaAccents } from './AromaAccents'
import { BackdropGlow } from './BackdropGlow'
import { GroundShadow } from './GroundShadow'
import { scrollState, subscribeScrollProgress } from '@/lib/scrollStore'
import { sampleTimeline } from '@/lib/timeline'
import { CAN_HEIGHT, CAN_RADIUS } from '@/lib/canGeometry'
import { useFlavor } from '@/state/flavor'
import { PRODUCTS } from '@/content/products'

export type Quality = 'high' | 'low'

// post-processing is desktop-only, so phones never download it
const Effects = lazy(() => import('./Effects').then((m) => ({ default: m.Effects })))

/** Scene-wide tuning. Choreography itself lives in lib/timeline.ts. */
export const SCENE = {
  /** How fast the rig chases the scroll target (1/s). Lower = more inertia. */
  damping: 4.2,
  /** Opening reveal: the can rises out of the dark while the lights come up. */
  introSeconds: 2.4,
  introRise: 0.1,
  introTurn: 0.9,
  introDolly: 0.8,
  /** Idle hover on desktop — just enough to read as suspended, not bouncing. */
  floatAmplitude: 0.012,
  floatSpeed: 0.9,
  background: { cold: '#0A0A0B', warm: '#140D09' },
  /** Aspect below which the portrait framing kicks in, and where desktop framing is fully on. */
  portraitBelow: 0.8,
  landscapeFrom: 1.25,
  /** Landscape windows shorter than this (px) start pulling back by the frame's shortZoom; fully at shortBelow − shortRange. */
  shortBelow: 940,
  shortRange: 340,
}

/**
 * `?snap` in the URL makes the rig jump straight to the scroll target — no
 * damping, no intro. For checking keyframes and grabbing stills, where the
 * renderer may be too slow for the damping to settle.
 */
const SNAP = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('snap')

type ProductSceneProps = {
  quality: Quality
  reducedMotion: boolean
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export function ProductScene({ quality, reducedMotion }: ProductSceneProps) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const scene = useThree((s) => s.scene)
  const invalidate = useThree((s) => s.invalidate)

  // re-renders (rarely — a user's flavor click) so the background tint and fruit accents follow the active can
  const flavor = useFlavor()
  const product = PRODUCTS[flavor]

  const model = useRef<THREE.Group>(null)
  const keyLight = useRef<THREE.DirectionalLight>(null)
  const rimLight = useRef<THREE.DirectionalLight>(null)

  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])

  // live, damped values the render loop owns
  const lookAt = useRef(new THREE.Vector3(0, -0.22, 0))
  const rotY = useRef(-0.35)
  const lights = useRef({ key: 0, rim: 0, env: 1, warmth: 0 })
  const glow = useRef(0)
  const aroma = useRef(0)
  const dof = useRef(0)
  /** Where the lens focuses: the can's surface facing the camera, not its axis. */
  const focus = useRef(new THREE.Vector3())
  const intro = useRef(reducedMotion || SNAP ? 1 : 0)
  const initialised = useRef(false)

  const scratch = useMemo(() => ({ pos: new THREE.Vector3(), target: new THREE.Vector3(), toCam: new THREE.Vector3() }), [])
  const colors = useMemo(() => ({ cold: new THREE.Color(SCENE.background.cold), warm: new THREE.Color(), live: new THREE.Color(SCENE.background.cold) }), [])
  // the "warm" backdrop is the active flavor's own colour, folded most of the way toward black — never a fixed orange
  useEffect(() => {
    colors.warm.set(product.colors.deep).lerp(colors.cold, 0.55)
  }, [colors, product])

  useEffect(() => {
    scene.background = colors.live
    scene.fog = new THREE.Fog(colors.live.clone(), 6, 12)
    return () => {
      scene.background = null
      scene.fog = null
    }
  }, [scene, colors])

  // In demand mode (mobile) nothing renders until something asks for a frame: scrolling does.
  useEffect(() => subscribeScrollProgress(() => invalidate()), [invalidate])
  useEffect(() => {
    invalidate()
  }, [ready, invalidate])

  useFrame((state, rawDelta) => {
    // cap dt so a backgrounded tab doesn't snap the camera across the scene on return
    const dt = Math.min(rawDelta, 1 / 20)
    const f = sampleTimeline(scrollState.progress)

    // ── responsive framing ────────────────────────────────────────────
    const aspect = state.size.width / state.size.height
    const t = f.lookAt
    const p = f.pos
    scratch.target.set(t[0], t[1], t[2])
    scratch.pos.set(p[0], p[1], p[2])
    if (aspect < SCENE.portraitBelow) {
      scratch.pos.sub(scratch.target).multiplyScalar(f.mobileZoom).add(scratch.target)
      scratch.pos.y += f.mobileY
      scratch.target.y += f.mobileY
    } else {
      const short = THREE.MathUtils.clamp((SCENE.shortBelow - state.size.height) / SCENE.shortRange, 0, 1)
      scratch.pos.sub(scratch.target).multiplyScalar(1 + (f.shortZoom - 1) * short).add(scratch.target)
      const wide = THREE.MathUtils.clamp((aspect - SCENE.portraitBelow) / (SCENE.landscapeFrom - SCENE.portraitBelow), 0, 1)
      scratch.pos.x += f.desktopX * wide
      scratch.target.x += f.desktopX * wide
    }

    // ── intro ─────────────────────────────────────────────────────────
    if (ready && intro.current < 1) intro.current = Math.min(1, intro.current + dt / SCENE.introSeconds)
    const k = easeOutCubic(intro.current)
    scratch.pos.z += (1 - k) * SCENE.introDolly

    // ── chase the target with exponential damping (frame-rate independent) ──
    const a = initialised.current && !SNAP ? 1 - Math.exp(-SCENE.damping * dt) : 1
    initialised.current = true

    camera.position.lerp(scratch.pos, a)
    lookAt.current.lerp(scratch.target, a)
    camera.lookAt(lookAt.current)
    camera.fov += (f.fov - camera.fov) * a
    camera.updateProjectionMatrix()

    rotY.current += (f.rotY - rotY.current) * a
    lights.current.key += (f.keyLight - lights.current.key) * a
    lights.current.rim += (f.rimLight - lights.current.rim) * a
    lights.current.env += (f.envIntensity - lights.current.env) * a
    lights.current.warmth += (f.warmth - lights.current.warmth) * a
    glow.current += (f.glow * k - glow.current) * a
    aroma.current += (f.aroma - aroma.current) * a
    dof.current += (f.dof - dof.current) * a

    // ── apply ─────────────────────────────────────────────────────────
    const floating = quality === 'high' && !reducedMotion
    const time = state.clock.elapsedTime
    if (model.current) {
      model.current.rotation.y = rotY.current + LABEL_FRONT_OFFSET + (1 - k) * SCENE.introTurn
      model.current.position.y = -(1 - k) * SCENE.introRise + (floating ? Math.sin(time * SCENE.floatSpeed) * SCENE.floatAmplitude : 0)
      model.current.rotation.z = floating ? Math.sin(time * SCENE.floatSpeed * 0.7) * 0.01 : 0
    }
    if (keyLight.current) keyLight.current.intensity = lights.current.key * 2.4 * k
    if (rimLight.current) rimLight.current.intensity = lights.current.rim * 3.2 * k
    scene.environmentIntensity = lights.current.env * (0.15 + 0.85 * k)

    colors.live.lerpColors(colors.cold, colors.warm, lights.current.warmth)
    if (scene.fog) scene.fog.color.copy(colors.live)

    // focus on the skin of the can nearest the lens: step out from the look-at point toward the
    // camera by the can's radius, less so the more the camera looks down onto the lid
    const toCam = scratch.toCam.subVectors(camera.position, lookAt.current)
    const distance = toCam.length()
    const downward = distance > 0 ? Math.abs(toCam.y) / distance : 0
    toCam.y = 0
    if (toCam.lengthSq() > 0) toCam.normalize().multiplyScalar(CAN_RADIUS * (1 - downward))
    focus.current.copy(lookAt.current).add(toCam)

    // ── demand mode: keep asking for frames until the rig has settled ──
    const settled =
      intro.current >= 1 &&
      camera.position.distanceToSquared(scratch.pos) < 1e-8 &&
      lookAt.current.distanceToSquared(scratch.target) < 1e-8 &&
      Math.abs(f.rotY - rotY.current) < 1e-4 &&
      aroma.current < 0.01
    if (!settled || floating) invalidate()
  })

  return (
    <>
      <StudioEnvironment />

      <ambientLight intensity={0.15} />
      {/* key: warm-white softbox, high front-right */}
      <directionalLight
        ref={keyLight}
        position={[2.2, 3, 2.8]}
        intensity={0}
        color="#FFF4E8"
        castShadow={quality === 'high'}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-1}
        shadow-camera-right={1}
        shadow-camera-top={1}
        shadow-camera-bottom={-1}
      />
      {/* rim: orange-tinted strip from behind-left, outlines the silhouette */}
      <directionalLight ref={rimLight} position={[-2.4, 1.2, -2.6]} intensity={0} color="#FFB27A" />
      {/* cool kicker from behind-right so the metal isn't one-sided */}
      <directionalLight position={[2.6, 1.6, -2.4]} intensity={0.6} color="#B8C6FF" />

      <BackdropGlow amount={glow} color={product.colors.can} />

      <ProductModel ref={model} segments={quality === 'high' ? 128 : 72} flavor={flavor} onReady={onReady} />

      {quality === 'high' ? (
        <ContactShadows position={[0, -CAN_HEIGHT / 2 - 0.004, 0]} opacity={0.6} scale={3} blur={2.2} far={1} resolution={512} color="#000000" />
      ) : (
        <GroundShadow y={-CAN_HEIGHT / 2 - 0.004} />
      )}

      <AromaAccents amount={aroma} particles={quality === 'high' ? 26 : 12} flavor={flavor} />

      {quality === 'high' && (
        <Suspense fallback={null}>
          <Effects strength={dof} focus={focus} />
        </Suspense>
      )}
    </>
  )
}
