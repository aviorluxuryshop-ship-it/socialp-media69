'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Product } from '@/data/products'
import { formatPrice } from '@/lib/format'

/** Ana sayfada tek bir modelin renklerini canlı olarak değiştirerek gösterir. */
export function ColorStory({ product }: { product: Product }) {
  const [active, setActive] = useState(product.colors[0])
  const [loaded, setLoaded] = useState<string[]>([product.colors[0].id])
  const pick = (c: Product['colors'][number]) => {
    setActive(c)
    setLoaded((l) => (l.includes(c.id) ? l : [...l, c.id]))
  }
  return (
    <div className="grid items-center gap-8 overflow-hidden rounded-[36px] bg-white p-5 ring-1 ring-line md:grid-cols-2 md:gap-12 md:p-10">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[440px] overflow-hidden rounded-[28px]" style={{ background: `${active.hex}22` }}>
        {product.colors
          .filter((c) => loaded.includes(c.id))
          .map((c) => (
            <Image
              key={c.id}
              src={c.image}
              alt={c.alt}
              fill
              sizes="(min-width:768px) 440px, 90vw"
              className={`object-cover object-top transition-opacity duration-500 ease-soft ${c.id === active.id ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
      </div>
      <div>
        <p className="eyebrow">Tek model, 5 renk</p>
        <h2 className="mt-1.5 text-[28px] leading-tight md:text-[40px]">{product.name}</h2>
        <p className="mt-3 text-[16.5px] text-ink-soft">{product.description}</p>
        <fieldset className="mt-6">
          <legend className="text-[14px] font-bold text-ink-soft">
            Renk: <span className="text-ink">{active.name}</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => pick(c)}
                onMouseEnter={() => pick(c)}
                aria-pressed={c.id === active.id}
                className={`flex min-h-[48px] items-center gap-2 rounded-full border px-3.5 pr-4 text-[14px] font-semibold transition ${
                  c.id === active.id ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink/40'
                }`}
              >
                <span className="h-6 w-6 rounded-full border border-black/10" style={{ background: c.hex }} aria-hidden="true" />
                {c.name}
              </button>
            ))}
          </div>
        </fieldset>
        <ul className="mt-6 space-y-1.5 text-[15px] text-ink-soft">
          {product.pieces.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" aria-hidden="true" /> {p}
            </li>
          ))}
        </ul>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Link href={`/urun/${product.slug}?renk=${active.id}`} className="btn-primary h-14 px-8 text-[16px]">
            {active.name} rengini incele <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <p className="font-display text-[22px] font-bold tabular">{formatPrice(product.price)}</p>
        </div>
      </div>
    </div>
  )
}
