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
 * Showcase-only checkout affordance: it confirms visually and resets itself.
 * No cart state is persisted anywhere.
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
        isAdded
          ? 'border-gold-500 text-obsidian'
          : 'border-white/20 text-white hover:border-gold-600 hover:text-gold-200',
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
