'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/** Yerel <dialog> — odak hapsi, Esc ile kapanma ve arka plan kilidi tarayıcıdan gelir. */
export function Dialog({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      d.showModal()
      document.body.style.overflow = 'hidden'
    } else if (!open && d.open) {
      d.close()
    }
    if (!open) document.body.style.overflow = ''
  }, [open])
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className={`m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-[28px] bg-cream p-0 text-ink backdrop:bg-ink/50 open:animate-sheet-up md:m-auto md:max-h-[88vh] md:rounded-[28px] md:open:animate-fade-up ${
        wide ? 'md:max-w-3xl' : 'md:max-w-xl'
      }`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-cream/95 px-5 py-3 backdrop-blur">
        <h2 className="text-[18px]">{title}</h2>
        <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full hover:bg-ink/5" aria-label="Kapat">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="p-5 pb-[calc(20px+env(safe-area-inset-bottom))]">{children}</div>
    </dialog>
  )
}
