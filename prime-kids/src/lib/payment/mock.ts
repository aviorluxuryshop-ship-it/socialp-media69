import { openOrder } from "../orders";
import type { PaymentProvider } from "./types";

/**
 * DENEME sağlayıcısı — gerçek ödeme ALMAZ, hiçbir kart bilgisi istemez.
 * Kullanıcıyı site içindeki /odeme/deneme sayfasına yönlendirir; orada "onayla" ya da "başarısız"
 * seçilerek akışın tamamı (callback → sipariş onayı) denenebilir.
 */
export const mockProvider: PaymentProvider = {
  id: "mock",

  async createPayment(_order, ctx) {
    return { kind: "redirect", url: `${ctx.baseUrl}/odeme/deneme?t=${encodeURIComponent(ctx.orderToken)}` };
  },

  async verifyCallback({ fields }) {
    const summary = openOrder(fields.token);
    if (!summary || summary.status !== "pending" || fields.status !== "success") return { status: "failed" };
    return { status: "paid", orderToken: fields.token, providerRef: `DENEME-${summary.id}` };
  },
};
