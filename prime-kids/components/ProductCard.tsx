'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { Product } from '@/data/products'
import { BADGE_LABEL } from '@/data/products'
import { formatPrice } from '@/lib/format'

export function ProductCard({ product, priority = false, sizes = '(min-width: 1024px) 23vw, (min-width: 640px) 31vw, 47vw' }: { product: Product; priority?: boolean; sizes?: string }) {
  const [active, setActiveState] = useState(product.colors[0])
  // Yalnızca gösterilen renklerin fotoğrafı indirilir (yavaş internette gereksiz yük olmasın)
  const [shown, setShown] = useState<string[]>([product.colors[0].id])
  const setActive = (c: Product['colors'][number]) => {
    setActiveState(c)
    setShown((s) => (s.includes(c.id) ? s : [...s, c.id]))
  }
  const href = `/urun/${product.slug}${active.id !== product.colors[0].id ? `?renk=${active.id}` : ''}`
  const range = `${product.sizes[0].split('-')[0]}–${product.sizes[product.sizes.length - 1].split('-')[1]} yaş`

  return (
    <article className="group relative flex flex-col">
      <Link href={href} className="relative block overflow-hidden rounded-3xl bg-sand" aria-label={`${product.name}, ${active.name}, ${formatPrice(product.price)}`}>
        <div className="relative aspect-[3/4]">
          {product.colors.filter((c) => shown.includes(c.id)).map((c) => (
            <Image
              key={c.id}
              src={c.image}
              alt={c.alt}
              fill
              sizes={sizes}
              priority={priority && c.id === product.colors[0].id}
              className={`object-cover object-top transition duration-500 ease-soft group-hover:scale-[1.03] ${
                c.id === active.id ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </div>
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {product.badges.includes('sardonlu') && (
            <span className="rounded-full bg-white/95 px-2.5 py-1 font-display text-[11.5px] font-bold uppercase tracking-wide text-ink shadow-sm">
              Şardonlu
            </span>
          )}
        </div>
        {product.colors.length > 1 && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-bold text-ink-soft shadow-sm">
            {product.colors.length} renk
          </span>
        )}
      </Link>

      <div className="mt-3 flex flex-1 flex-col px-0.5">
        {product.colors.length > 1 && (
          <div className="-ml-1.5 mb-1 flex flex-wrap" role="group" aria-label={`${product.name} renk seçenekleri`}>
            {product.colors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c)}
                onMouseEnter={() => setActive(c)}
                aria-pressed={c.id === active.id}
                aria-label={c.name}
                title={c.name}
                className="grid h-8 w-8 place-items-center rounded-full"
              >
                <span
                  className={`h-[18px] w-[18px] rounded-full border border-ink/15 transition ${c.id === active.id ? 'ring-2 ring-ink ring-offset-2' : ''}`}
                  style={{ backgroundColor: c.hex }}
                />
              </button>
            ))}
          </div>
        )}
        <h3 className="font-display text-[15px] font-semibold leading-snug md:text-[16px]">
          <Link href={href} tabIndex={-1} className="hover:underline hover:underline-offset-4">
            {product.name}
          </Link>
        </h3>
        <p className="mt-0.5 line-clamp-1 text-[13.5px] text-ink-muted">{product.short}</p>
        <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-2">
          <p className="tabular whitespace-nowrap font-display text-[16px] font-bold">{formatPrice(product.price)}</p>
          <p className="whitespace-nowrap text-[12.5px] font-semibold text-ink-muted">{range}</p>
        </div>
        {product.badges.includes('yeni') && <span className="sr-only">{BADGE_LABEL.yeni}</span>}
      </div>
    </article>
  )
}
