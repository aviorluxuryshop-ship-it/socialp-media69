'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useHydrated } from '@/lib/hooks'
import { AlertCircle, Check, ChevronDown, CreditCard, Landmark, Loader2, Lock, ShieldCheck } from 'lucide-react'
import { cartActions, summarize, useCart } from '@/lib/cart'
import { formatPrice } from '@/lib/format'
import { CITIES } from '@/data/cities'
import { site } from '@/data/site'
import { getLegalDoc } from '@/data/legal'
import { sizeLabel } from '@/data/products'
import { newOrderNo, saveLastOrder, toOrderItems, type OrderDetails, type StoredOrder } from '@/lib/order'
import { startPayment } from '@/lib/payment'
import { Dialog } from '@/components/Dialog'
import { PaymentBadges } from '@/components/BrandIcons'

type Method = 'kart' | 'havale'
type FieldKey =
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'email'
  | 'city'
  | 'district'
  | 'line'
  | 'bCity'
  | 'bDistrict'
  | 'bLine'
  | 'agree'

interface Draft {
  firstName: string
  lastName: string
  phone: string
  email: string
  city: string
  district: string
  line: string
  billingSame: boolean
  bCity: string
  bDistrict: string
  bLine: string
  note: string
}

const EMPTY: Draft = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  city: '',
  district: '',
  line: '',
  billingSame: true,
  bCity: '',
  bDistrict: '',
  bLine: '',
  note: '',
}
const DRAFT_KEY = 'pk-checkout-draft'

const LABELS: Record<FieldKey, string> = {
  firstName: 'Ad',
  lastName: 'Soyad',
  phone: 'Cep telefonu',
  email: 'E-posta',
  city: 'İl',
  district: 'İlçe',
  line: 'Açık adres',
  bCity: 'Fatura ili',
  bDistrict: 'Fatura ilçesi',
  bLine: 'Fatura adresi',
  agree: 'Sözleşme onayı',
}

/** "5321234567" → "0 (532) 123 45 67" */
function formatPhone(raw: string) {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('90')) d = d.slice(2)
  if (d.startsWith('0')) d = d.slice(1)
  d = d.slice(0, 10)
  const p = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)]
  let out = '0'
  if (p[0]) out += ` (${p[0]}${p[0].length === 3 ? ')' : ''}`
  if (p[1]) out += ` ${p[1]}`
  if (p[2]) out += ` ${p[2]}`
  if (p[3]) out += ` ${p[3]}`
  return d.length === 0 ? '' : out
}
const phoneDigits = (v: string) => {
  let d = v.replace(/\D/g, '')
  if (d.startsWith('90')) d = d.slice(2)
  if (d.startsWith('0')) d = d.slice(1)
  return d
}

function validate(d: Draft, agree: boolean): Partial<Record<FieldKey, string>> {
  const e: Partial<Record<FieldKey, string>> = {}
  if (d.firstName.trim().length < 2) e.firstName = 'Adınızı yazın.'
  if (d.lastName.trim().length < 2) e.lastName = 'Soyadınızı yazın.'
  const ph = phoneDigits(d.phone)
  if (!/^5\d{9}$/.test(ph)) e.phone = 'Cep telefonunuzu 05XX XXX XX XX şeklinde yazın.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) e.email = 'Geçerli bir e-posta yazın (ör. ad@gmail.com).'
  if (!d.city) e.city = 'İl seçin.'
  if (d.district.trim().length < 2) e.district = 'İlçeyi yazın.'
  if (d.line.trim().length < 10) e.line = 'Mahalle, sokak, bina ve daire no yazın.'
  if (!d.billingSame) {
    if (!d.bCity) e.bCity = 'Fatura ilini seçin.'
    if (d.bDistrict.trim().length < 2) e.bDistrict = 'Fatura ilçesini yazın.'
    if (d.bLine.trim().length < 10) e.bLine = 'Fatura adresini yazın.'
  }
  if (!agree) e.agree = 'Devam etmek için sözleşmeleri onaylayın.'
  return e
}

