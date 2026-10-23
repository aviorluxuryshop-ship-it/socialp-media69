// Tarih yardımcıları — tüm "gün" değerleri yerel saatte YYYY-MM-DD biçimindedir.

const pad = (n: number) => String(n).padStart(2, "0");

export function toDay(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function fromDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}
export function addDays(day: string, n: number): string {
  const d = fromDay(day);
  d.setDate(d.getDate() + n);
  return toDay(d);
}
export function diffDays(a: string, b: string): number {
  return Math.round((fromDay(a).getTime() - fromDay(b).getTime()) / 86400000);
}
/** 0 = Pazartesi … 6 = Pazar */
export function weekdayOf(day: string): number {
  return (fromDay(day).getDay() + 6) % 7;
}
export function startOfWeek(day: string): string {
  return addDays(day, -weekdayOf(day));
}
export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}
export function hhmm(minutes: number): string {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export const WEEKDAYS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
export const WEEKDAYS_LONG = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

const longFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" });
const dayFmt = new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long" });
const timeFmt = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" });
const relFmt = new Intl.RelativeTimeFormat("tr-TR", { numeric: "auto" });

export const formatDay = (day: string) => longFmt.format(fromDay(day));
export const formatDayLong = (day: string) => dayFmt.format(fromDay(day));
export const formatTime = (ms: number) => timeFmt.format(new Date(ms));

export function relativeDay(day: string, today = toDay()): string {
  const n = diffDays(day, today);
  if (Math.abs(n) <= 1) return relFmt.format(n, "day");
  if (n > 1 && n < 7) return `${n} gün sonra`;
  if (n < -1 && n > -7) return `${-n} gün önce`;
  return formatDay(day);
}

export function timeAgo(ms: number, now = Date.now()): string {
  const s = Math.round((now - ms) / 1000);
  if (s < 45) return "az önce";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} dk önce`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} gün önce`;
  return formatDay(toDay(new Date(ms)));
}

/** Olay işleyicilerinde ve kayıt zamanı damgalarında kullanılır (render sırasında çağrılmaz). */
export function nowMs(): number {
  return Date.now();
}
