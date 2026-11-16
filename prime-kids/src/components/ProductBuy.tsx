"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { LOW_STOCK, stockOf, type Product } from "@/data/products";
import { site, sizeGuide } from "@/data/site";
import { useCart } from "@/lib/cart";
import { fmt, waLink } from "@/lib/site-helpers";

export default function ProductBuy({ product }: { product: Product }) {
  const { add } = useCart();
  const [colorId, setColorId] = useState(product.colors[0].id);
  const [size, setSize] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const sizesRef = useRef<HTMLFieldSetElement>(null);
  const guideRef = useRef<HTMLDetailsElement>(null);

  const color = product.colors.find((c) => c.id === colorId)!;
  const guide = sizeGuide.filter((g) => product.sizes.includes(g.age));
  const stock = size ? stockOf(product, colorId, size) : null;
  const { shipping } = site;

  // Galeri ve sepetten gelen ?renk= bağlantıları ilgili rengi açar.
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("renk");
    if (r && product.colors.some((c) => c.id === r)) setColorId(r);
  }, [product.colors]);

  function pickColor(id: string) {
    setColorId(id);
    if (size && stockOf(product, id, size) === 0) setSize(null);
  }

  function addToCart() {
    if (!size) {
      setError(true);
      const el = sizesRef.current;
      if (el) {
        el.classList.remove("nudge");
        void el.offsetWidth;
        el.classList.add("nudge");
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        el.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus({ preventScroll: true });
      }
      return;
    }
    add({ slug: product.slug, colorId, size });
  }

  function openGuide(e: React.MouseEvent) {
    e.preventDefault();
    const d = guideRef.current;
    if (!d) return;
    d.open = true;
    d.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
      {/* Fotoğraf */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="grid gap-3 sm:grid-cols-[76px_1fr]">
          <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-sand sm:order-2">
            <Image
              key={color.image}
              src={color.image}
              alt={color.alt}
              fill
              priority
              sizes="(min-width:1024px) 44vw, (min-width:640px) 80vw, 100vw"
              className="fade-in object-cover object-top"
            />
            {product.badge && (
              <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.08em]">
                {product.badge}
              </span>
            )}
          </div>
          {product.colors.length > 1 && (
            <ul className="hide-scrollbar flex gap-2.5 overflow-x-auto sm:order-1 sm:flex-col sm:overflow-visible" aria-label="Renk fotoğrafları">
              {product.colors.map((c) => (
                <li key={c.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => pickColor(c.id)}
                    aria-label={`${c.name} fotoğrafını göster`}
                    aria-pressed={c.id === colorId}
                    className={`relative block aspect-[2/3] w-[60px] overflow-hidden rounded-lg border-2 transition sm:w-full ${
                      c.id === colorId ? "border-ink" : "border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <Image src={c.image} alt="" fill sizes="76px" className="object-cover object-top" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Bilgi ve satın alma */}
      <div>
        <h1 className="h-display text-[28px] sm:text-4xl">{product.name}</h1>
        <p className="mt-2 text-[15px] text-mute">{product.short}</p>
        <p className="mt-4 flex items-baseline gap-2.5">
          <span className="text-[26px] font-bold tabular-nums">{fmt(product.price)}</span>
          <span className="text-[13px] text-mute">KDV dahil</span>
        </p>

        <fieldset className="mt-7">
          <legend className="text-[14px]">
            <span className="font-semibold">Renk:</span> <span className="text-mute">{color.name}</span>
          </legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <label key={c.id} className="relative cursor-pointer" title={c.name}>
                <input
                  type="radio"
                  name="renk"
                  value={c.id}
                  checked={c.id === colorId}
                  onChange={() => pickColor(c.id)}
                  className="peer sr-only"
                />
                <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-transparent transition peer-checked:border-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink hover:border-ink/30">
                  <span className="block h-8 w-8 rounded-full border border-black/15" style={{ background: c.hex }} />
                </span>
                <span className="sr-only">{c.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset ref={sizesRef} className="mt-6 scroll-mt-28" aria-describedby="beden-durum">
          <legend className="sr-only">Beden</legend>
          <div className="flex items-center justify-between text-[14px]">
            <span className="font-semibold" aria-hidden>Beden (yaş)</span>
            <a href="#beden-rehberi" onClick={openGuide} className="link inline-flex min-h-[44px] items-center gap-1.5 text-[13.5px]">
              <Icon name="ruler" size={17} /> Beden rehberi
            </a>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {product.sizes.map((s) => {
              const left = stockOf(product, colorId, s);
              const out = left === 0;
              const g = sizeGuide.find((x) => x.age === s);
              return (
                <label key={s} className={`relative ${out ? "cursor-not-allowed" : "cursor-pointer"}`}>
                  <input
                    type="radio"
                    name="beden"
                    value={s}
                    disabled={out}
                    checked={size === s}
                    onChange={() => {
                      setSize(s);
                      setError(false);
                    }}
                    className="peer sr-only"
                  />
                  <span
                    className={`flex min-h-[54px] flex-col items-center justify-center rounded-xl border bg-white px-1 py-1.5 text-center transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-cream peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink peer-disabled:bg-transparent peer-disabled:text-mute/70 ${
                      error ? "border-alert/60" : "border-line"
                    } ${out ? "" : "hover:border-ink"}`}
                  >
                    <span className={`text-[14.5px] font-semibold ${out ? "line-through" : ""}`}>{s}</span>
                    <span className="text-[11.5px] opacity-70">{out ? "Tükendi" : g?.height}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <p id="beden-durum" aria-live="polite" className="mt-2.5 min-h-[22px] text-[13.5px]">
            {error && !size ? (
              <span className="font-semibold text-alert">Lütfen bir beden seçin.</span>
            ) : stock !== null && stock <= LOW_STOCK ? (
              <span className="font-semibold text-alert">Bu renk ve bedende son {stock} adet.</span>
            ) : stock !== null ? (
              <span className="text-pine">Stokta · {shipping.dispatchDays} içinde kargoda</span>
            ) : (
              <span className="text-mute">İki beden arasında kaldıysanız büyük bedeni öneririz.</span>
            )}
          </p>
        </fieldset>

        <button type="button" onClick={addToCart} className="btn-primary mt-4 w-full py-4 text-base">
          <Icon name="bag" size={20} /> Sepete ekle
        </button>

        {/* Satın almadan önce bilinmesi gerekenler */}
        <ul className="mt-5 divide-y divide-line rounded-2xl border border-line bg-white/60 text-[14px]">
          <li className="flex gap-3 p-4">
            <Icon name="truck" className="mt-0.5 shrink-0 text-pine" />
            <span>
              <strong className="font-semibold">{shipping.dispatchDays} içinde kargoda</strong>, teslimat {shipping.deliveryDays}.{" "}
              {product.price >= shipping.freeThreshold
                ? "Bu ürünle kargonuz ücretsiz."
                : `Kargo ${fmt(shipping.fee)}; ${fmt(shipping.freeThreshold)} ve üzeri ücretsiz.`}
            </span>
          </li>
          <li className="flex gap-3 p-4">
            <Icon name="return" className="mt-0.5 shrink-0 text-pine" />
            <span>
              <strong className="font-semibold">{shipping.returnDays} gün içinde iade ve beden değişimi.</strong> Kullanılmamış, etiketi üzerinde ürünlerde geçerlidir.{" "}
              <Link href="/yasal/iade-degisim" className="link">Koşullar</Link>
            </span>
          </li>
          <li className="flex gap-3 p-4">
            <Icon name="lock" className="mt-0.5 shrink-0 text-pine" />
            <span>
              <strong className="font-semibold">Güvenli ödeme.</strong> Kart bilgileriniz ödeme kuruluşunun sayfasında işlenir, bizde saklanmaz.
            </span>
          </li>
        </ul>

        <p className="mt-4 text-[14px] text-mute">
          Bedenden emin değil misiniz?{" "}
          <a
            href={waLink(`Merhaba, "${product.name}" için beden konusunda yardım almak istiyorum.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            WhatsApp’tan sorun
          </a>
        </p>

        <div className="mt-8 divide-y divide-line border-y border-line">
          <Acc title="Takım içeriği ve özellikler" open>
            <p>{product.description}</p>
            <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink">Takımda neler var?</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">{product.includes.map((x) => <li key={x}>{x}</li>)}</ul>
            <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink">Özellikler</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">{product.features.map((x) => <li key={x}>{x}</li>)}</ul>
          </Acc>
          <Acc title="Kumaş ve bakım">
            <p><strong className="font-semibold text-ink">Kumaş:</strong> {product.fabric.composition}</p>
            <p className="mt-1.5">{product.fabric.note}</p>
            <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink">Bakım</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">{product.care.map((x) => <li key={x}>{x}</li>)}</ul>
          </Acc>
          <Acc title="Beden rehberi" id="beden-rehberi" detailsRef={guideRef}>
            <p>Ölçüler yaklaşıktır; çocuğunuzun boyunu esas alın. İki beden arasında kaldıysanız büyük bedeni öneririz.</p>
            <table className="mt-3 w-full text-left text-[14px]">
              <caption className="sr-only">{product.name} beden tablosu</caption>
              <thead>
                <tr className="border-b border-line text-ink">
                  <th scope="col" className="py-2 font-semibold">Beden</th>
                  <th scope="col" className="py-2 font-semibold">Boy</th>
                  <th scope="col" className="py-2 font-semibold">Kilo</th>
                </tr>
              </thead>
              <tbody>
                {guide.map((g) => (
                  <tr key={g.age} className="border-b border-line/60 last:border-0">
                    <th scope="row" className="py-2 font-medium text-ink">{g.age}</th>
                    <td className="py-2">{g.height}</td>
                    <td className="py-2">{g.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Acc>
          <Acc title="Teslimat ve iade">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Siparişler {shipping.dispatchDays} içinde {shipping.carrier} ile gönderilir; takip numarası e-posta ile iletilir.</li>
              <li>Kargo ücreti {fmt(shipping.fee)}; {fmt(shipping.freeThreshold)} ve üzeri siparişlerde ücretsizdir.</li>
              <li>Teslim aldıktan sonra {shipping.returnDays} gün içinde cayma hakkınızı kullanabilirsiniz.</li>
            </ul>
            <p className="mt-3">
              <Link href="/yasal/teslimat-kargo" className="link">Teslimat ve kargo</Link>
              {" · "}
              <Link href="/yasal/iade-degisim" className="link">İade ve değişim</Link>
            </p>
          </Acc>
        </div>

        <p className="mt-5 flex items-start gap-2.5 text-[13.5px] text-mute">
          <Icon name="store" size={18} className="mt-0.5 shrink-0" />
          <span>
            Alışverişinizi Trendyol üzerinden yapmayı tercih ederseniz{" "}
            <a href={site.social.trendyol.url} target="_blank" rel="noopener noreferrer" className="link">Trendyol mağazamızda</a>{" "}
            da bulabilirsiniz.
          </span>
        </p>
      </div>

      {/* Mobil: sabit satın alma çubuğu */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0 shrink-0">
            <p className="truncate text-[12px] text-mute">{color.name}{size ? ` · ${size}` : ""}</p>
            <p className="text-[18px] font-bold leading-tight tabular-nums">{fmt(product.price)}</p>
          </div>
          <button type="button" onClick={addToCart} className="btn-primary flex-1">
            {size ? "Sepete ekle" : "Beden seçin"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Acc({
  title, children, open, id, detailsRef,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
  id?: string;
  detailsRef?: React.Ref<HTMLDetailsElement>;
}) {
  return (
    <details ref={detailsRef} id={id} open={open} className="group scroll-mt-24">
      <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <Icon name="plus" size={18} className="shrink-0 transition-transform duration-200 group-open:rotate-45" />
      </summary>
      <div className="pb-5 text-[14.5px] leading-relaxed text-mute">{children}</div>
    </details>
  );
}
