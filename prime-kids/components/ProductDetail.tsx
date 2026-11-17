'use client'

import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, Clock, Maximize2, Minus, Plus, RotateCcw, Ruler, ShieldCheck, ShoppingBag, Truck } from 'lucide-react'
import type { Product } from '@/data/products'
import { CATEGORY_LABEL, SIZE_CHART, getVariant, sizeLabel } from '@/data/products'
import { site, whatsappLink } from '@/data/site'
import { cartActions, MAX_QTY } from '@/lib/cart'
import { deliveryEstimate, formatPrice } from '@/lib/format'
import { useUI } from '@/components/UIProvider'
import { Accordion, Breadcrumbs } from '@/components/Common'
import { SizeFinder, SizeTable } from '@/components/SizeFinder'
import { StoreIcon, WhatsAppIcon } from '@/components/BrandIcons'
import { Dialog } from '@/components/Dialog'
import Link from 'next/link'
import { useHydrated } from '@/lib/hooks'

export function ProductDetailRouted({ product }: { product: Product }) {
  const params = useSearchParams()
  const color = params.get('renk')
  return <ProductDetail key={product.slug} product={product} initialColor={color} />
}

export function ProductDetail({ product, initialColor }: { product: Product; initialColor: string | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const { showAdded } = useUI()
  const [variant, setVariant] = useState(() => getVariant(product, initialColor))
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null)
  const [qty, setQty] = useState(1)
  const [sizeError, setSizeError] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [zoomOpen, setZoomOpen] = useState(false)
  const hydrated = useHydrated()
  const delivery = hydrated ? deliveryEstimate() : null
  const sizesRef = useRef<HTMLFieldSetElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const [showSticky, setShowSticky] = useState(false)

  // Ana "Sepete ekle" butonu ekrandan çıkınca mobilde yapışkan çubuğu göster
  useEffect(() => {
    const el = ctaRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    document.body.classList.toggle('has-sticky-cta', showSticky)
    return () => document.body.classList.remove('has-sticky-cta')
  }, [showSticky])

  // Primo'nun "Bedenimi bul" ipucu
  useEffect(() => {
    const open = () => setGuideOpen(true)
    window.addEventListener('pk-open-size-guide', open)
    return () => window.removeEventListener('pk-open-size-guide', open)
  }, [])

  const chooseColor = (c: Product['colors'][number]) => {
    setVariant(c)
    const next = new URLSearchParams()
    if (c.id !== product.colors[0].id) next.set('renk', c.id)
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false })
  }

  const chooseSize = useCallback((s: string) => {
    setSize(s)
    setSizeError(false)
  }, [])

  const add = () => {
    if (!size) {
      setSizeError(true)
      sizesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      sizesRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
      return
    }
    cartActions.add({ slug: product.slug, color: variant.id, size, qty })
    showAdded({ name: product.name, colorName: variant.name, sizeLabel: sizeLabel(size), image: variant.image, qty })
    setQty(1)
  }

  const askText = `Merhaba, "${product.name}" (${variant.name}${size ? `, ${sizeLabel(size)}` : ''}) hakkında bilgi almak istiyorum.`

  return (
    <div className="container pb-10 pt-4 md:pt-6">
      <div className="hidden md:block">
        <Breadcrumbs
          items={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'Ürünler', href: '/urunler' },
          { label: CATEGORY_LABEL[product.category], href: `/urunler?kategori=${product.category}` },
          { label: product.name },
          ]}
        />
      </div>
      <Link href={`/urunler?kategori=${product.category}`} className="-ml-1 inline-flex min-h-[40px] items-center gap-1 text-[14px] font-semibold text-ink-soft md:hidden">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {CATEGORY_LABEL[product.category]}
      </Link>

      <div className="mt-1 grid gap-6 md:mt-4 md:grid-cols-[1.05fr_1fr] md:gap-10 lg:gap-14">
        {/* ---------- Görsel ---------- */}
        <div className="md:sticky md:top-24 md:self-start">
          <div className="relative overflow-hidden rounded-[28px] bg-sand">
            <button type="button" onClick={() => setZoomOpen(true)} className="relative block aspect-[4/5] w-full cursor-zoom-in md:aspect-[3/4]" aria-label="Fotoğrafı büyüt">
              <Image
                key={variant.id}
                src={variant.image}
                alt={variant.alt}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="animate-fade-in object-cover object-top"
              />
              <span className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-white/95 shadow-card" aria-hidden="true">
                <Maximize2 className="h-5 w-5" />
              </span>
            </button>
            {product.badges.includes('sardonlu') && (
              <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-sun px-3 py-1 font-display text-[14px] font-semibold text-ink">
                Kışlık · İçi yumuşak şardonlu
              </span>
            )}
          </div>
        </div>

        {/* ---------- Bilgi ---------- */}
        <div>
          <h1 className="text-[30px] font-bold leading-tight md:text-[38px]">{product.name}</h1>
          <p className="mt-1.5 text-[16.5px] text-ink-soft">{product.short}</p>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="tabular font-display text-[30px] font-semibold text-brand">{formatPrice(product.price)}</span>
            <span className="text-[13.5px] font-semibold text-ink-muted">KDV dahil · takım fiyatı</span>
          </p>

          {/* Renk */}
          {product.colors.length > 0 && (
            <fieldset className="mt-6">
              <legend className="text-[15px] font-bold">
                Renk: <span className="font-semibold text-ink-soft">{variant.name}</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {product.colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => chooseColor(c)}
                    aria-pressed={c.id === variant.id}
                    aria-label={c.name}
                    title={c.name}
                    className={`relative h-[74px] w-[56px] overflow-hidden rounded-2xl bg-sand ring-offset-2 ring-offset-cream transition md:h-[84px] md:w-[64px] ${
                      c.id === variant.id ? 'ring-[3px] ring-brand' : 'ring-1 ring-line hover:ring-brand/50'
                    }`}
                  >
                    <Image src={c.image} alt="" fill sizes="64px" className="object-cover object-top" />
                    <span className="absolute bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border border-white shadow" style={{ background: c.hex }} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Beden */}
          <fieldset ref={sizesRef} className="mt-7 scroll-mt-28" aria-describedby={sizeError ? 'size-error' : undefined}>
            <div className="flex items-center justify-between gap-3">
              <legend className="text-[15px] font-bold">
                Beden: <span className="font-semibold text-ink-soft">{size ? sizeLabel(size) : 'Seçiniz'}</span>
              </legend>
              <button type="button" onClick={() => setGuideOpen(true)} className="flex min-h-[44px] items-center gap-1.5 rounded-full px-2 text-[14px] font-bold underline underline-offset-4">
                <Ruler className="h-4 w-4" aria-hidden="true" /> Beden Rehberi
              </button>
            </div>
            <div className={`mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 ${sizeError ? 'animate-[pop_.4s]' : ''}`}>
              {product.sizes.map((s) => {
                const row = SIZE_CHART.find((r) => r.size === s)
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => chooseSize(s)}
                    aria-pressed={size === s}
                    className={`flex min-h-[58px] flex-col items-center justify-center rounded-2xl border-2 text-center transition ${
                      size === s ? 'border-brand bg-brand text-white' : sizeError ? 'border-danger bg-white' : 'border-line bg-white hover:border-brand'
                    }`}
                  >
                    <span className="font-display text-[16px] font-semibold tabular">{s} yaş</span>
                    {row && <span className={`text-[12px] ${size === s ? 'text-white/75' : 'text-ink-muted'}`}>{row.height[0]}-{row.height[1]} cm</span>}
                  </button>
                )
              })}
            </div>
            {sizeError && (
              <p id="size-error" role="alert" className="field-error">
                <AlertCircle className="h-4 w-4" aria-hidden="true" /> Lütfen önce beden seçin.
              </p>
            )}
          </fieldset>

          {/* Adet + Sepete ekle */}
          <div ref={ctaRef} className="mt-6 flex gap-3">
            <div className="flex h-14 items-center rounded-full border-2 border-line bg-white" role="group" aria-label="Adet">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="grid h-14 w-12 place-items-center rounded-l-full disabled:opacity-35" aria-label="Adedi azalt">
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="w-7 text-center font-display text-[16px] font-bold tabular" aria-live="polite" aria-label={`${qty} adet`}>
                {qty}
              </span>
              <button type="button" onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY} className="grid h-14 w-12 place-items-center rounded-r-full disabled:opacity-35" aria-label="Adedi artır">
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <button type="button" onClick={add} className="btn-primary h-14 flex-1 text-[16px]">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" /> Sepete Ekle
            </button>
          </div>
          <a href={whatsappLink(askText)} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-3 w-full">
            <WhatsAppIcon className="h-5 w-5 text-[#157a3f]" /> WhatsApp’tan sor
          </a>

          {/* Kısa güvenceler */}
          <ul className="mt-5 flex flex-wrap gap-2 text-[14px] font-semibold">
            <li className="flex items-center gap-1.5 rounded-full bg-sky px-3 py-1.5 text-brand">
              <Truck className="h-4 w-4" aria-hidden="true" /> {formatPrice(site.shipping.freeOver).replace(',00', '')} üzeri kargo bedava
            </li>
            <li className="flex items-center gap-1.5 rounded-full bg-mint-soft px-3 py-1.5 text-success">
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> {site.returns.days} gün kolay iade
            </li>
            <li className="flex items-center gap-1.5 rounded-full bg-pink-soft px-3 py-1.5 text-pink">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Güvenli ödeme
            </li>
          </ul>
          <p className="mt-3 flex items-center gap-2 text-[15px] text-ink-soft">
            <Clock className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            {delivery ? (
              <span>
                Tahmini teslim: <strong className="text-ink">{delivery.range}</strong>
              </span>
            ) : (
              <span>Hafta içi {site.shipping.cutoffHour}:00’e kadar verilen siparişler aynı gün kargoda.</span>
            )}
          </p>
          {site.social.trendyol && (
            <a href={site.social.trendyol} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-[40px] items-center gap-1.5 text-[15px] font-semibold text-brand">
              <StoreIcon className="h-[18px] w-[18px]" /> Müşteri yorumlarımız Trendyol’da <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </a>
          )}

          {/* Detaylar */}
          <div className="mt-6">
            <Accordion
              items={[
                {
                  q: 'Ürün detayları',
                  a: (
                    <>
                      <p className="font-semibold text-ink">Takımda: {product.pieces.join(' · ')}</p>
                      <p className="mt-2">{product.description}</p>
                      <ul className="mt-3 space-y-1.5">
                        {product.highlights.map((h) => (
                          <li key={h} className="flex gap-2">
                            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" /> {h}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3">
                        <strong className="text-ink">Kumaş:</strong> {product.fabric}
                      </p>
                      <p className="mt-1">
                        <strong className="text-ink">Bakım:</strong> {product.care.join(' · ')}
                      </p>
                    </>
                  ),
                },
                {
                  q: 'Kargo ve iade',
                  a: (
                    <p>
                      {formatPrice(site.shipping.freeOver)} ve üzeri siparişlerde kargo ücretsiz, altında {formatPrice(site.shipping.fee)}. Beden olmazsa teslimattan itibaren{' '}
                      {site.returns.days} gün içinde değişim veya iade yapabilirsiniz{site.returns.freeReturn ? '; anlaşmalı kargo ile iade ücretsizdir' : ''}.{' '}
                      <Link href="/yasal/iade-ve-degisim" className="font-semibold underline underline-offset-4">
                        İade koşulları
                      </Link>
                    </p>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* ---------- Mobil yapışkan çubuk ---------- */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-300 ease-soft md:hidden ${
          showSticky ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-hidden={!showSticky}
      >
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-xl bg-sand">
            <Image src={variant.image} alt="" fill sizes="44px" className="object-cover object-top" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink-soft">
              {variant.name} · {size ? sizeLabel(size) : 'Beden seçin'}
            </p>
            <p className="tabular font-display text-[17px] font-bold">{formatPrice(product.price)}</p>
          </div>
          <button type="button" onClick={add} tabIndex={showSticky ? 0 : -1} className="btn-primary h-12 px-5">
            {size ? 'Sepete Ekle' : 'Beden Seç'}
          </button>
        </div>
      </div>

      <Dialog open={guideOpen} onClose={() => setGuideOpen(false)} title="Beden Rehberi">
        <SizeFinder
          compact
          available={product.sizes}
          onPick={(s) => {
            chooseSize(s)
            setGuideOpen(false)
          }}
        />
        <h3 className="mb-3 mt-6 text-[16px]">Bu modelin ölçüleri</h3>
        <SizeTable only={product.sizes} />
        <p className="mt-3 text-[13.5px] text-ink-muted">Ölçüler ortalama değerlerdir; ±2 cm farklılık olabilir. Arada kalırsanız bir büyük bedeni öneririz.</p>
      </Dialog>

      <Dialog open={zoomOpen} onClose={() => setZoomOpen(false)} title={`${product.name} — ${variant.name}`} wide>
        <div className="relative mx-auto aspect-[3/4] max-h-[78vh] w-full max-w-[560px] overflow-hidden rounded-2xl bg-sand">
          <Image src={variant.image} alt={variant.alt} fill sizes="(min-width:768px) 560px, 100vw" className="object-contain" />
        </div>
      </Dialog>
    </div>
  )
}
