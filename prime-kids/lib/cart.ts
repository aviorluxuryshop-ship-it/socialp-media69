'use client'

import { useSyncExternalStore } from 'react'
import { getProduct, getVariant, type Product, type ColorVariant } from '@/data/products'
import { shippingFor } from '@/lib/format'

/**
 * Sepette yalnızca "hangi ürün, hangi renk, hangi beden, kaç adet" tutulur.
 * Fiyat asla tarayıcıda saklanmaz; her ekranda katalogdan yeniden hesaplanır.
 */
export interface CartLine {
  slug: string
  color: string
  size: string
  qty: number
}

export interface CartState {
  lines: CartLine[]
  giftWrap: boolean
  giftNote: string
}

export interface ResolvedLine extends CartLine {
  key: string
  product: Product
  variant: ColorVariant
  unitPrice: number
  lineTotal: number
}

export const MAX_QTY = 10
const STORAGE_KEY = 'pk-cart-v1'
const EMPTY: CartState = { lines: [], giftWrap: false, giftNote: '' }

export const lineKey = (l: Pick<CartLine, 'slug' | 'color' | 'size'>) => `${l.slug}::${l.color}::${l.size}`

let state: CartState = EMPTY
let loaded = false
const listeners = new Set<() => void>()

function load() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CartState>
      state = {
        lines: Array.isArray(parsed.lines)
          ? parsed.lines.filter((l) => l && getProduct(l.slug) && typeof l.size === 'string')
          : [],
        giftWrap: Boolean(parsed.giftWrap),
        giftNote: typeof parsed.giftNote === 'string' ? parsed.giftNote.slice(0, 200) : '',
      }
    }
  } catch {
    state = EMPTY
  }
}

function commit(next: CartState) {
  state = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* gizli sekme vb. — sepet bu oturumda yine çalışır */
  }
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  load()
  listeners.add(fn)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      loaded = false
      load()
      fn()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(fn)
    window.removeEventListener('storage', onStorage)
  }
}

const getSnapshot = () => {
  load()
  return state
}
const getServerSnapshot = () => EMPTY

export function useCart() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export const cartActions = {
  add(line: CartLine) {
    load()
    const key = lineKey(line)
    const existing = state.lines.find((l) => lineKey(l) === key)
    const lines = existing
      ? state.lines.map((l) => (lineKey(l) === key ? { ...l, qty: Math.min(l.qty + line.qty, MAX_QTY) } : l))
      : [...state.lines, { ...line, qty: Math.min(line.qty, MAX_QTY) }]
    commit({ ...state, lines })
  },
  setQty(key: string, qty: number) {
    const q = Math.max(1, Math.min(MAX_QTY, Math.trunc(qty)))
    commit({ ...state, lines: state.lines.map((l) => (lineKey(l) === key ? { ...l, qty: q } : l)) })
  },
  setSize(key: string, size: string) {
    const target = state.lines.find((l) => lineKey(l) === key)
    if (!target) return
    const merged = { ...target, size }
    const others = state.lines.filter((l) => lineKey(l) !== key)
    const dup = others.find((l) => lineKey(l) === lineKey(merged))
    const lines = dup
      ? others.map((l) => (l === dup ? { ...l, qty: Math.min(l.qty + target.qty, MAX_QTY) } : l))
      : state.lines.map((l) => (lineKey(l) === key ? merged : l))
    commit({ ...state, lines })
  },
  remove(key: string) {
    const index = state.lines.findIndex((l) => lineKey(l) === key)
    const removed = state.lines[index]
    commit({ ...state, lines: state.lines.filter((l) => lineKey(l) !== key) })
    return { removed, index }
  },
  restore(line: CartLine, index: number) {
    const lines = [...state.lines]
    lines.splice(Math.min(index, lines.length), 0, line)
    commit({ ...state, lines })
  },
  setGift(giftWrap: boolean, giftNote?: string) {
    commit({ ...state, giftWrap, giftNote: giftNote ?? state.giftNote })
  },
  setGiftNote(giftNote: string) {
    commit({ ...state, giftNote: giftNote.slice(0, 200) })
  },
  clear() {
    commit(EMPTY)
  },
}

export function resolveLines(lines: CartLine[]): ResolvedLine[] {
  return lines.flatMap((line) => {
    const product = getProduct(line.slug)
    if (!product) return []
    const variant = getVariant(product, line.color)
    const qty = Math.max(1, Math.min(MAX_QTY, Math.trunc(line.qty) || 1))
    return [{ ...line, qty, key: lineKey(line), product, variant, unitPrice: product.price, lineTotal: product.price * qty }]
  })
}

export function summarize(cart: CartState) {
  const lines = resolveLines(cart.lines)
  const count = lines.reduce((n, l) => n + l.qty, 0)
  const subtotal = Math.round(lines.reduce((n, l) => n + l.lineTotal, 0) * 100) / 100
  const shipping = shippingFor(subtotal)
  const total = Math.round((subtotal + shipping) * 100) / 100
  return { lines, count, subtotal, shipping, total }
}
