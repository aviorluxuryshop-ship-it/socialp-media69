import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-void px-6 text-center">
      <p className="font-sans text-xs uppercase tracking-wide4 text-haze">404</p>
      <h1 className="font-display text-4xl font-bold tracking-tight text-mist">Bu sayfa bulunamadı.</h1>
      <Link
        href="/"
        className="rounded-full bg-mist px-6 py-2.5 font-sans text-xs uppercase tracking-wide3 text-void"
      >
        Ana Sayfaya Dön
      </Link>
    </main>
  )
}
