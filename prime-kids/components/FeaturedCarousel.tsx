'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Pause, Play, ShoppingBag, Snowflake, Sparkles, Trophy } from 'lucide-react'
import { featured, type FeaturedIcon } from '@/data/featured'
import { getProduct } from '@/data/products'
import { formatPrice } from '@/lib/format'
import { useHydrated } from '@/lib/hooks'

/**
 * Ana sayfadaki kayan vitrin: her 2 saniyede bir sonraki ürüne kayar, sona
 * gelince başa döner (sonsuz döngü). Parmakla / fareyle kaydırılabilir.
 * Üzerine gelince, dokununca ya da klavyeyle odaklanınca durur; "Durdur"
 * düğmesiyle tamamen durdurulabilir. "Hareketi azalt" açık cihazlarda kendiliğinden kaymaz.
 */

const INTERVAL_MS = 2000
const RESUME_AFTER_MS = 4000

const ICONS: Record<FeaturedIcon, typeof ShoppingBag> = { bag: ShoppingBag, trophy: Trophy, snow: Snowflake, heart: Heart, sparkle: Sparkles }

const slides = featured.flatMap((f) => {
  const product = getProduct(f.slug)
  if (!product) return []
  const color = product.colors.find((c) => c.id === f.color) ?? product.colors[0]
  const href = `/urun/${product.slug}${color.id !== product.colors[0].id ? `?renk=${color.id}` : ''}`
  return [{ ...f, product, color, href }]
})
type SlideData = (typeof slides)[number]
const N = slides.length

const mod = (a: number, n: number) => ((a % n) + n) % n

/** Bir kaydırma adımı (kart genişliği + boşluk), px. */
function stepOf(el: HTMLElement) {
  const a = el.children[0] as HTMLElement | undefined
  const b = el.children[1] as HTMLElement | undefined
  return a && b ? b.offsetLeft - a.offsetLeft : 0
}

