'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, ShoppingBag } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { LUXE_EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface AddToCartButtonProps {
  onAdd: () => boolean
  className?: string
}

/**
 * Confirms the add and resets itself. The cart itself is the caller's
 * business: `onAdd` returns false when there is a reason not to — no size
 * chosen, most often — and then nothing is confirmed.
 */
export function AddToCartButton({ onAdd, className }: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    [],
  )

  const handleClick = () => {
    if (isAdded) return
    if (!onAdd()) return

    setIsAdded(true)
    timeoutRef.current = setTimeout(() => setIsAdded(false), 2600)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-live="polite"
      className={cn(
        'group relative flex h-14 w-full items-center justify-center overflow-hidden border font-sans text-[11px] uppercase tracking-luxe transition-colors duration-500 ease-luxe',
        // Gold, filled. The one thing on the page you are meant to press should
        // not be the faintest mark on it — a hairline outline on a dark ground
        // reads as a disabled control, not as the way forward.
        isAdded
          ? 'border-gold-500 text-obsidian'
          : 'border-gold-500 bg-gold-500 text-obsidian hover:border-gold-400 hover:bg-gold-400',
        className,
      )}
    >
      <motion.span
        aria-hidden
        initial={false}
        animate={{ scaleX: isAdded ? 1 : 0 }}
        transition={{ duration: 0.6, ease: LUXE_EASE }}
        className="absolute inset-0 origin-left bg-gold-500"
      />

      <AnimatePresence mode="wait" initial={false}>
        {isAdded ? (
          <motion.span
            key="added"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: LUXE_EASE }}
            className="relative z-10 inline-flex items-center gap-2.5"
          >
            <Check className="h-4 w-4" aria-hidden />
            Sepete eklendi
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: LUXE_EASE }}
            className="relative z-10 inline-flex items-center gap-2.5"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            Sepete ekle
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
