'use client'

import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'

import { KitCard3D } from '@/components/hero/KitCard3D'
import { Spotlight } from '@/components/hero/Spotlight'
import { LUXE_EASE } from '@/lib/motion'
import { products } from '@/data/products'
import { siteConfig } from '@/data/site'

const rise = {
  hidden: { opacity: 0, y: 28 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.95, ease: LUXE_EASE, delay: index * 0.1 },
  }),
}

export function HeroSelector() {
  return (
    <Spotlight className="grain relative overflow-hidden pb-24 pt-[calc(var(--header-height)+3.5rem)] lg:pb-32 lg:pt-[calc(var(--header-height)+5rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-gold-600/40 to-transparent"
      />

      <div className="container">
        <div className="flex flex-col items-center text-center">
          <motion.p variants={rise} custom={0} initial="hidden" animate="visible" className="eyebrow">
            Bayburtspor · {siteConfig.founded}
          </motion.p>

          <motion.h1
            variants={rise}
            custom={1}
            initial="hidden"
            animate="visible"
            className="mt-6 font-display text-[clamp(2.6rem,9vw,6.5rem)] font-semibold uppercase leading-[0.94] tracking-[0.06em] text-balance"
          >
            <span className="gold-text">Miras</span>
            <span className="mt-2 block font-sans text-[clamp(0.62rem,1.5vw,0.8rem)] font-normal tracking-luxe text-smoke">
              Koleksiyonu
            </span>
          </motion.h1>

          <motion.p
            variants={rise}
            custom={2}
            initial="hidden"
            animate="visible"
            className="mt-8 max-w-xl font-sans text-[15px] leading-relaxed text-pretty text-smoke"
          >
            {siteConfig.tagline} Üç forma, üç kaynak: kale, nehir ve çini. Sezon başına 1.969 adet.
          </motion.p>
        </div>

        <div className="mt-16 grid gap-6 sm:gap-7 lg:mt-20 lg:grid-cols-3 lg:gap-8">
          {products.map((product, index) => (
            <KitCard3D key={product.slug} product={product} index={index} priority={index === 0} />
          ))}
        </div>

        <motion.div
          variants={rise}
          custom={7}
          initial="hidden"
          animate="visible"
          className="mt-16 flex items-center justify-center gap-3 lg:mt-20"
        >
          <ArrowDown className="h-3.5 w-3.5 animate-scroll-hint text-gold-500" aria-hidden />
          <span className="font-sans text-[11px] uppercase tracking-luxe text-ash">
            Hikâyeyi kaydırın
          </span>
        </motion.div>
      </div>
    </Spotlight>
  )
}
