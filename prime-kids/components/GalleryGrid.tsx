'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { galleryItems, type Category } from '@/data/products'
import { formatPrice } from '@/lib/format'

const FILTERS: Array<{ id: Category | null; label: string }> = [
  { id: null, label: 'Tümü' },
  { id: 'kiz', label: 'Kız' },
  { id: 'erkek', label: 'Erkek' },
  { id: 'mini', label: 'Mini' },
]

export function GalleryGrid() {
  const [filter, setFilter] = useState<Category | null>(null)
  const [index, setIndex] = useState<number | null>(null)
  const items = filter ? galleryItems.filter((g) => g.product.category === filter) : galleryItems
  const dialogRef = useRef<HTMLDialogElement>(null)
  const touchX = useRef<number | null>(null)

  const open = (i: number) => setIndex(i)
  const close = useCallback(() => setIndex(null), [])
  const step = useCallback((dir: 1 | -1) => setIndex((i) => (i === null ? i : (i + dir + items.length) % items.length)), [items.length])

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (index !== null && !d.open) d.showModal()
    if (index === null && d.open) d.close()
  }, [index])

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, step])

  const current = index !== null ? items[index] : null

  return (
    <div className="container pb-8 pt-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Galeri filtresi">
        {FILTERS.map((f) => (
          <button key={f.label} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <ul className="mt-6 columns-2 gap-3 sm:columns-3 lg:columns-4 lg:gap-4">
        {items.map((g, i) => (
          <li key={g.src} className="mb-3 break-inside-avoid lg:mb-4">
            <button type="button" onClick={() => open(i)} className="group relative block w-full overflow-hidden rounded-3xl bg-sand text-left" aria-label={`${g.product.name}, ${g.color.name} — büyüt`}>
              <Image
                src={g.src}
                alt={g.alt}
                width={600}
                height={i % 3 === 1 ? 760 : 900}
                sizes="(min-width:1024px) 23vw, (min-width:640px) 31vw, 47vw"
                className="h-auto w-full object-cover object-top transition duration-500 ease-soft group-hover:scale-[1.04]"
                style={{ aspectRatio: i % 3 === 1 ? '600/760' : '600/900' }}
              />
              <span className="absolute inset-x-2 bottom-2 rounded-2xl bg-white/95 px-3 py-2 opacity-100 shadow-sm transition md:opacity-0 md:group-hover:opacity-100">
                <span className="block truncate font-display text-[13px] font-bold">{g.product.name}</span>
                <span className="block text-[12px] text-ink-muted">{g.color.name}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={close}
        onClick={(e) => e.target === dialogRef.current && close()}
        aria-label="Fotoğraf görüntüleyici"
        className="m-0 h-[100dvh] max-h-none w-full max-w-none bg-ink/95 p-0 text-white backdrop:bg-ink/80"
      >
        {current && (
          <div
            className="flex h-full flex-col"
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return
              const dx = e.changedTouches[0].clientX - touchX.current
              if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
              touchX.current = null
            }}
          >
            <div className="flex items-center justify-between p-3">
              <p className="pl-2 text-[14px] text-white/70 tabular">
                {index! + 1} / {items.length}
              </p>
              <button type="button" onClick={close} className="grid h-12 w-12 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Kapat">
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="relative flex-1">
              <Image key={current.src} src={current.src} alt={current.alt} fill sizes="100vw" className="animate-fade-in object-contain" />
              <button type="button" onClick={() => step(-1)} className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25" aria-label="Önceki fotoğraf">
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => step(1)} className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25" aria-label="Sonraki fotoğraf">
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
              <div className="min-w-0">
                <p className="truncate font-display text-[16px] font-bold">{current.product.name}</p>
                <p className="text-[14px] text-white/70">
                  {current.color.name} · {formatPrice(current.product.price)}
                </p>
              </div>
              <Link href={current.href} className="btn shrink-0 bg-white px-5 text-ink hover:bg-cream">
                Ürüne git <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </dialog>
    </div>
  )
}
