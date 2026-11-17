'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { site } from '@/data/site'

/**
 * Ekranın sağından ya da solundan kısa süreliğine "pencereden bakar gibi"
 * başını uzatıp el sallayan küçük çocuklar. Mesaj vermezler, dokunmayı
 * engellemezler (pointer-events: none), sepet ve ödemede hiç çıkmazlar,
 * "hareketi azalt" açık cihazlarda gösterilmezler.
 */

type Variant = 'sunny' | 'bun' | 'beanie' | 'curly'
const VARIANTS: Variant[] = ['sunny', 'bun', 'beanie', 'curly']
const NEVER_ON = ['/sepet', '/odeme', '/siparis-alindi']
const SHOW_MS = 4200

const PALETTE: Record<Variant, { skin: string; shirt: string }> = {
  sunny: { skin: '#f9d3b4', shirt: '#4ea6e3' },
  bun: { skin: '#f6c9a5', shirt: '#ff8fb3' },
  beanie: { skin: '#eab48d', shirt: '#3cc9a0' },
  curly: { skin: '#a96c46', shirt: '#ffa94d' },
}

/** Sağ kenardan bakacak şekilde çizilmiştir; sol kenar için aynalanır. */
export function PeekKid({ variant, className, waving = true }: { variant: Variant; className?: string; waving?: boolean }) {
  const { skin, shirt } = PALETTE[variant]
  return (
    <svg viewBox="0 0 130 140" className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      {/* Omuz */}
      <path d="M40 140 C52 118 92 112 130 122 V140 Z" fill={shirt} />

      {/* Kulak */}
      <circle cx="28" cy="80" r="8" fill={skin} />
      <circle cx="112" cy="80" r="8" fill={skin} />
      {/* Kafa */}
      <circle cx="70" cy="76" r="43" fill={skin} />

      {/* Saç / şapka */}
      {variant === 'sunny' && (
        <>
          <path d="M28 70 C26 44 46 30 70 30 C96 30 116 44 113 70 C107 61 99 56 91 54 L89 62 L81 50 L75 60 L67 46 L59 60 L51 50 L46 62 C38 62 32 65 28 70 Z" fill="#f2b84b" />
          <path d="M44 38 L39 20 L54 31 L60 14 L70 29 L82 14 L86 31 L101 22 L96 40 Z" fill="#f2b84b" />
          {/* Alındaki güneş gözlüğü */}
          <rect x="45" y="42" width="21" height="12" rx="5.5" fill="#1e2a4a" />
          <rect x="74" y="42" width="21" height="12" rx="5.5" fill="#1e2a4a" />
          <path d="M66 47 h8" stroke="#1e2a4a" strokeWidth="3" />
          <path d="M49 46 h6 M78 46 h6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity=".75" />
        </>
      )}
      {variant === 'bun' && (
        <>
          <circle cx="70" cy="26" r="13" fill="#7a4a2b" />
          <path d="M27 80 C22 48 44 32 70 32 C97 32 118 48 113 80 C108 66 99 57 86 52 C78 62 58 65 45 59 C37 64 31 71 27 80 Z" fill="#7a4a2b" />
          <path d="M70 37 l-12 -7 v14 Z M70 37 l12 -7 v14 Z" fill="#ff6f9c" />
          <circle cx="70" cy="37" r="4" fill="#ff8fb3" />
        </>
      )}
      {variant === 'beanie' && (
        <>
          <path d="M34 72 q6 7 12 0 q6 7 12 0 q6 7 12 0 q6 7 12 0 q6 7 12 0 q6 7 12 0" fill="#5b3a26" />
          <path d="M25 66 C25 38 46 24 70 24 C95 24 116 38 115 66 Z" fill="#ffc83d" />
          <rect x="22" y="56" width="96" height="15" rx="7.5" fill="#f2a900" />
          <path d="M34 56 v15 M48 56 v15 M62 56 v15 M76 56 v15 M90 56 v15 M104 56 v15" stroke="#ffc83d" strokeWidth="3" />
          <circle cx="70" cy="20" r="9" fill="#fff" stroke="#f6dd8c" strokeWidth="2" />
        </>
      )}
      {variant === 'curly' && (
        <>
          {[
            [32, 66, 13],
            [38, 46, 13],
            [52, 33, 14],
            [70, 28, 15],
            [88, 33, 14],
            [102, 46, 13],
            [108, 66, 12],
          ].map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#2b1d1a" />
          ))}
          <path d="M30 60 Q70 30 110 60" fill="none" stroke="#3cc9a0" strokeWidth="7" strokeLinecap="round" />
        </>
      )}

      {/* Yüz — sade, sevimli */}
      <ellipse cx="57" cy="82" rx="4.6" ry="5.6" fill="#2a2140" />
      <ellipse cx="83" cy="82" rx="4.6" ry="5.6" fill="#2a2140" />
      <circle cx="58.6" cy="79.8" r="1.7" fill="#fff" />
      <circle cx="84.6" cy="79.8" r="1.7" fill="#fff" />
      <ellipse cx="47" cy="94" rx="7" ry="4.4" fill="#ff8fab" opacity=".6" />
      <ellipse cx="93" cy="94" rx="7" ry="4.4" fill="#ff8fab" opacity=".6" />
      <path d="M62 93 Q70 103 78 93 Z" fill="#8c3341" />
      <path d="M65.5 97.5 Q70 101 74.5 97.5" fill="#ff8a94" />

      {/* El sallayan kol */}
      <g className={waving ? 'peek-wave' : undefined} style={{ transformOrigin: '30px 140px' }}>
        <path d="M30 140 L22 112" stroke={shirt} strokeWidth="15" strokeLinecap="round" />
        <circle cx="20" cy="101" r="11" fill={skin} />
        <ellipse cx="11" cy="94" rx="3.6" ry="6" fill={skin} transform="rotate(-25 11 94)" />
        <ellipse cx="17" cy="89" rx="3.6" ry="6.5" fill={skin} transform="rotate(-8 17 89)" />
        <ellipse cx="24" cy="89" rx="3.6" ry="6.5" fill={skin} transform="rotate(8 24 89)" />
        <ellipse cx="30" cy="94" rx="3.6" ry="5.6" fill={skin} transform="rotate(28 30 94)" />
      </g>
    </svg>
  )
}

