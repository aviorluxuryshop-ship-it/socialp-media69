"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { CartLine, FreeShippingBar } from "./CartParts";
import Icon from "./Icon";
import { useCart } from "@/lib/cart";
import { fmt } from "@/lib/site-helpers";

/** Sepete ekleme sonrası açılan mini sepet: net onay + bir sonraki adım. */
export default function CartDrawer() {
  const { totals, justAdded, dismissAdded } = useCart();
  const ref = useRef<HTMLDialogElement>(null);
  const path = usePathname();

  useEffect(() => {
    const d = ref.current;
    if (justAdded && d && !d.open) d.showModal();
  }, [justAdded]);

  useEffect(() => ref.current?.close(), [path]);

  const close = () => ref.current?.close();

  return (
    <dialog
      ref={ref}
      aria-labelledby="mini-sepet-baslik"
      onClose={dismissAdded}
      onClick={(e) => e.target === e.currentTarget && close()}
      className="sheet-right m-0 ml-auto h-dvh max-h-none w-full max-w-[420px] bg-cream p-0"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <h2 id="mini-sepet-baslik" className="flex items-center gap-2.5 text-[16px] font-semibold">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-pine text-white"><Icon name="check" size={14} /></span>
            Sepete eklendi
          </h2>
          <button type="button" onClick={close} aria-label="Mini sepeti kapat" className="-mr-2.5 grid h-11 w-11 place-items-center rounded-full">
            <Icon name="close" size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          <ul className="divide-y divide-line">
            {totals.items.map((i) => (
              <CartLine key={`${i.slug}-${i.colorId}-${i.size}`} item={i} compact onNavigate={close} />
            ))}
          </ul>
          {totals.items.length === 0 && <p className="py-10 text-center text-mute">Sepetiniz boş.</p>}
        </div>

        {totals.items.length > 0 && (
          <div className="shrink-0 border-t border-line bg-white/60 px-5 pb-5 pt-4">
            <FreeShippingBar totals={totals} />
            <p className="mt-4 flex items-baseline justify-between">
              <span className="text-[14.5px] text-mute">Ara toplam ({totals.count} ürün)</span>
              <span className="text-[19px] font-bold tabular-nums">{fmt(totals.subtotal)}</span>
            </p>
            <div className="mt-4 grid gap-2.5">
              <Link href="/odeme" onClick={close} className="btn-primary w-full">Ödemeye geç</Link>
              <Link href="/sepet" onClick={close} className="btn-outline w-full">Sepeti görüntüle</Link>
            </div>
            <button type="button" onClick={close} className="mt-1 min-h-[44px] w-full text-[14px] text-mute underline underline-offset-4 hover:text-ink">
              Alışverişe devam et
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
