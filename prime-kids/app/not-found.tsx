import Link from 'next/link'
import { PeekKid } from '@/components/Peekers'

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <PeekKid variant="sunny" className="h-32 w-auto" />
      <h1 className="mt-4 text-[30px]">Hay aksi, bu sayfa saklambaç oynuyor!</h1>
      <p className="mt-2 max-w-md text-ink-soft">Aradığınız sayfayı bulamadık. Ürünlerimize buradan ulaşabilirsiniz.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/urunler" className="btn-primary">Ürünleri gör</Link>
        <Link href="/" className="btn-secondary">Ana sayfa</Link>
      </div>
    </div>
  )
}
