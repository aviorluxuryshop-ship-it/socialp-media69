import { CATEGORIES, STANDS } from '../stadium/config.ts';
import type { Block, StadiumLayout } from '../stadium/layout.ts';

const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });

export function price(v: number): string {
  return v > 0 ? money.format(v) : '—';
}

export function categoryName(id: number): string {
  return CATEGORIES[id]?.name ?? '';
}

export function tierName(b: Block): string {
  return b.tier === 'upper' ? 'Üst Kat' : b.tier === 'lower' ? 'Alt Kat' : 'Loca Katı';
}

export function standName(b: Block): string {
  return STANDS[b.stand].name;
}

export function blockTitle(b: Block): string {
  if (b.kind === 'suite') return b.label;
  if (b.kind === 'vip') return 'VIP Tribün';
  if (b.kind === 'press') return 'Basın Tribünü';
  return `Blok ${b.code}`;
}

/** Free / total seats of a block (or of one row, 1-based). */
export function availability(layout: StadiumLayout, b: Block, row?: number): { free: number; total: number } {
  const S = layout.seats;
  const a = row ? b.rowStart[row - 1] : b.seatStart;
  const e = row ? b.rowStart[row] : b.seatStart + b.seatCount;
  let free = 0;
  for (let i = a; i < e; i++) if (S.sold[i] === 0) free++;
  return { free, total: e - a };
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
