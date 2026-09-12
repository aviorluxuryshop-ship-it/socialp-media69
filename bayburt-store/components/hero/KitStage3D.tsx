'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

import { buildJersey, type JerseyMeshes } from '@/lib/jersey3d'
import type { Product } from '@/data/products'
import { cn, formatPrice } from '@/lib/utils'

const FOV = 32
const TAN_HALF_FOV = Math.tan((FOV / 2) * (Math.PI / 180))

interface KitStage3DProps {
  products: Product[]
  onUnsupported: () => void
}

interface KitNode {
  group: THREE.Group
  picker: THREE.Mesh
  materials: THREE.MeshStandardMaterial[]
  meshes: JerseyMeshes
  index: number
}

/** Widest kit aspect; the portrait carousel is spaced off this. */
const KIT_ASPECT = 0.78

/**
 * Where the kits stand inside the backdrop, as fractions of the plate.
 *
 * The plate itself has no kits in it. These numbers come from
 * media-source/banner-placement.jpg — the same frame with the kits painted in
 * — matched against the cut-out photographs, so each kit lands on its own
 * ground: over its label, clear of its neighbours, the middle one set very
 * slightly back the way the artwork stages it. They are then set down a
 * little and taken in from the reference size, so the wordmark above them
 * stays clear and no shoulder reaches its neighbour. Desktop derives the
 * layout from the plate's cover box rather than from the viewport, so the
 * kits stay on that ground at every window size.
 */
const PLATE_ASPECT = 1600 / 901
const PLATE_KIT = [
  { x: 0.276, height: 0.494 },
  { x: 0.516, height: 0.455 },
  { x: 0.764, height: 0.497 },
]

/**
 * The band the kits are allowed to occupy, as fractions of the plate: below
 * the tagline under the wordmark, above the painted kit names. Everything
 * above — the sizes, the resting centre, the ceiling on the hover lift — is
 * chosen so that a hovered kit still lands inside it.
 */
const PLATE_SAFE_TOP = 0.245
const PLATE_SAFE_BOTTOM = 0.745

/**
 * Where the band under the kits begins, and how it is stacked.
 *
 * The kit, its name, its kind and the shop button each get a strip of their
 * own, separated by fixed gaps rather than by fractions — a fraction shrinks
 * with the plate and the strips close up on a short window. Nothing here is
 * layered over anything: the kits end at PLATE_SAFE_BOTTOM and the type
 * starts below it.
 */
const NAME_BAND_TOP = '74.5%'
const NAME_BAND_GAP = 24
const NAME_BAND_HEIGHT = 47

/**
 * Hover lift, kept deliberately small. The kit also steps toward the camera,
 * which magnifies it again — at 6 units back a step of 0.18 is another 3% —
 * so the two together stay inside the safe band and clear of the neighbours.
 */
const HOVER_SCALE = 1.03
const HOVER_STEP = 0.18

/**
 * Portrait keeps this much room, in pixels, at each end of the stage: the
 * wordmark above the kit, and below it the kit's name, its kind, the carousel
 * dots and the shop button. The foot needs more than the head, so the band is
 * off-centre and the kit is lifted to match — which on a small phone is the
 * difference between a readable page and a kit sitting on its own name.
 */
/**
 * Fallback only. In portrait the real guard is the foot of the live wordmark
 * plus PORTRAIT_HEAD_GAP: its height comes out of a clamp, so measuring it
 * beats guessing — guessing left the kit's collar a few pixels under the
 * tagline on a phone.
 */
const PORTRAIT_GUARD_TOP = 138
const PORTRAIT_HEAD_GAP = 30

/**
 * What has to fit below the kit in portrait, in pixels: the name, its kind,
 * the carousel dots, the line that says to pick one, and the gaps. The kit
 * is sized to what is left rather than to a guessed fraction, so the four
 * never close up on a short phone or run into each other on a tall tablet.
 */
const PORTRAIT_FOOT_STACK = 208

/** Air between the kit's hem and its name, on top of the anchor's own gap. */
const PORTRAIT_NAME_GAP = 18
const CAMERA_Z = 6

