'use client'

import { Send } from 'lucide-react'
import { useId, useState } from 'react'

import { contact } from '@/data/site'
import { cn } from '@/lib/utils'

const SUBJECTS = ['Sipariş ve kargo', 'Beden ve stok', 'Kurumsal ve toplu alım', 'Diğer'] as const

/**
 * Contact form.
 *
 * The site has no backend, and a form that quietly posts nowhere is worse
 * than no form at all — so this one composes the message and hands it to the
 * visitor's own mail client. Nothing is sent without them seeing it, and the
 * address is the same one printed above.
 */
export function ContactForm() {
  const id = useId()
  const [name, setName] = useState('')
  const [from, setFrom] = useState('')
  const [subject, setSubject] = useState<string>(SUBJECTS[0])
  const [message, setMessage] = useState('')
  const [touched, setTouched] = useState(false)

  const missing = name.trim() === '' || message.trim() === ''

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTouched(true)
    if (missing) return

    const body = [
      message.trim(),
      '',
      '—',
      name.trim(),
      from.trim() ? from.trim() : null,
    ]
      .filter((line) => line !== null)
      .join('\n')

    // Handed to the mail client through a link rather than a navigation:
    // mailto: is a protocol handler, not a page.
    const link = document.createElement('a')
    link.href = `${contact.emailHref}?subject=${encodeURIComponent(
      `${subject} — ${name.trim()}`,
    )}&body=${encodeURIComponent(body)}`
    link.rel = 'noopener'
    link.click()
  }

  const field =
    'w-full border border-white/15 bg-white/[0.03] px-4 py-3.5 font-sans text-sm text-white placeholder:text-ash transition-colors duration-300 focus:border-gold-600 focus:outline-none focus:ring-1 focus:ring-gold-600/40'
  const label = 'mb-2.5 block font-sans text-[11px] uppercase tracking-wider2 text-gold-600'

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor={`${id}-ad`}>
            Ad soyad
          </label>
          <input
            id={`${id}-ad`}
            name="ad"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={touched && name.trim() === ''}
            className={cn(field, touched && name.trim() === '' && 'border-red-400/60')}
            placeholder="Adınız"
          />
        </div>

        <div>
          <label className={label} htmlFor={`${id}-eposta`}>
            E-posta
          </label>
          <input
            id={`${id}-eposta`}
            name="eposta"
            type="email"
            autoComplete="email"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className={field}
            placeholder="size@ornek.com"
          />
        </div>
      </div>

      <div>
        <label className={label} htmlFor={`${id}-konu`}>
          Konu
        </label>
        <select
          id={`${id}-konu`}
          name="konu"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className={cn(field, 'appearance-none')}
        >
          {SUBJECTS.map((option) => (
            <option key={option} value={option} className="bg-obsidian text-white">
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={label} htmlFor={`${id}-mesaj`}>
          Mesaj
        </label>
        <textarea
          id={`${id}-mesaj`}
          name="mesaj"
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-invalid={touched && message.trim() === ''}
          className={cn(field, 'resize-y', touched && message.trim() === '' && 'border-red-400/60')}
          placeholder="Nasıl yardımcı olabiliriz?"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
        <button
          type="submit"
          className="group inline-flex items-center gap-3 border border-white/25 px-8 py-4 font-sans text-[11px] uppercase tracking-luxe text-white transition-colors duration-500 ease-luxe hover:border-gold-500 hover:text-gold-200"
        >
          <Send className="h-3.5 w-3.5" aria-hidden />
          Mesajı gönder
        </button>

        <p className="font-sans text-[11px] uppercase tracking-wider2 text-ash" role="status">
          {touched && missing
            ? 'Ad soyad ve mesaj alanlarını doldurun'
            : `Mesaj ${contact.email} adresine gider`}
        </p>
      </div>
    </form>
  )
}
