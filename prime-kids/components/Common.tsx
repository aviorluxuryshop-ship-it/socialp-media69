import Link from 'next/link'
import { ChevronDown, ChevronRight, MessageCircleHeart, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { site } from '@/data/site'
import { formatPrice } from '@/lib/format'

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Konumunuz" className="text-[13.5px] text-ink-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
            {item.href ? (
              <Link href={item.href} className="inline-flex min-h-[32px] items-center hover:text-ink hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold text-ink-soft">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function PageHeader({
  eyebrow,
  title,
  lead,
  crumbs,
  children,
}: {
  eyebrow?: string
  title: string
  lead?: string
  crumbs?: Array<{ label: string; href?: string }>
  children?: React.ReactNode
}) {
  return (
    <section className="border-b border-line bg-gradient-to-b from-sand/70 to-cream">
      <div className="container pb-8 pt-5 md:pb-12 md:pt-8">
        {crumbs && <Breadcrumbs items={[{ label: 'Ana Sayfa', href: '/' }, ...crumbs]} />}
        {eyebrow && <p className="eyebrow mt-5">{eyebrow}</p>}
        <h1 className="mt-2 text-[30px] leading-[1.15] md:text-[44px]">{title}</h1>
        {lead && <p className="mt-3 max-w-2xl text-[16.5px] text-ink-soft md:text-[18px]">{lead}</p>}
        {children}
      </div>
    </section>
  )
}

export function TrustStrip({ compact = false }: { compact?: boolean }) {
  const items = [
    { icon: Truck, title: 'Ücretsiz Kargo', text: `${formatPrice(site.shipping.freeOver).replace(',00', '')} ve üzeri siparişlerde` },
    { icon: RotateCcw, title: `${site.returns.days} Gün Kolay İade`, text: 'Beden olmazsa hemen değiştiriyoruz' },
    { icon: ShieldCheck, title: 'Güvenli Ödeme', text: '3D Secure · Kart bilgisi saklanmaz' },
    { icon: MessageCircleHeart, title: 'WhatsApp Destek', text: 'Beden & sipariş sorularınıza yanıt' },
  ]
  return (
    <ul className={`grid grid-cols-2 gap-3 ${compact ? '' : 'md:grid-cols-4 md:gap-4'}`}>
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex flex-col items-start gap-2.5 rounded-2xl bg-white p-3.5 ring-1 ring-line sm:flex-row sm:gap-3 md:p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sand">
            <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-[13.5px] font-bold leading-tight md:text-[14.5px]">{title}</span>
            <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-muted md:text-[13.5px]">{text}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export function SectionHeading({ eyebrow, title, lead, action }: { eyebrow?: string; title: string; lead?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:mb-9 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-1.5 text-[26px] leading-tight md:text-[36px]">{title}</h2>
        {lead && <p className="mt-2 max-w-xl text-[16px] text-ink-soft">{lead}</p>}
      </div>
      {action}
    </div>
  )
}

/** Yerel <details> tabanlı akordeon — JavaScript gerektirmez, klavye ve ekran okuyucu dostudur. */
export function Accordion({ items, defaultOpen }: { items: Array<{ q: string; a: React.ReactNode }>; defaultOpen?: number }) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white">
      {items.map((item, i) => (
        <details key={item.q} className="group" open={defaultOpen === i}>
          <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display text-[15.5px] font-semibold marker:hidden hover:bg-sand/40 [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDown className="h-5 w-5 shrink-0 text-ink-muted transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="px-5 pb-5 text-[15.5px] leading-relaxed text-ink-soft">{item.a}</div>
        </details>
      ))}
    </div>
  )
}
