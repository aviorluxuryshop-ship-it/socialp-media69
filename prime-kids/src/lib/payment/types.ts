import type { Customer } from "../checkout";
import type { PricedLine } from "../pricing";

/** Sunucuda, products.ts fiyatlarıyla yeniden hesaplanmış sipariş. */
export type Order = {
  id: string; // ör. PK-261116-7F3KQ
  createdAt: string; // ISO
  items: PricedLine[];
  subtotal: number;
  shipping: number;
  total: number; // TL, KDV dahil
  currency: string;
  customer: Customer;
};

/** Sağlayıcının ödeme adımını nasıl açacağı. Tarayıcı üçünü de işleyebilir (PaymentLauncher). */
export type PaymentSession =
  | { kind: "redirect"; url: string } // ortak ödeme sayfasına yönlendirme (iyzico Checkout Form sayfası, mock)
  | { kind: "iframe"; url: string } // sayfa içinde güvenli iframe (PayTR iFrame API)
  | { kind: "form"; action: string; fields: Record<string, string> }; // gizli form POST (klasik 3D sanal POS)

export type PaymentContext = {
  baseUrl: string; // https://alanadi.com
  callbackUrl: string; // {baseUrl}/api/payment/callback
  orderToken: string; // imzalı sipariş özeti; sağlayıcı geri taşıyabiliyorsa callback'te kullanılır
  ip: string;
};

export type CallbackInput = {
  method: "GET" | "POST";
  fields: Record<string, string>; // form gövdesi + sorgu parametreleri
};

export type PaymentResult = {
  status: "paid" | "failed";
  /** İmzalı sipariş özeti (mock geri taşır). Gerçek sağlayıcıda siparişi orderId ile veritabanından okuyun. */
  orderToken?: string;
  providerRef?: string;
  /**
   * Sağlayıcı sunucudan sunucuya bildirim (webhook) gönderiyorsa ve düz metin yanıt bekliyorsa
   * (PayTR "OK" bekler) buraya yazın; kullanıcı yönlendirmesi yapılmaz.
   */
  reply?: string;
};

export interface PaymentProvider {
  id: string;
  /** Ödeme adımını başlatır: sipariş + müşteri → yönlendirme URL'si, iframe ya da form. */
  createPayment(order: Order, ctx: PaymentContext): Promise<PaymentSession>;
  /** Sağlayıcıdan dönen sonucu DOĞRULAR (imza/hash/sorgu). Doğrulanamayan sonuç "failed" sayılmalıdır. */
  verifyCallback(input: CallbackInput): Promise<PaymentResult>;
}
