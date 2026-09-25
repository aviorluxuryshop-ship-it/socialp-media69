'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { MenuOverlay } from './MenuOverlay'

/**
 * Minimal and transparent on purpose: the header is a thin layer of UI over
 * the scene, not a bar bolted on top of it. There is no background box —
 * only the wordmark, the trigger, and a very soft top scrim (in globals via
 * the scene itself) for legibility over bright frames.
 */
export function Header() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[60] flex items-center justify-between px-6 py-5 sm:px-10 sm:py-7">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="font-display text-2xl font-bold tracking-tight text-mist drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
        >
          GADA
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
          className="group relative z-[80] flex h-10 w-10 flex-col items-center justify-center gap-[5px]"
        >
          <span
            className={`h-px w-6 bg-mist transition-transform duration-300 ease-cinema drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)] ${
              open ? 'translate-y-[3px] rotate-45' : ''
            }`}
          />
          <span
            className={`h-px w-6 bg-mist transition-all duration-300 ease-cinema drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)] ${
              open ? '-translate-y-[3px] -rotate-45' : ''
            }`}
          />
        </button>
      </header>

      <MenuOverlay open={open} onClose={() => setOpen(false)} />
    </>
  )
}
