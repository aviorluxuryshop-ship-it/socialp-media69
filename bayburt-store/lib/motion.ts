import type { Transition, Variants } from 'framer-motion'

/** Shared easing curve — long tail, no bounce. Reads as "expensive". */
export const LUXE_EASE = [0.16, 1, 0.3, 1] as const

export const baseTransition: Transition = {
  duration: 0.9,
  ease: LUXE_EASE,
}

/** Parent container that reveals its children one after another. */
export const staggerContainer = (
  stagger = 0.12,
  delayChildren = 0.08,
): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
})

/** Vertical reveal used for headings, paragraphs and cards. */
export const fadeUp = (distance = 24): Variants => ({
  hidden: { opacity: 0, y: distance },
  visible: { opacity: 1, y: 0, transition: baseTransition },
})

/** Horizontal reveal for narrative blocks that alternate sides. */
export const fadeIn = (distance = 32, axis: 'x' | 'y' = 'x'): Variants =>
  axis === 'x'
    ? {
        hidden: { opacity: 0, x: distance },
        visible: { opacity: 1, x: 0, transition: baseTransition },
      }
    : {
        hidden: { opacity: 0, y: distance },
        visible: { opacity: 1, y: 0, transition: baseTransition },
      }

/** Hairline rules that draw themselves in. */
export const drawLine: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 1.1, ease: LUXE_EASE },
  },
}

/** Fullscreen menu overlay panel. */
export const overlayPanel: Variants = {
  hidden: { opacity: 0, clipPath: 'inset(0% 0% 100% 0%)' },
  visible: {
    opacity: 1,
    clipPath: 'inset(0% 0% 0% 0%)',
    transition: { duration: 0.7, ease: LUXE_EASE, when: 'beforeChildren' },
  },
  exit: {
    opacity: 0,
    clipPath: 'inset(0% 0% 100% 0%)',
    transition: { duration: 0.5, ease: LUXE_EASE, when: 'afterChildren' },
  },
}

/** Staggered links inside the fullscreen menu. */
export const overlayLink: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: LUXE_EASE, delay: 0.12 + index * 0.07 },
  }),
  exit: { opacity: 0, y: 18, transition: { duration: 0.28, ease: LUXE_EASE } },
}

/** Viewport defaults for scroll-triggered reveals. */
/**
 * A block reveals as soon as a tenth of it is in view. At a quarter, a tall
 * story block sits blank through the first screen of scrolling it — and a
 * block taller than four screens would never reach the threshold at all.
 */
export const viewportOnce = { once: true, amount: 0.1 } as const
