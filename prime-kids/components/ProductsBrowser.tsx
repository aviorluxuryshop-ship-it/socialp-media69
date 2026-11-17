'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { ChevronDown, X, SearchX } from 'lucide-react'
import { products, AGE_FILTERS, CATEGORY_LABEL, type Category } from '@/data/products'
import { ProductCard } from '@/components/ProductCard'
import { WhatsAppIcon } from '@/components/BrandIcons'
import { whatsappLink } from '@/data/site'

const SORTS = [
  { id: 'onerilen', label: 'Sırala: Önerilen' },
  { id: 'fiyat-artan', label: 'Fiyat: Artan' },
  { id: 'fiyat-azalan', label: 'Fiyat: Azalan' },
]

const norm = (s: string) => s.toLocaleLowerCase('tr-TR')

export function ProductsBrowser() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const kategori = params.get('kategori') as Category | null
  const yas = params.get('yas')
  const ozellik = params.get('ozellik')
  const ara = params.get('ara') ?? ''
  const sirala = params.get('sirala') ?? 'onerilen'

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const list = useMemo(() => {
    const q = norm(ara.trim())
    const out = products.filter((p) => {
      if (kategori && p.category !== kategori) return false
      if (yas && !p.sizes.includes(yas)) return false
      if (ozellik === 'sardonlu' && !p.badges.includes('sardonlu')) return false
      if (q) {
        const hay = norm([p.name, p.short, p.description, ...p.pieces, ...p.colors.map((c) => c.name), CATEGORY_LABEL[p.category]].join(' '))
        if (!q.split(/\s+/).every((w) => hay.includes(w))) return false
      }
      return true
    })
    if (sirala === 'fiyat-artan') out.sort((a, b) => a.price - b.price)
    else if (sirala === 'fiyat-azalan') out.sort((a, b) => b.price - a.price)
    else out.sort((a, b) => a.order - b.order)
    return out
  }, [kategori, yas, ozellik, ara, sirala])

  const activeCount = [kategori, yas, ozellik, ara].filter(Boolean).length
  const cats: Array<{ id: string | null; label: string }> = [
    { id: null, label: 'Tümü' },
    { id: 'kiz', label: 'Kız Çocuk' },
    { id: 'erkek', label: 'Erkek Çocuk' },
    { id: 'mini', label: 'Bebek & Mini' },
  ]

  return (
    <div className="container pb-8 pt-4 md:pt-6">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Kategori">
        {cats.map((c) => (
          <button key={c.label} type="button" className="chip" aria-pressed={kategori === c.id} onClick={() => set('kategori', c.id)}>
            {c.label}
          </button>
        ))}
        <button type="button" className="chip" aria-pressed={ozellik === 'sardonlu'} onClick={() => set('ozellik', ozellik === 'sardonlu' ? null : 'sardonlu')}>
          Kışlık
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:flex">
        <label className="relative block">
          <span className="sr-only">Yaş</span>
          <select
            value={yas ?? ''}
            onChange={(e) => set('yas', e.target.value || null)}
            className="field min-h-[48px] w-full cursor-pointer appearance-none pr-10 font-display text-[16px] font-medium sm:w-[190px]"
          >
            <option value="">Tüm yaşlar</option>
            {AGE_FILTERS.map((a) => (
              <option key={a} value={a}>
                {a} yaş
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        </label>
        <label className="relative block">
          <span className="sr-only">Sıralama</span>
          <select
            value={sirala}
            onChange={(e) => set('sirala', e.target.value === 'onerilen' ? null : e.target.value)}
            className="field min-h-[48px] w-full cursor-pointer appearance-none pr-10 font-display text-[16px] font-medium sm:w-[210px]"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        </label>
      </div>

      <div className="mt-5 flex min-h-[40px] flex-wrap items-center justify-between gap-2" aria-live="polite">
        <p className="text-[14.5px] font-semibold text-ink-soft">
          {list.length} ürün{ara && <> · “{ara}” için</>}
          {yas && <> · {yas} yaş</>}
        </p>
        {activeCount > 0 && (
          <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className="flex min-h-[40px] items-center gap-1 rounded-full px-3 text-[14px] font-bold hover:bg-ink/5">
            <X className="h-4 w-4" aria-hidden="true" /> Filtreleri temizle
          </button>
        )}
      </div>

      {list.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
          {list.map((p, i) => (
            <div key={p.slug} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
              <ProductCard product={p} priority={i < 4} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-10 max-w-md rounded-3xl bg-white p-8 text-center ring-1 ring-line">
          <SearchX className="mx-auto h-10 w-10 text-ink-muted" aria-hidden="true" />
          <h2 className="mt-4 text-xl">Bu seçimle ürün bulamadık</h2>
          <p className="mt-2 text-ink-soft">Filtreleri azaltmayı deneyin ya da aradığınızı bize yazın; yeni ürünlerimizden önerelim.</p>
          <div className="mt-6 flex flex-col gap-3">
            <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className="btn-primary">
              Tüm ürünleri göster
            </button>
            <a href={whatsappLink('Merhaba, aradığım bir ürün var:')} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
              <WhatsAppIcon className="h-5 w-5" /> WhatsApp’tan sor
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
