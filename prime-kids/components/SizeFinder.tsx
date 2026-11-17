'use client'

import Link from 'next/link'
import { useId, useState } from 'react'
import { Ruler, Sparkles } from 'lucide-react'
import { recommendSize, SIZE_CHART } from '@/data/products'

export function SizeFinder({
  available,
  onPick,
  compact = false,
}: {
  /** Ürün sayfasında: o ürünün bedenleri */
  available?: string[]
  onPick?: (size: string) => void
  compact?: boolean
}) {
  const id = useId()
  const [height, setHeight] = useState('')
  const value = Number(height)
  const result = height.length >= 2 ? recommendSize(value) : null
  const fits = result && available ? available.includes(result.row.size) : true

  return (
    <div className={`rounded-3xl bg-white ${compact ? 'p-4' : 'p-5 md:p-6'} ring-1 ring-line`}>
      <label htmlFor={id} className="flex items-center gap-2 font-display text-[15.5px] font-bold">
        <Ruler className="h-5 w-5" aria-hidden="true" /> Çocuğunuzun boyu kaç cm?
      </label>
      <div className="mt-3 flex items-center gap-3">
        <div className="relative w-[150px] shrink-0">
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={70}
            max={180}
            placeholder="128"
            value={height}
            onChange={(e) => setHeight(e.target.value.slice(0, 3))}
            className="field pr-12 text-[18px] font-bold"
            aria-describedby={`${id}-result`}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-ink-muted">cm</span>
        </div>
        <p className="text-[13.5px] leading-snug text-ink-muted">Ayakkabısız, duvara yaslanarak ölçün.</p>
      </div>
      <div id={`${id}-result`} aria-live="polite" className="min-h-[24px]">
        {result && (
          <div className="mt-4 animate-fade-up rounded-2xl bg-sage p-4">
            <p className="flex items-center gap-2 font-display text-[16px] font-bold">
              <Sparkles className="h-5 w-5" aria-hidden="true" /> Önerimiz: {result.row.label}
            </p>
            <p className="mt-1 text-[14.5px] text-ink-soft">
              {result.between
                ? 'İki beden arasında kalmış — çocuklar hızlı büyüdüğü için bir büyük bedeni öneriyoruz.'
                : `${result.row.height[0]}-${result.row.height[1]} cm boy aralığına uygun.`}
              {!fits && ' Bu beden bu modelde yok; en yakın bedeni seçebilir ya da WhatsApp’tan bize danışabilirsiniz.'}
            </p>
            {onPick && fits && (
              <button type="button" onClick={() => onPick(result.row.size)} className="btn-primary mt-3 min-h-[44px] w-full sm:w-auto">
                {result.row.label} bedeni seç
              </button>
            )}
            {!onPick && (
              <Link href={`/urunler?yas=${result.row.size}`} className="btn-primary mt-3 min-h-[44px] w-full sm:w-auto">
                {result.row.label} ürünlerini gör
              </Link>
            )}
          </div>
        )}
        {height.length >= 2 && !result && (
          <p className="mt-3 text-[14px] font-semibold text-danger">Lütfen 70 ile 180 cm arasında bir boy yazın.</p>
        )}
      </div>
    </div>
  )
}

export function SizeTable({ only }: { only?: string[] }) {
  const rows = only ? SIZE_CHART.filter((r) => only.includes(r.size)) : SIZE_CHART
  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-line" tabIndex={0} role="region" aria-label="Beden tablosu (yana kaydırılabilir)">
      <table className="w-full min-w-[420px] border-collapse bg-white text-left text-[14.5px]">
        <caption className="sr-only">Beden tablosu (cm)</caption>
        <thead className="bg-sand font-display text-[13px] uppercase tracking-wide text-ink-soft">
          <tr>
            <th scope="col" className="px-4 py-3">Beden</th>
            <th scope="col" className="px-4 py-3">Boy</th>
            <th scope="col" className="px-4 py-3">Göğüs</th>
            <th scope="col" className="px-4 py-3">Bel</th>
          </tr>
        </thead>
        <tbody className="tabular divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.size}>
              <th scope="row" className="px-4 py-3 font-bold">{r.label}</th>
              <td className="px-4 py-3">{r.height[0]}-{r.height[1]} cm</td>
              <td className="px-4 py-3">{r.chest} cm</td>
              <td className="px-4 py-3">{r.waist} cm</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
