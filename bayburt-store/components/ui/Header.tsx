'use client'

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  // Only the home page puts artwork under an unscrolled bar; every other page
  // is paper, where ink needs no help to be read.
  const onPlate = usePathname() === '/'
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
          // Scrolled, the bar needs a ground of its own, and on a paper site
          // that ground is paper — including over the hero, where a black
          // strip was the one thing the plate was never supposed to have.
          isScrolled && !isOpen
            ? 'border-b border-ink/14 bg-paper/90 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
          // On a phone over the hero the bar keeps no ground at any scroll
          // position: the portrait plate is dark the whole way down, so white
          // type reads against it without anything laid underneath.
          //
          // On the paper pages it keeps one, because there the ground changes
          // as you scroll — a kit plate is a dark window passing under a bar
          // holding ink, and through a fully transparent bar the wordmark
          // simply disappears each time one goes by. The ground is paper, so
          // on a paper page there is nothing to see until that happens.
          onPlate && 'max-lg:border-transparent max-lg:bg-transparent max-lg:backdrop-blur-none',
        )}
      >
        {/* Unscrolled on the hero there is no bar at all: the plate runs to
            the top of the window with nothing laid over it, and every mark in
            the header is held up by a halo of its own instead. Scrolled, or on
            any paper page, the bar has ground again and the halo would only
            smear the type, so it goes. */}
        <div
          className={cn(
            'container relative flex h-[var(--header-height)] items-center justify-between gap-6 transition-[filter] duration-500 ease-luxe',
            // Over the plate the type is ink with a white halo: white type
            // there needs a strip of shade behind it, and the strip is exactly
            // what should not be on the artwork. Off the plate the pages are
            // paper, so ink is simply the colour of the page — no halo needed,
            // and none wanted.
            !isScrolled && !isOpen && onPlate
              ? 'text-ink [&_*]:!text-ink drop-shadow-[0_0_2px_rgba(255,255,255,0.98)] drop-shadow-[0_0_10px_rgba(255,255,255,0.9)] [text-shadow:0_0_2px_rgba(255,255,255,0.98),0_0_7px_rgba(255,255,255,0.92),0_0_16px_rgba(255,255,255,0.8),0_0_32px_rgba(255,255,255,0.6)]'
              : 'text-ink',
            // Phones do not get the halo. A glow around dark letters is a
            // smear at that size; the answer there is the other one — give the
            // type the colour its ground calls for. The portrait plate is dark
            // at its head, so on the hero that colour is white, and on every
            // paper page it is ink.
            'max-lg:!drop-shadow-none max-lg:[text-shadow:none]',
            onPlate ? 'max-lg:!text-white max-lg:[&_*]:!text-white' : 'max-lg:!text-ink',
          )}
        >
          <Link
            href="/"
            className="group flex items-baseline gap-2.5 whitespace-nowrap"
            aria-label={`${siteConfig.name} — anasayfa`}
          >
            <span className="font-display text-[15px] font-semibold uppercase tracking-[0.3em] text-ink transition-colors duration-500 group-hover:text-gold-800 sm:text-base">
              Bayburt
            </span>
            <span className="font-sans text-[10px] uppercase tracking-luxe text-ink-soft transition-colors duration-500 group-hover:text-gold-800">
              Store
            </span>
          </Link>

          <nav aria-label="Kısayollar" className="hidden items-center gap-9 md:flex">
            <Link
              href="/koleksiyon"
              className="link-underline font-sans text-[11px] uppercase tracking-wider2 text-ink transition-colors duration-300 hover:text-gold-800"
            >
              Koleksiyon
            </Link>
            <Link
              href="/hakkimizda"
              className="link-underline font-sans text-[11px] uppercase tracking-wider2 text-ink transition-colors duration-300 hover:text-gold-800"
            >
              Hakkımızda
            </Link>
            <span className="h-4 w-px bg-ink/20" aria-hidden />
            <span className="font-sans text-[11px] uppercase tracking-wider2 text-gold-800">
              69
            </span>
          </nav>

          <button
            type="button"
            onClick={toggle}
            aria-expanded={isOpen}
            aria-controls="tam-ekran-menu"
            className={cn(
              'group -mr-2 flex items-center gap-3 px-2 py-3 transition-colors duration-300',
              // Over the plate the menu button is ink like the rest of the
              // bar, and its halo is tightened so the three rules keep a white
              // edge even where the artwork behind them goes near-black.
              !isScrolled && !isOpen && onPlate
                ? 'text-ink [&_*]:!text-ink drop-shadow-[0_0_1.5px_rgba(255,255,255,1)] drop-shadow-[0_0_4px_rgba(255,255,255,1)] drop-shadow-[0_0_9px_rgba(255,255,255,0.95)]'
                : 'text-ink hover:text-gold-800',
              'max-lg:!drop-shadow-none',
              onPlate ? 'max-lg:!text-white max-lg:[&_*]:!text-white' : 'max-lg:!text-ink',
            )}
          >
            <span className="hidden font-sans text-[11px] uppercase tracking-wider2 text-ink transition-colors duration-300 group-hover:text-gold-800 sm:inline">
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
