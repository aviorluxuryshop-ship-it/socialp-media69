'use client'

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'

import { FullMenu } from '@/components/ui/FullMenu'
import { useMenu } from '@/components/providers/MenuProvider'
import { siteConfig } from '@/data/site'
import { cn } from '@/lib/utils'

function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  const bar = 'absolute left-0 h-px w-full bg-current'
  return (
    <span aria-hidden className="relative block h-3.5 w-7">
      <motion.span
        className={bar}
        initial={false}
        animate={isOpen ? { top: 7, rotate: 45 } : { top: 0, rotate: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.span
        className={bar}
        style={{ top: 7 }}
        initial={false}
        animate={isOpen ? { opacity: 0, scaleX: 0.4 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.span
        className={bar}
        initial={false}
        animate={isOpen ? { top: 7, rotate: -45 } : { top: 14, rotate: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      />
    </span>
  )
}

export function Header() {
  const { isOpen, toggle } = useMenu()
  const [isScrolled, setIsScrolled] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 24)
  })

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-colors duration-500 ease-luxe',
          isScrolled && !isOpen
            ? 'border-b border-white/10 bg-obsidian/80 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        {/* The hero's head is near-white artwork, and white type on it is
            unreadable. This wash sits under the bar until the scrolled state
            takes over, so the links always have ground of their own. */}
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 h-[calc(var(--header-height)+2.5rem)] bg-[linear-gradient(180deg,rgba(5,5,5,0.82)_0%,rgba(5,5,5,0.52)_55%,transparent_100%)] transition-opacity duration-500 ease-luxe',
            isScrolled && !isOpen ? 'opacity-0' : 'opacity-100',
          )}
        />

        <div className="container relative flex h-[var(--header-height)] items-center justify-between gap-6">
          <Link
            href="/"
            className="group flex items-baseline gap-2.5 whitespace-nowrap"
            aria-label={`${siteConfig.name} — anasayfa`}
          >
            <span className="font-display text-[15px] font-semibold uppercase tracking-[0.3em] text-white transition-colors duration-500 group-hover:text-gold-300 sm:text-base">
              Bayburt
            </span>
            <span className="font-sans text-[10px] uppercase tracking-luxe text-smoke transition-colors duration-500 group-hover:text-gold-500">
              Store
            </span>
          </Link>

          <nav aria-label="Kısayollar" className="hidden items-center gap-9 md:flex">
            <Link
              href="/koleksiyon"
              className="link-underline font-sans text-[11px] uppercase tracking-wider2 text-smoke transition-colors duration-300 hover:text-white"
            >
              Koleksiyon
            </Link>
            <Link
              href="/hakkimizda"
              className="link-underline font-sans text-[11px] uppercase tracking-wider2 text-smoke transition-colors duration-300 hover:text-white"
            >
              Hakkımızda
            </Link>
            <span className="h-4 w-px bg-white/15" aria-hidden />
            <span className="font-sans text-[11px] uppercase tracking-wider2 text-gold-500">
              69
            </span>
          </nav>

          <button
            type="button"
            onClick={toggle}
            aria-expanded={isOpen}
            aria-controls="tam-ekran-menu"
            className="group -mr-2 flex items-center gap-3 px-2 py-3 text-white transition-colors duration-300 hover:text-gold-300"
          >
            <span className="hidden font-sans text-[11px] uppercase tracking-wider2 text-smoke transition-colors duration-300 group-hover:text-white sm:inline">
              {isOpen ? 'Kapat' : 'Menü'}
            </span>
            <HamburgerIcon isOpen={isOpen} />
            <span className="sr-only">{isOpen ? 'Menüyü kapat' : 'Menüyü aç'}</span>
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">{isOpen ? <FullMenu key="menu" /> : null}</AnimatePresence>
    </>
  )
}
