'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ShoppingBag } from 'lucide-react'

import type { Product } from '@/data/products'
import { useCart } from '@/lib/cart'

export function AddToCartButton({ product }: { product: Product }) {
  const { add } = useCart()
  const router = useRouter()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    add({ slug: product.slug, name: product.name, price: product.price, color: product.color })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handleAdd}
        className="inline-flex items-center gap-2 rounded-full bg-carbon px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink"
      >
        {added ? <Check className="h-4 w-4 text-signal" /> : <ShoppingBag className="h-4 w-4" />}
        {added ? 'Sepete eklendi' : 'Sepete Ekle'}
      </button>
      <button
        onClick={() => {
          handleAdd()
          router.push('/sepet')
        }}
        className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink/50"
      >
        Hemen Al
      </button>
    </div>
  )
}
