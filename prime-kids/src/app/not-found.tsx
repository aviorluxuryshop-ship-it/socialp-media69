import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x py-28 text-center">
      <p className="eyebrow">404</p>
      <h1 className="h-display mt-3 text-5xl">Bu sayfa bulunamadı</h1>
      <p className="mt-4 text-mute">Aradığınız sayfa taşınmış ya da kaldırılmış olabilir.</p>
      <Link href="/urunler" className="btn-primary mt-8">Ürünlere dön</Link>
    </div>
  );
}
