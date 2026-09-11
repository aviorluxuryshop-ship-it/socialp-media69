'use client'

import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import { useCallback, useState, type PointerEvent } from 'react'

import { JerseyImage } from '@/components/ui/JerseyImage'
import { LUXE_EASE } from '@/lib/motion'
import type { Product } from '@/data/products'
import { cn } from '@/lib/utils'

const ZOOM = 1.55

export function JerseyViewer({ product }: { product: Product }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  const views = product.media.views
  const activeView = views[activeIndex] ?? views[0]

  // Pointer-tracked origin, spring-damped so the zoom glides instead of snapping.
  const originX = useMotionValue(50)
  const originY = useMotionValue(50)
  const smoothX = useSpring(originX, { stiffness: 120, damping: 22, mass: 0.5 })
  const smoothY = useSpring(originY, { stiffness: 120, damping: 22, mass: 0.5 })
  const transformOrigin = useMotionTemplate`${smoothX}% ${smoothY}%`

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const bounds = event.currentTarget.getBoundingClientRect()
      originX.set(((event.clientX - bounds.left) / bounds.width) * 100)
      originY.set(((event.clientY - bounds.top) / bounds.height) * 100)
    },
    [originX, originY],
  )

  const handlePointerLeave = useCallback(() => {
    setIsZoomed(false)
    originX.set(50)
    originY.set(50)
  }, [originX, originY])

  if (!activeView) return null

  return (
    <div className="flex flex-col gap-5">
      <div
        onPointerMove={handlePointerMove}
        onPointerEnter={() => setIsZoomed(true)}
        onPointerLeave={handlePointerLeave}
        className="group relative aspect-square overflow-hidden rounded-sm border border-white/10 bg-graphite-dark"
      >
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

        <motion.div
          style={{ transformOrigin }}
          animate={{ scale: isZoomed ? ZOOM : 1 }}
          transition={{ duration: 0.9, ease: LUXE_EASE }}
          className="absolute inset-[7%]"
        >
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
        </motion.div>

        {product.media.video ? (
          <video
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            src={product.media.video.src}
            poster={product.media.video.poster}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : null}

        <span className="pointer-events-none absolute bottom-5 left-5 hidden font-sans text-[11px] uppercase tracking-wider2 text-smoke opacity-0 transition-opacity duration-500 group-hover:opacity-100 lg:block">
          Yakınlaştırmak için üzerine gelin
        </span>

        <span className="pointer-events-none absolute right-5 top-5 font-sans text-[11px] uppercase tracking-wider2 text-gold-500">
          {product.colorway}
        </span>
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
                isActive ? 'border-gold-600/70' : 'border-white/10 hover:border-white/25',
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
