"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { totals, useCart } from "@/lib/cart";
import { fmt, getProduct } from "@/data/products";
import { site } from "@/data/site";

export default function CartPage() {
  const { lines, ready, setQty, remove, clear } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [touched, setTouched] = useState(false);

  const t = totals(lines);
  const phoneDigits = form.phone.replace(/\D/g, "");
  const errors = {
    name: form.name.trim().length < 3 ? "Ad soyad girin" : "",
    phone: phoneDigits.length < 10 ? "Geçerli bir telefon girin" : "",
    address: form.address.trim().length < 15 ? "Teslimat adresini açık yazın (mahalle, sokak, no, ilçe/il)" : "",
  };
  const valid = !errors.name && !errors.phone && !errors.address;

  function order() {
    setTouched(true);
    if (!valid || !lines.length) return;
    const rows = lines.map((l, i) => {
      const p = getProduct(l.slug)!;
      const c = p.colors.find((x) => x.id === l.colorId)!;
      return `${i + 1}) ${p.name} — ${c.name}, ${l.size} × ${l.qty} = ${fmt(p.price * l.qty)}`;
    });
    const msg = [
      `Merhaba, ${site.name} üzerinden sipariş vermek istiyorum.`,
      "",
      ...rows,
      "",
      `Ara toplam: ${fmt(t.subtotal)}`,
      `Kargo: ${t.shipping === 0 ? "Ücretsiz" : fmt(t.shipping)}`,
      `Toplam: ${fmt(t.total)}`,
      "",
      `Ad Soyad: ${form.name.trim()}`,
      `Telefon: ${form.phone.trim()}`,
      `Adres: ${form.address.trim()}`,
      form.note.trim() ? `Not: ${form.note.trim()}` : "",
    ]
      .filter((x, i, a) => x !== "" || a[i - 1] !== "")
      .join("\n");
    window.open(`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }

  if (!ready) return <div className="container-x py-24 text-center text-mute">Yükleniyor…</div>;

  if (!lines.length)
    return (
      <div className="container-x py-24 text-center">
        <h1 className="h-display text-4xl">Sepetiniz boş</h1>
        <p className="mt-3 text-mute">Beğendiğiniz takımları sepete ekleyin.</p>
        <Link href="/urunler" className="btn-primary mt-8">Alışverişe başla</Link>
      </div>
    );

  const toFree = site.freeShippingThreshold - t.subtotal;

  return (
    <div className="container-x pb-8 pt-10">
      <div className="flex items-end justify-between">
        <h1 className="h-display text-4xl sm:text-5xl">Sepetim</h1>
        <button onClick={clear} className="text-[14px] text-mute underline underline-offset-4 hover:text-ink">
          Sepeti boşalt
        </button>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <ul className="divide-y divide-line border-y border-line">
          {lines.map((l) => {
            const p = getProduct(l.slug)!;
            const c = p.colors.find((x) => x.id === l.colorId)!;
            const key = `${l.slug}-${l.colorId}-${l.size}`;
            return (
              <li key={key} className="flex gap-4 py-5">
                <Link href={`/urun/${p.slug}?renk=${c.id}`} className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl bg-sand sm:w-28">
                  <Image src={c.image} alt={`${p.name} — ${c.name}`} fill sizes="112px" className="object-cover object-top" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <div>
                      <Link href={`/urun/${p.slug}`} className="font-semibold hover:text-cobalt">{p.name}</Link>
                      <p className="mt-1 text-[14px] text-mute">{c.name} · {l.size}</p>
                    </div>
                    <p className="font-bold">{fmt(p.price * l.qty)}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center rounded-full border border-line bg-white">
                      <button aria-label="Azalt" onClick={() => setQty(l, l.qty - 1)} className="h-9 w-9 text-lg">−</button>
                      <span className="w-6 text-center text-[14px] font-semibold" aria-live="polite">{l.qty}</span>
                      <button aria-label="Artır" onClick={() => setQty(l, l.qty + 1)} className="h-9 w-9 text-lg" disabled={l.qty >= 9}>+</button>
                    </div>
                    <button onClick={() => remove(l)} className="text-[13.5px] text-mute underline underline-offset-4 hover:text-ink">
                      Kaldır
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit rounded-3xl border border-line bg-white/70 p-6 lg:sticky lg:top-28">
          <h2 className="text-lg font-bold">Sipariş özeti</h2>

          {t.shipping > 0 && (
            <p className="mt-3 rounded-xl bg-cobalt-soft px-3 py-2 text-[13.5px] text-cobalt-dark">
              {fmt(toFree)} daha ekleyin, kargo ücretsiz olsun.
            </p>
          )}

          <dl className="mt-5 space-y-2 text-[15px]">
            <div className="flex justify-between"><dt className="text-mute">Ara toplam</dt><dd>{fmt(t.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-mute">Kargo</dt><dd>{t.shipping === 0 ? "Ücretsiz" : fmt(t.shipping)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-extrabold"><dt>Toplam</dt><dd>{fmt(t.total)}</dd></div>
          </dl>

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              order();
            }}
            className="mt-6 space-y-3"
          >
            <Field label="Ad soyad" error={touched ? errors.name : ""}>
              <input className="input" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Telefon" error={touched ? errors.phone : ""}>
              <input className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="05xx xxx xx xx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Teslimat adresi" error={touched ? errors.address : ""}>
              <textarea className="input min-h-[92px]" autoComplete="street-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <Field label="Sipariş notu (isteğe bağlı)">
              <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Field>
            <button type="submit" className="btn-cobalt w-full py-4 text-base">
              WhatsApp ile siparişi tamamla
            </button>
            <p className="text-[12.5px] leading-relaxed text-mute">
              Siparişiniz WhatsApp’ta hazır bir mesaj olarak açılır. Mesajı gönderdiğinizde ekibimiz
              stok ve ödeme bilgisi için size dönüş yapar.
            </p>
          </form>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13.5px] font-semibold">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[13px] text-red-600" role="alert">{error}</span>}
    </label>
  );
}
