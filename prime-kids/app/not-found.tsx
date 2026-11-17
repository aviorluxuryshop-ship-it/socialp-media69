import Link from 'next/link'
import { Kid } from '@/components/Kids'

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <Kid kid="primo" className="h-40 w-auto" />
      <h1 className="mt-6 text-[30px]">Hay aksi, bu sayfa saklambaç oynuyor!</h1>
      <p className="mt-2 max-w-md text-ink-soft">Aradığınız sayfayı bulamadık. Belki adres değişmiştir; ürünlerimize buradan ulaşabilirsiniz.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/urunler" className="btn-primary">Ürünlere göz at</Link>
        <Link href="/" className="btn-secondary">Ana sayfa</Link>
      </div>
    </div>
  )
}
