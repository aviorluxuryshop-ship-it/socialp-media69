import { site } from '@/data/site'
import { sizeLabel } from '@/data/products'
import { formatPrice } from '@/lib/format'
import type { ResolvedLine } from '@/lib/cart'

export interface Address {
  city: string
  district: string
  line: string
}

export interface OrderDetails {
  firstName: string
  lastName: string
  phone: string
  email: string
  shipping: Address
  billingSame: boolean
  billing: Address
  note: string
}

export interface StoredOrder {
  no: string
  createdAt: string
  details: OrderDetails
  items: Array<{ name: string; color: string; size: string; qty: number; unitPrice: number; lineTotal: number; image: string; slug: string }>
  subtotal: number
  shipping: number
  total: number
  giftWrap: boolean
  giftNote: string
  method: 'havale' | 'kart'
}

const LAST_ORDER_KEY = 'pk-last-order'

export function newOrderNo() {
  const d = new Date()
  const y = String(d.getFullYear()).slice(2)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `PK${y}${m}${day}-${rand}`
}

export function toOrderItems(lines: ResolvedLine[]): StoredOrder['items'] {
  return lines.map((l) => ({
    name: l.product.name,
    color: l.variant.name,
    size: sizeLabel(l.size),
    qty: l.qty,
    unitPrice: l.unitPrice,
    lineTotal: l.lineTotal,
    image: l.variant.image,
    slug: l.product.slug,
  }))
}

export function saveLastOrder(order: StoredOrder) {
  try {
    window.localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order))
  } catch {
    /* yoksay */
  }
}

export function readLastOrder(): StoredOrder | null {
  try {
    const raw = window.localStorage.getItem(LAST_ORDER_KEY)
    return raw ? (JSON.parse(raw) as StoredOrder) : null
  } catch {
    return null
  }
}

/** Siparişi mağazaya iletmek için WhatsApp mesajı (kart ödemesi bağlanana kadar). */
export function orderWhatsappText(o: StoredOrder) {
  const items = o.items.map((i) => `• ${i.name} — ${i.color}, ${i.size} × ${i.qty} = ${formatPrice(i.lineTotal)}`).join('\n')
  const addr = `${o.details.shipping.line}, ${o.details.shipping.district} / ${o.details.shipping.city}`
  return [
    `Merhaba ${site.name}, sipariş vermek istiyorum.`,
    `Sipariş No: ${o.no}`,
    '',
    items,
    '',
    `Ara toplam: ${formatPrice(o.subtotal)}`,
    `Kargo: ${o.shipping === 0 ? 'Ücretsiz' : formatPrice(o.shipping)}`,
    `Toplam: ${formatPrice(o.total)}`,
    o.giftWrap ? `Hediye paketi: Evet${o.giftNote ? ` — Not: "${o.giftNote}"` : ''}` : '',
    '',
    `Ad Soyad: ${o.details.firstName} ${o.details.lastName}`,
    `Telefon: ${o.details.phone}`,
    `E-posta: ${o.details.email}`,
    `Adres: ${addr}`,
    o.details.note ? `Not: ${o.details.note}` : '',
    '',
    'Ödeme: Havale / EFT',
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n')
}
