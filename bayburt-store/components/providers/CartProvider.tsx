'use client'

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'

import { MAX_PER_LINE, cartCount, lineKey, type CartLine } from '@/lib/cart'
import type { ProductSlug, SizeOption } from '@/data/products'

const STORAGE_KEY = 'bayburt-store:sepet:v1'

/**
 * The cart lives in one module-level store that localStorage backs, and the
 * components read it through `useSyncExternalStore`. Reading storage in an
 * effect and calling setState would work too, but it renders once with an
 * empty cart and again with the real one — a flash of "sepetiniz boş" on every
 * load for anyone who has something in it. This way the first client render
 * already has the right answer, while the server keeps rendering the empty
 * snapshot it is obliged to.
 */
let lines: CartLine[] = []
let snapshot: CartLine[] = lines
let loaded = false
const listeners = new Set<() => void>()

const SERVER_SNAPSHOT: CartLine[] = []

/** Anything that is not a well-formed line is dropped rather than trusted. */
function parse(raw: string | null): CartLine[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    return value.flatMap((entry) => {
      if (typeof entry !== 'object' || entry === null) return []
      const { slug, size, quantity } = entry as Record<string, unknown>
      if (typeof slug !== 'string' || typeof size !== 'string') return []
      const n = typeof quantity === 'number' ? Math.trunc(quantity) : 1
      if (!Number.isFinite(n) || n < 1) return []
      return [
        { slug: slug as ProductSlug, size: size as SizeOption, quantity: Math.min(n, MAX_PER_LINE) },
      ]
    })
  } catch {
    return []
  }
}

function load() {
  if (loaded) return
  loaded = true
  try {
    lines = parse(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    // Private windows and blocked site data both throw. The cart still works
    // for this visit; it just will not survive a reload.
    lines = []
  }
  snapshot = lines
}

function commit(next: CartLine[]) {
  lines = next
  snapshot = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Nothing to do and nothing worth saying: the cart is still correct on
    // screen, which is what the visitor is looking at.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  load()
  listeners.add(listener)
  // Another tab is the same cart. Without this, two open tabs quietly
  // disagree and the last one to write wins.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return
    lines = parse(window.localStorage.getItem(STORAGE_KEY))
    snapshot = lines
    listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function getSnapshot() {
  load()
  return snapshot
}

interface CartContextValue {
  lines: CartLine[]
  count: number
  /** False through the server render, so nothing renders mid-guess. */
  isReady: boolean
  add: (slug: ProductSlug, size: SizeOption) => void
  setQuantity: (slug: string, size: string, quantity: number) => void
  remove: (slug: string, size: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const current = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT)
  const isReady = current !== SERVER_SNAPSHOT

  const add = useCallback((slug: ProductSlug, size: SizeOption) => {
    const key = lineKey(slug, size)
    const found = lines.find((line) => lineKey(line.slug, line.size) === key)
    commit(
      found
        ? lines.map((line) =>
            lineKey(line.slug, line.size) === key
              ? { ...line, quantity: Math.min(line.quantity + 1, MAX_PER_LINE) }
              : line,
          )
        : [...lines, { slug, size, quantity: 1 }],
    )
  }, [])

  const setQuantity = useCallback((slug: string, size: string, quantity: number) => {
    const next = Math.trunc(quantity)
    const key = lineKey(slug, size)
    commit(
      next < 1
        ? lines.filter((line) => lineKey(line.slug, line.size) !== key)
        : lines.map((line) =>
            lineKey(line.slug, line.size) === key
              ? { ...line, quantity: Math.min(next, MAX_PER_LINE) }
              : line,
          ),
    )
  }, [])

  const remove = useCallback((slug: string, size: string) => {
    commit(lines.filter((line) => lineKey(line.slug, line.size) !== lineKey(slug, size)))
  }, [])

  const clear = useCallback(() => commit([]), [])

  const value = useMemo<CartContextValue>(
    () => ({ lines: current, count: cartCount(current), isReady, add, setQuantity, remove, clear }),
    [current, isReady, add, setQuantity, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart, CartProvider içinde kullanılmalı')
  return value
}
