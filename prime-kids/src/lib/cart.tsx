"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProduct } from "@/data/products";
import { site } from "@/data/site";

export type Line = { slug: string; colorId: string; size: string; qty: number };

type CartCtx = {
  lines: Line[];
  ready: boolean;
  count: number;
  add: (l: Omit<Line, "qty">) => void;
  setQty: (l: Omit<Line, "qty">, qty: number) => void;
  remove: (l: Omit<Line, "qty">) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "primekids.cart.v1";

const same = (a: Omit<Line, "qty">, b: Omit<Line, "qty">) =>
  a.slug === b.slug && a.colorId === b.colorId && a.size === b.size;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Line[];
        // Ürün veya renk artık yoksa satırı ele
        setLines(
          parsed.filter((l) => {
            const p = getProduct(l.slug);
            return p && p.colors.some((c) => c.id === l.colorId) && p.sizes.includes(l.size) && l.qty > 0;
          }),
        );
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const add = useCallback((l: Omit<Line, "qty">) => {
    setLines((cur) => {
      const hit = cur.find((x) => same(x, l));
      if (hit) return cur.map((x) => (same(x, l) ? { ...x, qty: Math.min(x.qty + 1, 9) } : x));
      return [...cur, { ...l, qty: 1 }];
    });
  }, []);

  const setQty = useCallback((l: Omit<Line, "qty">, qty: number) => {
    setLines((cur) =>
      cur.flatMap((x) => (same(x, l) ? (qty <= 0 ? [] : [{ ...x, qty: Math.min(qty, 9) }]) : [x])),
    );
  }, []);

  const remove = useCallback((l: Omit<Line, "qty">) => {
    setLines((cur) => cur.filter((x) => !same(x, l)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({ lines, ready, count: lines.reduce((s, l) => s + l.qty, 0), add, setQty, remove, clear }),
    [lines, ready, add, setQty, remove, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}

export function totals(lines: Line[]) {
  const subtotal = lines.reduce((s, l) => s + (getProduct(l.slug)?.price ?? 0) * l.qty, 0);
  const shipping = subtotal === 0 || subtotal >= site.freeShippingThreshold ? 0 : site.shippingFee;
  return { subtotal, shipping, total: subtotal + shipping };
}
