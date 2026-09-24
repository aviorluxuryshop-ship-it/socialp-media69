'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { useMenu } from '@/components/providers/MenuProvider'
import { useSmoothScroll } from '@/components/providers/SmoothScroll'
import { company } from '@/data/company'
import { products } from '@/data/products'
import { navigation } from '@/data/site'
import { useNavigate } from '@/lib/useNavigate'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Full-screen menu on the same warm paper as the page — never a black
 * sheet. It is slightly translucent, so the page stays faintly present
 * behind it and opening the menu reads as a layer, not a new place.
 */
export function Menu() {
  const { isOpen, close } = useMenu()
  const { lock, unlock } = useSmoothScroll()
  const navigate = useNavigate()
  const pathname = usePathname()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    lock()
    const trigger = document.activeElement as HTMLElement | null
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key !== 'Tab' || !panelRef.current) return
      // Keep Tab inside the dialog (the header's close button included).
      const focusables = [
        document.querySelector<HTMLElement>('[aria-controls="site-menu"]'),
        ...Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href], button')),
      ].filter(Boolean) as HTMLElement[]
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    const focusTimer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('a[href]')?.focus({ preventScroll: true })
    }, 250)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKey)
      unlock()
      trigger?.focus?.({ preventScroll: true })
    }
  }, [isOpen, close, lock, unlock])

  // A route change always closes the menu.
  const lastPath = useRef(pathname)
  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    close()
  }, [pathname, close])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          id="site-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menüsü"
          initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 0.8, ease: EASE } }}
          exit={{ clipPath: 'inset(0% 0% 100% 0%)', transition: { duration: 0.5, ease: EASE } }}
          className="fixed inset-0 z-40 overflow-y-auto bg-paper/[0.93] text-ink backdrop-blur-xl"
        >
          <div className="container flex min-h-full flex-col pb-10 pt-[calc(var(--header-h)+3rem)] lg:pt-[calc(var(--header-h)+4.5rem)]">
            <div className="grid flex-1 gap-14 lg:grid-cols-[1.5fr_1fr] lg:gap-24">
              <nav aria-label="Ana menü">
                <ul className="space-y-1 sm:space-y-2">
                  {navigation.map((item, index) => (
                    <motion.li
                      key={item.href}
                      initial={{ opacity: 0, y: 28 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.18 + index * 0.06, duration: 0.8, ease: EASE } }}
                      exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    >
                      <Link
                        href={item.href}
                        onClick={(event) => {
                          close()
                          navigate(item.href, event)
                        }}
                        className="group flex items-baseline gap-5 py-1.5"
                      >
                        <span className="eyebrow w-7 shrink-0 text-ink-faint tabular">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="display text-[clamp(2.3rem,1.5rem+3.6vw,4.75rem)] transition-transform duration-500 ease-luxe group-hover:translate-x-2 group-focus-visible:translate-x-2">
                          {item.label}
                        </span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <motion.aside
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.45, duration: 0.8 } }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                className="flex flex-col gap-12 lg:pt-4"
              >
                <div>
                  <p className="eyebrow mb-5 text-ink-faint">İçecekler</p>
                  <ul className="space-y-3">
                    {products.map((product) => (
                      <li key={product.id}>
                        <Link
                          href={`/icecekler/${product.slug}/`}
                          onClick={close}
                          className="group inline-flex items-center gap-3 text-lg"
                        >
                          <span
                            aria-hidden
                            className="h-3 w-3 rounded-full ring-1 ring-ink/10"
                            style={{ background: product.colors.can }}
                          />
                          <span className="underline-offset-4 group-hover:underline">GADA {product.short}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="eyebrow mb-5 text-ink-faint">İletişim</p>
                  <ul className="space-y-2 text-lg">
                    <li>
                      <a href={company.phone.href} className="tabular underline-offset-4 hover:underline">
                        {company.phone.display}
                      </a>
                    </li>
                    <li>
                      <a href={company.email.href} className="underline-offset-4 hover:underline">
                        {company.email.display}
                      </a>
                    </li>
                  </ul>
                  <address className="mt-5 not-italic text-ink-soft">
                    {company.address.lines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </div>
              </motion.aside>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.6, duration: 0.8 } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="mt-16 flex flex-wrap justify-between gap-3 border-t border-ink/10 pt-6 text-sm text-ink-soft"
            >
              <span>Bir {company.shortName} markası</span>
              <span>
                {company.city}, {company.country}
              </span>
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