const reduceQuery = '(prefers-reduced-motion: reduce)'
function subscribeReduce(cb: () => void) {
  const mq = window.matchMedia(reduceQuery)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const useReducedMotion = () =>
  useSyncExternalStore(
    subscribeReduce,
    () => window.matchMedia(reduceQuery).matches,
    () => false,
  )

export function FeaturedCarousel() {
  const hydrated = useHydrated()
  const reduce = useReducedMotion()
  const [userPaused, setUserPaused] = useState<boolean | null>(null)
  const playing = userPaused === null ? !reduce : !userPaused
  const [active, setActive] = useState(0)
  const [armed, setArmed] = useState(false)

  const rootRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(0)
  const flags = useRef({ hover: false, focus: false, touching: false, scrolling: false, visible: false, lastInput: -Infinity })

  // Sonsuz döngü için kartların önüne ve arkasına birer kopya eklenir (yalnızca tarayıcıda)
  const looping = hydrated && N > 1

  // Kopyalar eklenince, görüntü değişmeden ortadaki gerçek kartlara geç
  useLayoutEffect(() => {
    const el = trackRef.current
    if (!looping || !el) return
    el.scrollLeft = (N + activeRef.current) * stepOf(el)
  }, [looping])

  // Kaydırma: etkin noktayı güncelle, durunca kopyadaysak sessizce gerçeğine atla
  useEffect(() => {
    const el = trackRef.current
    if (!looping || !el) return
    const f = flags.current
    const hasScrollEnd = 'onscrollend' in window
    let settleTimer: number | undefined

    const normalize = () => {
      f.scrolling = false
      if (f.touching) return
      const s = stepOf(el)
      if (!s) return
      const idx = Math.round(el.scrollLeft / s)
      if (idx < N || idx >= 2 * N) el.scrollTo({ left: el.scrollLeft + (N + mod(idx, N) - idx) * s, behavior: 'instant' })
    }
    const onScroll = () => {
      f.scrolling = true
      const s = stepOf(el)
      if (s) {
        const i = mod(Math.round(el.scrollLeft / s), N)
        activeRef.current = i
        setActive(i)
      }
      if (!hasScrollEnd) {
        window.clearTimeout(settleTimer)
        settleTimer = window.setTimeout(normalize, 150)
      }
    }
    const onTouchStart = (e: Event) => {
      f.touching = true
      f.lastInput = e.timeStamp
    }
    const onTouchEnd = (e: Event) => {
      f.touching = false
      f.lastInput = e.timeStamp
      if (!f.scrolling) normalize()
    }
    const onUserInput = (e: Event) => {
      f.lastInput = e.timeStamp
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    if (hasScrollEnd) el.addEventListener('scrollend', normalize)
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })
    el.addEventListener('wheel', onUserInput, { passive: true })
    el.addEventListener('pointerdown', onUserInput, { passive: true })

    // Ekran genişliği değişince (telefon yan çevrilince) aynı kartta kal
    let lastWidth = el.clientWidth
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === lastWidth) return
      lastWidth = el.clientWidth
      el.scrollTo({ left: (N + activeRef.current) * stepOf(el), behavior: 'instant' })
    })
    ro.observe(el)

    return () => {
      window.clearTimeout(settleTimer)
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('scrollend', normalize)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
      el.removeEventListener('wheel', onUserInput)
      el.removeEventListener('pointerdown', onUserInput)
      ro.disconnect()
    }
  }, [looping])

  // Ekrana yaklaşınca fotoğrafları önceden yükle; görünürken kaydır, değilken bekle
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const f = flags.current
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setArmed(true)
      },
      { rootMargin: '400px 0px' },
    )
    const seen = new IntersectionObserver(
      ([e]) => {
        f.visible = e.isIntersecting
      },
      { threshold: 0.2 },
    )
    near.observe(root)
    seen.observe(root)
    return () => {
      near.disconnect()
      seen.disconnect()
    }
  }, [])

  const go = (delta: number, smooth = true) => {
    const el = trackRef.current
    if (!el) return
    const s = stepOf(el)
    if (!s) return
    const idx = Math.round(el.scrollLeft / s)
    el.scrollTo({ left: (idx + delta) * s, behavior: smooth && !reduce ? 'smooth' : 'instant' })
  }

  // Otomatik kaydırma: her 2 saniyede bir sonraki karta
  useEffect(() => {
    if (!playing || !looping) return
    const f = flags.current
    const id = window.setInterval(() => {
      if (f.hover || f.focus || f.touching || !f.visible || document.visibilityState !== 'visible') return
      if (performance.now() - f.lastInput < RESUME_AFTER_MS) return
      const el = trackRef.current
      if (!el) return
      const s = stepOf(el)
      if (s) el.scrollTo({ left: (Math.round(el.scrollLeft / s) + 1) * s, behavior: 'smooth' })
    }, INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [playing, looping])

  // Kullanıcı bir düğmeye basınca otomatik kaydırma birkaç saniye bekler
  const userGo = (e: MouseEvent, delta: number) => {
    flags.current.lastInput = e.timeStamp
    go(delta)
  }

  if (N === 0) return null
  const current = slides[active]

  return (
    <section
      ref={rootRef}
      className="container mt-10 md:mt-14"
      aria-roledescription="carousel"
      aria-labelledby="one-cikanlar"
      onFocus={(e) => {
        // Yalnızca klavyeyle gezinirken dursun; fareyle düğmeye tıklamak durdurmasın
        flags.current.focus = e.target.matches(':focus-visible')
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) flags.current.focus = false
      }}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="one-cikanlar" className="text-[26px] md:text-[34px]">
            Öne çıkanlar
          </h2>
          <p className="mt-0.5 text-[15px] font-semibold text-ink-muted md:text-[16px]">Sepetlerin ve annelerin favorileri</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setUserPaused(playing)}
            aria-label={playing ? 'Otomatik kaydırmayı durdur' : 'Otomatik kaydırmayı başlat'}
            className="grid h-11 w-11 place-items-center rounded-full border-2 border-line bg-white text-ink transition hover:bg-sand"
          >
            {playing ? <Pause className="h-4 w-4" fill="currentColor" aria-hidden="true" /> : <Play className="h-4 w-4" fill="currentColor" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={(e) => userGo(e, -1)}
            aria-label="Önceki ürün"
            className="hidden h-11 w-11 place-items-center rounded-full border-2 border-line bg-white text-ink transition hover:bg-sand sm:grid"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => userGo(e, 1)}
            aria-label="Sonraki ürün"
            className="hidden h-11 w-11 place-items-center rounded-full border-2 border-line bg-white text-ink transition hover:bg-sand sm:grid"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar relative -mx-4 mt-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 pt-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:gap-5 md:scroll-px-0 md:px-0"
        aria-live={playing ? 'off' : 'polite'}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') flags.current.hover = true
        }}
        onPointerLeave={() => {
          flags.current.hover = false
        }}
      >
        {looping && slides.map((s, i) => <Slide key={`once-${i}`} s={s} clone loading={armed ? 'eager' : 'lazy'} />)}
        {slides.map((s, i) => (
          <Slide key={`asil-${i}`} s={s} index={i} loading={armed ? 'eager' : 'lazy'} />
        ))}
        {looping && slides.map((s, i) => <Slide key={`sonra-${i}`} s={s} clone loading={armed ? 'eager' : 'lazy'} />)}
      </div>

      <div className="mt-1 flex justify-center" data-theme={current.product.category}>
        {slides.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={(e) => userGo(e, i - active)}
            aria-label={`${i + 1}. ürün: ${s.label}`}
            aria-current={i === active ? 'true' : undefined}
            className="grid h-10 w-8 place-items-center"
          >
            <span className={`block h-2.5 rounded-full transition-all duration-300 ${i === active ? 'w-7 bg-accent' : 'w-2.5 bg-ink/20'}`} />
          </button>
        ))}
      </div>
    </section>
  )
}

