import { Truck } from 'lucide-react'
import { site } from '@/data/site'
import { formatPrice } from '@/lib/format'

export function FreeShippingProgress({ subtotal, className = '' }: { subtotal: number; className?: string }) {
  const goal = site.shipping.freeOver
  const remaining = Math.max(0, goal - subtotal)
  const pct = Math.min(100, Math.round((subtotal / goal) * 100))
  const done = remaining === 0
  return (
    <div className={`rounded-2xl ${done ? 'bg-success-soft' : 'bg-sand'} p-3.5 ${className}`}>
      <p className="flex items-center gap-2 text-[14px] font-semibold text-ink-soft">
        <Truck className={`h-[18px] w-[18px] shrink-0 ${done ? 'text-success' : ''}`} aria-hidden="true" />
        {done ? (
          <span className="text-success">Harika! Kargonuz ücretsiz.</span>
        ) : (
          <span>
            Ücretsiz kargo için <strong className="text-ink">{formatPrice(remaining)}</strong> kaldı
          </span>
        )}
      </p>
      <div
        className="mt-2.5 h-2 overflow-hidden rounded-full bg-white"
        role="progressbar"
        aria-label="Ücretsiz kargo ilerlemesi"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className={`h-full rounded-full transition-[width] duration-700 ease-soft ${done ? 'bg-success' : 'bg-ink'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
