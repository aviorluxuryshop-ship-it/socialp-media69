// Yerel saatle çalışan küçük tarih yardımcıları. Anahtar biçimi: "YYYY-AA-GG".

const pad = (n: number) => String(n).padStart(2, "0");

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toKey(new Date());
}

export function isValidKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  return toKey(parseKey(key)) === key;
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function addMonths(key: string, n: number): string {
  const d = parseKey(key);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toKey(d);
}

/** 0 = Pazar … 6 = Cumartesi */
export function weekday(key: string): number {
  return parseKey(key).getDay();
}

/** Haftanın pazartesisi. */
export function startOfWeek(key: string): string {
  const wd = weekday(key);
  return addDays(key, wd === 0 ? -6 : 1 - wd);
}

export function startOfMonth(key: string): string {
  return key.slice(0, 8) + "01";
}

export function endOfMonth(key: string): string {
  const d = parseKey(key);
  return toKey(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 86_400_000);
}

/** a..b dahil tüm günler. */
export function daysBetween(a: string, b: string): string[] {
  const out: string[] = [];
  for (let k = a; k <= b; k = addDays(k, 1)) out.push(k);
  return out;
}

export function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minToTime(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

export function endTime(start: string, durationMin: number): string {
  return minToTime(timeToMin(start) + durationMin);
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("tr-TR", opts);
const fLong = fmt({ day: "numeric", month: "long", year: "numeric", weekday: "long" });
const fDayMonth = fmt({ day: "numeric", month: "long" });
const fDayShort = fmt({ day: "numeric", month: "short" });
const fMonthYear = fmt({ month: "long", year: "numeric" });
const fWeekdayShort = fmt({ weekday: "short" });
const fWeekdayLong = fmt({ weekday: "long" });

export const formatLong = (k: string) => fLong.format(parseKey(k));
export const formatDayMonth = (k: string) => fDayMonth.format(parseKey(k));
export const formatDayShort = (k: string) => fDayShort.format(parseKey(k));
export const formatMonthYear = (k: string) => fMonthYear.format(parseKey(k));
export const formatWeekdayShort = (k: string) => fWeekdayShort.format(parseKey(k));
export const formatWeekdayLong = (k: string) => fWeekdayLong.format(parseKey(k));

export const WEEKDAY_NAMES = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
export const WEEKDAY_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export type PeriodKind = "day" | "week" | "month";

export interface Period {
  kind: PeriodKind;
  start: string;
  end: string;
  label: string;
}

export function periodOf(kind: PeriodKind, anchor: string): Period {
  if (kind === "day") return { kind, start: anchor, end: anchor, label: formatLong(anchor) };
  if (kind === "week") {
    const s = startOfWeek(anchor);
    const e = addDays(s, 6);
    const sameMonth = s.slice(0, 7) === e.slice(0, 7);
    const label = sameMonth
      ? `${parseKey(s).getDate()}–${formatDayMonth(e)} ${e.slice(0, 4)}`
      : `${formatDayMonth(s)} – ${formatDayMonth(e)} ${e.slice(0, 4)}`;
    return { kind, start: s, end: e, label };
  }
  const s = startOfMonth(anchor);
  return { kind, start: s, end: endOfMonth(anchor), label: formatMonthYear(anchor) };
}

/** Bir önceki aynı uzunluktaki dönem. */
export function previousPeriod(p: Period): Period {
  if (p.kind === "day") return periodOf("day", addDays(p.start, -1));
  if (p.kind === "week") return periodOf("week", addDays(p.start, -7));
  return periodOf("month", addMonths(p.start, -1));
}

export function shiftPeriod(p: Period, dir: 1 | -1): Period {
  if (p.kind === "day") return periodOf("day", addDays(p.start, dir));
  if (p.kind === "week") return periodOf("week", addDays(p.start, 7 * dir));
  return periodOf("month", addMonths(p.start, dir));
}

export function inRange(key: string, start: string, end: string): boolean {
  return key >= start && key <= end;
}

/**
 * Karşılaştırılabilir aralıklar. Dönem devam ediyorsa (bugünü içeriyorsa) bu dönem bugüne kadar,
 * önceki dönem de aynı sayıda günle sınırlanır; böylece yarım ay tam ayla kıyaslanmaz.
 */
export function comparable(p: Period, today: string) {
  const prev = previousPeriod(p);
  if (p.kind === "day" || today < p.start || today > p.end) {
    return { cur: { start: p.start, end: p.end }, prev: { start: prev.start, end: prev.end }, partial: false, prevLabel: prev.label };
  }
  const n = diffDays(p.start, today);
  const pe = addDays(prev.start, n);
  return { cur: { start: p.start, end: today }, prev: { start: prev.start, end: pe < prev.end ? pe : prev.end }, partial: true, prevLabel: prev.label };
}
