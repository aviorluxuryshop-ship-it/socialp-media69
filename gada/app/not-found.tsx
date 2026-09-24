import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="container flex min-h-[80svh] flex-col items-start justify-center pt-[var(--header-h)]">
      <p className="eyebrow text-ink-soft">404</p>
      <h1 className="display mt-5 text-[clamp(2.5rem,1.5rem+4vw,5rem)]">Bu sayfa bulunamadı.</h1>
      <Link href="/" className="mt-8 font-medium underline underline-offset-[6px]">
        Ana sayfaya dönün
      </Link>
    </section>
  )
}
