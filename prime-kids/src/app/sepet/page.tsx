"use client";

import Link from "next/link";
import { CartLine, FreeShippingBar, TotalsRows } from "@/components/CartParts";
import CheckoutSteps from "@/components/CheckoutSteps";
import Icon from "@/components/Icon";
import { site } from "@/data/site";
import { useCart } from "@/lib/cart";
import { fmt } from "@/lib/site-helpers";

export default function CartPage() {
  const { totals, ready } = useCart();

  if (!ready) return <div className="container-x py-24 text-center text-mute" role="status">Sepetiniz yükleniyor…</div>;

  if (!totals.items.length)
    return (
      <div className="container-x py-20 text-center sm:py-28">
        <h1 className="h-display text-[32px] sm:text-5xl">Sepetiniz boş</h1>
        <p className="mx-auto mt-3 max-w-sm text-mute">Beğendiğiniz takımın rengini ve bedenini seçip sepete ekleyebilirsiniz.</p>
        <Link href="/urunler" className="btn-primary mt-8">Ürünlere Git <Icon name="arrow" size={18} /></Link>
      </div>
    );

  return (
    <div className="container-x pb-28 pt-8 sm:pt-12 lg:pb-0">
      <CheckoutSteps current={1} />
      <h1 className="h-display mt-6 text-[32px] sm:text-5xl">Sepetim</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
        <section aria-label="Sepetteki ürünler">
          <ul className="divide-y divide-line border-y border-line">
            {totals.items.map((i) => (
              <CartLine key={`${i.slug}-${i.colorId}-${i.size}`} item={i} />
            ))}
          </ul>
          <Link href="/urunler" className="link mt-5 inline-flex min-h-[44px] items-center text-[14.5px]">Alışverişe devam et</Link>
        </section>

        <aside aria-label="Sipariş özeti" className="lg:sticky lg:top-28 lg:self-start">
          <div className="card p-6">
            <h2 className="text-[17px] font-semibold">Sipariş özeti</h2>
            <div className="mt-4"><FreeShippingBar totals={totals} /></div>
            <div className="mt-5"><TotalsRows totals={totals} /></div>
            <Link href="/odeme" className="btn-primary mt-6 hidden w-full py-4 text-base lg:inline-flex">Ödemeye geç</Link>
            <ul className="mt-5 space-y-2.5 text-[13.5px] text-mute">
              <li className="flex gap-2.5"><Icon name="lock" size={17} className="mt-0.5 shrink-0 text-pine" /> Kart bilgileriniz ödeme kuruluşunun güvenli sayfasında işlenir.</li>
              <li className="flex gap-2.5"><Icon name="truck" size={17} className="mt-0.5 shrink-0 text-pine" /> {site.shipping.dispatchDays} içinde {site.shipping.carrier} ile kargoda.</li>
              <li className="flex gap-2.5"><Icon name="return" size={17} className="mt-0.5 shrink-0 text-pine" /> {site.shipping.returnDays} gün içinde iade ve beden değişimi.</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Mobil: sabit ödeme çubuğu */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="shrink-0">
            <p className="text-[12px] text-mute">Toplam</p>
            <p className="text-[18px] font-bold leading-tight tabular-nums">{fmt(totals.total)}</p>
          </div>
          <Link href="/odeme" className="btn-primary flex-1">Ödemeye geç</Link>
        </div>
      </div>
    </div>
  );
}
