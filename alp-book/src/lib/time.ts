/** "HH:MM" → gün başından itibaren dakika. Geçersizse null. */
export function parseTime(s: unknown): number | null {
  if (typeof s !== "string") return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/**
 * Yatış ve uyanış saatinden uyku süresi (dakika). Gece yarısını geçen uykuyu doğru hesaplar:
 * 23:30 → 07:15 = 7 sa 45 dk. Saatlerden biri eksik/geçersizse ya da ikisi aynıysa null
 * (aynı saat 0 mı 24 saat mi belli olmadığı için süre uydurulmaz).
 */
export function sleepMinutes(bed: unknown, wake: unknown): number | null {
  const b = parseTime(bed);
  const w = parseTime(wake);
  if (b === null || w === null) return null;
  const diff = (w - b + 1440) % 1440;
  return diff === 0 ? null : diff;
}

/** 465 → "7 sa 45 dk". */
export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m} dk`;
  if (m === 0) return `${h} sa`;
  return `${h} sa ${m} dk`;
}

/** Eksenler için kısa hali: 7.75 → "7,8 sa". */
export const fmtHours = (hours: number, digits = 1) => `${hours.toFixed(digits).replace(".", ",")} sa`;

export const fmtNum = (n: number, digits = 0) =>
  n.toLocaleString("tr-TR", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
