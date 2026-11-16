"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProduct, MAX_QTY_PER_LINE, stockOf } from "@/data/products";
import { parseLines, priceCart, sameLine, type CartTotals, type Line, type LineKey } from "./pricing";

type CartCtx = {
  lines: Line[];
  totals: CartTotals;
  ready: boolean; // localStorage okundu mu (SSR/ilk boyamada false)
  add: (l: LineKey) => void;
  setQty: (l: LineKey, qty: number) => void;
  remove: (l: LineKey) => void;
  clear: () => void;
  /** Sepete son eklenen satır — mini sepet çekmecesi bununla açılır. */
  justAdded: LineKey | null;
  dismissAdded: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "primekids.cart.v1";

const maxFor = (l: LineKey) => {
  const p = getProduct(l.slug);
  return p ? Math.min(MAX_QTY_PER_LINE, stockOf(p, l.colorId, l.size)) : 0;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);
  const [justAdded, setJustAdded] = useState<LineKey | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // Ürün, renk veya beden artık yoksa / tükendiyse satır elenir.
      if (raw) setLines(parseLines(JSON.parse(raw)));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const add = useCallback((l: LineKey) => {
    const max = maxFor(l);
    if (max < 1) return;
    setLines((cur) =>
      cur.some((x) => sameLine(x, l))
        ? cur.map((x) => (sameLine(x, l) ? { ...x, qty: Math.min(x.qty + 1, max) } : x))
        : [...cur, { ...l, qty: 1 }],
    );
    setJustAdded(l);
  }, []);

  const setQty = useCallback((l: LineKey, qty: number) => {
    setLines((cur) =>
      cur.flatMap((x) => (sameLine(x, l) ? (qty <= 0 ? [] : [{ ...x, qty: Math.min(qty, maxFor(l)) }]) : [x])),
    );
  }, []);

  const remove = useCallback((l: LineKey) => setLines((cur) => cur.filter((x) => !sameLine(x, l))), []);
  const clear = useCallback(() => setLines([]), []);
  const dismissAdded = useCallback(() => setJustAdded(null), []);

  const value = useMemo(
    () => ({ lines, totals: priceCart(lines), ready, add, setQty, remove, clear, justAdded, dismissAdded }),
    [lines, ready, add, setQty, remove, clear, justAdded, dismissAdded],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
