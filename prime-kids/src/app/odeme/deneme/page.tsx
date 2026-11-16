import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CheckoutSteps from "@/components/CheckoutSteps";
import { site } from "@/data/site";
import { openOrder } from "@/lib/orders";
import { fmt } from "@/lib/site-helpers";

export const metadata: Metadata = { title: "Deneme ödeme sayfası", robots: { index: false } };

/**
 * Yalnızca "mock" sağlayıcının kullandığı deneme ödeme sayfası. Gerçek bir sağlayıcı bağlandığında
 * kullanıcı buraya değil, sağlayıcının kendi ödeme sayfasına gider ve bu sayfa 404 verir.
 */
export default async function MockPaymentPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  if (site.payment.provider !== "mock") notFound();
  const { t } = await searchParams;
  const order = openOrder(t);

  if (!order || order.status !== "pending")
    return (
      <div className="container-x py-20 text-center">
        <h1 className="h-display text-[28px] sm:text-4xl">Ödeme oturumu bulunamadı</h1>
        <p className="mx-auto mt-3 max-w-md text-mute">Bağlantının süresi dolmuş ya da bağlantı eksik olabilir. Sepetinizden yeniden deneyebilirsiniz.</p>
        <Link href="/sepet" className="btn-primary mt-8">Sepete dön</Link>
      </div>
    );

  return (
    <div className="container-x max-w-xl pt-8 sm:pt-12">
      <CheckoutSteps current={3} />
      <div className="mt-6 rounded-2xl border-2 border-dashed border-pine/40 bg-pine-soft p-6 sm:p-8">
        <p className="eyebrow text-pine-dark">Deneme modu</p>
        <h1 className="h-display mt-2 text-[26px] sm:text-3xl">Bu bir deneme ödeme sayfasıdır</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/80">
          Gerçek ödeme altyapısı bağlandığında bu adımda ödeme kuruluşunun güvenli kart formu açılacak.
          Şu anda <strong>kart bilgisi istenmez, hiçbir tutar çekilmez ve gerçek bir sipariş oluşmaz.</strong>
        </p>
        <dl className="mt-5 space-y-2 border-y border-pine/20 py-4 text-[14.5px]">
          <div className="flex justify-between"><dt className="text-ink/70">Deneme sipariş no</dt><dd className="font-semibold">{order.id}</dd></div>
          <div className="flex justify-between"><dt className="text-ink/70">Tutar</dt><dd className="font-semibold tabular-nums">{fmt(order.total)}</dd></div>
        </dl>
        <form method="post" action="/api/payment/callback" className="mt-6 grid gap-3">
          <input type="hidden" name="token" value={t} />
          <button name="status" value="success" className="btn-primary w-full">Denemeyi onayla (başarılı ödeme)</button>
          <button name="status" value="fail" className="btn-outline w-full">Başarısız ödemeyi dene</button>
        </form>
        <p className="mt-4 text-center text-[13.5px]"><Link href="/odeme" className="link">Bilgilere geri dön</Link></p>
      </div>
    </div>
  );
}
