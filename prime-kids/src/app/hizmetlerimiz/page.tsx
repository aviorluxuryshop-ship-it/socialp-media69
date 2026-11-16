import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import { services } from "@/data/content";
import { sizeGuide } from "@/data/site";
import { waLink } from "@/lib/site-helpers";

export const metadata: Metadata = {
  title: "Hizmetlerimiz",
  description: "Beden danışmanlığı, ücretsiz hediye paketi, kolay iade ve değişim, hızlı kargo, WhatsApp desteği ve toplu sipariş: Prime Kids’in alışverişi kolaylaştıran hizmetleri.",
  alternates: { canonical: "/hizmetlerimiz" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Hizmetlerimiz"
        title="Alışverişin her adımında yanınızdayız"
        lead="Çocuğa kıyafet almak, özellikle internetten, bazen tahmin işidir. Aşağıdaki hizmetler o tahmini kolaylaştırmak için var."
      />
      <div className="container-x">
        <ul className="grid gap-4 md:grid-cols-2">
          {services.map((s) => (
            <li key={s.id} id={s.id} className="card flex scroll-mt-28 flex-col p-6 sm:p-8">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-pine-soft text-pine">
                <Icon name={s.icon} size={22} />
              </span>
              <h2 className="mt-5 font-display text-[21px] font-bold">{s.title}</h2>
              <p className="mt-2 text-[15.5px] font-medium leading-relaxed">{s.summary}</p>
              <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-mute">
                {s.body.map((b) => <p key={b}>{b}</p>)}
              </div>
              <p className="mt-auto pt-5">
                {s.cta.external ? (
                  <a href={s.cta.href} target="_blank" rel="noopener noreferrer" className="link inline-flex min-h-[44px] items-center gap-2">
                    {s.cta.label} <Icon name="arrow" size={16} />
                  </a>
                ) : (
                  <Link href={s.cta.href} className="link inline-flex min-h-[44px] items-center gap-2">
                    {s.cta.label} <Icon name="arrow" size={16} />
                  </Link>
                )}
              </p>
            </li>
          ))}
        </ul>

        <section id="beden-rehberi" className="mt-16 scroll-mt-28 sm:mt-24" aria-labelledby="beden-rehberi-baslik">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.4fr] lg:gap-14">
            <div>
              <p className="eyebrow">Beden rehberi</p>
              <h2 id="beden-rehberi-baslik" className="h-display mt-2 text-[26px] sm:text-4xl">Doğru bedeni bulmak</h2>
              <div className="mt-4 space-y-3 text-[15.5px] leading-relaxed text-mute">
                <p>Bedenlerimiz yaşa göre adlandırılır, ancak belirleyici olan çocuğunuzun boyudur. Yaşına göre uzun ya da kısa ise tabloda boyuna karşılık gelen bedeni seçin.</p>
                <p>İki beden arasında kaldıysanız büyük bedeni öneririz; lastikli bel ve paçalar sayesinde takımlar bir sezon daha rahatlıkla giyilir.</p>
              </div>
              <a href={waLink("Merhaba, beden seçimi için yardım almak istiyorum. Çocuğumun boyu ve kilosu:")} target="_blank" rel="noopener noreferrer" className="btn-outline mt-6">
                <Icon name="whatsapp" /> Emin değilseniz bize sorun
              </a>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full text-left text-[14.5px]">
                <caption className="sr-only">Prime Kids beden tablosu: yaşa göre boy ve kilo aralıkları</caption>
                <thead className="bg-sand/70 text-[13px]">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Beden</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Boy</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Kilo</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeGuide.map((g) => (
                    <tr key={g.age} className="border-t border-line">
                      <th scope="row" className="px-5 py-2.5 font-semibold">{g.age}</th>
                      <td className="px-5 py-2.5 text-mute">{g.height}</td>
                      <td className="px-5 py-2.5 text-mute">{g.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="mt-16 flex flex-col items-start justify-between gap-5 border-t border-line pt-8 sm:flex-row sm:items-center">
          <p className="text-[17px] font-semibold">Sorularınızın cevabını bulduysanız, sıra takımı seçmekte.</p>
          <Link href="/urunler" className="btn-primary">Ürünlere Git <Icon name="arrow" size={18} /></Link>
        </div>
      </div>
    </>
  );
}
