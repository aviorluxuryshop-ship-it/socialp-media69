'use client'

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useCallback, type PointerEvent } from 'react'

import { JerseyImage } from '@/components/ui/JerseyImage'
import { LUXE_EASE } from '@/lib/motion'
import type { Product } from '@/data/products'
import { cn, formatPrice } from '@/lib/utils'

interface KitCard3DProps {
  product: Product
  index: number
  priority?: boolean
}

const SPRING = { stiffness: 140, damping: 18, mass: 0.5 }

export function KitCard3D({ product, index, priority = false }: KitCard3DProps) {
  // Normalised pointer position inside the card, -0.5 … 0.5 on both axes.
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)

  const smoothX = useSpring(pointerX, SPRING)
  const smoothY = useSpring(pointerY, SPRING)

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [9, -9])
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-12, 12])

  // Layered parallax: the kit lifts further than the plate behind it.
  const kitX = useTransform(smoothX, [-0.5, 0.5], [-26, 26])
  const kitY = useTransform(smoothY, [-0.5, 0.5], [-18, 18])
  const captionX = useTransform(smoothX, [-0.5, 0.5], [-10, 10])

  const glareX = useTransform(smoothX, [-0.5, 0.5], [22, 78])
  const glareY = useTransform(smoothY, [-0.5, 0.5], [12, 78])
  const glare = useMotionTemplate`radial-gradient(46% 40% at ${glareX}% ${glareY}%, rgba(255,255,255,0.14), transparent 68%)`

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const bounds = event.currentTarget.getBoundingClientRect()
      pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5)
      pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5)
    },
    [pointerX, pointerY],
  )

  const handlePointerLeave = useCallback(() => {
    pointerX.set(0)
    pointerY.set(0)
  }, [pointerX, pointerY])

  return (
    <motion.article
      initial={{ opacity: 0, y: 56 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: LUXE_EASE, delay: 0.25 + index * 0.14 }}
      className="perspective-1200 group relative"
    >
      <motion.div
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{ rotateX, rotateY }}
        className="preserve-3d relative"
      >
        <Link
          href={`/koleksiyon/${product.slug}`}
          className="block focus-visible:outline-none"
          aria-label={`${product.displayName} — ${product.kind}, ${formatPrice(product.price)}`}
        >
          <div
            className={cn(
              'preserve-3d relative flex aspect-[3/4] flex-col overflow-hidden rounded-sm border border-white/14 bg-graphite-dark',
              'transition-[border-color,box-shadow] duration-700 ease-luxe group-hover:border-gold-600/45 group-focus-within:border-gold-600/45',
              'shadow-kit',
            )}
          >
            {/* Kit-tinted floor light. */}
            <span
              aria-hidden
              className="absolute inset-0 opacity-70 transition-opacity duration-700 group-hover:opacity-100"
              style={{
                background: `radial-gradient(62% 48% at 50% 78%, ${product.palette.glow} 0%, transparent 68%)`,
              }}
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.35)_0%,transparent_38%,rgba(5,5,5,0.72)_100%)]"
            />

            <motion.span aria-hidden className="absolute inset-0 z-20 mix-blend-soft-light" style={{ background: glare }} />

            <div className="relative z-10 flex items-start justify-between px-6 pt-6">
              <span className="font-sans text-[11px] uppercase tracking-wider2 text-gold-500">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="font-sans text-[11px] uppercase tracking-wider2 text-smoke">
                {product.subtitle}
              </span>
            </div>

            <motion.div
              style={{ x: kitX, y: kitY, translateZ: 60 }}
              className="preserve-3d relative z-10 mx-auto aspect-square w-[84%] flex-1"
            >
              <JerseyImage
                src={product.media.views[0]?.src ?? ''}
                alt={product.media.views[0]?.alt ?? product.displayName}
                priority={priority}
                sizes="(max-width: 768px) 84vw, (max-width: 1280px) 40vw, 420px"
                className="drop-shadow-[0_28px_44px_rgba(0,0,0,0.55)] transition-transform duration-700 ease-luxe group-hover:scale-[1.035]"
              />
            </motion.div>

            <motion.div
              style={{ x: captionX, translateZ: 34 }}
              className="relative z-10 px-6 pb-7"
            >
              <p className="font-sans text-[11px] uppercase tracking-wider2 text-ash">{product.kind}</p>
              <h3 className="mt-2 font-display text-2xl font-semibold uppercase tracking-wide text-white sm:text-[26px]">
                {product.displayName}
              </h3>
              <div className="mt-4 flex items-center justify-between border-t border-white/14 pt-4">
                <span className="font-sans text-sm text-smoke">{formatPrice(product.price)}</span>
                <span className="inline-flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-wider2 text-gold-400">
                  İncele
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-500 ease-luxe group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </div>
            </motion.div>
          </div>
        </Link>
      </motion.div>
    </motion.article>
  )
}
