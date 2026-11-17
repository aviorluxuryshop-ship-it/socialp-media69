'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AlertCircle, Mail, Send } from 'lucide-react'
import { site, whatsappLink } from '@/data/site'
import { WhatsAppIcon } from '@/components/BrandIcons'

const TOPICS = ['Beden danışmanlığı', 'Siparişim hakkında', 'İade / değişim', 'Toplu sipariş', 'Diğer']

/**
 * Sunucu tarafı e-posta servisi bağlanana kadar mesaj, kullanıcının kendi
 * WhatsApp'ı veya e-posta uygulaması üzerinden gönderilir — hiçbir mesaj
 * "gönderildi" deyip kaybolmaz.
 */
export function ContactForm() {
  const [name, setName] = useState('')
  const [topic, setTopic] = useState(TOPICS[0])
  const [order, setOrder] = useState('')
  const [message, setMessage] = useState('')
  const [tried, setTried] = useState(false)

  const errors = {
    name: name.trim().length < 2 ? 'Adınızı yazın.' : '',
    message: message.trim().length < 5 ? 'Mesajınızı yazın.' : '',
  }
  const valid = !errors.name && !errors.message
  const text = `Merhaba ${site.name},\nKonu: ${topic}${order ? `\nSipariş No: ${order}` : ''}\n\n${message.trim()}\n\n— ${name.trim()}`

  const send = (via: 'wa' | 'mail') => {
    setTried(true)
    if (!valid) return
    if (via === 'wa') window.open(whatsappLink(text), '_blank', 'noopener')
    else window.location.href = `mailto:${site.contact.email}?subject=${encodeURIComponent(`${topic}${order ? ` — ${order}` : ''}`)}&body=${encodeURIComponent(text)}`
  }

  return (
    <form onSubmit={(e) => (e.preventDefault(), send('wa'))} noValidate className="rounded-[32px] bg-white p-5 ring-1 ring-line md:p-8" aria-labelledby="contact-title">
      <h2 id="contact-title" className="flex items-center gap-2 text-[22px]">
        <Send className="h-5 w-5" aria-hidden="true" /> Bize yazın
      </h2>
      <p className="mt-1 text-[14.5px] text-ink-muted">Mesajınız WhatsApp veya e-posta uygulamanızda hazır olarak açılır; gönder’e basmanız yeterli.</p>
      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="c-name" className="field-label">Adınız <span className="text-danger" aria-hidden="true">*</span></label>
          <input id="c-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="field" aria-invalid={tried && !!errors.name} aria-describedby={tried && errors.name ? 'c-name-err' : undefined} />
          {tried && errors.name && <p id="c-name-err" className="field-error"><AlertCircle className="h-4 w-4" aria-hidden="true" /> {errors.name}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="c-topic" className="field-label">Konu</label>
            <select id="c-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="field cursor-pointer">
              {TOPICS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="c-order" className="field-label">Sipariş no <span className="font-normal text-ink-muted">(varsa)</span></label>
            <input id="c-order" value={order} onChange={(e) => setOrder(e.target.value)} placeholder="PK…" className="field" />
          </div>
        </div>
        <div>
          <label htmlFor="c-msg" className="field-label">Mesajınız <span className="text-danger" aria-hidden="true">*</span></label>
          <textarea id="c-msg" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="örn. 7 yaşındaki kızım 126 cm, Perfect takımda hangi bedeni almalıyım?" className="field py-3" aria-invalid={tried && !!errors.message} aria-describedby={tried && errors.message ? 'c-msg-err' : undefined} />
          {tried && errors.message && <p id="c-msg-err" className="field-error"><AlertCircle className="h-4 w-4" aria-hidden="true" /> {errors.message}</p>}
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button type="submit" className="btn-whatsapp h-14">
          <WhatsAppIcon className="h-5 w-5" /> WhatsApp ile gönder
        </button>
        <button type="button" onClick={() => send('mail')} className="btn-secondary h-14">
          <Mail className="h-5 w-5" aria-hidden="true" /> E-posta ile gönder
        </button>
      </div>
      <p className="mt-4 text-[13px] text-ink-muted">
        Bilgileriniz yalnızca sorunuzu yanıtlamak için kullanılır. <Link href="/yasal/kvkk-aydinlatma-metni" className="font-semibold underline">KVKK Aydınlatma Metni</Link>
      </p>
    </form>
  )
}
