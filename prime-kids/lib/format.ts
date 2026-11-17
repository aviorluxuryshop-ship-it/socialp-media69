import { site } from '@/data/site'

const tl = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 1299.9 → "1.299,90 TL" */
export const formatPrice = (value: number) => `${tl.format(value)} TL`

const dayFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' })
const weekdayFmt = new Intl.DateTimeFormat('tr-TR', { weekday: 'long' })

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6

function addBusinessDays(date: Date, days: number) {
  const d = new Date(date)
  let added = 0
  while (added < days) {
    d.setDate(d.getDate() + 1)
    if (!isWeekend(d)) added += 1
  }
  return d
}

/** Kargoya veriliş günü ve tahmini teslim aralığı. Türkiye saatine göre hesaplanır. */
export function deliveryEstimate(now = new Date()) {
  const tr = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }))
  let ship = new Date(tr)
  const sameDay = !isWeekend(tr) && tr.getHours() < site.shipping.cutoffHour
  if (!sameDay) ship = addBusinessDays(tr, 1)
  const [min, max] = site.shipping.deliveryDays
  const from = addBusinessDays(ship, min)
  const to = addBusinessDays(ship, max)
  const shipLabel = sameDay ? 'bugün' : weekdayFmt.format(ship)
  const range =
    from.getMonth() === to.getMonth()
      ? `${from.getDate()}-${dayFmt.format(to)}`
      : `${dayFmt.format(from)} - ${dayFmt.format(to)}`
  return { sameDay, shipLabel, range }
}

export function shippingFor(subtotal: number) {
  if (subtotal <= 0) return 0
  return subtotal >= site.shipping.freeOver ? 0 : site.shipping.fee
}

export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')
