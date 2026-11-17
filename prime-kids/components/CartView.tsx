'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Gift, Lock, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { cartActions, summarize, useCart, MAX_QTY } from '@/lib/cart'
import { formatPrice } from '@/lib/format'
import { sizeLabel, products } from '@/data/products'
import { site } from '@/data/site'
import { useUI } from '@/components/UIProvider'
import { Breadcrumbs, TrustStrip } from '@/components/Common'
import { FreeShippingProgress } from '@/components/FreeShippingProgress'
import { PaymentBadges } from '@/components/BrandIcons'
import { ProductCard } from '@/components/ProductCard'
import { useHydrated } from '@/lib/hooks'

export function CartView() {
  const cart = useCart()
  const { lines, count, subtotal, shipping, total } = summarize(cart)
  const { toast } = useUI()
  const hydrated = useHydrated()

  const remove = (key: string, name: string) => {
    const { removed, index } = cartActions.remove(key)
    if (removed) toast(`${name} sepetten çıkarıldı`, { label: 'Geri al', onClick: () => cartActions.restore(removed, index) })
  }

  if (!hydrated) {
    return (
      <div className="container py-16" aria-busy="true">
        <div className="h-8 w-40 animate-pulse rounded-full bg-sand" />
        <div className="mt-6 h-40 animate-pulse rounded-3xl bg-sand" />
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="container pb-10 pt-6">
        <Breadcrumbs items={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Sepetim' }]} />
        <div className="mx-auto mt-8 max-w-md text-center">
          <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-white ring-1 ring-line">
            <ShoppingBag className="h-10 w-10" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-[28px]">Sepetiniz şimdilik boş</h1>
          <p className="mt-2 text-[16px] text-ink-soft">Yeni sezonun en sevilen takımlarına bir göz atın — beğendiklerinizi buraya ekleyelim.</p>
          <Link href="/urunler" className="btn-primary mt-6 h-14 w-full text-[16px] sm:w-auto sm:px-10">
            Alışverişe Başla <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-14">
          <h2 className="mb-5 text-[22px]">Yeni sezondan seçtiklerimiz</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container pb-32 pt-6 md:pb-12">
      <Breadcrumbs items={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Sepetim' }]} />
      <h1 className="mt-3 text-[28px] md:text-[36px]">
        Sepetim <span className="text-ink-muted">({count} ürün)</span>
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          <FreeShippingProgress subtotal={subtotal} />
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-4 p-4 md:p-5">
                <Link href={`/urun/${l.slug}?renk=${l.color}`} className="relative h-[124px] w-[94px] shrink-0 overflow-hidden rounded-2xl bg-sand md:h-[148px] md:w-[112px]">
                  <Image src={l.variant.image} alt={l.variant.alt} fill sizes="112px" className="object-cover object-top" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/urun/${l.slug}?renk=${l.color}`} className="font-display text-[15.5px] font-semibold leading-snug hover:underline">
                        {l.product.name}
                      </Link>
                      <p className="mt-0.5 text-[14px] text-ink-muted">Renk: {l.variant.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(l.key, l.product.name)}
                      className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-danger-soft hover:text-danger"
                      aria-label={`${l.product.name} ürününü sepetten çıkar`}
                    >
                      <Trash2 className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>

                  <label className="mt-2 flex items-center gap-2 text-[14px]">
                    <span className="font-semibold text-ink-soft">Beden:</span>
                    <select
                      value={l.size}
                      onChange={(e) => cartActions.setSize(l.key, e.target.value)}
                      className="min-h-[40px] cursor-pointer rounded-xl border border-line bg-white px-3 pr-8 font-semibold"
                      aria-label={`${l.product.name} bedeni`}
                    >
                      {l.product.sizes.map((s) => (
                        <option key={s} value={s}>
                          {sizeLabel(s)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                    <div className="flex h-11 items-center rounded-full border border-line" role="group" aria-label={`${l.product.name} adedi`}>
                      <button type="button" onClick={() => cartActions.setQty(l.key, l.qty - 1)} disabled={l.qty <= 1} className="grid h-11 w-11 place-items-center rounded-l-full disabled:opacity-30" aria-label="Azalt">
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span className="w-6 text-center font-display font-bold tabular" aria-live="polite">
                        {l.qty}
                      </span>
                      <button type="button" onClick={() => cartActions.setQty(l.key, l.qty + 1)} disabled={l.qty >= MAX_QTY} className="grid h-11 w-11 place-items-center rounded-r-full disabled:opacity-30" aria-label="Artır">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="text-right">
                      {l.qty > 1 && <p className="text-[12.5px] text-ink-muted tabular">{formatPrice(l.unitPrice)} × {l.qty}</p>}
                      <p className="font-display text-[16.5px] font-bold tabular">{formatPrice(l.lineTotal)}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {site.services.giftWrap && (
            <div className="mt-4 rounded-3xl border border-line bg-white p-4 md:p-5">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={cart.giftWrap}
                  onChange={(e) => cartActions.setGift(e.target.checked)}
                  className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-ink"
                />
                <span>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-[15.5px] font-semibold">
                    <Gift className="h-5 w-5" aria-hidden="true" /> Hediye paketi istiyorum
                    <span className="rounded-full bg-success-soft px-2 py-0.5 text-[12px] font-bold text-success">Ücretsiz</span>
                  </span>
                  <span className="mt-0.5 block text-[14px] text-ink-muted">Fiyat etiketi çıkarılır, özel kutuda gönderilir.</span>
                </span>
              </label>
              {cart.giftWrap && (
                <div className="mt-3 animate-fade-up">
                  <label htmlFor="gift-note" className="field-label">
                    Hediye notu (isteğe bağlı)
                  </label>
                  <textarea
                    id="gift-note"
                    value={cart.giftNote}
                    onChange={(e) => cartActions.setGiftNote(e.target.value)}
                    maxLength={200}
                    rows={2}
                    placeholder="İyi ki doğdun Defne! Sevgilerle, Ayşe teyzen"
                    className="field py-3"
                  />
                  <p className="mt-1 text-right text-[12.5px] text-ink-muted">{cart.giftNote.length}/200</p>
                </div>
              )}
            </div>
          )}

          <Link href="/urunler" className="mt-4 inline-flex min-h-[44px] items-center gap-1 font-display text-[14.5px] font-semibold underline underline-offset-4">
            ← Alışverişe devam et
          </Link>
        </div>

        {/* Özet */}
        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Sipariş özeti">
          <div className="rounded-3xl border border-line bg-white p-5 md:p-6">
            <h2 className="text-[19px]">Sipariş Özeti</h2>
            <dl className="mt-4 space-y-2.5 text-[15.5px]">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Ürünler ({count})</dt>
                <dd className="tabular font-semibold">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Kargo</dt>
                <dd className={`tabular font-semibold ${shipping === 0 ? 'text-success' : ''}`}>{shipping === 0 ? 'Ücretsiz' : formatPrice(shipping)}</dd>
              </div>
              {cart.giftWrap && (
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Hediye paketi</dt>
                  <dd className="font-semibold text-success">Ücretsiz</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-display text-[16px] font-bold">Toplam</dt>
                <dd className="tabular font-display text-[22px] font-bold">{formatPrice(total)}</dd>
              </div>
            </dl>
            <p className="mt-1 text-right text-[12.5px] text-ink-muted">KDV dahildir. Ek ücret yoktur.</p>
            <Link href="/odeme" className="btn-primary mt-5 hidden h-14 w-full text-[16px] lg:flex">
              <Lock className="h-[18px] w-[18px]" aria-hidden="true" /> Güvenle Ödemeye Geç
            </Link>
            <div className="mt-5 flex flex-col items-center gap-2 text-ink-muted">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" /> 256-bit SSL ile korunan ödeme
              </p>
              <PaymentBadges className="justify-center text-ink" />
            </div>
          </div>
          <div className="mt-4 hidden lg:block">
            <TrustStrip compact />
          </div>
        </aside>
      </div>

      {/* Mobil yapışkan ödeme çubuğu */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-ink-muted">Toplam ({count} ürün)</p>
            <p className="tabular font-display text-[19px] font-bold">{formatPrice(total)}</p>
          </div>
          <Link href="/odeme" className="btn-primary h-13 min-h-[52px] flex-1 text-[15.5px]">
            <Lock className="h-[18px] w-[18px]" aria-hidden="true" /> Ödemeye Geç
          </Link>
        </div>
      </div>
    </div>
  )
}
