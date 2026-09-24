'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

const EASE = [0.16, 1, 0.3, 1] as const

const TAGS = {
  div: motion.div,
  p: motion.p,
  h2: motion.h2,
  h3: motion.h3,
  li: motion.li,
  ul: motion.ul,
  span: motion.span,
  figure: motion.figure,
} as const

interface RevealProps {
  children: ReactNode
  as?: keyof typeof TAGS
  className?: string
  delay?: number
  /** Distance travelled, px. */
  y?: number
}

/** Rises and fades into place the first time it enters the window. */
export function Reveal({ children, as = 'div', className, delay = 0, y = 28 }: RevealProps) {
  const reduced = useReducedMotion()
  const Tag = TAGS[as]
  return (
    <Tag
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 1.05, ease: EASE, delay }}
    >
      {children}
    </Tag>
  )
}
