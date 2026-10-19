"use client";

import { useEffect, useRef, useState } from "react";

/** Kapsayıcının piksel genişliğini izler; grafikler bu genişlikte çizilir (metin bozulmaz). */
export function useWidth<T extends HTMLElement>(fallback = 320) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(Math.max(120, Math.floor(el.getBoundingClientRect().width)) || fallback);
    const ro = new ResizeObserver(([e]) => setW(Math.max(120, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback]);
  return [ref, w] as const;
}

/** Eksen üst sınırı için "yuvarlak" bir sayı. */
export function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / p;
  const n = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((x) => f <= x + 1e-9) ?? 10;
  return n * p;
}
