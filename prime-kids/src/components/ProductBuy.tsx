"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { fmt, type Product } from "@/data/products";
import { sizeGuide, site } from "@/data/site";

export default function ProductBuy({ product }: { product: Product }) {
  const { add } = useCart();
  const [colorId, setColorId] = useState(product.colors[0].id);
  const [size, setSize] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [added, setAdded] = useState(false);
  const sizesRef = useRef<HTMLDivElement>(null);

  const color = product.colors.find((c) => c.id === colorId)!;
  const guide = sizeGuide.filter((g) => product.sizes.includes(g.age));

  useEffect(() => {
    try {
      const r = new URLSearchParams(window.location.search).get("renk");
      if (r && product.colors.some((c) => c.id === r)) setColorId(r);
    } catch {}
  }, [product.colors]);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 4000);
    return () => clearTimeout(t);
  }, [added]);

  function addToCart() {
    if (!size) {
      setError(true);
      sizesRef.current?.classList.remove("shake");
      void sizesRef.current?.offsetWidth;
      sizesRef.current?.classList.add("shake");
      sizesRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    add({ slug: product.slug, colorId, size });
    setAdded(true);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
      {/* Galeri */}
      <div className="grid gap-3 sm:grid-cols-[84px_1fr] lg:sticky lg:top-28 lg:self-start">
        <div className="order-2 flex gap-2.5 sm:order-1 sm:flex-col">
          {product.colors.map((c) => (
            <button
              key={c.id}
              onClick={() => setColorId(c.id)}
              aria-label={`${c.name} görseli`}
              aria-pressed={c.id === colorId}
              className={`relative aspect-[3/4] w-16 overflow-hidden rounded-xl border-2 transition sm:w-full ${
                c.id === colorId ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={c.image} alt="" fill sizes="84px" className="object-cover object-top" />
            </button>
          ))}
        </div>
        <div className="relative order-1 aspect-[3/4] overflow-hidden rounded-3xl bg-sand sm:order-2">
          <Image
            key={color.image}
            src={color.image}
            alt={`${product.name} — ${color.name}`}
            fill
            priority
            sizes="(min-width:1024px) 45vw, 100vw"
            className="object-cover object-top"
          />
          {product.badge && (
            <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-wide">
              {product.badge}
            </span>
          )}
        </div>
      </div>

      {/* Bilgi */}
      <div>
        <h1 className="h-display text-3xl sm:text-4xl">{product.name}</h1>
        <p className="mt-2 text-[15px] text-mute">{product.short}</p>
        <p className="mt-5 flex items-baseline gap-3">
          <span className="text-3xl font-extrabold">{fmt(product.price)}</span>
          {product.oldPrice && (
            <span className="text-lg text-mute line-through">{fmt(product.oldPrice)}</span>
          )}
        </p>

        <p className="mt-7 text-[14px]">
          <span className="font-semibold">Renk:</span> <span className="text-mute">{color.name}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-3" role="radiogroup" aria-label="Renk">
          {product.colors.map((c) => (
            <button
              key={c.id}
              role="radio"
              aria-checked={c.id === colorId}
              aria-label={c.name}
              onClick={() => setColorId(c.id)}
              className={`h-10 w-10 rounded-full border-2 p-0.5 transition ${
                c.id === colorId ? "border-ink" : "border-transparent hover:border-ink/30"
              }`}
            >
              <span className="block h-full w-full rounded-full border border-black/10" style={{ background: c.hex }} />
            </button>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-between text-[14px]">
          <p className="font-semibold">
            Beden <span className={`ml-1 font-normal ${error ? "text-red-600" : "text-mute"}`}>
              {error && !size ? "Lütfen bir beden seçin" : size ?? ""}
            </span>
          </p>
          <a href="#beden-rehberi" className="font-semibold text-cobalt underline-offset-4 hover:underline">
            Beden rehberi
          </a>
        </div>
        <div ref={sizesRef} className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Beden">
          {product.sizes.map((s) => (
            <button
              key={s}
              role="radio"
              aria-checked={size === s}
              onClick={() => {
                setSize(s);
                setError(false);
              }}
              className={`min-w-[74px] rounded-xl border px-3 py-2.5 text-[14px] font-semibold transition ${
                size === s
                  ? "border-ink bg-ink text-cream"
                  : error
                    ? "border-red-300 bg-white hover:border-ink"
                    : "border-line bg-white hover:border-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <button onClick={addToCart} className="btn-cobalt mt-8 w-full py-4 text-base">
          Sepete ekle
        </button>
        <div aria-live="polite" className="mt-3 min-h-[24px] text-[14px]">
          {added && (
            <p className="font-semibold text-green-700">
              Sepete eklendi.{" "}
              <Link href="/sepet" className="underline underline-offset-4">
                Sepete git →
              </Link>
            </p>
          )}
        </div>

        <ul className="mt-4 space-y-2 rounded-2xl bg-sand/70 p-5 text-[14px]">
          <li>✓ {fmt(site.freeShippingThreshold)} ve üzeri siparişlerde ücretsiz kargo</li>
          <li>✓ {site.returnDays} gün içinde iade hakkı</li>
          <li>✓ Sipariş ve beden desteği için WhatsApp hattı</li>
        </ul>

        <div className="mt-8 divide-y divide-line border-y border-line">
          <Acc title="Takım içeriği" open>
            <ul className="list-disc space-y-1 pl-5">{product.includes.map((x) => <li key={x}>{x}</li>)}</ul>
          </Acc>
          <Acc title="Ürün özellikleri">
            <p className="mb-3">{product.description}</p>
            <ul className="list-disc space-y-1 pl-5">{product.features.map((x) => <li key={x}>{x}</li>)}</ul>
          </Acc>
          <Acc title="Bakım önerileri">
            <ul className="list-disc space-y-1 pl-5">{product.care.map((x) => <li key={x}>{x}</li>)}</ul>
          </Acc>
          <Acc title="Teslimat ve iade">
            <p>
              Siparişler hazırlanıp kargoya verilir. Teslim aldıktan sonra {site.returnDays} gün içinde,
              kullanılmamış ve etiketi üzerinde olan ürünleri iade edebilirsiniz.{" "}
              <Link href="/teslimat-iade" className="font-semibold text-cobalt underline underline-offset-4">
                Detaylar
              </Link>
            </p>
          </Acc>
        </div>

        <div id="beden-rehberi" className="mt-10 scroll-mt-28">
          <h2 className="text-lg font-bold">Beden rehberi</h2>
          <p className="mt-1 text-[13.5px] text-mute">
            Ölçüler yaklaşıktır. İki beden arasında kalırsanız büyük bedeni öneririz.
          </p>
          <table className="mt-4 w-full text-left text-[14px]">
            <thead>
              <tr className="border-b border-line text-mute">
                <th className="py-2 font-semibold">Yaş</th>
                <th className="py-2 font-semibold">Boy</th>
              </tr>
            </thead>
            <tbody>
              {guide.map((g) => (
                <tr key={g.age} className="border-b border-line/60">
                  <td className="py-2">{g.age}</td>
                  <td className="py-2">{g.height}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobil sabit çubuk */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="shrink-0">
          <p className="text-[12px] text-mute">{color.name}</p>
          <p className="text-lg font-extrabold leading-none">{fmt(product.price)}</p>
        </div>
        <button onClick={addToCart} className="btn-cobalt flex-1 py-3.5">
          {size ? "Sepete ekle" : "Beden seç"}
        </button>
      </div>
    </div>
  );
}

function Acc({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group py-4">
      <summary className="flex cursor-pointer items-center justify-between text-[15px] font-semibold">
        {title}
        <span className="text-xl leading-none transition group-open:rotate-45" aria-hidden>+</span>
      </summary>
      <div className="mt-3 text-[14.5px] leading-relaxed text-mute">{children}</div>
    </details>
  );
}
