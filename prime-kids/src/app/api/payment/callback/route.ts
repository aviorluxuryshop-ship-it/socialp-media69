import { NextResponse, type NextRequest } from "next/server";
import { openOrder, sealOrder } from "@/lib/orders";
import { getPaymentProvider } from "@/lib/payment";

/**
 * Ödeme sağlayıcısının sonucu bildirdiği adres (kullanıcı dönüşü ve/veya sunucu bildirimi).
 * Sonuç her zaman sağlayıcının verifyCallback'i ile doğrulanır; doğrulanmayan hiçbir istek
 * "ödendi" sayılmaz ve sipariş onay sayfası imzalı belirteç olmadan açılmaz.
 */
async function handle(req: NextRequest, method: "GET" | "POST") {
  const fields: Record<string, string> = Object.fromEntries(req.nextUrl.searchParams);
  if (method === "POST") {
    try {
      const type = req.headers.get("content-type") || "";
      if (type.includes("application/json")) {
        for (const [k, v] of Object.entries((await req.json()) as Record<string, unknown>)) fields[k] = String(v);
      } else {
        for (const [k, v] of (await req.formData()).entries()) if (typeof v === "string") fields[k] = v;
      }
    } catch {}
  }

  const back = (path: string) => NextResponse.redirect(new URL(path, req.nextUrl.origin), 303);

  try {
    const result = await getPaymentProvider().verifyCallback({ method, fields });

    // YAYIN NOTU: Gerçek sağlayıcıda sipariş durumunu burada güncelleyin (ödendi / başarısız),
    // stok düşün ve müşteriye sipariş e-postasını gönderin.

    if (result.reply !== undefined) return new NextResponse(result.reply, { status: 200 });

    const summary = result.status === "paid" ? openOrder(result.orderToken) : null;
    if (!summary) return back("/odeme?durum=basarisiz");
    return back(`/siparis-onay?t=${encodeURIComponent(sealOrder({ ...summary, status: "paid", ref: result.providerRef }))}`);
  } catch (e) {
    console.error("[payment/callback]", e);
    return back("/odeme?durum=basarisiz");
  }
}

export const POST = (req: NextRequest) => handle(req, "POST");
export const GET = (req: NextRequest) => handle(req, "GET");
