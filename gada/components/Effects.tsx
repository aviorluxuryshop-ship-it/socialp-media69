'use client'

import { useEffect } from 'react'

/**
 * İki küçük gözlemci:
 * - `[data-reveal]` ögeleri ekrana girince `is-in` sınıfını alır (bir kez).
 * - `[data-steps]` bölümlerinde, ekranın ortasından geçen adım `data-active` olur.
 */
export default function Effects() {
  useEffect(() => {
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          e.target.classList.add('is-in')
          reveal.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0 },
    )
    document.querySelectorAll('[data-reveal]').forEach((el) => reveal.observe(el))

    const steps = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const el = e.target as HTMLElement
          const section = el.closest<HTMLElement>('[data-steps]')
          if (section) section.dataset.active = el.dataset.step
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    )
    document.querySelectorAll('[data-steps] [data-step]').forEach((el) => steps.observe(el))

    return () => {
      reveal.disconnect()
      steps.disconnect()
    }
  }, [])

  return null
}
