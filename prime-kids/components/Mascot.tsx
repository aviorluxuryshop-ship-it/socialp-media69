'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { PrimoFace } from '@/components/Mascot.svg'
import { site, whatsappLink } from '@/data/site'

interface Tip {
  text: string
  cta: string
  href?: string
  external?: boolean
  event?: string
}

const NEVER_ON = ['/sepet', '/odeme', '/siparis-alindi', '/yasal']

function tipFor(pathname: string): Tip | null {
  if (pathname === '/')
    return {
      text: 'Selam, ben Primo! Kışlık şardonlu takımlar geldi — içi pamuk gibi yumuşacık. Bir bakalım mı?',
      cta: 'Kışlıklara bak',
      href: '/urunler?ozellik=sardonlu',
    }
  if (pathname.startsWith('/urunler'))
    return {
      text: 'Küçük bir ipucu: Yaş seçersen sadece çocuğuna uyan bedenleri gösteririm.',
      cta: 'Boya göre beden bul',
      href: '/beden-rehberi#beden-bul',
    }
  if (pathname.startsWith('/urun/'))
    return {
      text: 'Bedenden emin değil misin? Çocuğunun boyunu yaz, 10 saniyede önereyim.',
      cta: 'Bedenimi bul',
      event: 'pk-open-size-guide',
    }
  if (pathname.startsWith('/galeri'))
    return site.social.instagram
      ? {
          text: `Beğendiğin kareye dokun, ürünü göstereyim! Yeni kombinler için Instagram’da ${site.social.instagramHandle} hesabımızı takip edebilirsin.`,
          cta: 'Instagram’a git',
          href: site.social.instagram,
          external: true,
        }
      : { text: 'Beğendiğin kareye dokun, o ürünü hemen önüne getireyim!', cta: 'Tamamdır' }
  if (pathname.startsWith('/iletisim') || pathname.startsWith('/hizmetler') || pathname.startsWith('/sss'))
    return {
      text: 'Aklına takılan bir şey mi var? WhatsApp’tan yaz, ekibimizden biri yanıtlasın.',
      cta: 'WhatsApp’tan yaz',
      href: whatsappLink('Merhaba, bir sorum var.'),
      external: true,
    }
  return {
    text: 'Bu sezonun yıldızı Legend Kargo Takım — tam 5 renk! Bir göz atmak ister misin?',
    cta: 'Hemen bak',
    href: '/urun/legend-kargo-takim',
  }
}

const read = (store: Storage, key: string) => {
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}
const write = (store: Storage, key: string, value: string) => {
  try {
    store.setItem(key, value)
  } catch {}
}

export function Mascot() {
  const pathname = usePathname()
  const [shown, setShown] = useState<{ path: string; tip: Tip } | null>(null)
  const tip = shown && shown.path === pathname ? shown.tip : null
  const [leaving, setLeaving] = useState(false)

  const hide = useCallback(() => {
    setLeaving(true)
    window.setTimeout(() => {
      setShown(null)
      setLeaving(false)
    }, 280)
  }, [])

  useEffect(() => {
    if (!site.mascot.enabled) return
    if (NEVER_ON.some((p) => pathname.startsWith(p))) return
    if (read(localStorage, 'pk-primo-off')) return
    const count = Number(read(sessionStorage, 'pk-primo-count') ?? '0')
    if (count >= site.mascot.maxPerSession) return
    const seenKey = pathname.startsWith('/urun/') ? '/urun/' : pathname
    const seen: string[] = JSON.parse(read(sessionStorage, 'pk-primo-seen') ?? '[]')
    if (seen.includes(seenKey)) return

    let timer: number | undefined
    let ready = false
    // Kullanıcı sayfada biraz gezinmeden (kaydırmadan) çıkmaz; böylece ilk ekrandaki butonların üstüne binmez.
    const scrolled = () => window.scrollY > 280
    const show = () => {
      if (!ready || !scrolled()) return
      window.removeEventListener('scroll', show)
      reveal()
    }
    const reveal = () => {
      // Bir form alanına yazılırken veya bir pencere açıkken araya girme
      const el = document.activeElement
      if (el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return
      if (document.querySelector('[aria-modal="true"], dialog[open]')) return
      const next = tipFor(pathname)
      if (!next) return
      setShown({ path: pathname, tip: next })
      write(sessionStorage, 'pk-primo-count', String(count + 1))
      write(sessionStorage, 'pk-primo-seen', JSON.stringify([...seen, seenKey]))
    }
    const schedule = () => {
      timer = window.setTimeout(() => {
        ready = true
        if (scrolled()) show()
        else window.addEventListener('scroll', show, { passive: true })
      }, count === 0 ? site.mascot.firstDelayMs : site.mascot.firstDelayMs * 2)
    }
    // Çerez bildirimi açıkken üst üste binmesin — önce o kapanmalı
    const onCookie = () => schedule()
    if (read(localStorage, 'pk-cookie-ok')) schedule()
    else window.addEventListener('pk-cookie-ok', onCookie, { once: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pk-cookie-ok', onCookie)
      window.removeEventListener('scroll', show)
    }
  }, [pathname])

  // Kendiliğinden kaybolur; dokunulmazsa ekranı işgal etmez.
  useEffect(() => {
    if (!tip) return
    const t = window.setTimeout(hide, 15000)
    return () => window.clearTimeout(t)
  }, [tip, hide])

  if (!tip) return null

  const act = () => {
    if (tip.event) window.dispatchEvent(new Event(tip.event))
    hide()
  }

  return (
    <aside
      aria-label="Primo’dan ipucu"
      className={`fixed right-3 z-[44] flex max-w-[calc(100vw-24px)] items-end gap-2 md:right-6 ${leaving ? 'pointer-events-none opacity-0 transition-opacity duration-300' : ''}`}
      style={{ bottom: 'calc(var(--bottom-nav-h) + var(--float-offset, 0px) + 12px)' }}
    >
      <div
        className="relative mb-6 w-[268px] max-w-[calc(100vw-110px)] origin-bottom-right animate-fade-up rounded-3xl rounded-br-md border border-line bg-white p-4 shadow-lift"
        role="status"
      >
        <button
          type="button"
          onClick={hide}
          className="absolute right-1.5 top-1.5 grid h-10 w-10 place-items-center rounded-full text-ink-muted hover:bg-ink/5"
          aria-label="İpucunu kapat"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <p className="pr-7 font-display text-[12px] font-bold uppercase tracking-[0.14em] text-ink-muted">Primo</p>
        <p className="mt-1 text-[14.5px] leading-snug text-ink">{tip.text}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          {tip.href ? (
            tip.external ? (
              <a href={tip.href} target="_blank" rel="noopener noreferrer" onClick={hide} className="btn-primary min-h-[40px] px-4 text-[13.5px]">
                {tip.cta}
              </a>
            ) : (
              <Link href={tip.href} onClick={hide} className="btn-primary min-h-[40px] px-4 text-[13.5px]">
                {tip.cta}
              </Link>
            )
          ) : (
            <button type="button" onClick={act} className="btn-primary min-h-[40px] px-4 text-[13.5px]">
              {tip.cta}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              write(localStorage, 'pk-primo-off', '1')
              hide()
            }}
            className="min-h-[40px] text-[12.5px] font-semibold text-ink-muted underline-offset-2 hover:underline"
          >
            Bir daha gösterme
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={hide}
        aria-label="Primo’yu gizle"
        className="h-[68px] w-[68px] shrink-0 animate-peek overflow-visible rounded-full bg-white shadow-lift"
      >
        <PrimoFace className="h-full w-full" waving />
      </button>
    </aside>
  )
}
