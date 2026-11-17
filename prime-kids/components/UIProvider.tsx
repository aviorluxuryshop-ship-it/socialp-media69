'use client'

import Image from 'next/image'
import Link from 'next/link'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { useCart, summarize } from '@/lib/cart'
import { formatPrice } from '@/lib/format'
import { FreeShippingProgress } from '@/components/FreeShippingProgress'

interface Toast {
  id: number
  message: string
  action?: { label: string; onClick: () => void }
}

interface AddedInfo {
  name: string
  colorName: string
  sizeLabel: string
  image: string
  qty: number
}

interface UIContextValue {
  toast: (message: string, action?: Toast['action']) => void
  showAdded: (info: AddedInfo) => void
  cartPulse: number
}

const UIContext = createContext<UIContextValue | null>(null)

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [added, setAdded] = useState<AddedInfo | null>(null)
  const [cartPulse, setCartPulse] = useState(0)
  const idRef = useRef(0)

  const toast = useCallback((message: string, action?: Toast['action']) => {
    const id = ++idRef.current
    setToasts((t) => [...t.slice(-2), { id, message, action }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 6000 : 3500)
  }, [])

  const showAdded = useCallback((info: AddedInfo) => {
    setAdded(info)
    setCartPulse((n) => n + 1)
  }, [])

  return (
    <UIContext.Provider value={{ toast, showAdded, cartPulse }}>
      {children}
      <AddedSheet info={added} onClose={() => setAdded(null)} />
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-[70] flex flex-col items-center gap-2 px-4"
        style={{ bottom: 'calc(var(--bottom-nav-h) + var(--float-offset, 0px) + 16px)' }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex max-w-md animate-fade-up items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-[15px] text-white shadow-lift"
          >
            <span>{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick()
                  setToasts((all) => all.filter((x) => x.id !== t.id))
                }}
                className="min-h-[36px] shrink-0 rounded-full bg-white/15 px-3 font-display text-[13px] font-bold hover:bg-white/25"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </UIContext.Provider>
  )
}

function AddedSheet({ info, onClose }: { info: AddedInfo | null; onClose: () => void }) {
  const cart = useCart()
  const { subtotal, count } = summarize(cart)
  const closeRef = useRef<HTMLButtonElement>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!info) return
    closeRef.current?.focus({ preventScroll: true })
    timer.current = window.setTimeout(onClose, 7000)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer.current)
      window.removeEventListener('keydown', onKey)
    }
  }, [info, onClose])

  if (!info) return null
  return (
    <>
      <div className="fixed inset-0 z-[60] animate-fade-in bg-ink/30 md:bg-transparent" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="added-title"
        onMouseEnter={() => window.clearTimeout(timer.current)}
        className="fixed inset-x-0 bottom-0 z-[61] animate-sheet-up rounded-t-[28px] bg-white p-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-sheet md:inset-x-auto md:bottom-auto md:right-6 md:top-[84px] md:w-[400px] md:animate-fade-up md:rounded-3xl md:pb-5"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line md:hidden" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <p id="added-title" className="flex items-center gap-2 font-display text-[15px] font-bold text-success">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-success text-white">
              <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            </span>
            Sepete eklendi
          </p>
          <button ref={closeRef} type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full hover:bg-ink/5" aria-label="Kapat">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-3 flex gap-4">
          <div className="relative h-24 w-[72px] shrink-0 overflow-hidden rounded-xl bg-sand">
            <Image src={info.image} alt="" fill sizes="72px" className="object-cover" />
          </div>
          <div className="min-w-0 text-[15px]">
            <p className="font-display font-semibold leading-snug">{info.name}</p>
            <p className="mt-1 text-ink-muted">
              {info.colorName} · {info.sizeLabel} · {info.qty} adet
            </p>
            <p className="mt-1 font-bold">Sepette {count} ürün · {formatPrice(subtotal)}</p>
          </div>
        </div>
        <FreeShippingProgress subtotal={subtotal} className="mt-4" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="btn-secondary px-3">
            Alışverişe Devam
          </button>
          <Link href="/sepet" onClick={onClose} className="btn-primary px-3">
            Sepete Git
          </Link>
        </div>
      </div>
    </>
  )
}
