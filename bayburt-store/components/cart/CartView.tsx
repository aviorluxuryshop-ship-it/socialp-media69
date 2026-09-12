'use client'

import { ArrowRight, Minus, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import { JerseyImage } from '@/components/ui/JerseyImage'
import { useCart } from '@/components/providers/CartProvider'
import { MAX_PER_LINE, cartTotal, lineKey, resolveLines } from '@/lib/cart'
import { formatPrice } from '@/lib/utils'

export function CartView() {
  const { lines, isReady, setQuantity, remove } = useCart()
  const resolved = useMemo(() => resolveLines(lines), [lines])
  const total = cartTotal(resolved)

  if (!isReady) {
    return (
      <p className="font-sans text-sm text-ink-mute" role="status">
        Sepet yükleniyor…
      </p>
    )
  }

  if (resolved.length === 0) {
    return (
      <div className="border border-ink/14 bg-paper-raised px-6 py-14 text-center sm:px-10">
        <p className="font-display text-xl uppercase tracking-wider2 text-ink">Sepetiniz boş</p>
        <p className="mx-auto mt-3 max-w-sm font-sans text-sm text-ink-soft">
          Miras Koleksiyonu’nda üç forma var. Birini seçin, bedeninizi belirleyin ve buraya geri
          dönün.
        </p>
        <Link
          href="/koleksiyon"
          className="mt-8 inline-flex items-center gap-3 border border-ink/25 px-7 py-3.5 font-sans text-[11px] uppercase tracking-luxe text-ink transition-colors duration-500 ease-luxe hover:border-gold-700 hover:text-gold-800"
        >
          Koleksiyona git
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-14">
      <ul className="space-y-4">
        {resolved.map((line) => {
          const key = lineKey(line.slug, line.size)
          return (
            <li
              key={key}
              className="flex flex-col gap-5 border border-ink/14 bg-paper-raised p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
            >
              <Link
                href={`/koleksiyon/${line.slug}`}
                className="relative mx-auto aspect-square w-24 shrink-0 sm:mx-0 sm:w-24"
              >
                <JerseyImage
                  src={line.product.media.views[0]?.src ?? ''}
                  alt={line.product.media.views[0]?.alt ?? line.product.displayName}
                  sizes="96px"
                />
              </Link>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <Link
                  href={`/koleksiyon/${line.slug}`}
                  className="font-display text-lg uppercase tracking-wider2 text-ink transition-colors duration-300 hover:text-gold-800"
                >
                  {line.product.displayName}
                </Link>
                <p className="mt-1 font-sans text-[11px] uppercase tracking-wider2 text-ink-mute">
                  {line.product.kind} · Beden {line.size}
                </p>
                <p className="mt-2.5 font-sans text-sm text-ink-soft">
                  Birim {formatPrice(line.unitPrice, line.product.currencySymbol)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-5 sm:flex-col sm:items-end sm:gap-3">
                <div className="flex items-center border border-ink/25">
                  <button
                    type="button"
                    onClick={() => setQuantity(line.slug, line.size, line.quantity - 1)}
                    aria-label={`${line.product.displayName} ${line.size} adedini azalt`}
                    className="grid h-10 w-10 place-items-center text-ink transition-colors duration-300 hover:text-gold-800"
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <span
                    aria-live="polite"
                    className="w-9 text-center font-sans text-sm tabular-nums text-ink"
                  >
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={line.quantity >= MAX_PER_LINE}
                    onClick={() => setQuantity(line.slug, line.size, line.quantity + 1)}
                    aria-label={`${line.product.displayName} ${line.size} adedini artır`}
                    className="grid h-10 w-10 place-items-center text-ink transition-colors duration-300 hover:text-gold-800 disabled:cursor-not-allowed disabled:text-ink-mute"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>

                <p className="font-sans text-base text-ink sm:text-lg">
                  {formatPrice(line.lineTotal, line.product.currencySymbol)}
                </p>

                <button
                  type="button"
                  onClick={() => remove(line.slug, line.size)}
                  className="inline-flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-wider2 text-ink-mute transition-colors duration-300 hover:text-ink"
                >
                  <X className="h-3 w-3" aria-hidden />
                  Çıkar
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <aside className="border border-ink/14 bg-paper-raised p-6 sm:p-7 lg:sticky lg:top-28">
        <h2 className="font-display text-lg uppercase tracking-wider2 text-ink">Sepet özeti</h2>

        <dl className="mt-6 space-y-3 border-t border-ink/14 pt-6 font-sans text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-ink-mute">Ara toplam</dt>
            <dd className="text-ink">{formatPrice(total)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-ink-mute">Kargo</dt>
            <dd className="text-gold-800">Ücretsiz</dd>
          </div>
        </dl>

        <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-ink/14 pt-6">
          <span className="font-sans text-[11px] uppercase tracking-wider2 text-ink-mute">Toplam</span>
          <span className="font-display text-2xl text-ink">{formatPrice(total)}</span>
        </div>

        <Link
          href="/siparis"
          className="mt-7 flex h-14 w-full items-center justify-center gap-3 bg-gold-500 font-sans text-[11px] uppercase tracking-luxe text-obsidian transition-colors duration-500 ease-luxe hover:bg-gold-400"
        >
          Siparişi ver
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>

        <Link
          href="/koleksiyon"
          className="mt-4 block text-center font-sans text-[11px] uppercase tracking-wider2 text-ink-mute transition-colors duration-300 hover:text-ink"
        >
          Alışverişe devam et
        </Link>
      </aside>
    </div>
  )
}
