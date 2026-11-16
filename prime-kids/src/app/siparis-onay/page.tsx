import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import CheckoutSteps from "@/components/CheckoutSteps";
import ClearCart from "@/components/ClearCart";
import Icon from "@/components/Icon";
import { site } from "@/data/site";
import { openOrder } from "@/lib/orders";
import { priceCart } from "@/lib/pricing";
import { fmt, waLink } from "@/lib/site-helpers";

export const metadata: Metadata = { title: "Sipariş onayı", robots: { index: false } };

export default async function OrderConfirmationPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const order = openOrder(t);

  // İmzalı ve "ödendi" durumundaki belirteç olmadan onay gösterilmez.
  if (!order || order.status !== "paid")
    return (
      <div className="container-x py-20 text-center sm:py-28">
        <h1 className="h-display text-[28px] sm:text-4xl">Sipariş bilgisi bulunamadı</h1>
        <p className="mx-auto mt-3 max-w-md text-mute">
          Bu sayfa yalnızca tamamlanan bir ödemenin ardından açılır. Siparişinizle ilgili sorunuz varsa bize yazabilirsiniz.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/urunler" className="btn-primary">Ürünlere Git</Link>
          <Link href="/iletisim" className="btn-outline">İletişim</Link>
        </div>
      </div>
    );

  const { items } = priceCart(order.lines);
  const date = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(order.at));

  return (
    <div className="container-x max-w-3xl pt-8 sm:pt-12">
      <ClearCart />
      <CheckoutSteps current={4} />

      {order.test ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-pine/40 bg-pine-soft p-6 sm:p-8">
          <p className="eyebrow text-pine-dark">Deneme modu</p>
          <h1 className="h-display mt-2 text-[28px] sm:text-4xl">Deneme siparişi tamamlandı</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-ink/80">
            Sipariş akışını sonuna kadar denediniz. <strong>Ödeme alınmadı, gerçek bir sipariş oluşmadı ve ürün gönderilmeyecek.</strong>{" "}
            Girdiğiniz adres ve iletişim bilgileri kaydedilmedi. Gerçek sipariş için bize{" "}
            <a href={waLink("Merhaba, sipariş vermek istiyorum.")} target="_blank" rel="noopener noreferrer" className="link">WhatsApp’tan yazabilirsiniz</a>.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-pine text-white"><Icon name="check" size={26} /></span>
          <h1 className="h-display mt-4 text-[28px] sm:text-4xl">Siparişiniz alındı, teşekkür ederiz</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-mute">
            Ödemeniz onaylandı. Sipariş özetiniz {order.email} adresine gönderilecek; siparişiniz {site.shipping.dispatchDays} içinde{" "}
            {site.shipping.carrier} ile kargoya verildiğinde takip numaranızı ayrıca ileteceğiz.
          </p>
        </div>
      )}

      <section className="card mt-6 p-6" aria-label="Sipariş özeti">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[14.5px] sm:grid-cols-4">
          <div><dt className="text-[12.5px] text-mute">{order.test ? "Deneme sipariş no" : "Sipariş no"}</dt><dd className="mt-0.5 font-semibold">{order.id}</dd></div>
          <div><dt className="text-[12.5px] text-mute">Tarih</dt><dd className="mt-0.5 font-semibold">{date}</dd></div>
          <div><dt className="text-[12.5px] text-mute">Teslimat ili</dt><dd className="mt-0.5 font-semibold">{order.city}</dd></div>
          <div><dt className="text-[12.5px] text-mute">Toplam</dt><dd className="mt-0.5 font-semibold tabular-nums">{fmt(order.total)}</dd></div>
        </dl>
        <ul className="mt-5 divide-y divide-line border-y border-line">
          {items.map((i) => (
            <li key={`${i.slug}-${i.colorId}-${i.size}`} className="flex gap-3.5 py-3.5">
              <div className="relative h-[84px] w-[56px] shrink-0 overflow-hidden rounded-lg bg-sand">
                <Image src={i.image} alt="" fill sizes="56px" className="object-cover object-top" />
              </div>
              <div className="min-w-0 flex-1 text-[14.5px]">
                <p className="font-semibold leading-snug">{i.name}</p>
                <p className="mt-0.5 text-[13.5px] text-mute">{i.colorName} · {i.size} · {i.qty} adet</p>
              </div>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 text-[14.5px]">
          <div className="flex justify-between"><dt className="text-mute">Ara toplam</dt><dd className="tabular-nums">{fmt(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-mute">Kargo</dt><dd className="tabular-nums">{order.shipping === 0 ? "Ücretsiz" : fmt(order.shipping)}</dd></div>
          {order.giftWrap && <div className="flex justify-between"><dt className="text-mute">Hediye paketi</dt><dd>Ücretsiz</dd></div>}
          <div className="flex justify-between border-t border-line pt-3 font-semibold"><dt>Toplam (KDV dahil)</dt><dd className="tabular-nums">{fmt(order.total)}</dd></div>
        </dl>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/urunler" className="btn-primary">Alışverişe devam et</Link>
        <Link href="/yasal/iade-degisim" className="btn-outline">İade ve değişim koşulları</Link>
      </div>
    </div>
  );
}
