import { NextResponse, type NextRequest } from "next/server";
import { isTestPayment, site } from "@/data/site";
import { validateCustomer, type CheckoutRequest, type CheckoutResponse } from "@/lib/checkout";
import { newOrderId, sealOrder, summarize } from "@/lib/orders";
import { getPaymentProvider } from "@/lib/payment";
import type { Order } from "@/lib/payment/types";
import { parseLines, priceCart } from "@/lib/pricing";

const json = (body: CheckoutResponse, status = 200) => NextResponse.json(body, { status });

/**
 * Siparişi oluşturur ve ödeme adımını başlatır.
 * İstemciden yalnızca ürün/renk/beden/adet alınır; fiyat, kargo ve toplam burada
 * products.ts + site.ts üzerinden YENİDEN hesaplanır.
 */
export async function POST(req: NextRequest) {
  let body: CheckoutRequest;
  try {
    body = (await req.json()) as CheckoutRequest;
  } catch {
    return json({ ok: false, message: "İstek okunamadı. Sayfayı yenileyip tekrar deneyin." }, 400);
  }

  const lines = parseLines(body?.lines);
  const sent = Array.isArray(body?.lines) ? body.lines : [];
  const sentQty = sent.reduce((s: number, l) => s + (Number((l as { qty?: unknown })?.qty) || 0), 0);
  const cart = priceCart(lines);
  if (!cart.items.length) return json({ ok: false, message: "Sepetiniz boş görünüyor.", cartChanged: true }, 422);
  if (lines.length !== sent.length || cart.count !== sentQty) {
    return json(
      { ok: false, cartChanged: true, message: "Sepetinizdeki bazı ürünlerin stok durumu değişti. Lütfen sepetinizi kontrol edin." },
      409,
    );
  }

  const { values: customer, errors } = validateCustomer(body.customer);
  if (Object.keys(errors).length) {
    return json({ ok: false, message: "Lütfen işaretli alanları kontrol edin.", fieldErrors: errors }, 422);
  }
  if (body.consents?.preInfo !== true || body.consents?.distanceSales !== true) {
    return json({ ok: false, message: "Devam etmek için Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi onayları gereklidir." }, 422);
  }

  const order: Order = {
    id: newOrderId(),
    createdAt: new Date().toISOString(),
    items: cart.items,
    subtotal: cart.subtotal,
    shipping: cart.shipping,
    total: cart.total,
    currency: site.currency,
    customer,
  };

  // YAYIN NOTU: Gerçek sağlayıcıya geçerken siparişi burada kalıcı olarak kaydedin
  // (veritabanı / sipariş e-postası). Deneme modunda müşteri bilgileri hiçbir yere yazılmaz.

  try {
    const baseUrl = req.nextUrl.origin;
    const session = await getPaymentProvider().createPayment(order, {
      baseUrl,
      callbackUrl: `${baseUrl}/api/payment/callback`,
      orderToken: sealOrder(summarize(order, isTestPayment)),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0",
    });
    return json({ ok: true, orderId: order.id, session });
  } catch (e) {
    console.error("[checkout] ödeme başlatılamadı:", e);
    return json({ ok: false, message: "Ödeme adımı şu anda başlatılamıyor. Lütfen biraz sonra tekrar deneyin ya da bizimle iletişime geçin." }, 503);
  }
}
