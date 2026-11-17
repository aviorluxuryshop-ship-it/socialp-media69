import { site } from '@/data/site'
import type { StoredOrder } from '@/lib/order'

export type PaymentHandoff =
  | { status: 'redirect'; url: string }
  | { status: 'offline' } // Havale/EFT — sipariş özeti sayfasına yönlendirilir
  | { status: 'unavailable'; reason: string }

/**
 * Ödeme sağlayıcısının bağlanacağı TEK nokta.
 *
 * Bu projede hiçbir yerde kart numarası, son kullanma tarihi veya CVV
 * istenmez — istenmemeli de. Kart bilgisi iyzico / PayTR gibi lisanslı
 * ödeme kuruluşunun kendi güvenli sayfasında (ya da iframe'inde) alınır;
 * böylece kart verisi ne tarayıcı kodumuza ne sunucumuza dokunur.
 *
 * Bağlamak için:
 *   1. app/api/odeme/route.ts oluşturun; siparişi sağlayıcıya gönderip
 *      dönen ödeme sayfası adresini (paymentPageUrl / iframe token) verin.
 *   2. Aşağıdaki 'kart' dalında o route'u çağırıp { status: 'redirect', url } döndürün.
 *   3. data/site.ts › payment.cardEnabled değerini true yapın.
 *   4. Sağlayıcının geri dönüş (callback) adresini /siparis-alindi olarak tanımlayın.
 */
export async function startPayment(order: StoredOrder): Promise<PaymentHandoff> {
  if (order.method === 'havale') return { status: 'offline' }
  if (!site.payment.cardEnabled) {
    return { status: 'unavailable', reason: 'Kartla ödeme çok yakında aktif olacak. Şimdilik Havale / EFT ile sipariş verebilirsiniz.' }
  }
  return { status: 'unavailable', reason: 'Ödeme sağlayıcısı henüz bağlanmadı.' }
}