export function CheckoutForm() {
  const router = useRouter()
  const cart = useCart()
  const { lines, count, subtotal, shipping, total } = summarize(cart)
  const hydrated = useHydrated()
  const [d, setD] = useState<Draft>(() => {
    if (typeof window === 'undefined') return EMPTY
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY
    } catch {
      return EMPTY
    }
  })
  const [placed, setPlaced] = useState(false)
  const [method, setMethod] = useState<Method>(site.payment.cardEnabled ? 'kart' : 'havale')
  const [agree, setAgree] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [payError, setPayError] = useState('')
  const [doc, setDoc] = useState<null | 'on-bilgilendirme-formu' | 'mesafeli-satis-sozlesmesi'>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hydrated) return
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d))
    } catch {}
  }, [d, hydrated])

  const errors = useMemo(() => validate(d, agree), [d, agree])
  const visibleError = (k: FieldKey) => ((touched[k] || submitted) && errors[k]) || undefined

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }))
  const blur = (k: FieldKey) => setTouched((t) => ({ ...t, [k]: true }))

  if (!hydrated) {
    return (
      <div className="container py-16" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded-full bg-sand" />
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-sand" />
      </div>
    )
  }

  if (lines.length === 0 && !placed) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-[26px]">Sepetiniz boş</h1>
        <p className="mt-2 text-ink-soft">Ödeme adımına geçmek için önce sepetinize ürün ekleyin.</p>
        <Link href="/urunler" className="btn-primary mt-6">
          Ürünlere göz at
        </Link>
      </div>
    )
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setPayError('')
    const keys = Object.keys(errors) as FieldKey[]
    if (keys.length) {
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    setBusy(true)
    const details: OrderDetails = {
      firstName: d.firstName.trim(),
      lastName: d.lastName.trim(),
      phone: formatPhone(d.phone),
      email: d.email.trim(),
      shipping: { city: d.city, district: d.district.trim(), line: d.line.trim() },
      billingSame: d.billingSame,
      billing: d.billingSame
        ? { city: d.city, district: d.district.trim(), line: d.line.trim() }
        : { city: d.bCity, district: d.bDistrict.trim(), line: d.bLine.trim() },
      note: d.note.trim(),
    }
    const order: StoredOrder = {
      no: newOrderNo(),
      createdAt: new Date().toISOString(),
      details,
      items: toOrderItems(lines),
      subtotal,
      shipping,
      total,
      giftWrap: cart.giftWrap,
      giftNote: cart.giftNote,
      method,
    }
    const result = await startPayment(order)
    if (result.status === 'redirect') {
      saveLastOrder(order)
      window.location.assign(result.url)
      return
    }
    if (result.status === 'offline') {
      setPlaced(true)
      saveLastOrder(order)
      try {
        sessionStorage.removeItem(DRAFT_KEY)
      } catch {}
      cartActions.clear()
      router.push(`/siparis-alindi?no=${encodeURIComponent(order.no)}`)
      return
    }
    setBusy(false)
    setPayError(result.reason)
  }

  const errorKeys = (Object.keys(errors) as FieldKey[]).filter((k) => submitted && errors[k])

  const field = (k: Exclude<FieldKey, 'agree' | 'city' | 'bCity'>, props: React.InputHTMLAttributes<HTMLInputElement> & { hint?: string }) => {
    const err = visibleError(k)
    const { hint, ...rest } = props
    const value = d[k as keyof Draft] as string
    return (
      <div>
        <label htmlFor={k} className="field-label">
          {LABELS[k]} <span className="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id={k}
          name={k}
          value={value}
          onChange={(e) => set(k as keyof Draft, (k === 'phone' ? formatPhone(e.target.value) : e.target.value) as never)}
          onBlur={() => blur(k)}
          aria-invalid={!!err}
          aria-describedby={[err ? `${k}-err` : '', hint ? `${k}-hint` : ''].filter(Boolean).join(' ') || undefined}
          required
          className="field"
          {...rest}
        />
        {hint && !err && (
          <p id={`${k}-hint`} className="mt-1.5 text-[13px] text-ink-muted">
            {hint}
          </p>
        )}
        {err && (
          <p id={`${k}-err`} className="field-error">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {err}
          </p>
        )}
      </div>
    )
  }

  const citySelect = (k: 'city' | 'bCity', autoComplete: string) => {
    const err = visibleError(k)
    return (
      <div>
        <label htmlFor={k} className="field-label">
          {LABELS[k]} <span className="text-danger" aria-hidden="true">*</span>
        </label>
        <div className="relative">
          <select
            id={k}
            name={k}
            value={d[k]}
            onChange={(e) => set(k, e.target.value)}
            onBlur={() => blur(k)}
            aria-invalid={!!err}
            aria-describedby={err ? `${k}-err` : undefined}
            autoComplete={autoComplete}
            required
            className="field cursor-pointer appearance-none pr-10"
          >
            <option value="">Seçiniz</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        </div>
        {err && (
          <p id={`${k}-err`} className="field-error">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {err}
          </p>
        )}
      </div>
    )
  }

  const summary = (
    <div className="rounded-3xl border border-line bg-white p-5">
      <ul className="space-y-4">
        {lines.map((l) => (
          <li key={l.key} className="flex gap-3">
            <div className="relative h-[76px] w-[58px] shrink-0 overflow-hidden rounded-xl bg-sand">
              <Image src={l.variant.image} alt="" fill sizes="58px" className="object-cover object-top" />
              <span className="absolute -right-0 -top-0 grid h-6 min-w-[24px] place-items-center rounded-bl-xl bg-ink px-1 text-[12px] font-bold text-white">{l.qty}</span>
            </div>
            <div className="min-w-0 flex-1 text-[14px]">
              <p className="font-display font-semibold leading-snug">{l.product.name}</p>
              <p className="text-ink-muted">
                {l.variant.name} · {sizeLabel(l.size)}
              </p>
            </div>
            <p className="tabular text-[14.5px] font-bold">{formatPrice(l.lineTotal)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[15px]">
        <div className="flex justify-between">
          <dt className="text-ink-soft">Ara toplam</dt>
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
          <dt className="font-display font-bold">Ödenecek tutar</dt>
          <dd className="tabular font-display text-[21px] font-bold">{formatPrice(total)}</dd>
        </div>
      </dl>
      <p className="mt-1 text-right text-[12.5px] text-ink-muted">KDV dahil · gizli ücret yok</p>
      <Link href="/sepet" className="mt-3 inline-flex min-h-[40px] items-center text-[14px] font-semibold underline underline-offset-4">
        Sepeti düzenle
      </Link>
    </div>
  )

  return (
    <div className="container pb-12 pt-5 md:pt-8">
      {/* Adımlar */}
      <ol className="mx-auto flex max-w-md items-center justify-between text-[12.5px] font-bold text-ink-muted" aria-label="Sipariş adımları">
        {[
          { label: 'Sepet', state: 'done' },
          { label: 'Bilgiler & Ödeme', state: 'current' },
          { label: 'Onay', state: 'todo' },
        ].map((s, i) => (
          <li key={s.label} className="flex flex-1 items-center gap-2 last:flex-none" aria-current={s.state === 'current' ? 'step' : undefined}>
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-[13px] ${
                s.state === 'done' ? 'bg-success text-white' : s.state === 'current' ? 'bg-ink text-white' : 'bg-white text-ink-muted ring-1 ring-line'
              }`}
            >
              {s.state === 'done' ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : i + 1}
            </span>
            <span className={s.state === 'current' ? 'text-ink' : ''}>{s.label}</span>
            {i < 2 && <span className="mx-1 h-px flex-1 bg-line" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      <h1 className="mt-7 text-[26px] md:text-[34px]">Siparişi tamamla</h1>
      <p className="mt-1 text-[15px] text-ink-soft">Üyelik gerekmez. Bilgileriniz yalnızca siparişiniz için kullanılır.</p>

      {/* Mobil özet */}
      <div className="mt-5 lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((o) => !o)}
          aria-expanded={summaryOpen}
          className="flex min-h-[56px] w-full items-center justify-between rounded-2xl border border-line bg-white px-4 text-[15px] font-semibold"
        >
          <span className="flex items-center gap-2">
            Sipariş özeti ({count} ürün)
            <ChevronDown className={`h-5 w-5 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </span>
          <span className="tabular font-display font-bold">{formatPrice(total)}</span>
        </button>
        {summaryOpen && <div className="mt-3 animate-fade-up">{summary}</div>}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_400px]">
        <form onSubmit={onSubmit} noValidate className="space-y-6">
          {errorKeys.length > 0 && (
            <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-3xl border-2 border-danger bg-danger-soft p-5 outline-none">
              <p className="flex items-center gap-2 font-display font-bold text-danger">
                <AlertCircle className="h-5 w-5" aria-hidden="true" /> Lütfen şu alanları kontrol edin:
              </p>
              <ul className="mt-2 space-y-1 pl-7 text-[15px]">
                {errorKeys.map((k) => (
                  <li key={k}>
                    <a href={`#${k}`} className="font-semibold underline underline-offset-2">
                      {LABELS[k]}
                    </a>{' '}
                    — {errors[k]}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <fieldset className="rounded-3xl border border-line bg-white p-5 md:p-6">
            <legend className="sr-only">İletişim bilgileri</legend>
            <h2 className="flex items-center gap-2.5 text-[18px]">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink font-display text-[13px] text-white">1</span> İletişim bilgileri
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {field('firstName', { autoComplete: 'given-name' })}
              {field('lastName', { autoComplete: 'family-name' })}
              {field('phone', { type: 'tel', inputMode: 'tel', autoComplete: 'tel-national', placeholder: '0 (5XX) XXX XX XX', hint: 'Kargo bilgilendirmesi için kullanılır.' })}
              {field('email', { type: 'email', inputMode: 'email', autoComplete: 'email', placeholder: 'ad@ornek.com', hint: 'Sipariş özetiniz bu adrese gönderilir.' })}
            </div>
          </fieldset>

          <fieldset className="rounded-3xl border border-line bg-white p-5 md:p-6">
            <legend className="sr-only">Teslimat adresi</legend>
            <h2 className="flex items-center gap-2.5 text-[18px]">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink font-display text-[13px] text-white">2</span> Teslimat adresi
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {citySelect('city', 'address-level1')}
              {field('district', { autoComplete: 'address-level2', placeholder: 'örn. Kadıköy' })}
              <div className="sm:col-span-2">
                <label htmlFor="line" className="field-label">
                  Açık adres <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="line"
                  name="line"
                  rows={3}
                  value={d.line}
                  onChange={(e) => set('line', e.target.value)}
                  onBlur={() => blur('line')}
                  autoComplete="street-address"
                  placeholder="Mahalle, cadde/sokak, bina no, daire no"
                  aria-invalid={!!visibleError('line')}
                  aria-describedby={visibleError('line') ? 'line-err' : undefined}
                  required
                  className="field py-3"
                />
                {visibleError('line') && (
                  <p id="line-err" className="field-error">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {visibleError('line')}
                  </p>
                )}
              </div>
            </div>
            <label className="mt-5 flex cursor-pointer items-center gap-3 text-[15px] font-semibold">
              <input type="checkbox" checked={d.billingSame} onChange={(e) => set('billingSame', e.target.checked)} className="h-6 w-6 shrink-0 cursor-pointer accent-ink" />
              Fatura adresim teslimat adresiyle aynı
            </label>
            {!d.billingSame && (
              <div className="mt-4 grid animate-fade-up gap-4 rounded-2xl bg-sand/60 p-4 sm:grid-cols-2">
                {citySelect('bCity', 'billing address-level1')}
                {field('bDistrict', { autoComplete: 'billing address-level2' })}
                <div className="sm:col-span-2">{field('bLine', { autoComplete: 'billing street-address', placeholder: 'Mahalle, cadde/sokak, bina no, daire no' })}</div>
              </div>
            )}
            <div className="mt-5">
              <label htmlFor="note" className="field-label">
                Sipariş notu <span className="font-normal text-ink-muted">(isteğe bağlı)</span>
              </label>
              <input id="note" value={d.note} onChange={(e) => set('note', e.target.value.slice(0, 200))} placeholder="örn. Zili çalmayın, bebek uyuyor" className="field" />
            </div>
          </fieldset>

          <fieldset className="rounded-3xl border border-line bg-white p-5 md:p-6">
            <legend className="sr-only">Ödeme yöntemi</legend>
            <h2 className="flex items-center gap-2.5 text-[18px]">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink font-display text-[13px] text-white">3</span> Ödeme yöntemi
            </h2>
            <div className="mt-5 grid gap-3" role="radiogroup" aria-label="Ödeme yöntemi">
              <label
                className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                  !site.payment.cardEnabled ? 'cursor-not-allowed border-line bg-sand/40 opacity-70' : method === 'kart' ? 'cursor-pointer border-ink ring-2 ring-ink' : 'cursor-pointer border-line hover:border-ink/40'
                }`}
              >
                <input type="radio" name="method" value="kart" checked={method === 'kart'} disabled={!site.payment.cardEnabled} onChange={() => setMethod('kart')} className="mt-1 h-5 w-5 accent-ink" />
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-display text-[15.5px] font-semibold">
                    <CreditCard className="h-5 w-5" aria-hidden="true" /> Kredi / Banka Kartı
                    {!site.payment.cardEnabled && <span className="rounded-full bg-butter px-2 py-0.5 text-[11.5px] font-bold text-ink">Çok yakında</span>}
                  </span>
                  <span className="mt-1 block text-[14px] text-ink-muted">3D Secure ile güvenli ödeme. Kart bilgileriniz bize ulaşmaz, lisanslı ödeme kuruluşunun sayfasında girilir.</span>
                  <PaymentBadges className="mt-2 text-ink" />
                </span>
              </label>
              <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${method === 'havale' ? 'border-ink ring-2 ring-ink' : 'border-line hover:border-ink/40'}`}>
                <input type="radio" name="method" value="havale" checked={method === 'havale'} onChange={() => setMethod('havale')} className="mt-1 h-5 w-5 accent-ink" />
                <span className="flex-1">
                  <span className="flex items-center gap-2 font-display text-[15.5px] font-semibold">
                    <Landmark className="h-5 w-5" aria-hidden="true" /> Havale / EFT
                  </span>
                  <span className="mt-1 block text-[14px] text-ink-muted">
                    Siparişi onayladıktan sonra IBAN bilgimiz ekranda gösterilir. Ödemeniz ulaştığında siparişiniz hemen kargoya hazırlanır.
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

          {/* Sözleşmeler */}
          <div className={`rounded-3xl border bg-white p-5 md:p-6 ${visibleError('agree') ? 'border-danger' : 'border-line'}`}>
            <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug">
              <input
                id="agree"
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                aria-invalid={!!visibleError('agree')}
                aria-describedby={visibleError('agree') ? 'agree-err' : undefined}
                className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-ink"
              />
              <span>
                <button type="button" onClick={() => setDoc('on-bilgilendirme-formu')} className="font-bold underline underline-offset-2">
                  Ön Bilgilendirme Formu
                </button>
                ’nu ve{' '}
                <button type="button" onClick={() => setDoc('mesafeli-satis-sozlesmesi')} className="font-bold underline underline-offset-2">
                  Mesafeli Satış Sözleşmesi
                </button>
                ’ni okudum, onaylıyorum.
              </span>
            </label>
            {visibleError('agree') && (
              <p id="agree-err" className="field-error">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {visibleError('agree')}
              </p>
            )}
            <p className="mt-3 pl-9 text-[13.5px] text-ink-muted">
              Kişisel verileriniz{' '}
              <Link href="/yasal/kvkk-aydinlatma-metni" target="_blank" className="font-semibold underline underline-offset-2">
                KVKK Aydınlatma Metni
              </Link>{' '}
              kapsamında yalnızca siparişiniz için işlenir. {site.returns.days} gün içinde koşulsuz cayma hakkınız vardır.
            </p>
          </div>

          {payError && (
            <p role="alert" className="flex items-start gap-2 rounded-2xl bg-danger-soft p-4 text-[15px] font-semibold text-danger">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /> {payError}
            </p>
          )}

          <div>
            <button type="submit" disabled={busy} className="btn-primary h-[60px] w-full text-[17px]">
              {busy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Siparişiniz oluşturuluyor…
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" aria-hidden="true" /> Siparişi Onayla · {formatPrice(total)}
                </>
              )}
            </button>
            <p className="mt-3 flex items-center justify-center gap-2 text-center text-[13px] font-semibold text-ink-muted">
              <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" /> 256-bit SSL ile şifrelenmiş güvenli bağlantı
            </p>
          </div>
        </form>

        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start" aria-label="Sipariş özeti">
          <h2 className="mb-3 text-[18px]">Sipariş özeti</h2>
          {summary}
          <ul className="mt-4 space-y-2 text-[14px] text-ink-soft">
            {[`${site.returns.days} gün içinde koşulsuz iade`, 'Kart bilgileriniz saklanmaz', 'Faturanız e-posta ile gelir'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" strokeWidth={3} aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <Dialog open={doc !== null} onClose={() => setDoc(null)} title={doc ? getLegalDoc(doc)!.title : ''} wide>
        {doc && (
          <div className="prose-legal">
            <h2 className="!mt-0">Sipariş bilgileri</h2>
            <table>
              <tbody>
                <tr>
                  <th>Alıcı</th>
                  <td>{[d.firstName, d.lastName].join(' ').trim() || '—'}</td>
                </tr>
                <tr>
                  <th>Teslimat adresi</th>
                  <td>{d.line ? `${d.line}, ${d.district} / ${d.city}` : '—'}</td>
                </tr>
                <tr>
                  <th>Telefon / E-posta</th>
                  <td>
                    {d.phone || '—'} · {d.email || '—'}
                  </td>
                </tr>
                {lines.map((l) => (
                  <tr key={l.key}>
                    <th>{l.product.name}</th>
                    <td>
                      {l.variant.name}, {sizeLabel(l.size)} × {l.qty} = {formatPrice(l.lineTotal)} (KDV dahil)
                    </td>
                  </tr>
                ))}
                <tr>
                  <th>Kargo</th>
                  <td>{shipping === 0 ? 'Ücretsiz' : formatPrice(shipping)}</td>
                </tr>
                <tr>
                  <th>Toplam</th>
                  <td>
                    <strong>{formatPrice(total)}</strong> — {method === 'kart' ? 'Kredi/Banka kartı' : 'Havale/EFT'}
                  </td>
                </tr>
              </tbody>
            </table>
            <div dangerouslySetInnerHTML={{ __html: getLegalDoc(doc)!.html }} />
            <button
              type="button"
              onClick={() => {
                setAgree(true)
                setDoc(null)
              }}
              className="btn-primary mt-6 w-full"
            >
              Okudum, onaylıyorum
            </button>
          </div>
        )}
      </Dialog>
    </div>
  )
}
