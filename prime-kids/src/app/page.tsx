import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { categories, fmt, getProduct, products } from "@/data/products";
import { site } from "@/data/site";

const trust = [
  { t: "Takım halinde", d: "Komple kombin, tek sipariş" },
  { t: "Kolay beden seçimi", d: "Yaş ve boy rehberi her üründe" },
  { t: `${site.returnDays} gün iade`, d: "Beğenmezseniz iade edin" },
  { t: "WhatsApp destek", d: "Sorularınıza hızlı yanıt" },
];

const catImage: Record<string, string> = {
  kiz: "/products/perfect-pembe.webp",
  erkek: "/products/legend-mavi.webp",
  mini: "/products/cow-kahve.webp",
};

export default function Home() {
  const featured = products.filter((p) => p.featured);
  const legend = getProduct("legend-gomlek-ceket-takimi")!;

  return (
    <>
      {/* HERO */}
      <section className="overflow-hidden">
        <div className="container-x grid items-center gap-10 py-10 md:grid-cols-[1.05fr_1fr] md:py-16">
          <div className="order-2 md:order-1">
            <p className="eyebrow">Yeni sezon takımlar</p>
            <h1 className="h-display mt-4 text-[44px] sm:text-6xl lg:text-7xl">
              Küçük boyda <br className="hidden sm:block" />
              <span className="text-cobalt">büyük stil.</span>
            </h1>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-mute">
              Kız ve erkek çocuklar için rahat, iddialı takımlar. Üstü altı birlikte seçilmiş, giymeye hazır kombinler.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/urunler" className="btn-primary">Koleksiyonu keşfet</Link>
              <Link href="/urunler?kategori=kiz" className="btn-outline">Kız</Link>
              <Link href="/urunler?kategori=erkek" className="btn-outline">Erkek</Link>
            </div>
          </div>

          <div className="order-1 grid grid-cols-5 gap-3 md:order-2">
            <div className="relative col-span-3 aspect-[2/3] overflow-hidden rounded-[28px] bg-sand">
              <Image
                src="/products/legend-siyah.webp"
                alt="Siyah Legend gömlek ceket takımı giyen erkek çocuk"
                fill
                priority
                sizes="(min-width:768px) 28vw, 56vw"
                className="object-cover"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-3">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-sand">
                <Image
                  src="/products/felix-pembe.webp"
                  alt="Pembe Felix Star eşofman takımı giyen kız çocuk"
                  fill
                  priority
                  sizes="(min-width:768px) 20vw, 40vw"
                  className="object-cover object-top"
                />
              </div>
              <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-sand">
                <Image
                  src="/products/vintage-yesil.webp"
                  alt="Zümrüt yeşili Vintage Vibes takımı giyen kız çocuk"
                  fill
                  sizes="(min-width:768px) 20vw, 40vw"
                  className="object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GÜVEN ŞERİDİ */}
      <section className="border-y border-line bg-white/50">
        <div className="container-x grid grid-cols-2 gap-x-6 gap-y-5 py-6 md:grid-cols-4">
          {trust.map((x) => (
            <div key={x.t}>
              <p className="text-[14.5px] font-bold">{x.t}</p>
              <p className="mt-0.5 text-[13.5px] text-mute">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KATEGORİLER */}
      <section className="container-x pt-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="h-display text-3xl sm:text-4xl">Kime alıyoruz?</h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/urunler?kategori=${c.id}`}
              className="group relative isolate aspect-[4/5] overflow-hidden rounded-3xl bg-sand sm:aspect-[3/4]"
            >
              <Image
                src={catImage[c.id]}
                alt=""
                fill
                sizes="(min-width:640px) 33vw, 100vw"
                className="object-cover object-top transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <h3 className="font-display text-2xl font-extrabold">{c.label}</h3>
                <p className="mt-1 text-[14px] text-white/80">{c.blurb}</p>
                <span className="mt-3 inline-block text-[14px] font-semibold underline-offset-4 group-hover:underline">
                  Ürünlere git →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ÖNE ÇIKANLAR */}
      <section className="container-x pt-24">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Seçtiklerimiz</p>
            <h2 className="h-display mt-2 text-3xl sm:text-4xl">Öne çıkan takımlar</h2>
          </div>
          <Link href="/urunler" className="hidden text-[15px] font-semibold text-cobalt hover:underline sm:block">
            Hepsini gör →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* RENK ŞERİDİ */}
      <section className="mt-24 bg-sand py-16">
        <div className="container-x">
          <div className="max-w-xl">
            <p className="eyebrow">Aynı takım, 5 renk</p>
            <h2 className="h-display mt-2 text-3xl sm:text-4xl">{legend.name}</h2>
            <p className="mt-3 text-[16px] text-mute">
              Siyahtan zümrüt yeşiline; çocuğunuzun tarzına uyan rengi seçin. {fmt(legend.price)}
            </p>
          </div>
          <div className="mt-8 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] sm:grid sm:grid-cols-5 sm:overflow-visible">
            {legend.colors.map((c) => (
              <Link
                key={c.id}
                href={`/urun/${legend.slug}?renk=${c.id}`}
                className="group w-[58%] shrink-0 sm:w-auto"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-white">
                  <Image
                    src={c.image}
                    alt={`${legend.name} — ${c.name}`}
                    fill
                    sizes="(min-width:640px) 20vw, 58vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="mt-2.5 flex items-center gap-2 text-[14px] font-semibold">
                  <span className="h-3.5 w-3.5 rounded-full border border-black/15" style={{ background: c.hex }} />
                  {c.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* NEDEN */}
      <section className="container-x pt-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Üstü altı bir arada", d: "Takımlar birbirine uyumlu seçildi. Kombin düşünmenize gerek yok." },
            { n: "02", t: "Hareket eden çocuğa uygun", d: "Lastikli bel ve paça, rahat kesimler ve yumuşak dokulu kumaşlar." },
            { n: "03", t: "Doğru bedeni bulun", d: "Her üründe yaş ve boy tablosu var. Emin olamazsanız bize yazın." },
          ].map((x) => (
            <div key={x.n} className="rounded-3xl border border-line bg-white/60 p-7">
              <p className="font-display text-4xl font-extrabold text-cobalt/30">{x.n}</p>
              <h3 className="mt-4 text-xl font-bold">{x.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-mute">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHATSAPP */}
      <section className="container-x pt-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[32px] bg-cobalt p-8 text-white sm:flex-row sm:items-center sm:p-12">
          <div>
            <h2 className="h-display text-3xl">Beden mi seçemediniz?</h2>
            <p className="mt-2 max-w-md text-white/80">Çocuğunuzun boyunu yazın, size uygun bedeni birlikte bulalım.</p>
          </div>
          <a
            href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent("Merhaba, beden konusunda yardım almak istiyorum.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-white text-cobalt hover:bg-cream"
          >
            WhatsApp’tan yazın
          </a>
        </div>
      </section>
    </>
  );
}
