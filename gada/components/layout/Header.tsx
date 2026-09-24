'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useMenu } from '@/components/providers/MenuProvider'
import { cn } from '@/lib/cn'

/**
 * The header has no ground of its own at any scroll position — it is the
 * wordmark and the menu button standing on whatever the page is showing.
 * Over the dark sections the ink turns to paper so it stays legible; that
 * is the only thing that ever changes.
 */
function useToneUnderHeader() {
  const pathname = usePathname()
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-tone="dark"]'))
    const hits = new Set<Element>()
    // A new page starts from ink until the observer reports otherwise.
    const reset = requestAnimationFrame(() => setDark(hits.size > 0))
    // A thin band through the middle of the header's type. Starting it 30 px
    // down keeps a dark section that has just scrolled away from still
    // counting when its edge sits exactly on the top of the window.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) hits.add(entry.target)
          else hits.delete(entry.target)
        }
        setDark(hits.size > 0)
      },
      { rootMargin: '-30px 0px -95% 0px' },
    )
    targets.forEach((target) => observer.observe(target))
    return () => {
      cancelAnimationFrame(reset)
      observer.disconnect()
    }
  }, [pathname])

  return dark
}

export function Header() {
  const { isOpen, toggle, close } = useMenu()
  const darkGround = useToneUnderHeader() && !isOpen

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          'container flex h-[var(--header-h)] items-center justify-between transition-colors duration-500 ease-luxe',
          darkGround ? 'text-cream' : 'text-ink',
        )}
      >
        <Link
          href="/"
          onClick={close}
          aria-label="GADA ana sayfa"
          className="pointer-events-auto -ml-1 px-1 font-display text-[1.5rem] font-semibold leading-none tracking-[0.18em]"
        >
          GADA
        </Link>

        <button
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-controls="site-menu"
          aria-label={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          className="pointer-events-auto -mr-2.5 grid h-11 w-11 cursor-pointer place-items-center rounded-full"
        >
          <span aria-hidden className="relative block h-[14px] w-6">
            <span
              className={cn(
                'absolute left-0 top-0 h-[1.5px] w-full bg-current transition-transform duration-500 ease-luxe',
                isOpen && 'translate-y-[6.25px] rotate-45',
              )}
            />
            <span
              className={cn(
                'absolute left-0 top-[6.25px] h-[1.5px] w-full bg-current transition-all duration-300 ease-luxe',
                isOpen && 'scale-x-0 opacity-0',
              )}
            />
            <span
              className={cn(
                'absolute bottom-0 left-0 h-[1.5px] w-full bg-current transition-transform duration-500 ease-luxe',
                isOpen && '-translate-y-[6.25px] -rotate-45',
              )}
            />
          </span>
        </button>
      </div>
    </header>
  )
}
