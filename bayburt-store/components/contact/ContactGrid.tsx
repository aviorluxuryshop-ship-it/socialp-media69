'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, Globe, Instagram, MapPin, Phone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion'
import { contact } from '@/data/site'

interface ContactCard {
  icon: LucideIcon
  label: string
  value: string
  detail: string
  href: string
  external: boolean
}

const CARDS: ContactCard[] = [
  {
    icon: Phone,
    label: 'Telefon',
    value: contact.phone,
    detail: contact.store.hours,
    href: contact.phoneHref,
    external: false,
  },
  {
    icon: Globe,
    label: 'Web',
    value: contact.web,
    detail: 'Sipariş, iade ve kargo takibi',
    href: contact.webHref,
    external: true,
  },
  {
    icon: Instagram,
    label: 'Instagram',
    value: contact.instagram,
    detail: 'Koleksiyon lansmanları ve saha görselleri',
    href: contact.instagramHref,
    external: true,
  },
  {
    icon: MapPin,
    label: 'Flagship Mağaza',
    value: contact.store.district,
    detail: `${contact.store.addressLine} · ${contact.store.postalCode}`,
    href: contact.store.mapsHref,
    external: true,
  },
]

export function ContactGrid() {
  return (
    <motion.ul
      variants={staggerContainer(0.1)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      data-reveal
      className="grid gap-px overflow-hidden border border-ink/14 bg-white/10 sm:grid-cols-2"
    >
      {CARDS.map(({ icon: Icon, ...card }) => (
        <motion.li key={card.label} variants={fadeUp(20)} className="bg-paper">
          <a
            href={card.href}
            {...(card.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
            className="group relative flex h-full flex-col justify-between gap-12 p-8 transition-colors duration-700 ease-luxe hover:bg-graphite-dark lg:p-10"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              style={{
                background:
                  'radial-gradient(60% 70% at 20% 20%, rgba(212,175,55,0.10), transparent 70%)',
              }}
            />

            <span className="relative flex items-start justify-between gap-6">
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-gold-800" aria-hidden />
                <span className="font-sans text-[11px] uppercase tracking-wider2 text-ink-mute">
                  {card.label}
                </span>
              </span>
              <ArrowUpRight
                className="h-4 w-4 text-ink-mute transition-all duration-500 ease-luxe group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold-800"
                aria-hidden
              />
            </span>

            <span className="relative">
              <span className="block break-words font-display text-lg uppercase tracking-wider2 text-ink transition-colors duration-500 group-hover:text-gold-800 sm:text-xl">
                {card.value}
              </span>
              <span className="mt-3 block font-sans text-sm text-ink-mute">{card.detail}</span>
            </span>
          </a>
        </motion.li>
      ))}
    </motion.ul>
  )
}
