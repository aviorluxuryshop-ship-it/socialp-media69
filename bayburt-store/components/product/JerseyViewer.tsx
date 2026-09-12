'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

import { JerseyImage } from '@/components/ui/JerseyImage'
import { LUXE_EASE } from '@/lib/motion'
import type { Product } from '@/data/products'
import { cn } from '@/lib/utils'

/**
 * The kit is shown, not inspected. There is no zoom under the pointer: a
 * shirt that jumps and slides while you look at it is harder to read than one
 * that sits still, and there is nothing on a phone to hover with anyway.
 */
export function JerseyViewer({ product }: { product: Product }) {
  const [activeIndex, setActiveIndex] = useState(0)

  const views = product.media.views
  const activeView = views[activeIndex] ?? views[0]

  if (!activeView) return null

  return (
    <div className="flex flex-col gap-5">
      <div className="relative aspect-square overflow-hidden rounded-sm border border-white/14 bg-graphite-dark">
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `radial-gradient(56% 44% at 50% 74%, ${product.palette.glow} 0%, transparent 70%)`,
          }}
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.4)_0%,transparent_34%,rgba(5,5,5,0.55)_100%)]"
        />

        <div className="absolute inset-[7%]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeView.src}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.55, ease: LUXE_EASE }}
              className="absolute inset-0"
            >
              <JerseyImage
                src={activeView.src}
                alt={activeView.alt}
                priority
                sizes="(max-width: 1024px) 92vw, 46vw"
                className="drop-shadow-[0_30px_50px_rgba(0,0,0,0.6)]"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* The product film used to fade in under the pointer. With the
            inspection gone there is nothing left to reveal it, and an
            invisible clip playing on loop is only a drain, so it is not
            mounted. `media.video` stays in the data for a later surface. */}
      </div>

      {/* Under the frame, not over the garment: small type on a kit cannot be
          read, whichever kit it is. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5">
        <p className="font-sans text-[11px] uppercase tracking-wider2 text-gold-500">
          {product.colorway}
        </p>
      </div>

      {views.length > 1 ? (
      <div
        role="tablist"
        aria-label={`${product.displayName} görselleri`}
        className="grid grid-cols-3 gap-3"
      >
        {views.map((view, index) => {
          const isActive = index === activeIndex
          return (
            <button
              key={view.src}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-sm border bg-graphite-dark transition-colors duration-500 ease-luxe',
                isActive ? 'border-gold-600/70' : 'border-white/14 hover:border-white/25',
              )}
            >
              <span className="absolute inset-x-[10%] bottom-[24%] top-[6%]">
                <JerseyImage
                  src={view.src}
                  alt=""
                  sizes="140px"
                  className={cn(
                    'transition-opacity duration-500',
                    isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100',
                  )}
                />
              </span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-obsidian to-transparent"
              />
              <span
                className={cn(
                  'absolute inset-x-0 bottom-0 py-2.5 text-center font-sans text-[10px] uppercase tracking-wider2 transition-colors duration-500',
                  isActive ? 'text-gold-400' : 'text-ash',
                )}
              >
                {view.label}
              </span>
            </button>
          )
        })}
      </div>
      ) : null}
    </div>
  )
}
