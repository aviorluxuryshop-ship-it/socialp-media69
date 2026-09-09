'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion'

/**
 * Static element map. Building the motion component inline
 * (`motion(as)`) would create a new component type on every render and
 * remount the subtree, so the allowed tags are resolved once here.
 */
const MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  header: motion.header,
  figure: motion.figure,
  ul: motion.ul,
  ol: motion.ol,
  li: motion.li,
  dl: motion.dl,
  p: motion.p,
  span: motion.span,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  nav: motion.nav,
  aside: motion.aside,
} as const

export type RevealTag = keyof typeof MOTION_TAGS

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  distance?: number
  as?: RevealTag
}

/** Single element that rises into place the first time it enters the viewport. */
export function Reveal({ children, className, delay = 0, distance = 24, as = 'div' }: RevealProps) {
  const Component = MOTION_TAGS[as]

  return (
    <Component
      data-reveal
      className={className}
      variants={fadeUp(distance)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ delay }}
    >
      {children}
    </Component>
  )
}

interface RevealGroupProps {
  children: ReactNode
  className?: string
  stagger?: number
  delayChildren?: number
  as?: RevealTag
}

/** Parent that releases its `RevealItem` children one after another. */
export function RevealGroup({
  children,
  className,
  stagger = 0.12,
  delayChildren = 0.05,
  as = 'div',
}: RevealGroupProps) {
  const Component = MOTION_TAGS[as]

  return (
    <Component
      data-reveal
      className={className}
      variants={staggerContainer(stagger, delayChildren)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      {children}
    </Component>
  )
}

interface RevealItemProps {
  children: ReactNode
  className?: string
  distance?: number
  as?: RevealTag
}

export function RevealItem({ children, className, distance = 20, as = 'div' }: RevealItemProps) {
  const Component = MOTION_TAGS[as]

  return (
    <Component data-reveal className={className} variants={fadeUp(distance)}>
      {children}
    </Component>
  )
}
