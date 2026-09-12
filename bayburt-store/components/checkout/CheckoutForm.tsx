'use client'

import { AlertCircle, ArrowRight, Lock } from 'lucide-react'
import Link from 'next/link'

import { useId, useMemo, useState } from 'react'

import { useCart } from '@/components/providers/CartProvider'
import { cartTotal, lineKey, resolveLines } from '@/lib/cart'
import { startPayment, type OrderDetails } from '@/lib/payment'
import { cn, formatPrice } from '@/lib/utils'

/**
 * The order form.
 *
 * Seven fields, all required, and no postal code: in Turkey the district and
 * the address carry the delivery, and a field nobody needs is a field that
 * only costs the buyer a step.
 *
 * There is no card number, expiry or CVV here, and there must never be. Those
 * belong to the payment provider's own page — `startPayment` is where one is
 * attached, and until it is, this says so plainly rather than pretending.
 */

type FieldName = keyof OrderDetails

const FIELDS: {
  name: FieldName
  label: string
  type: string
  autoComplete: string
  placeholder: string
  full?: boolean
  multiline?: boolean
}[] = [
  { name: 'firstName', label: 'Ad', type: 'text', autoComplete: 'given-name', placeholder: 'Adınız' },
  { name: 'lastName', label: 'Soyad', type: 'text', autoComplete: 'family-name', placeholder: 'Soyadınız' },
  { name: 'phone', label: 'Telefon', type: 'tel', autoComplete: 'tel', placeholder: '05XX XXX XX XX' },
  { name: 'email', label: 'E-posta', type: 'email', autoComplete: 'email', placeholder: 'size@ornek.com' },
  {
    name: 'address',
    label: 'Adres',
    type: 'text',
    autoComplete: 'street-address',
    placeholder: 'Mahalle, cadde, sokak, bina ve daire',
    full: true,
    multiline: true,
  },
  { name: 'city', label: 'İl', type: 'text', autoComplete: 'address-level1', placeholder: 'Bayburt' },
  { name: 'district', label: 'İlçe', type: 'text', autoComplete: 'address-level2', placeholder: 'Merkez' },
]

const EMPTY: OrderDetails = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  district: '',
}

const LABEL: Record<FieldName, string> = {
  firstName: 'Ad',
  lastName: 'Soyad',
  phone: 'Telefon',
  email: 'E-posta',
  address: 'Adres',
  city: 'İl',
  district: 'İlçe',
}

/** Says what is wrong with one field, or nothing if it is fine. */
function checkField(name: FieldName, raw: string): string | null {
  const value = raw.trim()
  if (value === '') return `${LABEL[name]} alanını doldurun`

  if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    return 'Geçerli bir e-posta adresi girin'
  }
  if (name === 'phone') {
    const digits = value.replace(/\D/g, '')
    if (digits.length < 10) return 'Telefon numarasını eksiksiz girin'
  }
  if (name === 'address' && value.length < 10) {
    return 'Adresi biraz daha açık yazın'
  }
  return null
}