function Slide({ s, index, clone = false, loading }: { s: SlideData; index?: number; clone?: boolean; loading: 'eager' | 'lazy' }) {
  const Icon = ICONS[s.icon]
  return (
    <div
      className="w-[80%] flex-none snap-start sm:w-[calc((100%-0.75rem)/2.15)] md:w-[calc((100%-1.25rem)/2.15)] lg:w-[calc((100%-2.5rem)/3.2)]"
      data-theme={s.product.category}
      {...(clone
        ? { 'aria-hidden': true, inert: true }
        : { role: 'group', 'aria-roledescription': 'slayt', 'aria-label': `${(index ?? 0) + 1} / ${N}` })}
    >
      <Link
        href={s.href}
        aria-label={`${s.label}: ${s.product.name}, ${s.color.name}, ${formatPrice(s.product.price)}`}
        className="group flex h-full flex-col overflow-hidden rounded-[26px] bg-accent-soft transition duration-300 ease-soft hover:-translate-y-1 hover:shadow-card"
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image
            src={s.color.image}
            alt=""
            fill
            loading={loading}
            sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 80vw"
            className="object-cover object-top transition duration-500 ease-soft group-hover:scale-[1.03]"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 font-display text-[14.5px] font-semibold text-white shadow-[0_4px_14px_rgb(var(--accent)/0.35)]">
            <Icon className="h-4 w-4" aria-hidden="true" />
            {s.label}
          </span>
        </div>
        <div className="flex flex-1 items-center justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <p className="truncate font-display text-[17px] font-semibold leading-tight md:text-[19px]">{s.product.name}</p>
            <p className="tabular mt-0.5 font-display text-[16.5px] font-semibold text-accent-dark">{formatPrice(s.product.price)}</p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-white transition group-hover:bg-accent-dark" aria-hidden="true">
            <ArrowRight className="h-5 w-5" />
          </span>
        </div>
      </Link>
    </div>
  )
}
