'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRef } from 'react'

import { JerseyImage } from '@/components/ui/JerseyImage'
import { fadeUp, settleDown, staggerContainer, viewportOnce } from '@/lib/motion'
import type { Product, ProductSlug } from '@/data/products'
import { cn, formatPrice } from '@/lib/utils'

const MOTIF: Record<ProductSlug, string> = {
  hisar: '/images/motifs/castle.svg',
  coruh: '/images/motifs/river.svg',
  cinimacin: '/images/motifs/tile.svg',
}

interface StoryBlockProps {
  product: Product
  index: number
}

export function StoryBlock({ product, index }: StoryBlockProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const isReversed = index % 2 === 1

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  // The motif behind the kit drifts with the scroll; the kit itself does not.
  // A shirt that slides while you read about it is a shirt you cannot look at.
  const motifY = useTransform(scrollYProgress, [0, 1], [-30, 30])

  return (
    <section
      ref={sectionRef}
      id={product.slug}
      aria-labelledby={`${product.slug}-baslik`}
      className={cn(
        'scroll-mt-24 border-t border-ink/14 py-20 lg:py-32',
        // Every other block sits a shade above the ground. Three identical
        // dark bands in a row read as one; alternating them gives the scroll
        // somewhere to land.
        isReversed ? 'bg-paper-sunk' : 'bg-paper',
      )}
    >
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Visual plate. The caption sits under it, never on the garment:
              small grey type over a kit is unreadable whichever kit it is. */}
          <div className={cn(isReversed && 'lg:order-2')}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            data-reveal
            className="relative aspect-[4/5] overflow-hidden rounded-sm border border-ink/14 bg-graphite-dark sm:aspect-[5/4] lg:aspect-[4/5]"
          >
            <span
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `radial-gradient(58% 46% at 50% 72%, ${product.palette.glow} 0%, transparent 70%)`,
              }}
            />
            <motion.span
              aria-hidden
              style={{
                y: motifY,
                backgroundImage: `url(${MOTIF[product.slug]})`,
                backgroundSize: '210px',
              }}
              className="absolute inset-[-12%] opacity-[0.07]"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.5)_0%,transparent_35%,rgba(5,5,5,0.6)_100%)]"
            />

            <div className="absolute inset-[8%]">
              <JerseyImage
                src={product.media.views[0]?.src ?? ''}
                alt={product.media.views[0]?.alt ?? product.displayName}
                sizes="(max-width: 1024px) 88vw, 46vw"
                className="drop-shadow-[0_32px_52px_rgba(0,0,0,0.6)]"
              />
            </div>

          </motion.div>

            <p className="mt-4 font-sans text-[11px] uppercase tracking-wider2 text-ink-soft">
              {String(index + 1).padStart(2, '0')} · {product.kind}
            </p>
          </div>

          {/* Narrative column */}
          <motion.div
            variants={staggerContainer(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            data-reveal
            className={cn(isReversed && 'lg:order-1')}
          >
            <motion.p variants={fadeUp(14)} className="eyebrow">
              {product.story.kicker} · {product.story.source}
            </motion.p>

            <motion.h2
              id={`${product.slug}-baslik`}
              variants={settleDown(24)}
              className="mt-5 font-display text-[clamp(2rem,5vw,3.5rem)] font-semibold uppercase leading-[1.14] tracking-tight text-ink"
            >
              {product.displayName}
            </motion.h2>

            <motion.p
              variants={fadeUp(18)}
              className="mt-3 font-display text-lg uppercase tracking-wider2 text-gold-800"
            >
              {product.story.heading}
            </motion.p>

            <motion.div variants={fadeUp(18)} className="mt-8 space-y-5">
              {product.story.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 24)}
                  className="max-w-prose font-sans text-[15px] leading-relaxed text-pretty text-ink-soft"
                >
                  {paragraph}
                </p>
              ))}
            </motion.div>

            <motion.ul variants={fadeUp(16)} className="mt-9 flex flex-wrap gap-2.5">
              {product.story.motifs.map((motif) => (
                <li
                  key={motif}
                  className="border border-ink/16 px-3.5 py-2 font-sans text-[11px] uppercase tracking-wider2 text-ink-mute"
                >
                  {motif}
                </li>
              ))}
            </motion.ul>

            <motion.div
              variants={fadeUp(16)}
              className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
            >
              <Link
                href={`/koleksiyon/${product.slug}`}
                className="group inline-flex items-center gap-3 border border-ink/25 px-7 py-3.5 font-sans text-[11px] uppercase tracking-luxe text-ink transition-colors duration-500 ease-luxe hover:border-gold-700 hover:text-gold-800"
              >
                Formayı incele
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-500 ease-luxe group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
              <span className="font-sans text-sm text-ink-mute">{formatPrice(product.price)}</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
