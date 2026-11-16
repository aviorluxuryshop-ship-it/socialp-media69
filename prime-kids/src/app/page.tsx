import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import ProductCard from "@/components/ProductCard";
import SocialLinks from "@/components/SocialLinks";
import { buySteps, gallerySeries } from "@/data/content";
import { categories, getProduct, products } from "@/data/products";
import { site } from "@/data/site";
import { fmt, telLink, waLink } from "@/lib/site-helpers";

const { shipping } = site;

const trust = [
  { icon: "lock", title: "Güvenli ödeme", text: "Kart bilgileriniz bizde saklanmaz" },
  { icon: "truck", title: `${shipping.dispatchDays} içinde kargoda`, text: `${fmt(shipping.freeThreshold)} üzeri ücretsiz` },
  { icon: "return", title: `${shipping.returnDays} gün iade ve değişim`, text: "Beden olmazsa değiştirin" },
  { icon: "chat", title: "WhatsApp desteği", text: "Beden ve sipariş soruları için" },
] as const;

export default function Home() {
  const featured = products.filter((p) => p.featured);
  const legend = getProduct("legend-gomlek-ceket-takimi");
  // Galeri önizlemesi: her seriden ilk kare.
  const teaser = gallerySeries.slice(0, 4).flatMap((s) => {
    const p = getProduct(s.shots[0].product);
    const c = p?.colors.find((x) => x.id === s.shots[0].color);
    return c ? [{ id: s.id, title: s.title, image: c.image }] : [];
  });

  return (
    <>
      {/* HERO — ne satıyoruz + ürünlere en kısa yol */}
      <section className="container-x grid items-center gap-8 pb-4 pt-8 md:grid-cols-[1fr_1.05fr] md:gap-12 md:pb-10 md:pt-14">
        <div className="rise-in">
          <p className="eyebrow">Çocuk giyim · 2–14 yaş</p>
          <h1 className="h-display mt-3 text-[38px] sm:text-[52px] lg:text-[62px]">
            Giymesi rahat,<br />görmesi keyifli takımlar.
          </h1>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-mute sm:text-[17px]">
            Kız ve erkek çocuklar için üstü altı birlikte tasarlanmış kombinler. Rengi ve bedeni seçin, kapınıza gelsin.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/urunler" className="btn-primary px-9 py-4 text-base">
              Ürünlere Git <Icon name="arrow" size={18} />
            </Link>
            <Link href="/galeri" className="btn-outline">Galeriyi Gör</Link>
          </div>
        </div>

        <div className="grid grid-cols-[1.25fr_1fr] items-end gap-3 sm:gap-4">
          <Link href="/urun/vintage-vibes-yarim-fermuarli-takim?renk=yesil" className="group relative block aspect-[2/3] overflow-hidden rounded-2xl bg-sand">
            <Image
              src="/products/vintage-yesil.webp"
              alt="Zümrüt yeşili Vintage Vibes takımı giyen kız çocuk"
              fill
              priority
              sizes="(min-width:768px) 28vw, 54vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3.5 pt-10 text-[13px] font-medium text-white sm:p-4 sm:pt-12 sm:text-[14px]">
              Vintage Vibes · {fmt(getProduct("vintage-vibes-yarim-fermuarli-takim")?.price ?? 0)}
            </span>
          </Link>
          <Link href="/urun/legend-gomlek-ceket-takimi?renk=bej" className="group relative block aspect-[2/3] overflow-hidden rounded-2xl bg-sand">
            <Image
              src="/products/legend-bej.webp"
              alt="Bej Legend gömlek ceket takımı giyen erkek çocuk"
              fill
              priority
              sizes="(min-width:768px) 22vw, 42vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3.5 pt-10 text-[13px] font-medium text-white sm:p-4 sm:pt-12 sm:text-[14px]">
              Legend · {fmt(legend?.price ?? 0)}
            </span>
          </Link>
        </div>
      </section>

      {/* GÜVEN */}
      <section aria-label="Alışveriş güvenceleri" className="mt-8 border-y border-line bg-white/50">
        <ul className="container-x grid grid-cols-2 gap-x-5 gap-y-5 py-6 lg:grid-cols-4">
          {trust.map((x) => (
            <li key={x.title} className="flex gap-3">
              <Icon name={x.icon} size={22} className="mt-0.5 shrink-0 text-pine" />
              <div>
                <p className="text-[14px] font-semibold leading-snug">{x.title}</p>
                <p className="mt-0.5 text-[13px] text-mute">{x.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* KATEGORİLER */}
      <section className="container-x pt-16 sm:pt-20" aria-labelledby="kategoriler">
        <h2 id="kategoriler" className="h-display text-[26px] sm:text-4xl">Kime bakıyorsunuz?</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/urunler?kategori=${c.id}`} className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-line bg-white/70 p-3 sm:block sm:border-0 sm:bg-sand sm:p-0">
                <div className="relative aspect-[2/3] w-[92px] shrink-0 overflow-hidden rounded-xl bg-sand sm:aspect-[4/5] sm:w-auto sm:rounded-2xl">
                  <Image src={c.image} alt="" fill sizes="(min-width:640px) 33vw, 92px" className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 hidden bg-gradient-to-t from-black/60 via-transparent to-transparent sm:block" />
                </div>
                <div className="min-w-0 sm:absolute sm:inset-x-0 sm:bottom-0 sm:p-5 sm:text-white">
                  <h3 className="font-display text-[19px] font-bold sm:text-2xl">{c.label}</h3>
                  <p className="mt-1 text-[13.5px] text-mute sm:text-white/85">{c.blurb}</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-[14px] font-semibold">
                    Ürünleri gör <Icon name="arrow" size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ÖNE ÇIKANLAR */}
      <section className="container-x pt-16 sm:pt-24" aria-labelledby="one-cikanlar">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Bu sezon</p>
            <h2 id="one-cikanlar" className="h-display mt-2 text-[26px] sm:text-4xl">Öne çıkan takımlar</h2>
          </div>
          <Link href="/urunler" className="link hidden shrink-0 text-[15px] sm:inline">Tüm ürünler</Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-x-3.5 gap-y-9 sm:gap-x-5 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
        <div className="mt-9 text-center">
          <Link href="/urunler" className="btn-primary w-full sm:w-auto">
            Tüm ürünleri gör ({products.length}) <Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>

      {/* BİR TAKIM, BEŞ RENK */}
      {legend && (
        <section className="mt-16 bg-sand py-14 sm:mt-24 sm:py-16" aria-labelledby="legend-renkler">
          <div className="container-x">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-xl">
                <p className="eyebrow">Bir takım, {legend.colors.length} renk</p>
                <h2 id="legend-renkler" className="h-display mt-2 text-[26px] sm:text-4xl">{legend.name}</h2>
                <p className="mt-3 text-[15.5px] leading-relaxed text-mute">
                  {legend.short}. Kardeşler için farklı renk, aynı rahatlık. {fmt(legend.price)}
                </p>
              </div>
              <Link href={`/urun/${legend.slug}`} className="btn-outline">Takımı incele</Link>
            </div>
            <ul className="hide-scrollbar -mx-4 mt-7 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
              {legend.colors.map((c) => (
                <li key={c.id} className="w-[46%] shrink-0 snap-start sm:w-auto">
                  <Link href={`/urun/${legend.slug}?renk=${c.id}`} className="group block">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-white">
                      <Image src={c.image} alt={c.alt} fill sizes="(min-width:640px) 19vw, 46vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                    </div>
                    <p className="mt-2.5 flex items-center gap-2 text-[14px] font-medium">
                      <span className="h-3.5 w-3.5 rounded-full border border-black/15" style={{ background: c.hex }} />
                      {c.name}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* NASIL SATIN ALIRIM */}
      <section className="container-x pt-16 sm:pt-24" aria-labelledby="nasil">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.6fr] lg:gap-14">
          <div>
            <p className="eyebrow">Üç adımda</p>
            <h2 id="nasil" className="h-display mt-2 text-[26px] sm:text-4xl">Nasıl satın alırım?</h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-mute">
              Üyelik gerekmez. Sipariş vermeden önce{" "}
              <Link href="/yasal/teslimat-kargo" className="link">teslimat</Link>,{" "}
              <Link href="/yasal/iade-degisim" className="link">iade</Link> ve{" "}
              <Link href="/yasal/guvenli-alisveris" className="link">ödeme güvenliği</Link> koşullarını okuyabilirsiniz.
            </p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {buySteps.map((s, i) => (
              <li key={s.title} className="card p-5 sm:p-6">
                <span className="font-display text-[15px] font-bold text-pine">0{i + 1}</span>
                <h3 className="mt-2 text-[16.5px] font-semibold leading-snug">{s.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-mute">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* GALERİ + SOSYAL */}
      <section className="container-x pt-16 sm:pt-24" aria-labelledby="galeri-onizleme">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div>
            <p className="eyebrow">Galeri</p>
            <h2 id="galeri-onizleme" className="h-display mt-2 text-[26px] sm:text-4xl">Takımlar üzerinde nasıl duruyor?</h2>
          </div>
          <Link href="/galeri" className="link text-[15px]">Galeriyi gör</Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {teaser.map((t) => (
            <li key={t.id}>
              <Link href={`/galeri#${t.id}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-sand">
                  <Image src={t.image} alt="" fill sizes="(min-width:640px) 24vw, 46vw" className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                </div>
                <p className="mt-2 text-[14px] font-medium group-hover:underline group-hover:underline-offset-4">{t.title}</p>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-1 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14.5px] text-mute">Yeni gelenleri Instagram’da paylaşıyoruz; ürünlerimizi Trendyol’da da bulabilirsiniz.</p>
          <SocialLinks />
        </div>
      </section>

      {/* YARDIM / İLETİŞİM */}
      <section className="container-x pt-16 sm:pt-24" aria-labelledby="yardim">
        <div className="on-dark flex flex-col gap-7 rounded-3xl bg-ink p-7 text-cream sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 id="yardim" className="h-display text-[26px] sm:text-3xl">Beden mi seçemediniz?</h2>
            <p className="mt-2.5 text-[15.5px] leading-relaxed text-cream/75">
              Çocuğunuzun boyunu ve kilosunu yazın, uygun bedeni birlikte bulalım. {site.contact.hours[0].days}, {site.contact.hours[0].time} arasında yanıt veriyoruz.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <a href={waLink("Merhaba, beden seçimi için yardım almak istiyorum.")} target="_blank" rel="noopener noreferrer" className="btn-light">
              <Icon name="whatsapp" /> WhatsApp’tan yazın
            </a>
            <a href={telLink} className="btn border border-cream/30 text-cream hover:border-cream">
              <Icon name="phone" size={18} /> {site.contact.phoneDisplay}
            </a>
            <Link href="/iletisim" className="btn text-cream underline-offset-4 hover:underline">Tüm iletişim bilgileri</Link>
          </div>
        </div>
      </section>
    </>
  );
}
