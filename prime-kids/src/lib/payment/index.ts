import { site } from "@/data/site";
import { mockProvider } from "./mock";
import type { PaymentProvider } from "./types";

/**
 * Ödeme sağlayıcı kaydı. Yeni sağlayıcı bağlamak için:
 *   1) src/lib/payment/<ad>.ts içinde PaymentProvider arayüzünü uygulayın,
 *   2) aşağıdaki listeye ekleyin,
 *   3) src/data/site.ts → payment.provider değerini değiştirin.
 * Adım adım rehber: README.md → "Gerçek ödeme sağlayıcısını bağlama".
 */
const providers: Partial<Record<typeof site.payment.provider, PaymentProvider>> = {
  mock: mockProvider,
};

export function getPaymentProvider(): PaymentProvider {
  const p = providers[site.payment.provider];
  if (!p) {
    throw new Error(
      `Ödeme sağlayıcısı "${site.payment.provider}" henüz bağlanmadı. src/lib/payment/index.ts dosyasına ekleyin.`,
    );
  }
  return p;
}