/** How much bigger a hovered kit reads: the lift, plus the step's perspective. */
const HOVER_GROWTH = HOVER_SCALE * (CAMERA_Z / (CAMERA_Z - HOVER_STEP))

/**
 * Room kept clear under the kits, in pixels: the gap to the names, the two
 * lines of the name itself, the gap to the cue line, the cue line, and a
 * margin under that. The band is never allowed to sit lower than this leaves.
 */
const FOOT_STACK = NAME_BAND_GAP + NAME_BAND_HEIGHT + 36 + 18 + 28

/**
 * Rim light per kit: gold for Hisar, daylight for Çoruh, and for Çinimaçin a
 * a neutral white rather than gold — a warm rim multiplies into a black
 * garment and turns it olive, and a black kit should stay black when a light
 * is brought to it. Its gold trim picks up the light on its own.
 */
const RIM_COLOURS = [0xffc247, 0xeef3ff, 0xf6f4f0]

/**
 * The backdrop is three regions — the castle and its gold light, the river
 * and the city in daylight, the dark patterned right. Selecting a kit lifts
 * the region it belongs to and lets the other two fall back.
 */
const REGIONS = [
  { left: '0%', width: '40%', lift: 'rgba(233,162,28,0.22)' },
  { left: '38%', width: '28%', lift: 'rgba(228,238,255,0.20)' },
  { left: '64%', width: '36%', lift: 'rgba(212,175,55,0.16)' },
]

/**
 * Rim light per kit: gold for Hisar, daylight for Çoruh, and for Çinimaçin a
 * a neutral white rather than gold — a warm rim multiplies into a black
 * garment and turns it olive, and a black kit should stay black when a light
 * is brought to it. Its gold trim picks up the light on its own.
 */
const RIM_COLOURS = [0xffc247, 0xeef3ff, 0xf6f4f0]

/**
 * The backdrop is three regions — the castle and its gold light, the river
 * and the city in daylight, the dark patterned right. Selecting a kit lifts
 * the region it belongs to and lets the other two fall back.
 */
const REGIONS = [
  { left: '0%', width: '40%', lift: 'rgba(233,162,28,0.22)' },
  { left: '38%', width: '28%', lift: 'rgba(228,238,255,0.20)' },
  { left: '64%', width: '36%', lift: 'rgba(212,175,55,0.16)' },
]

