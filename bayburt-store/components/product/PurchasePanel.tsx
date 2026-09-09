'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Ruler, ShieldCheck, Truck } from 'lucide-react'
import { useCallback, useState } from 'react'

import { AddToCartButton } from '@/components/product/AddToCartButton'
import { SizeSelector } from '@/components/product/SizeSelector'
import { LUXE_EASE } from '@/lib/motion'
import type { Product, SizeOption } from '@/data/products'

const ASSURANCES = [
  { icon: Truck, label: 'Türkiye geneli ücretsiz kargo' },
  { icon: ShieldCheck, label: '14 gün içinde koşulsuz iade' },
  { icon: Ruler, label: 'Athletic fit — aradaki bedende bir üstünü seçin' },
]

export function PurchasePanel({ product }: { product: Product }) {
  const [size, setSize] = useState<SizeOption | null>(null)
  const [invalid, setInvalid] = useState(false)

  const handleSelect = useCallback((next: SizeOption) => {
    setSize(next)
    setInvalid(false)
  }, [])

  const handleAdd = useCallback(() => {
    if (!size) {
      setInvalid(true)
      return false
    }
    return true
  }, [size])

  return (
    <div className="space-y-8">
      <SizeSelector
        sizes={product.sizes}
        value={size}
        onChange={handleSelect}
        invalid={invalid}
        groupId={`${product.slug}-beden`}
      />

      <div>
        <AddToCartButton onAdd={handleAdd} />

        <AnimatePresence initial={false}>
          {invalid ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.45, ease: LUXE_EASE }}
              className="overflow-hidden font-sans text-[11px] uppercase tracking-wider2 text-gold-300"
            >
              <span className="mt-3 block">Devam etmek için bir beden seçin</span>
            </motion.p>
          ) : null}
        </AnimatePresence>

        <p className="mt-4 font-sans text-[11px] uppercase tracking-wider2 text-ash">
          Vitrin gösterimi · Ödeme akışı bu sürümde kapalıdır
        </p>
      </div>

      <ul className="space-y-3 border-t border-white/10 pt-7">
        {ASSURANCES.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-3 font-sans text-sm text-ash">
            <Icon className="h-4 w-4 shrink-0 text-gold-600" aria-hidden />
            {label}
          </li>
        ))}
      </ul>
    </div>
  )
}
