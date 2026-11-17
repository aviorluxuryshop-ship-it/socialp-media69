'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useHydrated } from '@/lib/hooks'
import { Check, Copy, PackageCheck } from 'lucide-react'
import { readLastOrder, orderWhatsappText, type StoredOrder } from '@/lib/order'
import { formatPrice } from '@/lib/format'
import { isPreview, site, whatsappLink } from '@/data/site'
import { WhatsAppIcon } from '@/components/BrandIcons'

export function OrderComplete() {
  const hydrated = useHydrated()
  const order: StoredOrder | null | undefined = hydrated ? readLastOrder() : undefined
  const [copied, setCopied] = useState(false)

  if (order === undefined) return <div className="container min-h-[50vh] py-16" aria-busy="true" />
  if (!order) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-[26px]">Gösterilecek sipariş bulunamadı</h1>
        <p className="mt-2 text-ink-soft">Bir sorun olduğunu düşünüyorsanız bize WhatsApp’tan yazın.</p>
        <Link href="/" className="btn-primary mt-6">
          Ana sayfaya dön
        </Link>
      </div>
    )
  }

  const copyIban = async () => {
    try {
      await navigator.clipboard.writeText(site.bank.iban.replace(/\s/g, ''))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {}
  }

  return (
    <div className="container max-w-3xl pb-12 pt-8">
      <div className="text-center">
        <span className="mx-auto grid h-20 w-20 animate-pop place-items-center rounded-full bg-success text-white ring-8 ring-success-soft">
          <Check className="h-10 w-10" strokeWidth={3} aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-[28px] md:text-[36px]">Teşekkürler {order.details.firstName}, siparişiniz oluşturuldu!</h1>
        <p className="mt-2 text-[16px] text-ink-soft">
          Sipariş numaranız <strong className="tabular text-ink">{order.no}</strong>. Lütfen ödeme ve onay için aşağıdaki iki adımı tamamlayın.
        </p>
      </div>

      {isPreview && (
        <p role="note" className="mt-6 rounded-2xl border-2 border-dashed border-[#f1c46a] bg-butter/70 p-4 text-center text-[14.5px] text-ink-soft">
          <strong className="text-ink">Önizleme sürümü:</strong> Bu sipariş gerçek değildir, işleme alınmaz.{' '}
          {site.social.trendyol && (
            <a href={site.social.trendyol} target="_blank" rel="noopener noreferrer" className="font-bold text-ink underline underline-offset-2">
              Trendyol mağazamızdan sipariş verin
            </a>
          )}
        </p>
      )}

      <ol className="mt-8 space-y-4">
        <li className="rounded-3xl border-2 border-ink bg-white p-5 md:p-6">
          <p className="flex items-center gap-2.5 font-display text-[17px] font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[14px] text-white">1</span> Siparişinizi WhatsApp’tan bize iletin
          </p>
          <p className="mt-2 text-[15px] text-ink-soft">
            Sipariş özetiniz hazır; tek dokunuşla bize gönderin. Ekibimiz siparişinizi onaylayıp kargo sürecini başlatsın.
          </p>
          <a href={whatsappLink(orderWhatsappText(order))} target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-4 h-14 w-full text-[16px]">
            <WhatsAppIcon className="h-5 w-5" /> Siparişi WhatsApp’tan Gönder
          </a>
        </li>
        <li className="rounded-3xl border border-line bg-white p-5 md:p-6">
          <p className="flex items-center gap-2.5 font-display text-[17px] font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[14px] text-white">2</span> Havale / EFT ile ödeyin
          </p>
          <dl className="mt-4 grid gap-3 text-[15px] sm:grid-cols-2">
            <div>
              <dt className="text-[13px] font-bold uppercase tracking-wide text-ink-muted">Tutar</dt>
              <dd className="tabular font-display text-[22px] font-bold">{formatPrice(order.total)}</dd>
            </div>
            <div>
              <dt className="text-[13px] font-bold uppercase tracking-wide text-ink-muted">Açıklama</dt>
              <dd className="tabular font-bold">{order.no}</dd>
            </div>
            <div>
              <dt className="text-[13px] font-bold uppercase tracking-wide text-ink-muted">Alıcı</dt>
              <dd className="font-semibold">{site.bank.holder}</dd>
            </div>
            <div>
              <dt className="text-[13px] font-bold uppercase tracking-wide text-ink-muted">Banka</dt>
              <dd className="font-semibold">{site.bank.name}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[13px] font-bold uppercase tracking-wide text-ink-muted">IBAN</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-2">
                <span className="tabular rounded-xl bg-sand px-3 py-2 font-bold tracking-wide">{site.bank.iban}</span>
                <button type="button" onClick={copyIban} className="btn-secondary min-h-[44px] px-4 text-[14px]">
                  {copied ? <Check className="h-4 w-4 text-success" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                  {copied ? 'Kopyalandı' : 'IBAN’ı kopyala'}
                </button>
              </dd>
            </div>
          </dl>
          <p className="mt-4 rounded-2xl bg-butter/70 p-3 text-[14px] text-ink-soft">
            Açıklama kısmına sipariş numaranızı yazmayı unutmayın. Ödemeniz ulaştığında siparişiniz {site.shipping.cutoffHour}:00’e kadar aynı gün kargoya verilir.
          </p>
        </li>
      </ol>

      <section className="mt-8 rounded-3xl border border-line bg-white p-5 md:p-6" aria-label="Sipariş özeti">
        <h2 className="flex items-center gap-2 text-[18px]">
          <PackageCheck className="h-5 w-5" aria-hidden="true" /> Sipariş özeti
        </h2>
        <ul className="mt-4 space-y-3">
          {order.items.map((i) => (
            <li key={`${i.slug}-${i.color}-${i.size}`} className="flex items-center gap-3">
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-sand">
                <Image src={i.image} alt="" fill sizes="48px" className="object-cover object-top" />
              </div>
              <div className="min-w-0 flex-1 text-[14.5px]">
                <p className="font-semibold">{i.name}</p>
                <p className="text-ink-muted">
                  {i.color} · {i.size} · {i.qty} adet
                </p>
              </div>
              <p className="tabular font-bold">{formatPrice(i.lineTotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Kargo</dt>
            <dd className="font-semibold">{order.shipping === 0 ? 'Ücretsiz' : formatPrice(order.shipping)}</dd>
          </div>
          <div className="flex justify-between font-display text-[17px] font-bold">
            <dt>Toplam</dt>
            <dd className="tabular">{formatPrice(order.total)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-[14px] text-ink-soft">
          Teslimat: {order.details.shipping.line}, {order.details.shipping.district} / {order.details.shipping.city}
        </p>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/urunler" className="btn-secondary">
          Alışverişe devam et
        </Link>
        <Link href="/yasal/iade-ve-degisim" className="btn-ghost">
          İade ve değişim koşulları
        </Link>
      </div>
    </div>
  )
}