export function KitStage3D({ products, onUnsupported }: KitStage3DProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labelRefs = useRef<(HTMLDivElement | null)[]>([])
  const dotsRef = useRef<HTMLDivElement>(null)

  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isPortrait, setIsPortrait] = useState(false)
  const [focusIndex, setFocusIndex] = useState(0)

  // Portrait shows one kit at a time; the scene reads the focus every frame.
  const focusRef = useRef(0)
  const setFocus = useCallback((index: number) => {
    focusRef.current = index
    setFocusIndex(index)
  }, [])

  // The scene owns hover state; React only mirrors it into the overlay. Both
  // are written together so the click handler never reads a stale frame.
  const activeRef = useRef<number | null>(null)
  const setActive = useCallback((index: number | null) => {
    if (activeRef.current === index) return
    activeRef.current = index
    setActiveIndex(index)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    } catch {
      onUnsupported()
      return
    }

    let disposed = false
    const nodes: KitNode[] = []
    const pointer = new THREE.Vector2(0, 0)
    const rayPointer = new THREE.Vector2(-2, -2)
    const raycaster = new THREE.Raycaster()
    const projected = new THREE.Vector3()

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100)
    camera.position.set(0, 0, CAMERA_Z)

    scene.add(new THREE.AmbientLight(0x5a5a68, 1.15))

    const key = new THREE.DirectionalLight(0xffffff, 2.4)
    key.position.set(2.4, 3.2, 4.2)
    scene.add(key)

    const rimBase = new THREE.Color(0xd4af37)
    const rimTarget = new THREE.Color(0xd4af37)
    const rim = new THREE.DirectionalLight(0xd4af37, 1.9)
    rim.position.set(-3.4, 1.4, -2.6)
    scene.add(rim)

    const fill = new THREE.DirectionalLight(0x9fb4d8, 0.75)
    fill.position.set(-2.2, -1.6, 2.8)
    scene.add(fill)

    let layout = {
      scale: 1,
      gap: 1,
      portrait: false,
      portraitY: 0,
      slots: [] as { x: number; y: number; scale: number }[],
    }

    function measure() {
      const { clientWidth, clientHeight } = container!
      const aspect = clientWidth / Math.max(clientHeight, 1)
      const visibleHeight = 2 * camera.position.z * TAN_HALF_FOV
      const visibleWidth = visibleHeight * aspect
      const portrait = aspect < 0.95
      const worldPerPixel = visibleHeight / Math.max(clientHeight, 1)

      // The plate is object-cover, pinned to its own head. Everything the
      // artwork has to say — the wordmark, the line under it — is painted
      // across its top, so a crop taken off both ends eats the title on a
      // short window. Taken off the foot it only eats dark ground.
      const plateWidth = aspect > PLATE_ASPECT ? clientWidth : clientHeight * PLATE_ASPECT
      const plateHeight = aspect > PLATE_ASPECT ? clientWidth / PLATE_ASPECT : clientHeight
      const plateLeft = (clientWidth - plateWidth) / 2
      const plateTop = 0

      // Where the kits stand. The painted foot is the honest answer, but on a
      // wide, short window it lands past the bottom of the frame and takes the
      // names and the cue line with it — so the band is also held far enough
      // up that the stack below it still fits on screen.
      const paintedFoot = plateTop + PLATE_SAFE_BOTTOM * plateHeight
      const bandTop = plateTop + PLATE_SAFE_TOP * plateHeight
      const footCeiling = clientHeight - FOOT_STACK
      const foot = Math.max(Math.min(paintedFoot, footCeiling), bandTop + 120)
      const kitCentre = (bandTop + foot) / 2

      // Nothing may grow out of the band, however the window is shaped: the
      // ceiling is the band itself, less the room hover needs.
      const maxScale = ((foot - bandTop) * worldPerPixel) / HOVER_GROWTH

      // The names and the cue line hang off this, not off a percentage that
      // only held while the plate and the frame were the same box.
      container!.parentElement?.style.setProperty('--plate-foot', `${Math.round(foot)}px`)

      // The plate is cropped, so its foot is no longer a fixed fraction of the
      // frame. Publish where it actually lands: the kit names and the cue line
      // hang off this, not off a percentage that only held while the plate and
      // the frame were the same box.
      container!.parentElement?.style.setProperty(
        '--plate-foot',
        `${Math.round(plateTop + PLATE_SAFE_BOTTOM * plateHeight)}px`,
      )

      const slots = PLATE_KIT.map((kit) => ({
        x: (plateLeft + kit.x * plateWidth - clientWidth / 2) * worldPerPixel,
        y: (clientHeight / 2 - kitCentre) * worldPerPixel,
        scale: Math.min(kit.height * plateHeight * worldPerPixel, maxScale),
      }))

      // Portrait crops the plate too hard to align to; it shows one kit at a
      // time and slides instead, so there it is one size for all three.
      const head = document.querySelector('[data-hero-head]')
      const headFoot = head
        ? head.getBoundingClientRect().bottom - container!.getBoundingClientRect().top
        : PORTRAIT_GUARD_TOP
      const guardTop = Math.max(headFoot + PORTRAIT_HEAD_GAP, PORTRAIT_GUARD_TOP)

      // The label hangs a fixed fraction of the kit below it, so the kit and
      // that gap together have to fit the space the foot stack leaves.
      const usable = Math.max(
        clientHeight - guardTop - PORTRAIT_FOOT_STACK - PORTRAIT_NAME_GAP,
        clientHeight * 0.24,
      )
      const bandHeight = usable / 1.02
      const scale = portrait
        ? Math.min(visibleWidth * 0.86, bandHeight * worldPerPixel)
        : (slots[0]?.scale ?? 1)
      const portraitY = (clientHeight / 2 - (guardTop + bandHeight / 2)) * worldPerPixel

      // Never less than a screen apart: on a short phone the kit is small
      // enough that a gap sized off the kit alone leaves its neighbour
      // hanging into the frame.
      const gap = Math.max(scale * KIT_ASPECT * 1.35, visibleWidth * 0.94)

      layout = { scale, gap, portrait, portraitY, slots }
      setIsPortrait(portrait)

      camera.aspect = aspect
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight, false)

      nodes.forEach((node) => {
        const slot = layout.slots[node.index]
        node.group.position.x = layout.portrait
          ? (node.index - focusRef.current) * layout.gap
          : (slot?.x ?? 0)
        node.group.position.y = layout.portrait ? layout.portraitY : (slot?.y ?? 0)
        node.group.scale.setScalar(layout.portrait ? layout.scale : (slot?.scale ?? layout.scale))
      })
    }

    async function build() {
      for (const [index, product] of products.entries()) {
        const front = product.media.views[0]?.src
        if (!front) continue

        const meshes = await buildJersey(front)
        if (disposed) {
          meshes.dispose()
          return
        }

        // Opaque with an alpha cutout, resolved through the multisample
        // buffer. A plain cutout has no anti-aliasing, so against the pale
        // valley behind them the sleeves read as a staircase; a transparent
        // material instead writes depth from its feathered edge fragments and
        // cuts a seam where one kit's plane passes in front of another.
        // Alpha-to-coverage gives the soft edge without the depth trouble.
        //
        // One inflated shell, not two. A rear shell sits far enough behind the
        // front that perspective slides it out from under the silhouette at
        // the off-centre positions, reading as a dark duplicate — and since
        // the kits never turn more than a few degrees, nothing is ever seen
        // from behind anyway.
        const material = new THREE.MeshStandardMaterial({
          map: meshes.texture,
          alphaTest: 0.5,
          alphaToCoverage: true,
          roughness: 0.82,
          metalness: 0.06,
          side: THREE.DoubleSide,
        })

        const materials = [material]

        const group = new THREE.Group()
        group.add(new THREE.Mesh(meshes.front, material))

        // Flat proxy for hit-testing — cheaper and steadier than the shell.
        // Hidden on the object, not the material: a material-level `visible`
        // flag still let the proxy reach the renderer and draw a hairline
        // along its own edge. The raycaster ignores visibility, so picking is
        // unaffected.
        const picker = new THREE.Mesh(
          new THREE.PlaneGeometry(meshes.aspect * 0.94, 0.98),
          new THREE.MeshBasicMaterial(),
        )
        picker.visible = false
        group.add(picker)

        scene.add(group)
        nodes.push({ group, picker, materials, meshes, index })

        // Building a kit blurs a field and displaces ~12k vertices. Yield
        // between kits so a tap during load is not swallowed.
        await new Promise((resolve) => setTimeout(resolve, 0))
      }

      measure()
      if (!disposed) setIsReady(true)
    }

    void build()

    /** Which kit sits under these client coordinates, if any. */
    function pick(clientX: number, clientY: number): number | null {
      if (!nodes.length) return null
      const bounds = container!.getBoundingClientRect()
      const ndc = new THREE.Vector2(
        ((clientX - bounds.left) / bounds.width) * 2 - 1,
        -(((clientY - bounds.top) / bounds.height) * 2 - 1),
      )
      raycaster.setFromCamera(ndc, camera)
      const hits = raycaster.intersectObjects(nodes.map((node) => node.picker))
      if (!hits.length) return null
      return nodes.find((node) => node.picker === hits[0]?.object)?.index ?? null
    }

    function onPointerMove(event: PointerEvent) {
      const bounds = container!.getBoundingClientRect()
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
      pointer.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1)
      rayPointer.copy(pointer)
    }

    function onPointerLeave() {
      pointer.set(0, 0)
      rayPointer.set(-2, -2)
      setActive(null)
    }

    function onClick(event: MouseEvent) {
      // Raycast from the event itself. Waiting for the hover pass in the
      // animation loop loses the first tap on touch, where no pointermove
      // precedes the click.
      const index = pick(event.clientX, event.clientY)
      if (index === null) return
      setActive(index)
      // On a phone a tap first brings the kit forward; the second opens it.
      if (layout.portrait && index !== focusRef.current) {
        setFocus(index)
        return
      }
      const slug = products[index]?.slug
      if (slug) router.push(`/koleksiyon/${slug}`)
    }

    let swipeStartX: number | null = null

    function onPointerDown(event: PointerEvent) {
      swipeStartX = event.clientX
    }

    function onPointerUp(event: PointerEvent) {
      if (swipeStartX === null || !layout.portrait) {
        swipeStartX = null
        return
      }
      const dx = event.clientX - swipeStartX
      swipeStartX = null
      if (Math.abs(dx) < 44) return
      const next = focusRef.current + (dx < 0 ? 1 : -1)
      if (next >= 0 && next < products.length) setFocus(next)
    }

    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerleave', onPointerLeave)
    container.addEventListener('click', onClick)
    container.addEventListener('pointerdown', onPointerDown)
    container.addEventListener('pointerup', onPointerUp)

    const resizeObserver = new ResizeObserver(() => measure())
    resizeObserver.observe(container)

    const clock = new THREE.Clock()
    let frame = 0

    function tick() {
      frame = requestAnimationFrame(tick)
      const time = clock.getElapsedTime()

      // Hover pick.
      if (nodes.length && rayPointer.x > -1.5) {
        raycaster.setFromCamera(rayPointer, camera)
        const hits = raycaster.intersectObjects(nodes.map((node) => node.picker))
        const hitIndex = hits.length
          ? nodes.find((node) => node.picker === hits[0]?.object)?.index ?? null
          : null
        setActive(hitIndex)
      }

      const active = activeRef.current
      const highlight = layout.portrait ? focusRef.current : active
      rimTarget.set(highlight === null ? rimBase.getHex() : RIM_COLOURS[highlight] ?? rimBase.getHex())
      rim.color.lerp(rimTarget, 0.06)
      // Restrained: at full strength the rim draws a bright outline around the
      // silhouette, which reads as a halo rather than as light.
      rim.intensity += ((highlight === null ? 1.9 : 2.2) - rim.intensity) * 0.06
      key.intensity += ((highlight === null ? 2.4 : 2.7) - key.intensity) * 0.06

      nodes.forEach((node) => {
        const isActive = node.index === active
        const sway = prefersReducedMotion ? 0 : Math.sin(time * 0.42 + node.index * 1.7) * 0.17
        const bob = prefersReducedMotion ? 0 : Math.sin(time * 0.62 + node.index * 2.1) * 0.022

        const isFocused = layout.portrait ? node.index === focusRef.current : isActive
        const targetRotation = isFocused ? sway * 0.25 : sway
        // At rest a kit is exactly the size the artwork gives it; the lift on
        // hover is small because the step forward and the region light behind
        // it carry most of the emphasis.
        const base = layout.portrait ? layout.scale : (layout.slots[node.index]?.scale ?? layout.scale)
        const targetScale = base * (isFocused ? HOVER_SCALE : layout.portrait ? 0.82 : 1)
        const targetZ = isFocused ? (layout.portrait ? 0.2 : HOVER_STEP) : 0

        node.group.rotation.y += (targetRotation - node.group.rotation.y) * 0.06
        node.group.rotation.z += (sway * 0.06 - node.group.rotation.z) * 0.06
        node.group.position.z += (targetZ - node.group.position.z) * 0.07

        const slot = layout.slots[node.index]
        const baseX = layout.portrait
          ? (node.index - focusRef.current) * layout.gap
          : (slot?.x ?? 0)
        const baseY = (layout.portrait ? layout.portraitY : (slot?.y ?? 0)) + bob
        node.group.position.x += (baseX - node.group.position.x) * 0.09
        node.group.position.y += (baseY - node.group.position.y) * 0.08

        const currentScale = node.group.scale.x
        node.group.scale.setScalar(currentScale + (targetScale - currentScale) * 0.08)

        // Dim by darkening rather than fading, which keeps the shells opaque.
        const lit = layout.portrait ? node.index === focusRef.current : active === null || isActive
        const targetTint = lit ? 1 : 0.34
        node.materials.forEach((material) => {
          material.color.setScalar(material.color.r + (targetTint - material.color.r) * 0.08)
        })
      })

      // Camera drifts with the pointer — a slow studio dolly, not a swing.
      // Only under a mouse: on a phone the pointer is wherever the last tap
      // landed, so the drift leaves the kit sitting off-centre after someone
      // presses a carousel dot.
      const drifts = !prefersReducedMotion && !layout.portrait
      const driftX = drifts ? pointer.x * 0.42 : 0
      const driftY = drifts ? pointer.y * 0.26 : 0
      camera.position.x += (driftX - camera.position.x) * 0.045
      camera.position.y += (driftY - camera.position.y) * 0.045
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)

      // Park each label under its kit, in screen space.
      const bounds = container!.getBoundingClientRect()
      let labelFoot = 0
      nodes.forEach((node) => {
        const label = labelRefs.current[node.index]
        if (!label) return
        projected.set(0, -0.52, 0).applyMatrix4(node.group.matrixWorld).project(camera)
        const x = (projected.x * 0.5 + 0.5) * bounds.width
        const y = (-projected.y * 0.5 + 0.5) * bounds.height
        label.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, 0)`
        if (node.index === focusRef.current) labelFoot = y + label.offsetHeight
      })

      // The carousel dots follow the label rather than the bottom of the
      // screen. Anchored to the screen they collide with the kind line
      // whenever the kit is tall — a tablet in portrait, most of all.
      const dots = dotsRef.current
      if (dots && layout.portrait && labelFoot > 0) {
        // Never into the strip the shop button needs, however tall the kit.
        const floor = bounds.height - 86
        dots.style.top = `${Math.round(Math.min(labelFoot + 16, floor))}px`
      }
    }

    tick()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerleave', onPointerLeave)
      container.removeEventListener('click', onClick)
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeEventListener('pointerup', onPointerUp)
      nodes.forEach((node) => {
        node.meshes.dispose()
        node.materials.forEach((material) => material.dispose())
        node.picker.geometry.dispose()
        ;(node.picker.material as THREE.Material).dispose()
      })
      renderer.dispose()
    }
  }, [products, router, onUnsupported, setActive, setFocus])

  return (
    <div ref={containerRef} className="absolute inset-0 cursor-pointer">
      {/* The stage answers the selection, not just the kit. The region of the
          backdrop the chosen kit belongs to lifts; the other two recede. */}
      {REGIONS.map((region, index) => {
        const selected = (isPortrait ? focusIndex : activeIndex) === index
        const anySelected = (isPortrait ? focusIndex : activeIndex) !== null
        return (
          <span key={`region-${region.left}`} aria-hidden className="pointer-events-none">
            <span
              className="pointer-events-none absolute inset-y-0 mix-blend-screen transition-opacity duration-[900ms] ease-luxe"
              style={{
                left: isPortrait ? '0%' : region.left,
                width: isPortrait ? '100%' : region.width,
                opacity: selected ? 1 : 0,
                background: `radial-gradient(62% 58% at 50% 48%, ${region.lift}, transparent 74%)`,
              }}
            />
            <span
              // Faded at both edges: a hard-edged veil draws the seams
              // between regions as visible bands.
              className="pointer-events-none absolute inset-y-0 transition-opacity duration-[900ms] ease-luxe"
              style={{
                left: region.left,
                width: region.width,
                opacity: !isPortrait && anySelected && !selected ? 0.44 : 0,
                background:
                  'linear-gradient(90deg, rgba(5,5,5,0) 0%, rgba(5,5,5,1) 26%, rgba(5,5,5,1) 74%, rgba(5,5,5,0) 100%)',
              }}
            />
          </span>
        )
      })}

      {/* Above the region lights: an absolutely positioned sibling paints over
          a static one whatever the DOM order, so the canvas is lifted out of
          flow to sit on top of them — the lights belong behind the kits, not
          washed across them. */}
      <canvas ref={canvasRef} className="relative z-10 block h-full w-full" aria-hidden />


      {/* Landscape: each name sits in the band below the kits, under its own
          kit and on clear ground — not projected onto the stage, so nothing
          it belongs to can drift over it. */}
      <div
        aria-hidden={isPortrait}
        className={cn(
          'pointer-events-none absolute inset-x-0 z-20 hidden transition-opacity duration-1000 ease-luxe lg:block',
          isReady ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          top: `var(--plate-foot, ${NAME_BAND_TOP})`,
          marginTop: NAME_BAND_GAP,
          height: NAME_BAND_HEIGHT,
        }}
      >
        {products.map((product, index) => (
          <div
            key={product.slug}
            className="absolute top-0 w-56 -translate-x-1/2 text-center"
            style={{ left: `${(PLATE_KIT[index]?.x ?? 0.5) * 100}%` }}
          >
            <p
              className={cn(
                'font-display text-2xl uppercase leading-[1.1] tracking-wider2 transition-colors duration-500',
                '[text-shadow:0_2px_4px_rgba(5,5,5,0.95),0_3px_20px_rgba(5,5,5,0.9)]',
                activeIndex === index ? 'text-gold-300' : 'text-white',
              )}
            >
              {product.displayName}
            </p>
            <p className="mt-1.5 font-sans text-[11px] uppercase tracking-wider2 text-white/80 [text-shadow:0_1px_3px_rgba(5,5,5,0.95),0_2px_16px_rgba(5,5,5,0.9)]">
              {product.kind}
            </p>
          </div>
        ))}
      </div>

      {/* Portrait: one name at a time, parked under the kit it belongs to. */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-20 transition-opacity duration-1000 ease-luxe lg:hidden',
          isReady ? 'opacity-100' : 'opacity-0',
        )}
      >
        {products.map((product, index) => (
          <div
            key={product.slug}
            ref={(node) => {
              labelRefs.current[index] = node
            }}
            className={cn(
              'absolute left-0 top-0 w-52 text-center transition-opacity duration-500 will-change-transform',
              focusIndex !== index && 'opacity-0',
            )}
            style={{ paddingTop: PORTRAIT_NAME_GAP }}
          >
            <p className="font-display text-xl uppercase leading-[1.1] tracking-wider2 text-white [text-shadow:0_2px_18px_rgba(5,5,5,0.95)] sm:text-2xl">
              {product.displayName}
            </p>
            <p className="mt-2 font-sans text-[11px] uppercase tracking-wider2 text-white/75 [text-shadow:0_1px_12px_rgba(5,5,5,0.95)]">
              {product.kind}
            </p>
          </div>
        ))}
      </div>

      {isPortrait ? (
        <div ref={dotsRef} className="absolute inset-x-0 top-0 z-20 flex justify-center">
          {products.map((product, index) => (
            <button
              key={product.slug}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setFocus(index)
              }}
              aria-label={`${product.displayName} formasını göster`}
              aria-current={focusIndex === index}
              // Generous padding: the bar is 6px tall, the target is not.
              className="grid place-items-center px-2.5 py-4"
            >
              <span
                aria-hidden
                className={cn(
                  'block h-1.5 rounded-full transition-all duration-500 ease-luxe',
                  focusIndex === index ? 'w-7 bg-gold-500' : 'w-1.5 bg-white/25',
                )}
              />
            </button>
          ))}
        </div>
      ) : null}

      {/* Keyboard and crawler route to the same places the canvas does. */}
      <ul className="sr-only">
        {products.map((product) => (
          <li key={product.slug}>
            <a href={`/koleksiyon/${product.slug}`}>
              {product.displayName} — {product.kind}, {formatPrice(product.price)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
