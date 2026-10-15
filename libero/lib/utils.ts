export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

/** Türkçe duyarlı sadeleştirme: arama ve karşılaştırma için */
export function norm(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/[âäà]/g, 'a')
    .replace(/[îïì]/g, 'i')
    .replace(/[ûùü]/g, 'u')
    .replace(/[êë]/g, 'e')
    .replace(/[ôò]/g, 'o')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/̇/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Yerel saat dilimine göre YYYY-MM-DD */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Haftanın başlangıcı (Pazartesi) */
export function weekStart(d = new Date()): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const wd = (x.getDay() + 6) % 7; // Pzt = 0
  x.setDate(x.getDate() - wd);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
export const DAY_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export function fmtDate(key: string): string {
  return parseKey(key).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}
export function fmtShort(key: string): string {
  return parseKey(key).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

/** Deterministik karıştırma (tohum + dizi) */
export function seeded<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed >>> 0 || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export function plural(n: number, one: string, many = one) {
  return n === 1 ? one : many;
}

export function download(name: string, text: string, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
