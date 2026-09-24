'use client'

import { useEffect, useRef, useState } from 'react'

import type { Face, Product } from '@/data/products'
import { dampPose, type Pose } from '@/lib/can/pose'
import type { CanScene } from '@/lib/can/scene'
import { webglAvailable } from '@/lib/can/webgl'
import { cn } from '@/lib/cn'
import { nearestFace } from '@/lib/stage/interaction'
import { useTurnable } from '@/lib/stage/useTurnable'

const LABELS: Record<Face, string> = { front: 'Ön', right: 'Sağ', back: 'Arka', left: 'Sol' }
const FACES: Face[] = ['front', 'right', 'back', 'left']

/** A single can the visitor turns by hand: drag, arrow keys or a face button. */
export function CanViewer({ product, className }: { product: Product; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const yawRef = useRef(-product.label.faces.front)
  const liveRef = useRef(0)
  const [face, setFace] = useState<Face>('front')
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  const turnable = useTurnable((delta) => {
    yawRef.current += delta
    // Keep the buttons on the face the can actually shows.
    const next = nearestFace(product.label.faces, 'front', yawRef.current + product.label.faces.front)
    setFace((previous) => (previous === next ? previous : next))
  })

  const showFace = (next: Face) => {
    const base = -product.label.faces[next]
    yawRef.current = base + 360 * Math.round((liveRef.current - base) / 360)
    setFace(next)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const fail = () => void Promise.resolve().then(() => setFailed(true))
    if (!webglAvailable()) {
      fail()
      return
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let scene: CanScene | null = null
    let frame = 0
    let last = performance.now()
    let dirty = true
    let disposed = false
    const current: Pose = { x: 0, y: -0.1, h: 0.84, yaw: yawRef.current - 40, pitch: 0, roll: 0, shadow: 0.5 }

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      scene?.setSize(rect.width, rect.height)
      dirty = true
    }
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const target: Pose = { x: 0, y: 0, h: 0.84, yaw: yawRef.current, pitch: 0, roll: 0, shadow: 0.5 }
      const moved = dampPose(current, target, reduced ? 1 : 1 - Math.exp(-dt * 6))
      liveRef.current = current.yaw
      if (scene && (moved > 1e-4 || dirty)) {
        scene.applyPose(product.id, current)
        scene.render()
        dirty = false
      }
    }
    const observer = new ResizeObserver(resize)
    const visibility = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame)
      frame = 0
      if (entry.isIntersecting && !disposed) {
        last = performance.now()
        frame = requestAnimationFrame(tick)
      }
    })

    import('@/lib/can/scene')
      .then(({ CanScene }) => {
        if (disposed) return
        scene = new CanScene(canvas, { compact: window.matchMedia('(max-width: 767px)').matches })
        return scene.load([product])
      })
      .then(() => {
        if (disposed || !scene) return
        resize()
        setReady(true)
        observer.observe(wrap)
        visibility.observe(wrap)
      })
      .catch(fail)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      visibility.disconnect()
      scene?.dispose()
    }
  }, [product])

  return (
    <div className={cn('flex flex-col', className)}>
      <div ref={wrapRef} className="relative min-h-0 flex-1">
        {failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.still} alt={`GADA ${product.short} kutusu`} className="mx-auto h-full w-auto object-contain" />
        ) : (
          <>
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={`GADA ${product.short} kutusunun üç boyutlu görünümü, ${LABELS[face].toLocaleLowerCase('tr')} yüz`}
              className={cn('absolute inset-0 h-full w-full transition-opacity duration-1000 ease-luxe', ready ? 'opacity-100' : 'opacity-0')}
            />
            <div
              {...turnable}
              role="slider"
              tabIndex={0}
              aria-label={`GADA ${product.short} kutusunu döndür`}
              aria-valuetext={`${LABELS[face]} yüz`}
              aria-valuemin={0}
              aria-valuemax={360}
              aria-valuenow={product.label.faces[face]}
              className="absolute inset-0 cursor-grab touch-pan-y select-none rounded-3xl outline-offset-[-8px] active:cursor-grabbing"
            />
          </>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {FACES.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={item === face}
            onClick={() => showFace(item)}
            className={cn(
              'min-h-11 min-w-[4.5rem] cursor-pointer rounded-full border px-4 text-[0.95rem] transition-colors duration-300',
              item === face ? 'border-ink bg-ink text-cream' : 'border-ink/15 bg-paper/50 hover:border-ink/40',
            )}
          >
            {LABELS[item]}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-ink-faint">Sürükleyerek 360° çevirin</p>
    </div>
  )
}
