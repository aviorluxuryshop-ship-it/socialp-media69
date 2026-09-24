'use client'

import { useEffect, useRef, useState } from 'react'

import { products, type FlavorId } from '@/data/products'
import { dampPose, lerpPose, smoothstep, type Pose } from '@/lib/can/pose'
import type { CanScene } from '@/lib/can/scene'
import { webglAvailable } from '@/lib/can/webgl'
import { bgFor, mixHex, offstage, poseFrom, specFor, type BeatId } from '@/lib/stage/beats'
import { interaction, liveYaw } from '@/lib/stage/interaction'

interface Anchor {
  id: BeatId
  el: HTMLElement
  center: number
}

const byId = new Map(products.map((product) => [product.id, product]))

/**
 * The fixed stage behind the story sections: a paper-coloured backdrop and
 * one WebGL canvas holding both cans.
 *
 * Scroll sets a target pose; the cans ease toward it. While a section is in
 * the middle of the window the target does not move, so the can is still
 * while its copy is read — it only travels in the space between sections.
 * Nothing is drawn unless something moved, and nothing runs at all once the
 * story has scrolled away.
 */
export function HomeStage({ storyId }: { storyId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const backdrop = backdropRef.current
    const story = document.getElementById(storyId)
    if (!canvas || !backdrop || !story) return

    if (!webglAvailable()) {
      document.documentElement.classList.add('no-webgl')
      return
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const compactQuery = window.matchMedia('(max-width: 1023px)')
    const finePointer = window.matchMedia('(pointer: fine)').matches
    let compact = compactQuery.matches

    // three.js arrives after the page is already readable.
    let scene: CanScene | null = null
    let disposed = false
    let anchors: Anchor[] = []
    let viewportH = window.innerHeight
    let dirty = true
    let active = true
    let frame = 0
    let last = performance.now()
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }

    const current = new Map<FlavorId, Pose | null>()
    let loaded = false

    const measure = () => {
      viewportH = window.innerHeight
      const scrollY = window.scrollY
      anchors = Array.from(story.querySelectorAll<HTMLElement>('[data-beat]')).map((el) => {
        const rect = el.getBoundingClientRect()
        // On a phone the copy sits under the can and a long section would
        // otherwise hold with its copy pushed up into it: the beat is held
        // where the first screenful of the section is centred instead.
        const span = compact ? Math.min(rect.height, viewportH * 1.25) : rect.height
        return { id: el.dataset.beat as BeatId, el, center: rect.top + scrollY + span / 2 }
      })
      const rect = canvas.getBoundingClientRect()
      scene?.setSize(rect.width, rect.height)
      dirty = true
    }

    /** Pose for one flavour at one beat, with the visitor's turn applied. */
    const beatPose = (beat: BeatId, flavor: FlavorId): Pose | null => {
      const product = byId.get(flavor)
      const choice = interaction.get()
      const spec = product && specFor(beat, flavor, compact, choice)
      if (!product || !spec) return null
      const pose = poseFrom(spec, product)
      if (beat === 'etkilesim') pose.yaw += choice.drag
      return pose
    }

    const targetAt = (position: number) => {
      const out = new Map<FlavorId, Pose | null>()
      let bg = bgFor(anchors[0]?.id ?? 'hero')
      if (anchors.length === 0) return { poses: out, bg }
      let i = anchors.findIndex((anchor) => anchor.center > position) - 1
      if (i === -2) i = anchors.length - 1 // past the last beat
      const a = anchors[Math.max(0, i)]
      const b = anchors[Math.min(anchors.length - 1, i + 1)]
      let t = a === b || i < 0 ? 0 : (position - a.center) / (b.center - a.center)
      // Hold at each end so the can rests while its section is read. The move
      // is weighted early: the can has settled before the next section's copy
      // arrives beside it, instead of sweeping through it.
      t = smoothstep(Math.min(1, Math.max(0, (t - 0.06) / 0.6)))
      if (reduced) t = t < 0.5 ? 0 : 1
      bg = mixHex(bgFor(a.id), bgFor(b.id), t)

      for (const product of products) {
        const pa = beatPose(a.id, product.id)
        const pb = beatPose(b.id, product.id)
        if (pa && pb) out.set(product.id, lerpPose(pa, pb, t))
        else if (pa) out.set(product.id, lerpPose(pa, offstage(pa, 'exit'), t))
        else if (pb) out.set(product.id, lerpPose(offstage(pb, 'enter'), pb, t))
        else out.set(product.id, null)
      }
      return { poses: out, bg }
    }

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      if (!scene) return
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const { poses, bg } = targetAt(window.scrollY + viewportH / 2)
      backdrop.style.backgroundColor = bg

      pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt * 3))
      pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt * 3))
      const k = reduced ? 1 : 1 - Math.exp(-dt * 5.5)
      let moved = Math.abs(pointer.tx - pointer.x) + Math.abs(pointer.ty - pointer.y)

      for (const product of products) {
        const target = poses.get(product.id) ?? null
        if (target) {
          // The lightest of responses to the pointer: a few degrees of turn.
          target.yaw += pointer.x * 5
          target.pitch += pointer.y * 2.5
        }
        const now = current.get(product.id)
        if (!target) {
          if (now) {
            current.set(product.id, null)
            scene.applyPose(product.id, null)
            dirty = true
          }
          continue
        }
        if (!now) {
          // First appearance: rise a little into place.
          current.set(product.id, reduced ? { ...target } : { ...target, y: target.y - 0.12, yaw: target.yaw - 35 })
          dirty = true
          continue
        }
        moved = Math.max(moved, dampPose(now, target, k))
        liveYaw[product.id] = now.yaw
        scene.applyPose(product.id, now)
      }

      if (moved > 1e-4) dirty = true
      if (dirty) {
        scene.render()
        dirty = false
      }
    }

    const start = () => {
      if (frame || disposed) return
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }

    const visibility = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting
      canvas.style.visibility = active ? 'visible' : 'hidden'
      backdrop.style.visibility = active ? 'visible' : 'hidden'
      if (active && loaded) start()
      else stop()
    })

    const resizeObserver = new ResizeObserver(() => measure())
    const onResize = () => {
      compact = compactQuery.matches
      measure()
    }
    const onPointer = (event: PointerEvent) => {
      if (!finePointer || reduced) return
      pointer.tx = (event.clientX / window.innerWidth) * 2 - 1
      pointer.ty = (event.clientY / window.innerHeight) * 2 - 1
    }

    import('@/lib/can/scene')
      .then(({ CanScene }) => {
        if (disposed) return
        scene = new CanScene(canvas, { compact: window.matchMedia('(max-width: 767px)').matches })
        return scene.load(products)
      })
      .then(() => {
        if (disposed || !scene) return
        loaded = true
        measure()
        setReady(true)
        visibility.observe(story)
        resizeObserver.observe(story)
        window.addEventListener('resize', onResize)
        window.addEventListener('pointermove', onPointer, { passive: true })
        if (active) start()
      })
      .catch(() => {
        document.documentElement.classList.add('no-webgl')
      })

    return () => {
      disposed = true
      stop()
      visibility.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointer)
      scene?.dispose()
    }
  }, [storyId])

  return (
    <>
      <div ref={backdropRef} aria-hidden className="fixed inset-0 -z-10 bg-paper" />
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="GADA kutusunun üç boyutlu görünümü. Sayfa kaydırıldıkça kutu dönerek anlatılan yüzünü gösterir."
        className={`pointer-events-none fixed inset-x-0 top-0 z-0 h-[100lvh] w-full transition-opacity duration-1000 ease-luxe ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  )
}
