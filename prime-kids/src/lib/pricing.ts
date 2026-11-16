import { getProduct, MAX_QTY_PER_LINE, stockOf } from "@/data/products";
import { site } from "@/data/site";

/** Sepet satırı — istemcide localStorage'da, sunucuda ödeme isteğinde aynı biçimde taşınır. */
export type Line = { slug: string; colorId: string; size: string; qty: number };
export type LineKey = Omit<Line, "qty">;

export type PricedLine = Line & {
  name: string;
  colorName: string;
  image: string;
  unitPrice: number;
  lineTotal: number;
  maxQty: number;
};

export const sameLine = (a: LineKey, b: LineKey) =>
  a.slug === b.slug && a.colorId === b.colorId && a.size === b.size;

/** Dışarıdan gelen (localStorage / istek gövdesi) veriyi güvenli sepet satırlarına çevirir. */
export function parseLines(input: unknown): Line[] {
  if (!Array.isArray(input)) return [];
  const out: Line[] = [];
  for (const raw of input.slice(0, 50)) {
    if (!raw || typeof raw !== "object") continue;
    const { slug, colorId, size, qty } = raw as Record<string, unknown>;
    if (typeof slug !== "string" || typeof colorId !== "string" || typeof size !== "string") continue;
    const p = getProduct(slug);
    if (!p || !p.colors.some((c) => c.id === colorId) || !p.sizes.includes(size)) continue;
    const max = Math.min(MAX_QTY_PER_LINE, stockOf(p, colorId, size));
    const n = Math.min(Math.floor(Number(qty)), max);
    if (!Number.isFinite(n) || n < 1) continue;
    const hit = out.find((x) => sameLine(x, { slug, colorId, size }));
    if (hit) hit.qty = Math.min(hit.qty + n, max);
    else out.push({ slug, colorId, size, qty: n });
  }
  return out;
}

/**
 * Sepeti products.ts'deki güncel fiyatlarla hesaplar. Hem istemci (gösterim) hem sunucu
 * (ödeme tutarı) bu fonksiyonu kullanır; sunucu istemciden gelen fiyata asla güvenmez.
 */
export function priceCart(lines: Line[]) {
  const items: PricedLine[] = lines.flatMap((l) => {
    const p = getProduct(l.slug);
    const c = p?.colors.find((x) => x.id === l.colorId);
    if (!p || !c) return [];
    return [{
      ...l,
      name: p.name,
      colorName: c.name,
      image: c.image,
      unitPrice: p.price,
      lineTotal: p.price * l.qty,
      maxQty: Math.min(MAX_QTY_PER_LINE, stockOf(p, l.colorId, l.size)),
    }];
  });
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const { freeThreshold, fee } = site.shipping;
  const shipping = subtotal === 0 || subtotal >= freeThreshold ? 0 : fee;
  return {
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal,
    shipping,
    total: subtotal + shipping,
    freeShippingLeft: Math.max(0, freeThreshold - subtotal),
  };
}

export type CartTotals = ReturnType<typeof priceCart>;
