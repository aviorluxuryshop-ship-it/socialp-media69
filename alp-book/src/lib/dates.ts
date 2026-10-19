const pad = (n: number) => String(n).padStart(2, "0");

export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => toKey(new Date());

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86_400_000);
}

export function lastNDays(n: number, end = todayKey()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)));
}

export function monthDays(year: number, month: number): string[] {
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => `${year}-${pad(month + 1)}-${pad(i + 1)}`);
}

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
export const monthName = (m: number) => MONTHS[m];
export const dayName = (key: string) => DAYS[fromKey(key).getDay()];
export const shortDay = (key: string) => DAYS[fromKey(key).getDay()].slice(0, 3);

export function prettyDate(key: string): string {
  const d = fromKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "İyi geceler";
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}

/** Haftanın ilk günü (Pazartesi). */
export function weekStart(key: string): string {
  const d = fromKey(key);
  const off = (d.getDay() + 6) % 7;
  return addDays(key, -off);
}

export function weekDays(key: string): string[] {
  const s = weekStart(key);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
}

/** Ay ekler; gün taşarsa ayın son gününe sabitler (31 Ocak + 1 ay = 28/29 Şubat). */
export function addMonths(key: string, n: number): string {
  const d = fromKey(key);
  const day = d.getDate();
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  first.setDate(Math.min(day, last));
  return toKey(first);
}

export const monthOf = (key: string) => key.slice(0, 7);

export function monthDaysOf(key: string): string[] {
  const d = fromKey(key);
  return monthDays(d.getFullYear(), d.getMonth());
}

/** Başlangıç ve bitiş dahil tüm günler (en fazla 400 gün). */
export function rangeDays(from: string, to: string): string[] {
  if (from > to) [from, to] = [to, from];
  const n = Math.min(daysBetween(from, to), 399);
  return Array.from({ length: n + 1 }, (_, i) => addDays(from, i));
}

export function longDate(key: string): string {
  const d = fromKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${DAYS[d.getDay()]}`;
}

export const dayNum = (key: string) => fromKey(key).getDate();
export const shortMonth = (key: string) => MONTHS[fromKey(key).getMonth()].slice(0, 3);
export const monthLabel = (key: string) => {
  const d = fromKey(key);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
export const isValidKey = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && toKey(fromKey(s)) === s;
