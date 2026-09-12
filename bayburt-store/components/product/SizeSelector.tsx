'use client'

import { motion } from 'framer-motion'

import { LUXE_EASE } from '@/lib/motion'
import type { SizeOption } from '@/data/products'
import { cn } from '@/lib/utils'

interface SizeSelectorProps {
  sizes: readonly SizeOption[]
  value: SizeOption | null
  onChange: (size: SizeOption) => void
  /** Set when the visitor tried to add to cart without picking a size. */
  invalid?: boolean
  groupId: string
}

export function SizeSelector({ sizes, value, onChange, invalid = false, groupId }: SizeSelectorProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p id={`${groupId}-label`} className="eyebrow-muted">
          Beden
        </p>
        <p
          className={cn(
            'font-sans text-[11px] uppercase tracking-wider2 transition-colors duration-300',
            invalid ? 'text-gold-800' : 'text-ink-mute',
          )}
        >
          {value ? `Seçili: ${value}` : 'Beden seçin'}
        </p>
      </div>

      <div
        role="radiogroup"
        aria-labelledby={`${groupId}-label`}
        className={cn(
          'mt-4 grid grid-cols-5 gap-2 rounded-sm transition-shadow duration-500',
          invalid && 'shadow-[0_0_0_1px_rgba(212,175,55,0.6)]',
        )}
      >
        {sizes.map((size) => {
          const isActive = size === value
          return (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(size)}
              className={cn(
                'relative flex h-12 items-center justify-center border font-sans text-[13px] tracking-wider2 transition-colors duration-500 ease-luxe',
                isActive
                  ? 'border-transparent text-obsidian'
                  : 'border-ink/25 text-ink-soft hover:border-white/35 hover:text-ink',
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId={`${groupId}-size-indicator`}
                  transition={{ duration: 0.45, ease: LUXE_EASE }}
                  className="absolute inset-0 bg-gold-500"
                  aria-hidden
                />
              ) : null}
              <span className="relative z-10">{size}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
