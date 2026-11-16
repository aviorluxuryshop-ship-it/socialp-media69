"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/** Sipariş onayı görüntülendiğinde sepeti ve ödeme formu taslağını temizler. */
export default function ClearCart() {
  const { ready, clear } = useCart();
  useEffect(() => {
    if (!ready) return;
    clear();
    try {
      sessionStorage.removeItem("primekids.checkout.v1");
    } catch {}
  }, [ready, clear]);
  return null;
}
