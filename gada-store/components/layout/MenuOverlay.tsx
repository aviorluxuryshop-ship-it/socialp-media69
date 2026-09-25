'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

import { navigation } from '@/lib/site'

export function MenuOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const itemsRef = useRef<HTMLAnchorElement[]>([])
  const pathname = usePathname()

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const items = itemsRef.current.filter(Boolean)
    const ctx = gsap.context(() => {
      if (open) {
        gsap.set(root, { pointerEvents: 'auto' })
        gsap.fromTo(
          root,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.5, ease: 'power2.out' },
        )
        gsap.fromTo(
          items,
          { yPercent: 60, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'expo.out', stagger: 0.06, delay: 0.08 },
        )
      } else {
        gsap.to(root, {
          autoAlpha: 0,
          duration: 0.35,
          ease: 'power2.in',
          onComplete: () => gsap.set(root, { pointerEvents: 'none' }),
        })
      }
    }, root)

    return () => ctx.revert()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[70] bg-void/97 backdrop-blur-md opacity-0"
      style={{ pointerEvents: 'none' }}
      aria-hidden={!open}
    >
      <nav className="flex h-full flex-col items-start justify-center gap-2 px-6 sm:px-12">
        {navigation.map((item, i) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              ref={(el) => {
                if (el) itemsRef.current[i] = el
              }}
              onClick={onClose}
              className={`group flex items-baseline gap-4 py-2 font-display text-[clamp(2.2rem,7vw,4.5rem)] font-semibold tracking-tight transition-colors duration-300 ${
                active ? 'text-[var(--accent)]' : 'text-mist hover:text-[var(--accent)]'
              }`}
            >
              <span className="font-sans text-xs tracking-wide4 text-haze opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {String(i + 1).padStart(2, '0')}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <p className="absolute bottom-8 left-6 right-6 flex flex-wrap items-center justify-between gap-2 font-sans text-[11px] uppercase tracking-wide3 text-haze sm:left-12 sm:right-12">
        <span>GADA · AN Zentrum</span>
        <span>Bayburt, Türkiye</span>
      </p>
    </div>
  )
}
