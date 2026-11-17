'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, X, SearchX } from 'lucide-react'
import { products, AGE_FILTERS, CATEGORY_LABEL, type Category } from '@/data/products'
import { ProductCard } from '@/components/ProductCard'
import { PageHeader } from '@/components/Common'
import { WhatsAppIcon } from '@/components/BrandIcons'
import { Heart, Star } from '@/components/Doodles'
import { whatsappLink } from '@/data/site'

const SORTS = [
  { id: 'onerilen', label: 'Sırala: Önerilen' },
  { id: 'fiyat-artan', label: 'Fiyat: Artan' },
  { id: 'fiyat-azalan', label: 'Fiyat: Azalan' },
]

/** Bölüm başlıkları — kız pembe, erkek mavi, bebek mint (renk data-theme ile gelir). */
const SECTIONS: Record<Category, { title: string; lead: string }> = {
  kiz: { title: 'Kız Çocuk', lead: '5-14 yaş kız çocuk takımları: eşofman, denim ve içi şardonlu kışlıklar.' },
  erkek: { title: 'Erkek Çocuk', lead: '5-14 yaş erkek çocuk takımları: kargo takımlar, gömlek ceket ve rahat jogger.' },
  mini: { title: 'Bebek & Mini', lead: '1-5 yaş için yumuşacık, rahat takımlar.' },
}

const norm = (s: string) => s.toLocaleLowerCase('tr-TR')

export interface Filters {
  kategori: Category | null
  yas: string | null
  ozellik: string | null
  ara: string
  sirala: string
}

/** Adres çubuğundaki filtreleri okuyup sayfayı çizer. */
export function ProductsBrowser() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const kategori = params.get('kategori')
  const filters: Filters = {
    kategori: kategori === 'kiz' || kategori === 'erkek' || kategori === 'mini' ? kategori : null,
    yas: params.get('yas'),
    ozellik: params.get('ozellik'),
    ara: params.get('ara') ?? '',
    sirala: params.get('sirala') ?? 'onerilen',
  }
  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }
  return <ProductsView filters={filters} set={set} clear={() => router.replace(pathname, { scroll: false })} />
}

/** Filtresiz ilk görünüm — JavaScript yüklenmeden önce de ürünler görünsün. */
export const DEFAULT_FILTERS: Filters = { kategori: null, yas: null, ozellik: null, ara: '', sirala: 'onerilen' }

export function ProductsView({ filters, set, clear }: { filters: Filters; set?: (key: string, value: string | null) => void; clear?: () => void }) {
  const { kategori, yas, ozellik, ara, sirala } = filters
  const update = set ?? (() => {})

  const q = norm(ara.trim())
  const list = products.filter((p) => {
    if (kategori && p.category !== kategori) return false
    if (yas && !p.sizes.includes(yas)) return false
    if (ozellik === 'sardonlu' && !p.badges.includes('sardonlu')) return false
    if (q) {
      const hay = norm([p.name, p.short, p.description, ...p.pieces, ...p.colors.map((c) => c.name), CATEGORY_LABEL[p.category]].join(' '))
      if (!q.split(/\s+/).every((w) => hay.includes(w))) return false
    }
    return true
  })
  if (sirala === 'fiyat-artan') list.sort((a, b) => a.price - b.price)
  else if (sirala === 'fiyat-azalan') list.sort((a, b) => b.price - a.price)
  else list.sort((a, b) => a.order - b.order)

  const activeCount = [kategori, yas, ozellik, ara].filter(Boolean).length
  const section = kategori ? SECTIONS[kategori] : null
  const cats: Array<{ id: Category | null; label: string; theme?: Category }> = [
    { id: null, label: 'Tümü' },
    { id: 'kiz', label: 'Kız Çocuk', theme: 'kiz' },
    { id: 'erkek', label: 'Erkek Çocuk', theme: 'erkek' },
    { id: 'mini', label: 'Bebek & Mini', theme: 'mini' },
  ]

  return (
    <div data-theme={kategori ?? undefined}>
      <PageHeader
        crumbs={section ? [{ label: 'Ürünler', href: '/urunler' }, { label: section.title }] : [{ label: 'Ürünler' }]}
        title={section?.title ?? 'Tüm Ürünler'}
        lead={section?.lead ?? 'Kız, erkek ve bebek takımları. Yaşı seçin, uyan ürünleri görün.'}
      >
        {kategori === 'kiz' && (
          <>
            <Heart className="absolute right-[8%] top-6 w-9 md:w-12" color="#ff6f9c" />
            <Heart className="absolute right-[20%] top-16 hidden w-6 md:block" color="#ffb3cb" />
          </>
        )}
        {kategori === 'erkek' && (
          <>
            <Star className="absolute right-[8%] top-6 w-9 md:w-12" color="#4ea6e3" />
            <Star className="absolute right-[20%] top-16 hidden w-6 md:block" color="#9cc9f0" />
          </>
        )}
        {kategori === 'mini' && <Star className="absolute right-[8%] top-6 w-9 md:w-12" color="#3cc9a0" />}
      </PageHeader>

      <div className="container pb-8 pt-2 md:pt-4">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Kategori">
          {cats.map((c) => (
            // Her bölüm düğmesi kendi renginde: kız pembe, erkek mavi, bebek mint
            <button key={c.label} type="button" data-theme={c.theme} className="chip" aria-pressed={kategori === c.id} onClick={() => update('kategori', c.id)}>
              {c.label}
            </button>
          ))}
          <button type="button" className="chip" aria-pressed={ozellik === 'sardonlu'} onClick={() => update('ozellik', ozellik === 'sardonlu' ? null : 'sardonlu')}>
            Kışlık
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:flex">
          <label className="relative block">
            <span className="sr-only">Yaş</span>
            <select
              value={yas ?? ''}
              onChange={(e) => update('yas', e.target.value || null)}
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
              onChange={(e) => update('sirala', e.target.value === 'onerilen' ? null : e.target.value)}
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
          <p className="text-[15px] font-semibold text-ink-soft">
            {list.length} ürün{ara && <> · “{ara}” için</>}
            {yas && <> · {yas} yaş</>}
          </p>
          {activeCount > 0 && (
            <button type="button" onClick={clear} className="flex min-h-[40px] items-center gap-1 rounded-full px-3 text-[14.5px] font-bold hover:bg-sand">
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
          <div className="mx-auto mt-10 max-w-md rounded-3xl border-2 border-line bg-white p-8 text-center">
            <SearchX className="mx-auto h-10 w-10 text-ink-muted" aria-hidden="true" />
            <h2 className="mt-4 text-xl">Bu seçimle ürün bulamadık</h2>
            <p className="mt-2 text-ink-soft">Farklı bir yaş seçin ya da aradığınızı bize yazın; yeni ürünlerimizden önerelim.</p>
            <div className="mt-6 flex flex-col gap-3">
              <button type="button" onClick={clear} className="btn-primary">
                Tüm ürünleri göster
              </button>
              <a href={whatsappLink('Merhaba, aradığım bir ürün var:')} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                <WhatsAppIcon className="h-5 w-5" /> WhatsApp’tan sor
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
