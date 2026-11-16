import Link from "next/link";
import { Wordmark } from "./Header";
import { site } from "@/data/site";

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink text-cream">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Wordmark white height={64} />
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-cream/70">
            {site.tagline}. Çocuğunuz için rahat, modern ve iddialı takımlar.
          </p>
        </div>

        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-cream/50">Alışveriş</h3>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            <li><Link className="hover:text-white" href="/urunler?kategori=kiz">Kız Çocuk</Link></li>
            <li><Link className="hover:text-white" href="/urunler?kategori=erkek">Erkek Çocuk</Link></li>
            <li><Link className="hover:text-white" href="/urunler?kategori=mini">Mini</Link></li>
            <li><Link className="hover:text-white" href="/urunler">Tüm Ürünler</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-cream/50">Yardım</h3>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            <li><Link className="hover:text-white" href="/teslimat-iade">Teslimat ve İade</Link></li>
            <li><Link className="hover:text-white" href="/teslimat-iade#beden">Beden Rehberi</Link></li>
            <li><Link className="hover:text-white" href="/sepet">Sepetim</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-cream/50">İletişim</h3>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            <li>
              <a className="hover:text-white" href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer">
                WhatsApp ile yazın
              </a>
            </li>
            <li>
              <a className="hover:text-white" href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <a className="hover:text-white" href={`mailto:${site.email}`}>{site.email}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col justify-between gap-2 py-6 text-[13px] text-cream/50 sm:flex-row">
          <span>© {new Date().getFullYear()} {site.name}. Tüm hakları saklıdır.</span>
          <span>Fiyatlara KDV dahildir.</span>
        </div>
      </div>
    </footer>
  );
}
