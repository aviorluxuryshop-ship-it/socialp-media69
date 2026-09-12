import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

import { Reveal } from '@/components/ui/Reveal'
import { contact } from '@/data/site'

const title = 'Siparişiniz alındı'
const description = 'Bayburt Store siparişiniz alındı. Sipariş özetiniz e-posta ile gönderilir.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/siparis/alindi' },
  robots: { index: false, follow: true },
}

/**
 * Where a payment provider returns the buyer once it has taken the payment.
 *
 * It is a real page rather than a stub so the return URL exists the day one is
 * attached, but it deliberately states nothing it cannot know: no order
 * number, no amount, no date. Those come from the provider's callback, and
 * inventing them here would put a receipt on screen for a payment nobody took.
 */
export default function OrderReceivedPage() {
  return (
    <section className="pb-24 pt-[calc(var(--header-height)+4rem)] lg:pb-32 lg:pt-[calc(var(--header-height)+6rem)]">
      <div className="container max-w-2xl">
        <Reveal className="flex justify-center">
          <span className="grid h-16 w-16 place-items-center rounded-full border border-gold-600/50 bg-gold-500/10">
            <Check className="h-7 w-7 text-gold-800" aria-hidden />
          </span>
        </Reveal>

        <Reveal
          as="h1"
          from="above"
          delay={0.06}
          className="mt-8 text-center font-display text-[clamp(2rem,5.5vw,3.25rem)] font-semibold uppercase leading-[1.12] tracking-tight text-balance text-ink"
        >
          Siparişiniz alındı
        </Reveal>

        <Reveal as="p" delay={0.12} className="mt-6 text-center font-sans text-base leading-relaxed text-ink-soft">
          Teşekkür ederiz. Sipariş özetiniz, verdiğiniz e-posta adresine gönderilir. Kargoya
          verildiğinde takip bilgisi de aynı adrese ulaşır.
        </Reveal>

        <Reveal delay={0.18} className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/koleksiyon"
            className="inline-flex w-full items-center justify-center gap-3 border border-ink/25 px-7 py-3.5 font-sans text-[11px] uppercase tracking-luxe text-ink transition-colors duration-500 ease-luxe hover:border-gold-700 hover:text-gold-800 sm:w-auto"
          >
            Koleksiyona dön
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link
            href="/iletisim"
            className="inline-flex w-full items-center justify-center px-7 py-3.5 font-sans text-[11px] uppercase tracking-wider2 text-ink-mute transition-colors duration-300 hover:text-ink sm:w-auto"
          >
            Siparişinizle ilgili bize yazın
          </Link>
        </Reveal>

        <Reveal delay={0.24} className="mt-10 text-center">
          <p className="font-sans text-[12px] text-ink-mute">
            Bir sorun olduğunu düşünüyorsanız{' '}
            <a
              href={contact.emailHref}
              className="text-gold-800 underline underline-offset-4 transition-colors duration-300 hover:text-gold-800"
            >
              {contact.email}
            </a>{' '}
            adresine yazın.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
