'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Kid, KID_META, type KidName } from '@/components/Kids'
import { site, whatsappLink } from '@/data/site'
import { getProduct, getVariant } from '@/data/products'
import { formatPrice } from '@/lib/format'

interface Tip {
  kid: KidName
  text: string
  cta: string
  href?: string
  external?: boolean
  event?: string
  /** "Buna bir bak!" dediği ürün */
  product?: { slug: string; color: string }
}

const NEVER_ON = ['/sepet', '/odeme', '/siparis-alindi', '/yasal']

function tipFor(pathname: string): Tip {
  if (pathname === '/')
    return {
      kid: 'pia',
      text: 'Selaaam, ben Pia! 👋 Şu fuşya takıma bayıldım — içi pamuk gibi yumuşacık. Bir bakar mısın?',
      cta: 'Hemen bak',
      href: '/urun/vintage-vibes-takim?renk=fusya',
      product: { slug: 'vintage-vibes-takim', color: 'fusya' },
    }
  if (pathname.startsWith('/urunler'))
    return {
      kid: 'primo',
      text: 'Hey, ben Primo! 😎 Yaşını seç, sana sadece uyan bedenleri göstereyim.',
      cta: 'Boyuma göre bul',
      href: '/beden-rehberi#beden-bul',
    }
  if (pathname.startsWith('/urun/'))
    return {
      kid: 'pia',
      text: 'Bedenden emin değil misin? Boyunu yaz, 10 saniyede birlikte bulalım!',
      cta: 'Bedenimi bul',
      event: 'pk-open-size-guide',
    }
  if (pathname.startsWith('/galeri'))
    return site.social.instagram
      ? {
          kid: 'primo',
          text: `Bu kareler süper değil mi? 🤩 Yeni kombinler için Instagram’da ${site.social.instagramHandle} hesabımızı takip et!`,
          cta: 'Instagram’a git',
          href: site.social.instagram,
          external: true,
        }
      : { kid: 'primo', text: 'Beğendiğin kareye dokun, o ürünü hemen önüne getireyim!', cta: 'Tamamdır' }
  if (pathname.startsWith('/iletisim') || pathname.startsWith('/hizmetler') || pathname.startsWith('/sss'))
    return {
      kid: 'pia',
      text: 'Aklına takılan bir şey mi var? WhatsApp’tan yaz, ekibimiz hemen yanıtlasın 💬',
      cta: 'WhatsApp’tan yaz',
      href: whatsappLink('Merhaba, bir sorum var.'),
      external: true,
    }
  return {
    kid: 'primo',
    text: 'Benim favorim Legend Kargo Takım — tam 5 renk! Zümrüt rengine bir bak 😎',
    cta: 'Göster',
    href: '/urun/legend-kargo-takim?renk=zumrut',
    product: { slug: 'legend-kargo-takim', color: 'zumrut' },
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

/**
 * Primo ve Pia — ekranın sağ kenarından eğilip el sallayan, ürün öneren
 * çizgi film karakterleri. Kullanıcı biraz gezindikten sonra çıkar, oturumda
 * birkaç kez görünür, kendiliğinden geri çekilir; sepet/ödemede asla çıkmaz.
 */
export function Mascot() {
  const pathname = usePathname()
  const [shown, setShown] = useState<{ path: string; tip: Tip } | null>(null)
  const [bubble, setBubble] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const tip = shown && shown.path === pathname ? shown.tip : null

  const hide = useCallback(() => {
    setLeaving(true)
    window.setTimeout(() => {
      setShown(null)
      setLeaving(false)
      setBubble(true)
    }, 450)
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
    // Kullanıcı biraz gezinmeden (kaydırmadan) çıkmaz; ilk ekrandaki butonların üstüne binmez.
    const scrolled = () => window.scrollY > 280
    const reveal = () => {
      const el = document.activeElement
      if (el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return
      if (document.querySelector('[aria-modal="true"], dialog[open]')) return
      setBubble(true)
      setShown({ path: pathname, tip: tipFor(pathname) })
      write(sessionStorage, 'pk-primo-count', String(count + 1))
      write(sessionStorage, 'pk-primo-seen', JSON.stringify([...seen, seenKey]))
    }
    const show = () => {
      if (!ready || !scrolled()) return
      window.removeEventListener('scroll', show)
      reveal()
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

  // Dokunulmazsa 18 sn sonra geri çekilir.
  useEffect(() => {
    if (!tip) return
    const t = window.setTimeout(hide, 18000)
    return () => window.clearTimeout(t)
  }, [tip, hide])

  if (!tip) return null

  const meta = KID_META[tip.kid]
  const product = tip.product ? getProduct(tip.product.slug) : undefined
  const variant = product ? getVariant(product, tip.product?.color) : undefined
  const act = () => {
    if (tip.event) window.dispatchEvent(new Event(tip.event))
    hide()
  }
  const ctaClass = 'btn min-h-[42px] px-4 text-[14px] text-white'
  const ctaStyle = { background: meta.color }

  return (
    <aside
      aria-label={`${meta.name}’dan öneri`}
      className="pointer-events-none fixed right-0 z-[44]"
      style={{ bottom: 'calc(var(--bottom-nav-h) + var(--float-offset, 0px) + 6px)' }}
    >
      <div className="relative flex items-end">
        {bubble && (
          <div
            role="status"
            className={`pointer-events-auto absolute bottom-[86px] right-[88px] w-[262px] max-w-[calc(100vw-104px)] origin-bottom-right rounded-[26px] rounded-br-md border-[3px] bg-white p-4 pr-3 shadow-lift transition duration-300 md:bottom-[104px] md:right-[112px] md:w-[290px] ${
              leaving ? 'scale-90 opacity-0' : 'animate-bubble-in'
            }`}
            style={{ borderColor: meta.color }}
          >
            <button
              type="button"
              onClick={hide}
              className="absolute right-1 top-1 grid h-10 w-10 place-items-center rounded-full text-ink-muted hover:bg-ink/5"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="inline-block rounded-full px-2.5 py-0.5 font-display text-[12px] font-bold text-white" style={{ background: meta.color }}>
              {meta.name}
            </span>
            <div className="mt-2 flex gap-3">
              {product && variant && (
                <Link
                  href={tip.href ?? `/urun/${product.slug}`}
                  onClick={hide}
                  className="relative h-[84px] w-[64px] shrink-0 overflow-hidden rounded-2xl bg-sand"
                  aria-label={`${product.name} ürününe git`}
                >
                  <Image src={variant.image} alt="" fill sizes="64px" className="object-cover object-top" />
                </Link>
              )}
              <div className="min-w-0 pr-5">
                <p className="text-[14.5px] font-semibold leading-snug text-ink">{tip.text}</p>
                {product && <p className="mt-1 font-display text-[13px] font-bold text-ink-soft">{formatPrice(product.price)}</p>}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              {tip.href ? (
                tip.external ? (
                  <a href={tip.href} target="_blank" rel="noopener noreferrer" onClick={hide} className={ctaClass} style={ctaStyle}>
                    {tip.cta}
                  </a>
                ) : (
                  <Link href={tip.href} onClick={hide} className={ctaClass} style={ctaStyle}>
                    {tip.cta}
                  </Link>
                )
              ) : (
                <button type="button" onClick={act} className={ctaClass} style={ctaStyle}>
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
        )}

        {/* Karakter — sağ kenardan eğilerek çıkar */}
        <button
          type="button"
          onClick={() => setBubble((b) => !b)}
          aria-label={bubble ? `${meta.name}’nın mesajını gizle` : `${meta.name}’nın mesajını göster`}
          aria-expanded={bubble}
          className={`pointer-events-auto relative w-[112px] md:w-[140px] ${leaving ? 'animate-peek-out' : 'animate-peek-side'}`}
        >
          <Kid kid={tip.kid} className="h-auto w-full drop-shadow-[0_10px_18px_rgba(21,19,17,.22)]" />
        </button>
      </div>
    </aside>
  )
}
