'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Cookie } from 'lucide-react'

const KEY = 'pk-cookie-ok'

/**
 * Site yalnızca zorunlu yerel depolama (sepet, tercihler) kullanır; reklam veya
 * analiz çerezi yoktur. Bu yüzden bildirim bilgilendirme amaçlıdır. İleride
 * analiz aracı eklenirse burada "Kabul et / Reddet" seçimi zorunlu hâle gelir.
 */
export function CookieNotice() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) {
        const t = window.setTimeout(() => setShow(true), 1200)
        return () => window.clearTimeout(t)
      }
    } catch {
      /* depolama kapalıysa gösterme */
    }
  }, [])

  if (!show) return null
  const accept = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {}
    setShow(false)
    window.dispatchEvent(new Event('pk-cookie-ok'))
  }
  return (
    <div
      role="region"
      aria-label="Çerez bildirimi"
      className="fixed inset-x-3 z-[45] mx-auto max-w-xl animate-fade-up rounded-3xl border border-line bg-white p-4 shadow-lift md:inset-x-auto md:left-6"
      style={{ bottom: 'calc(var(--bottom-nav-h) + 12px)' }}
    >
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 h-6 w-6 shrink-0 text-ink-soft" aria-hidden="true" />
        <p className="text-[14px] leading-snug text-ink-soft">
          Sepetinizi hatırlamak için yalnızca <strong className="text-ink">zorunlu</strong> çerezleri kullanıyoruz. Reklam veya takip çerezi yok.{' '}
          <Link href="/yasal/cerez-politikasi" className="font-semibold text-ink underline underline-offset-2">
            Detaylar
          </Link>
        </p>
      </div>
      <button type="button" onClick={accept} className="btn-primary mt-3 min-h-[44px] w-full">
        Anladım
      </button>
    </div>
  )
}