export function CheckoutForm() {
  const id = useId()

  const { lines, isReady, clear } = useCart()
  const [values, setValues] = useState<OrderDetails>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [handoff, setHandoff] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const resolved = useMemo(() => resolveLines(lines), [lines])
  const total = cartTotal(resolved)

  const set = (name: FieldName, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
    if (submitted) setErrors((current) => ({ ...current, [name]: checkField(name, value) ?? undefined }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    setHandoff(null)

    const next: Partial<Record<FieldName, string>> = {}
    for (const field of FIELDS) {
      const problem = checkField(field.name, values[field.name])
      if (problem) next[field.name] = problem
    }
    setErrors(next)

    const missing = Object.keys(next) as FieldName[]
    if (missing.length > 0) {
      document.getElementById(`${id}-${missing[0]}`)?.focus()
      return
    }
    if (resolved.length === 0) return

    setBusy(true)
    const result = await startPayment({
      details: {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
        city: values.city.trim(),
        district: values.district.trim(),
      },
      lines: resolved,
      total,
      currency: 'TRY',
    })
    setBusy(false)

    if (result.status === 'redirect') {
      clear()
      window.location.assign(result.url)
      return
    }
    setHandoff(result.reason)
  }

  if (isReady && resolved.length === 0) {
    return (
      <div className="border border-white/14 bg-graphite-dark px-6 py-14 text-center sm:px-10">
        <p className="font-display text-xl uppercase tracking-wider2 text-white">Sepetiniz boş</p>
        <p className="mx-auto mt-3 max-w-sm font-sans text-sm text-smoke">
          Sipariş bilgilerini doldurmadan önce sepetinize bir forma ekleyin.
        </p>
        <Link
          href="/koleksiyon"
          className="mt-8 inline-flex items-center gap-3 border border-white/20 px-7 py-3.5 font-sans text-[11px] uppercase tracking-luxe text-white transition-colors duration-500 ease-luxe hover:border-gold-600 hover:text-gold-300"
        >
          Koleksiyona git
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    )
  }

  const field =
    'w-full border bg-white/[0.03] px-4 py-3.5 font-sans text-base text-white placeholder:text-ash transition-colors duration-300 focus:border-gold-600 focus:outline-none focus:ring-1 focus:ring-gold-600/40 sm:text-sm'
  const label = 'mb-2.5 block font-sans text-[11px] uppercase tracking-wider2 text-gold-600'
  const errorList = (Object.keys(errors) as FieldName[]).filter((k) => errors[k])

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-14">
      <form onSubmit={handleSubmit} noValidate>
        <h2 className="font-display text-lg uppercase tracking-wider2 text-white">
          Teslimat bilgileri
        </h2>
        <p className="mt-2 font-sans text-sm text-smoke">Tüm alanlar zorunludur.</p>

        {submitted && errorList.length > 0 ? (
          <div
            role="alert"
            className="mt-6 border border-red-400/50 bg-red-400/[0.07] px-5 py-4"
          >
            <p className="flex items-center gap-2.5 font-sans text-[11px] uppercase tracking-wider2 text-red-300">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Eksik veya hatalı {errorList.length} alan var
            </p>
            <ul className="mt-3 space-y-1.5">
              {errorList.map((name) => (
                <li key={name} className="font-sans text-sm text-red-200">
                  <a href={`#${id}-${name}`} className="underline underline-offset-4">
                    {errors[name]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {FIELDS.map((f) => {
            const problem = errors[f.name]
            const describedBy = problem ? `${id}-${f.name}-hata` : undefined
            const shared = {
              id: `${id}-${f.name}`,
              name: f.name,
              value: values[f.name],
              autoComplete: f.autoComplete,
              placeholder: f.placeholder,
              required: true,
              'aria-invalid': Boolean(problem),
              'aria-describedby': describedBy,
              className: cn(field, problem ? 'border-red-400/70' : 'border-white/20'),
            }
            return (
              <div key={f.name} className={cn(f.full && 'sm:col-span-2')}>
                <label className={label} htmlFor={`${id}-${f.name}`}>
                  {f.label}
                </label>
                {f.multiline ? (
                  <textarea
                    {...shared}
                    rows={3}
                    className={cn(shared.className, 'resize-y')}
                    onChange={(event) => set(f.name, event.target.value)}
                  />
                ) : (
                  <input
                    {...shared}
                    type={f.type}
                    inputMode={f.name === 'phone' ? 'tel' : undefined}
                    onChange={(event) => set(f.name, event.target.value)}
                  />
                )}
                {problem ? (
                  <p
                    id={describedBy}
                    className="mt-2 font-sans text-[12px] text-red-300"
                  >
                    {problem}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>

        <button
          type="submit"
          disabled={busy}
          className="mt-10 flex h-14 w-full items-center justify-center gap-3 bg-gold-500 font-sans text-[11px] uppercase tracking-luxe text-obsidian transition-colors duration-500 ease-luxe hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto lg:px-12"
        >
          <Lock className="h-3.5 w-3.5" aria-hidden />
          {busy ? 'Yönlendiriliyor…' : 'Ödemeye geç'}
        </button>

        {handoff ? (
          <p
            role="status"
            className="mt-5 border border-gold-600/40 bg-gold-500/[0.06] px-5 py-4 font-sans text-sm text-gold-200"
          >
            {handoff} Bilgileriniz eksiksiz — ödeme sağlayıcısı bağlandığında bu adımdan
            sağlayıcının kendi güvenli sayfasına geçeceksiniz.
          </p>
        ) : null}

        <p className="mt-5 flex items-start gap-2.5 font-sans text-[12px] leading-relaxed text-ash">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" aria-hidden />
          Kart bilgileriniz bu sitede hiçbir aşamada istenmez ve saklanmaz. Ödeme, sağlayıcının
          kendi güvenli sayfasında alınır.
        </p>
      </form>

      <aside className="border border-white/14 bg-graphite-dark p-6 sm:p-7 lg:sticky lg:top-28">
        <h2 className="font-display text-lg uppercase tracking-wider2 text-white">Sipariş özeti</h2>

        <ul className="mt-6 space-y-5 border-t border-white/14 pt-6">
          {resolved.map((line) => (
            <li key={lineKey(line.slug, line.size)} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-display text-sm uppercase tracking-wider2 text-white">
                  {line.product.displayName}
                </p>
                <p className="mt-1 font-sans text-[11px] uppercase tracking-wider2 text-ash">
                  Beden {line.size} · {line.quantity} adet
                </p>
                <p className="mt-1 font-sans text-[12px] text-smoke">
                  Birim {formatPrice(line.unitPrice, line.product.currencySymbol)}
                </p>
              </div>
              <p className="shrink-0 font-sans text-sm text-white">
                {formatPrice(line.lineTotal, line.product.currencySymbol)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-6 space-y-3 border-t border-white/14 pt-6 font-sans text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-ash">Ara toplam</dt>
            <dd className="text-white">{formatPrice(total)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-ash">Kargo</dt>
            <dd className="text-gold-500">Ücretsiz</dd>
          </div>
        </dl>

        <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-white/14 pt-6">
          <span className="font-sans text-[11px] uppercase tracking-wider2 text-ash">Toplam</span>
          <span className="font-display text-2xl text-white">{formatPrice(total)}</span>
        </div>

        <Link
          href="/sepet"
          className="mt-6 block text-center font-sans text-[11px] uppercase tracking-wider2 text-ash transition-colors duration-300 hover:text-white"
        >
          Sepeti düzenle
        </Link>
      </aside>
    </div>
  )
}
