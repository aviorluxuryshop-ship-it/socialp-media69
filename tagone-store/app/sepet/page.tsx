'use client'

import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'

import { useCart } from '@/lib/cart'
import { siteConfig } from '@/data/site'

export default function CartPage() {
  const { items, setQty, remove, total } = useCart()

  if (items.length === 0) {
    return (
      <section className="bg-paper py-24">
        <div className="container max-w-lg text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">Sepetin boş</h1>
          <p className="mt-3 text-ink-mute">Henüz sepetine kart eklemedin.</p>
          <Link
            href="/urunler"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-carbon px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink"
          >
            Ürünlere Göz At
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-paper py-16">
      <div className="container grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Sepetim</h1>
          <ul className="mt-8 divide-y divide-ink/10">
            {items.map((item) => (
              <li key={item.slug} className="flex items-center gap-4 py-5">
                <span
                  className="h-14 w-20 shrink-0 rounded-lg"
                  style={{ background: item.color }}
                  aria-hidden
                />
                <div className="flex-1">
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="text-sm text-ink-mute">
                    {siteConfig.currency}
                    {item.price} / adet
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-ink/15 px-2 py-1">
                  <button
                    onClick={() => setQty(item.slug, item.qty - 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-ink/5"
                    aria-label="Azalt"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm">{item.qty}</span>
                  <button
                    onClick={() => setQty(item.slug, item.qty + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-ink/5"
                    aria-label="Artır"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => remove(item.slug)}
                  className="text-ink-mute transition hover:text-red-600"
                  aria-label="Kaldır"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="h-fit rounded-card border border-ink/10 bg-paper-raised p-6">
          <div className="flex items-center justify-between text-sm text-ink-soft">
            <span>Ara Toplam</span>
            <span>
              {siteConfig.currency}
              {total}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-ink-soft">
            <span>Kargo</span>
            <span>Ücretsiz</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4 text-base font-semibold text-ink">
            <span>Toplam</span>
            <span>
              {siteConfig.currency}
              {total}
            </span>
          </div>
          <Link
            href="/siparis"
            className="mt-6 flex items-center justify-center rounded-full bg-signal px-6 py-3 text-sm font-semibold text-carbon transition hover:bg-signal-dim"
          >
            Siparişi Tamamla
          </Link>
        </div>
      </div>
    </section>
  )
}
