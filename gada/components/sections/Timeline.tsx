'use client'

import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion'
import { useRef } from 'react'

import { Reveal } from '@/components/ui/Reveal'
import { milestones } from '@/data/company'

export function Timeline() {
  const listRef = useRef<HTMLOListElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 75%', 'end 60%'] })
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 })
  const sources = Array.from(new Map(milestones.map((m) => [m.source.url, m.source])).values())

  return (
    <section id="hikaye" className="relative z-10 bg-paper py-24 lg:py-40">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-24">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+4rem)] lg:self-start">
            <Reveal as="p" className="eyebrow text-ink-soft">
              GADA’nın hikâyesi
            </Reveal>
            <Reveal as="h2" delay={0.06} className="display balance mt-5 text-[clamp(2.25rem,1.4rem+3.4vw,4.5rem)]">
              Kuruluştan bugüne.
            </Reveal>
            <Reveal as="p" delay={0.12} className="lede mt-6 max-w-md">
              Yalnızca kaynağı olan tarihler. Her adımın kaynağı sayfanın sonunda.
            </Reveal>
          </div>

          <ol ref={listRef} className="relative">
            <span aria-hidden className="absolute bottom-2 left-[5px] top-2 w-px bg-ink/10" />
            <motion.span
              aria-hidden
              className="absolute left-[5px] top-2 h-[calc(100%-1rem)] w-px origin-top bg-ink"
              style={{ scaleY: reduced ? 1 : progress }}
            />
            {milestones.map((item, index) => (
              <Reveal as="li" key={item.title} delay={0.04} className="relative pb-14 pl-12 last:pb-0">
                <span aria-hidden className="absolute left-0 top-2.5 h-[11px] w-[11px] rounded-full border border-ink bg-paper" />
                <p className="flex items-baseline gap-4">
                  <span className="display text-[clamp(2.25rem,1.6rem+2.4vw,3.75rem)] leading-none tabular">{item.year}</span>
                  {item.date && <span className="text-sm text-ink-faint">{item.date}</span>}
                </p>
                <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 max-w-xl leading-relaxed text-ink-soft">
                  {item.body}
                  <a
                    href={item.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 align-super text-[0.7rem] text-ink-faint underline-offset-2 hover:text-ink hover:underline"
                    aria-label={`Kaynak: ${item.source.label}`}
                  >
                    [{sources.findIndex((s) => s.url === item.source.url) + 1}]
                  </a>
                </p>
                {index === milestones.length - 1 && <span className="sr-only">Zaman çizelgesinin sonu</span>}
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal className="mt-24 border-t border-ink/10 pt-8">
          <p className="eyebrow text-ink-faint">Kaynaklar</p>
          <ol className="mt-4 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
            {sources.map((source, i) => (
              <li key={source.url}>
                <span className="tabular text-ink-faint">[{i + 1}]</span>{' '}
                <a href={source.url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-ink hover:underline">
                  {source.label}
                </a>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}
