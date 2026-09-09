'use client'

import { motion } from 'framer-motion'

import { drawLine, viewportOnce } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** Hairline that draws itself in from the left when scrolled into view. */
export function GoldRule({ className }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      data-reveal
      variants={drawLine}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className={cn(
        'block h-px w-full origin-left bg-gradient-to-r from-gold-600/70 via-gold-500/25 to-transparent',
        className,
      )}
    />
  )
}
