import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-paper py-20">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-signal-dim">404</p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Bu sayfa dokununca açılmadı</h1>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-carbon px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </section>
  )
}
