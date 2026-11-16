import type { Metadata } from "next";
import Link from "next/link";
import { fmt } from "@/data/products";
import { sizeGuide, site } from "@/data/site";

export const metadata: Metadata = {
  title: "Teslimat, İade ve Beden Rehberi",
  description: "Kargo, iade koşulları ve yaş-boy tablosu.",
};

export default function Info() {
  return (
    <div className="container-x max-w-3xl pb-8 pt-12">
      <p className="eyebrow">Yardım</p>
      <h1 className="h-display mt-2 text-4xl sm:text-5xl">Teslimat, iade ve beden</h1>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Teslimat</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-[16px] leading-relaxed text-mute">
          <li>Siparişler WhatsApp üzerinden onaylanır; stok ve ödeme bilgisi size iletilir.</li>
          <li>{fmt(site.freeShippingThreshold)} ve üzeri siparişlerde kargo ücretsizdir. Altındaki siparişlerde kargo ücreti {fmt(site.shippingFee)}.</li>
          <li>Onaylanan siparişler hazırlanıp kargoya verilir; kargo takip bilgisi paylaşılır.</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">İade ve değişim</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-[16px] leading-relaxed text-mute">
          <li>Ürünü teslim aldıktan sonra {site.returnDays} gün içinde cayma hakkınızı kullanabilirsiniz.</li>
          <li>İade edilecek ürün kullanılmamış, yıkanmamış ve etiketi üzerinde olmalıdır.</li>
          <li>Beden değişimi için bize WhatsApp’tan yazmanız yeterlidir.</li>
        </ul>
      </section>

      <section id="beden" className="mt-12 scroll-mt-28">
        <h2 className="text-2xl font-bold">Beden rehberi</h2>
        <p className="mt-2 text-[15px] text-mute">
          Ölçüler yaklaşıktır. İki beden arasında kalırsanız büyük bedeni öneririz. Her ürünün
          sunduğu bedenler farklı olabilir.
        </p>
        <table className="mt-5 w-full text-left text-[15px]">
          <thead>
            <tr className="border-b border-line text-mute">
              <th className="py-2.5 font-semibold">Yaş</th>
              <th className="py-2.5 font-semibold">Boy</th>
            </tr>
          </thead>
          <tbody>
            {sizeGuide.map((g) => (
              <tr key={g.age} className="border-b border-line/60">
                <td className="py-2.5">{g.age}</td>
                <td className="py-2.5">{g.height}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-14 rounded-3xl bg-sand p-7">
        <p className="text-lg font-bold">Sorunuz mu var?</p>
        <p className="mt-1 text-mute">Bize yazın, birlikte çözelim.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-cobalt">WhatsApp</a>
          <Link href="/urunler" className="btn-outline">Alışverişe dön</Link>
        </div>
      </div>
    </div>
  );
}
