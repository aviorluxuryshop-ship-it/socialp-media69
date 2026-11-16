import Link from "next/link";
import { mainNav } from "@/data/site";

export default function NotFound() {
  return (
    <div className="container-x py-20 text-center sm:py-28">
      <p className="eyebrow">404</p>
      <h1 className="h-display mt-3 text-[32px] sm:text-5xl">Bu sayfayı bulamadık</h1>
      <p className="mx-auto mt-4 max-w-md text-mute">Aradığınız sayfa taşınmış ya da kaldırılmış olabilir. Aşağıdaki bağlantılardan devam edebilirsiniz.</p>
      <Link href="/urunler" className="btn-primary mt-8">Ürünlere Git</Link>
      <ul className="mt-6 flex flex-wrap justify-center gap-x-6">
        {mainNav.filter((n) => n.href !== "/urunler").map((n) => (
          <li key={n.href}><Link href={n.href} className="link inline-flex min-h-[44px] items-center text-[14.5px]">{n.label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
