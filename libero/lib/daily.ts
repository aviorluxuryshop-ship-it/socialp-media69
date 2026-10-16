import { todayKey } from './utils';

/** Gün anahtarına göre deterministik indeks: ziyaretçinin yerel gününe göre değişir */
export function dailyIndex(n: number, key = todayKey()): number {
  let h = 7;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % n;
}
