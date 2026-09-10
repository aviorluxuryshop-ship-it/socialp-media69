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
const KIT_ASPECT = 0.91

/**
 * Where the kits sit inside the campaign banner, as fractions of the plate.
 * The live kits are laid over the ones baked into it, so on desktop the
 * layout is derived from the plate's cover box rather than from the viewport.
 */
const PLATE_ASPECT = 1672 / 941
const PLATE_KIT_X = [0.256, 0.501, 0.745]
const PLATE_KIT_Y = 0.512
const PLATE_KIT_H = 0.60

/** Rim light per kit: gold for Hisar, daylight for Çoruh, warm gold for Çinimaçın. */
const RIM_COLOURS = [0xffb422, 0xf2f6ff, 0xd4af37]

/** Matching wash laid over the scene while a kit is selected. */
const WASH = ['rgba(233,162,28,0.20)', 'rgba(226,234,255,0.17)', 'rgba(212,175,55,0.15)']

export function KitStage3D({ products, onUnsupported }: KitStage3DProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labelRefs = useRef<(HTMLDivElement | null)[]>([])

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
    camera.position.set(0, 0, 6)

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
      slots: [] as { x: number; y: number }[],
    }

    function measure() {
      const { clientWidth, clientHeight } = container!
      const aspect = clientWidth / Math.max(clientHeight, 1)
      const visibleHeight = 2 * camera.position.z * TAN_HALF_FOV
      const visibleWidth = visibleHeight * aspect
      const portrait = aspect < 0.95
      const worldPerPixel = visibleHeight / Math.max(clientHeight, 1)

      // The plate is object-cover: work out its rendered box, then stand each
      // kit on the one painted into it.
      const plateWidth = aspect > PLATE_ASPECT ? clientWidth : clientHeight * PLATE_ASPECT
      const plateHeight = aspect > PLATE_ASPECT ? clientWidth / PLATE_ASPECT : clientHeight
      const plateLeft = (clientWidth - plateWidth) / 2
      const plateTop = (clientHeight - plateHeight) / 2

      // Portrait crops the plate too hard to align to; it shows one kit at a
      // time and slides instead.
      const scale = portrait
        ? Math.min(visibleWidth * 0.96, visibleHeight * 0.62)
        : PLATE_KIT_H * plateHeight * worldPerPixel

      const slots = PLATE_KIT_X.map((fraction) => ({
        x: (plateLeft + fraction * plateWidth - clientWidth / 2) * worldPerPixel,
        y: (clientHeight / 2 - (plateTop + PLATE_KIT_Y * plateHeight)) * worldPerPixel,
      }))

      layout = { scale, gap: scale * KIT_ASPECT * 1.25, portrait, slots }
      setIsPortrait(portrait)

      camera.aspect = aspect
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight, false)

      nodes.forEach((node) => {
        const slot = layout.slots[node.index]
        node.group.position.x = layout.portrait
          ? (node.index - focusRef.current) * layout.gap
          : (slot?.x ?? 0)
        node.group.position.y = layout.portrait ? 0 : (slot?.y ?? 0)
        node.group.scale.setScalar(layout.scale)
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

        // Opaque with an alpha cutout. A transparent material writes depth
        // from its feathered edge fragments, which cuts a visible seam where
        // one kit's plane passes in front of another.
        //
        // One inflated shell, not two. A rear shell sits far enough behind the
        // front that perspective slides it out from under the silhouette at
        // the off-centre positions, reading as a dark duplicate — and since
        // the kits never turn more than a few degrees, nothing is ever seen
        // from behind anyway.
        const material = new THREE.MeshStandardMaterial({
          map: meshes.texture,
          alphaTest: 0.35,
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
      rim.intensity += ((highlight === null ? 1.9 : 3.1) - rim.intensity) * 0.06
      key.intensity += ((highlight === null ? 2.4 : 3.0) - key.intensity) * 0.06

      nodes.forEach((node) => {
        const isActive = node.index === active
        const sway = prefersReducedMotion ? 0 : Math.sin(time * 0.42 + node.index * 1.7) * 0.17
        const bob = prefersReducedMotion ? 0 : Math.sin(time * 0.62 + node.index * 2.1) * 0.022

        const isFocused = layout.portrait ? node.index === focusRef.current : isActive
        const targetRotation = isFocused ? sway * 0.25 : sway
        const targetScale = layout.scale * (isFocused ? 1.06 : layout.portrait ? 0.82 : 0.97)
        const targetZ = isFocused ? (layout.portrait ? 0.2 : 0.55) : 0

        node.group.rotation.y += (targetRotation - node.group.rotation.y) * 0.06
        node.group.rotation.z += (sway * 0.06 - node.group.rotation.z) * 0.06
        node.group.position.z += (targetZ - node.group.position.z) * 0.07

        const slot = layout.slots[node.index]
        const baseX = layout.portrait
          ? (node.index - focusRef.current) * layout.gap
          : (slot?.x ?? 0)
        const baseY = (layout.portrait ? 0 : (slot?.y ?? 0)) + bob
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
      const driftX = prefersReducedMotion ? 0 : pointer.x * 0.42
      const driftY = prefersReducedMotion ? 0 : pointer.y * 0.26
      camera.position.x += (driftX - camera.position.x) * 0.045
      camera.position.y += (driftY - camera.position.y) * 0.045
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)

      // Park each label under its kit, in screen space.
      const bounds = container!.getBoundingClientRect()
      nodes.forEach((node) => {
        const label = labelRefs.current[node.index]
        if (!label) return
        projected.set(0, -0.52, 0).applyMatrix4(node.group.matrixWorld).project(camera)
        const x = (projected.x * 0.5 + 0.5) * bounds.width
        const y = (-projected.y * 0.5 + 0.5) * bounds.height
        label.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, 0)`
      })
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
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />

      {/* The stage answers the selection, not just the kit: the chosen kit's
          own colour washes across the scene. */}
      {products.map((product, index) => (
        <span
          key={`${product.slug}-wash`}
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-screen transition-opacity duration-[900ms] ease-luxe"
          style={{
            opacity: (isPortrait ? focusIndex : activeIndex) === index ? 1 : 0,
            background: `radial-gradient(48% 46% at ${
              isPortrait ? 50 : [26, 50, 74][index]
            }% 50%, ${WASH[index]}, transparent 72%)`,
          }}
        />
      ))}

      <div
        className={cn(
          'pointer-events-none absolute inset-0 transition-opacity duration-1000 ease-luxe',
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
              // The campaign plate already carries the names on desktop.
              !isPortrait && 'opacity-0',
              isPortrait && focusIndex !== index && 'opacity-0',
            )}
          >
            <p
              className={cn(
                'font-display text-xl uppercase tracking-wider2 transition-colors duration-500 sm:text-2xl',
                activeIndex === index ? 'text-gold-300' : 'text-white',
              )}
            >
              {product.displayName}
            </p>
            <p className="mt-2 font-sans text-[10px] uppercase tracking-wider2 text-ash">
              {product.kind}
            </p>

          </div>
        ))}
      </div>

      {isPortrait ? (
        <div className="absolute inset-x-0 bottom-28 flex justify-center">
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
