'use client'

import { useEffect, useRef } from 'react'
import { CanRenderer } from '@/lib/can-renderer'
import { CAN_META } from '@/lib/can-meta'
import { INTRO, Track, type CanState } from '@/lib/choreography'

/** CSS'teki `.stage__still` ile aynı kural: kompakt ekranda %60, geniş ekranda %74 yükseklik. */
export const COMPACT_QUERY = '(max-width: 640px), (max-width: 1024px) and (orientation: portrait)'

function baseHeight(w: number, h: number, compact: boolean) {
  return Math.min(h * (compact ? 0.6 : 0.74), w * 1.6)
}

// Ortam renkleri: şeftali → sıcak nötr → limon
const ENV = [
  [247, 231, 216],
  [244, 239, 231],
  [246, 240, 208],
]

function envColor(e: number): [number, number, number] {
  const i = Math.min(1, Math.floor(Math.max(0, e)))
  const t = Math.min(1, Math.max(0, e - i))
  const a = ENV[i]
  const b = ENV[i + 1]
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

const VIEWS = ['on', 'sag', 'arka', 'sol']

export default function Stage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stillRef = useRef<HTMLImageElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const still = stillRef.current!
    const stage = stageRef.current!
    const root = document.documentElement
    const compactMq = window.matchMedia(COMPACT_QUERY)
    const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fineMq = window.matchMedia('(pointer: fine)')

    let compact = compactMq.matches
    const track = new Track()
    const target: CanState = { ...(compact ? INTRO.m : INTRO.d) }
    const cur: CanState = { ...target }
    const startedScrolled = window.scrollY > 40

    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
    const dprCap = Math.min(window.devicePixelRatio || 1, 2)
    const quality: 'hd' | 'sd' =
      deviceMemory <= 4 || baseHeight(innerWidth, innerHeight, compact) * dprCap * 1.7 < 1100 ? 'sd' : 'hd'
    const renderer = CanRenderer.create(canvas, quality)

    let live = false
    let ambient = 0
    let vw = innerWidth
    let vh = innerHeight
    let mx = 0
    let my = 0
    let tmx = 0
    let tmy = 0
    let lastEnv = ''
    let lastHero = ''
    let raf = 0
    let last = performance.now()
    const t0 = last

    const measure = () => {
      compact = compactMq.matches
      vw = innerWidth
      vh = innerHeight
      if (renderer) renderer.resize(canvas.clientWidth || vw, canvas.clientHeight || vh, dprCap)
      track.measure(compact)
    }

    const setEnv = (e: number) => {
      const c = envColor(e)
      const css = `rgb(${c[0].toFixed(1)} ${c[1].toFixed(1)} ${c[2].toFixed(1)})`
      if (css !== lastEnv) {
        root.style.setProperty('--bg', css)
        lastEnv = css
      }
      return c
    }

    // WebGL yoksa: tek görünümlük görseller, en yakın yüze göre değişir
    let fallbackSrc = ''
    const fallback = (h: number, cx: number, cy: number) => {
      const slot = ((Math.round(-cur.phi / 90) % 4) + 4) % 4
      // phi negatif yönde SOL (-90) = sol, ARKA (-180), SAĞ (-270)
      const name = [VIEWS[0], VIEWS[3], VIEWS[2], VIEWS[1]][slot]
      const src = `/img/${cur.p > 0.5 ? 'limon' : 'seftali'}-${name}.webp`
      if (src !== fallbackSrc) {
        still.src = src
        fallbackSrc = src
      }
      still.style.height = `${h}px`
      still.style.opacity = String(cur.o)
      still.style.transform = `translate(${cx - (h * CAN_META.aspect) / 2}px, ${cy - h / 2}px)`
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const reduced = reducedMq.matches
      const y = window.scrollY

      track.sample(y, target)
      const k = reduced ? 1 : 1 - Math.exp(-dt * 6.5)
      for (const key of Object.keys(cur) as (keyof CanState)[]) cur[key] += (target[key] - cur[key]) * k

      const mk = reduced ? 1 : 1 - Math.exp(-dt * 3)
      mx += (tmx - mx) * mk
      my += (tmy - my) * mk

      const env = setEnv(cur.e)
      const heroP = Math.min(1, y / vh)
      const heroCss = heroP.toFixed(3)
      if (heroCss !== lastHero) {
        root.style.setProperty('--hero-p', heroCss)
        lastHero = heroCss
      }

      const t = (now - t0) / 1000
      const calm = Math.min(1, Math.max(0, (cur.s - 1.05) / 0.5))
      const idle = reduced ? 0 : 1 - calm * 0.75
      const phi = cur.phi + idle * (Math.sin(t * 0.33) * 3.2 + mx * 7)
      const h = baseHeight(vw, vh, compact) * cur.s
      const cx = vw / 2 + cur.x * vw
      const cy = vh / 2 + cur.y * vh + (0.5 - cur.fy) * h + idle * Math.sin(t * 0.52) * vh * 0.0035

      if (!renderer) {
        fallback(h, cx, cy)
        return
      }
      if (live) ambient = Math.min(1, ambient + dt * 1.2)
      renderer.render({
        cx,
        cy,
        h,
        phi,
        mix: cur.p,
        opacity: cur.o,
        env: [env[0] / 255, env[1] / 255, env[2] / 255],
        mx,
        my,
        ambient,
      })
    }

    const onPointer = (e: PointerEvent) => {
      if (!fineMq.matches) return
      tmx = (e.clientX / vw) * 2 - 1
      tmy = (e.clientY / vh) * 2 - 1
    }

    const ro = new ResizeObserver(() => measure())
    ro.observe(document.body)
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onPointer, { passive: true })
    compactMq.addEventListener('change', onResize)
    document.fonts?.ready.then(measure)

    measure()
    if (startedScrolled) {
      // sayfa ortadan açıldıysa açılış karesi yanlış yerde kalır: doğrudan hedefe geç
      track.sample(window.scrollY, target)
      Object.assign(cur, target)
      stage.classList.add('no-still')
      ambient = 1
    }

    if (renderer) {
      stage.dataset.mode = 'webgl'
      renderer
        .load(() => {
          live = true
          stage.classList.add('is-live')
        })
        .catch((err) => {
          console.warn('[GADA] kutu dokuları yüklenemedi', err)
          stage.dataset.mode = 'still'
        })
    } else {
      stage.dataset.mode = 'still'
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointer)
      compactMq.removeEventListener('change', onResize)
      renderer?.dispose()
    }
  }, [])

  return (
    <div className="stage" ref={stageRef} aria-hidden="true">
      <canvas ref={canvasRef} className="stage__canvas" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={stillRef}
        className="stage__still"
        src="/img/seftali-on.webp"
        alt=""
        width={CAN_META.cellW}
        height={CAN_META.cellH}
        decoding="async"
        fetchPriority="high"
      />
    </div>
  )
}