export function Peekers() {
  const pathname = usePathname()
  const [peek, setPeek] = useState<{ id: number; variant: Variant; side: 'left' | 'right'; top: number } | null>(null)
  const lastVariant = useRef<Variant | null>(null)

  useEffect(() => {
    if (!site.mascot.enabled) return
    if (NEVER_ON.some((p) => pathname.startsWith(p))) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let shown = 0
    let timer: number | undefined
    let hideTimer: number | undefined

    const next = (delay: number) => {
      timer = window.setTimeout(() => {
        const blocked = document.visibilityState !== 'visible' || document.querySelector('dialog[open], [aria-modal="true"]')
        if (!blocked) {
          const pool = VARIANTS.filter((v) => v !== lastVariant.current)
          const variant = pool[Math.floor(Math.random() * pool.length)]
          lastVariant.current = variant
          setPeek({ id: Date.now(), variant, side: Math.random() < 0.5 ? 'left' : 'right', top: 26 + Math.random() * 38 })
          hideTimer = window.setTimeout(() => setPeek(null), SHOW_MS)
          shown += 1
        }
        // Ara sıra: sayfa başına en fazla 4 kez, 20-38 sn arayla
        if (shown < 4) next(20000 + Math.random() * 18000)
      }, delay)
    }
    next(5000)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(hideTimer)
      setPeek(null)
    }
  }, [pathname])

  if (!peek) return null
  return (
    <div
      key={peek.id}
      aria-hidden="true"
      className="pointer-events-none fixed z-[44] w-[86px] md:w-[112px]"
      style={{ top: `${peek.top}vh`, [peek.side]: 0, transform: peek.side === 'left' ? 'scaleX(-1)' : undefined }}
    >
      <div className="animate-peek-in-out">
        <PeekKid variant={peek.variant} className="h-auto w-full drop-shadow-[0_6px_10px_rgba(30,42,74,.18)]" />
      </div>
    </div>
  )
}
