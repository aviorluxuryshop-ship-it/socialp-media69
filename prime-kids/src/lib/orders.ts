import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { site } from "@/data/site";
import type { Order } from "./payment/types";
import type { Line } from "./pricing";

/**
 * İmzalı sipariş özeti. Henüz veritabanı olmadığı için sipariş, ödeme adımı boyunca HMAC ile
 * imzalanmış bir belirteçte (token) taşınır: içeriği değiştirilirse imza tutmaz.
 * Adres, telefon gibi kişisel veriler belirtece KONMAZ (URL'de taşındığı için).
 */
export type OrderSummary = {
  id: string;
  at: string;
  lines: Line[];
  subtotal: number;
  shipping: number;
  total: number;
  giftWrap: boolean;
  email: string; // maskeli: a***@ornek.com
  city: string;
  status: "pending" | "paid";
  ref?: string; // sağlayıcı işlem referansı
  test: boolean; // deneme modunda oluşturuldu mu
};

const MAX_AGE_MS = 1000 * 60 * 60 * 24; // onay bağlantısı 24 saat geçerli

function secret(): string {
  const s = process.env.ORDER_SIGNING_SECRET;
  if (s && s.length >= 16) return s;
  // Deneme sağlayıcısında gerçek para ya da kişisel veri taşınmadığı için sabit bir değer yeterlidir.
  if (site.payment.provider === "mock") return "prime-kids-mock-mode-not-a-secret";
  throw new Error("ORDER_SIGNING_SECRET tanımlı değil (en az 16 karakter). Bkz. .env.example");
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function sealOrder(summary: OrderSummary): string {
  const payload = b64(JSON.stringify(summary));
  return `${payload}.${sign(payload)}`;
}

export function openOrder(token: unknown): OrderSummary | null {
  if (typeof token !== "string") return null;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const summary = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as OrderSummary;
    if (Date.now() - new Date(summary.at).getTime() > MAX_AGE_MS) return null;
    return summary;
  } catch {
    return null;
  }
}

export function newOrderId(now = new Date()): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const rand = Array.from({ length: 5 }, () => alphabet[randomInt(alphabet.length)]).join("");
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
  return `PK-${ymd}-${rand}`;
}

const maskEmail = (e: string) => e.replace(/^(.).*(@.*)$/, "$1***$2");

export function summarize(order: Order, test: boolean): OrderSummary {
  return {
    id: order.id,
    at: order.createdAt,
    lines: order.items.map(({ slug, colorId, size, qty }) => ({ slug, colorId, size, qty })),
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    giftWrap: order.customer.giftWrap,
    email: maskEmail(order.customer.email),
    city: order.customer.city,
    status: "pending",
    test,
  };
}
