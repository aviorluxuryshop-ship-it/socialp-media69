"use client";

import Image from "next/image";
import Link from "next/link";
import Icon from "./Icon";
import { site } from "@/data/site";
import { useCart } from "@/lib/cart";
import type { CartTotals, PricedLine } from "@/lib/pricing";
import { fmt } from "@/lib/site-helpers";

/** Ücretsiz kargoya ne kadar kaldığını gösteren ince çubuk. */
export function FreeShippingBar({ totals }: { totals: CartTotals }) {
  const { freeThreshold } = site.shipping;
  const pct = Math.min(100, Math.round((totals.subtotal / freeThreshold) * 100));
  const free = totals.freeShippingLeft === 0;
  return (
    <div>
      <p className="text-[13.5px]">
        {free ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-pine">
            <Icon name="check" size={16} /> Kargonuz ücretsiz
          </span>
        ) : (
          <>Ücretsiz kargo için <strong>{fmt(totals.freeShippingLeft)}</strong> daha ekleyin</>
        )}
      </p>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-label="Ücretsiz kargo ilerlemesi"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="h-full rounded-full bg-pine transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Sepet satırı — hem sepet sayfasında hem mini sepette kullanılır. */
export function CartLine({ item, compact = false, onNavigate }: { item: PricedLine; compact?: boolean; onNavigate?: () => void }) {
  const { setQty, remove } = useCart();
  const href = `/urun/${item.slug}?renk=${item.colorId}`;
  const atMax = item.qty >= item.maxQty;
  return (
    <li className="flex gap-4 py-4">
      <Link href={href} onClick={onNavigate} tabIndex={-1} aria-hidden className={`relative shrink-0 overflow-hidden rounded-lg bg-sand ${compact ? "h-[108px] w-[72px]" : "h-[132px] w-[88px] sm:h-[150px] sm:w-[100px]"}`}>
        <Image src={item.image} alt="" fill sizes="100px" className="object-cover object-top" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link href={href} onClick={onNavigate} className="text-[15px] font-semibold leading-snug underline-offset-4 hover:underline">
            {item.name}
          </Link>
          <p className="shrink-0 text-[15px] font-semibold tabular-nums">{fmt(item.lineTotal)}</p>
        </div>
        <p className="mt-1 text-[13.5px] text-mute">{item.colorName} · {item.size}</p>
        {item.qty > 1 && <p className="text-[12.5px] text-mute">Adet fiyatı {fmt(item.unitPrice)}</p>}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="inline-flex items-center rounded-full border border-line bg-white">
            <button type="button" onClick={() => setQty(item, item.qty - 1)} aria-label={`${item.name}: adedi azalt`} className="grid h-11 w-11 place-items-center rounded-full">
              <Icon name="minus" size={16} />
            </button>
            <span className="w-6 text-center text-[14.5px] font-semibold tabular-nums" aria-live="polite" aria-label={`Adet: ${item.qty}`}>{item.qty}</span>
            <button type="button" onClick={() => setQty(item, item.qty + 1)} disabled={atMax} aria-label={`${item.name}: adedi artır`} className="grid h-11 w-11 place-items-center rounded-full disabled:opacity-30">
              <Icon name="plus" size={16} />
            </button>
          </div>
          <button type="button" onClick={() => remove(item)} className="min-h-[44px] px-1 text-[13.5px] text-mute underline underline-offset-4 hover:text-ink" aria-label={`${item.name} ürününü sepetten kaldır`}>
            Kaldır
          </button>
        </div>
        {atMax && item.maxQty < 9 && <p className="mt-1 text-[12.5px] text-alert">Bu bedende stokta {item.maxQty} adet var.</p>}
      </div>
    </li>
  );
}

export function TotalsRows({ totals }: { totals: CartTotals }) {
  return (
    <dl className="space-y-2.5 text-[14.5px]">
      <div className="flex justify-between"><dt className="text-mute">Ara toplam</dt><dd className="tabular-nums">{fmt(totals.subtotal)}</dd></div>
      <div className="flex justify-between"><dt className="text-mute">Kargo</dt><dd className="tabular-nums">{totals.shipping === 0 ? "Ücretsiz" : fmt(totals.shipping)}</dd></div>
      <div className="flex items-baseline justify-between border-t border-line pt-3.5">
        <dt className="font-semibold">Toplam <span className="font-normal text-mute">(KDV dahil)</span></dt>
        <dd className="text-[20px] font-bold tabular-nums">{fmt(totals.total)}</dd>
      </div>
    </dl>
  );
}
