'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { overlayLink, overlayPanel } from '@/lib/motion'
import { navigation } from '@/data/site'
import { products } from '@/data/products'
import { cn } from '@/lib/utils'

export function FullMenu() {
  const pathname = usePathname()
  const panelRef = useRef<HTMLDivElement>(null)

  // Move focus into the overlay on open and hand it back to the trigger on close.
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    const firstLink = panelRef.current?.querySelector<HTMLElement>('a[href]')
    firstLink?.focus({ preventScroll: true })

    return () => trigger?.focus?.({ preventScroll: true })
  }, [])

  return (
    <motion.div
      ref={panelRef}
      id="tam-ekran-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menüsü"
      variants={overlayPanel}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="grain fixed inset-0 z-40 overflow-y-auto bg-obsidian"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(212,175,55,0.10),transparent_70%)]"
      />

      <div className="container relative flex min-h-full flex-col pb-16 pt-[calc(var(--header-height)+2.5rem)]">
        <div className="grid flex-1 gap-16 lg:grid-cols-[1.35fr_1fr] lg:gap-24">
          <nav aria-label="Ana menü">
            <motion.p
              variants={overlayLink}
              custom={0}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="eyebrow-muted mb-10"
            >
              Menü
            </motion.p>

            <ul className="space-y-1">
              {navigation.map((item, index) => {
                const isActive =
                  item.href === '/' ? pathname === '/' : pathname.startsWith(item.href.split('/').slice(0, 2).join('/'))

                return (
                  <motion.li
                    key={item.href}
                    variants={overlayLink}
                    custom={index + 1}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Link
                      href={item.href}
                      className="group flex items-baseline gap-5 border-b border-white/10 py-5 sm:gap-8"
                    >
                      <span className="w-8 shrink-0 font-sans text-[11px] tracking-wider2 text-gold-600">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={cn(
                          'font-display text-[clamp(1.6rem,4vw,2.6rem)] font-medium uppercase leading-[1.1] tracking-[0.08em] transition-colors duration-500 ease-luxe',
                          isActive ? 'text-gold-400' : 'text-white group-hover:text-gold-300',
                        )}
                      >
                        {item.label}
                      </span>
                      <span className="ml-auto hidden self-center font-sans text-[11px] uppercase tracking-wider2 text-ash transition-colors duration-500 group-hover:text-smoke sm:block">
                        {item.description}
                      </span>
                    </Link>
                  </motion.li>
                )
              })}
            </ul>
          </nav>

          <div className="flex flex-col gap-12">
            <motion.div variants={overlayLink} custom={6} initial="hidden" animate="visible" exit="exit">
              <p className="eyebrow-muted mb-6">Miras Koleksiyonu</p>
              <ul className="space-y-px">
                {products.map((product) => (
                  <li key={product.slug}>
                    <Link
                      href={`/koleksiyon/${product.slug}`}
                      className="group flex items-center justify-between border-b border-white/10 py-4"
                    >
                      <span className="flex items-center gap-4">
                        <span
                          aria-hidden
                          className="h-8 w-8 rounded-full border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                          style={{ background: product.palette.base }}
                        />
                        <span className="font-display text-lg uppercase tracking-wider2 text-white transition-colors duration-500 group-hover:text-gold-300">
                          {product.displayName}
                        </span>
                      </span>
                      <span className="font-sans text-[11px] uppercase tracking-wider2 text-ash">
                        {product.kind}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

          </div>
        </div>

        <motion.p
          variants={overlayLink}
          custom={9}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="mt-16 border-t border-white/10 pt-6 font-sans text-[11px] uppercase tracking-wider2 text-ash"
        >
          Geçmişten gelen, geleceğe taşınan.
        </motion.p>
      </div>
    </motion.div>
  )
}
