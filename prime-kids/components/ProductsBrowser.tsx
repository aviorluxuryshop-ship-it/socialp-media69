'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { Search, SlidersHorizontal, X, SearchX } from 'lucide-react'
import { products, AGE_FILTERS, CATEGORY_LABEL, type Category } from '@/data/products'
import { ProductCard } from '@/components/ProductCard'
import { WhatsAppIcon } from '@/components/BrandIcons'
import { whatsappLink } from '@/data/site'

const SORTS = [
  { id: 'onerilen', label: 'Önerilen' },
  { id: 'fiyat-artan', label: 'En düşük fiyat' },
  { id: 'fiyat-azalan', label: 'En yüksek fiyat' },
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
    { id: 'mini', label: 'Mini 1-5 Yaş' },
  ]

  return (
    <div className="container pb-8 pt-6 md:pt-8">
      <div className="sticky top-16 z-30 -mx-4 border-b border-line bg-cream/95 px-4 pb-3 pt-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <div className="flex gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Ürünlerde ara</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
            <input
              type="search"
              defaultValue={ara}
              key={ara}
              placeholder="Ürün ara…"
              enterKeyHint="search"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  set('ara', (e.target as HTMLInputElement).value.trim() || null)
                  ;(e.target as HTMLInputElement).blur()
                }
              }}
              onBlur={(e) => e.target.value.trim() !== ara && set('ara', e.target.value.trim() || null)}
              className="field min-h-[48px] pl-12"
            />
          </label>
          <label className="relative">
            <span className="sr-only">Sıralama</span>
            <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-muted" aria-hidden="true" />
            <select
              value={sirala}
              onChange={(e) => set('sirala', e.target.value === 'onerilen' ? null : e.target.value)}
              className="field min-h-[48px] w-[150px] cursor-pointer appearance-none pl-10 pr-3 text-[14.5px] font-semibold sm:w-auto sm:pr-5"
              aria-label="Sıralama"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Kategori">
          {cats.map((c) => (
            <button key={c.label} type="button" className="chip" aria-pressed={kategori === c.id} onClick={() => set('kategori', c.id)}>
              {c.label}
            </button>
          ))}
          <button type="button" className="chip" aria-pressed={ozellik === 'sardonlu'} onClick={() => set('ozellik', ozellik === 'sardonlu' ? null : 'sardonlu')}>
            Kışlık Şardonlu
          </button>
        </div>

        <div className="no-scrollbar -mx-4 mt-2 flex items-center gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Yaş">
          <span className="shrink-0 pr-1 text-[13px] font-bold uppercase tracking-wide text-ink-muted">Yaş</span>
          {AGE_FILTERS.map((a) => (
            <button key={a} type="button" className="chip min-h-[40px] px-3.5 tabular" aria-pressed={yas === a} onClick={() => set('yas', yas === a ? null : a)}>
              {a}
            </button>
          ))}
        </div>
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
