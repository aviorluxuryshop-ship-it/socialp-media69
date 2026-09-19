'use client'

import { useState } from 'react'
import Link from 'next/link'

import { useCart } from '@/lib/cart'
import { siteConfig } from '@/data/site'

/**
 * There is no payment provider wired in yet. This form collects the order
 * and, on submit, hands it to `submitOrder` below — a single seam to swap
 * for a real checkout (iyzico, Stripe, PayTR…) once one is chosen. For now
 * it just packages the order as a WhatsApp/email handoff so orders can
 * start flowing before a gateway is integrated.
 */
async function submitOrder(payload: Record<string, unknown>) {
  // TODO: replace with a real payment/checkout provider call.
  // Until then, we simply resolve — the confirmation screen tells the
  // customer TagOne will reach out to confirm and collect payment.
  await new Promise((r) => setTimeout(r, 600))
  return { ok: true, orderId: `TAG-${Date.now().toString().slice(-6)}`, payload }
}

export default function CheckoutPage() {
  const { items, total, clear } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (items.length === 0 && !orderId) {
    return (
      <section className="bg-paper py-24">
        <div className="container max-w-lg text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">Sepetin boş</h1>
          <p className="mt-3 text-ink-mute">Sipariş vermeden önce sepetine kart eklemelisin.</p>
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

  if (orderId) {
    return (
      <section className="bg-paper py-24">
        <div className="container max-w-lg text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">Siparişin alındı 🎉</h1>
          <p className="mt-3 text-ink-mute">
            Sipariş numaran: <span className="font-semibold text-ink">{orderId}</span>. Ödeme ve kargo detayları için{' '}
            {siteConfig.phone} veya {siteConfig.email} üzerinden en kısa sürede seninle iletişime geçeceğiz.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-carbon px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </section>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const form = new FormData(e.currentTarget)
    try {
      const result = await submitOrder({
        name: form.get('name'),
        phone: form.get('phone'),
        email: form.get('email'),
        address: form.get('address'),
        note: form.get('note'),
        items,
        total,
      })
      if (result.ok) {
        setOrderId(result.orderId)
        clear()
      }
    } catch {
      setError('Bir şeyler ters gitti, lütfen tekrar dene ya da bizi doğrudan ara.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-paper py-16">
      <div className="container grid gap-10 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Sipariş Bilgileri</h1>

          <Field label="Ad Soyad" name="name" required />
          <Field label="Telefon" name="phone" type="tel" required />
          <Field label="E-posta" name="email" type="email" required />
          <Field label="Teslimat Adresi" name="address" textarea required />
          <Field label="Not (opsiyonel)" name="note" textarea />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-semibold text-carbon transition hover:bg-signal-dim disabled:opacity-60"
          >
            {submitting ? 'Gönderiliyor…' : 'Siparişi Onayla'}
          </button>
          <p className="text-xs text-ink-mute">
            Bu, ödeme sağlayıcısı entegre edilene kadar geçici bir sipariş akışıdır — siparişini aldıktan sonra ödeme detayları için seninle iletişime geçeceğiz.
          </p>
        </form>

        <div className="h-fit rounded-card border border-ink/10 bg-paper-raised p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-ink-mute">Sipariş Özeti</h2>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            {items.map((item) => (
              <li key={item.slug} className="flex justify-between">
                <span>
                  {item.name} × {item.qty}
                </span>
                <span>
                  {siteConfig.currency}
                  {item.price * item.qty}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4 text-base font-semibold text-ink">
            <span>Toplam</span>
            <span>
              {siteConfig.currency}
              {total}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  textarea,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  textarea?: boolean
}) {
  return (
    <label className="block text-sm font-medium text-ink-soft">
      {label}
      {textarea ? (
        <textarea
          name={name}
          required={required}
          rows={3}
          className="mt-1.5 w-full rounded-lg border border-ink/15 bg-paper-raised px-3 py-2 text-ink outline-none transition focus:border-signal-dim"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          className="mt-1.5 w-full rounded-lg border border-ink/15 bg-paper-raised px-3 py-2 text-ink outline-none transition focus:border-signal-dim"
        />
      )}
    </label>
  )
}
