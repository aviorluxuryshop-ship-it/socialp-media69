import { addDays, monthDaysOf, monthOf, todayKey, weekStart, addMonths } from "./dates";
import { GROUPS, ROUTINES } from "./routines";
import { sleepMinutes } from "./time";
import type { DayEntry, GroupId, Goals, Meal, Routine, RoutineValue, WalkUnit, WalkValue, YesNoMin } from "./types";

/**
 * Tamamlanma kuralı (tüm uygulamada aynıdır):
 *  - done: kayıt var ve hedefi karşılıyor (Evet / hedefe ulaşan değer)
 *  - missed: kayıt var ama "Hayır" ya da hedefin altında/üstünde
 *  - recorded: kayıt var, hedefi olmayan bilgi alanı (yatış / uyanış saati)
 *  - unrecorded: kayıt yok → yüzdeye katılmaz, başarısızlık sayılmaz
 * Yüzde = done / (done + missed).
 */
export type Status = "done" | "missed" | "recorded" | "unrecorded";

export type Entries = Record<string, DayEntry>;

export const pct = (x: number) => Math.round(x * 100);

// ---------- değer okuyucular ----------

export function asYesNoMin(v: RoutineValue | undefined): YesNoMin | null {
  if (typeof v === "boolean") return { done: v };
  if (v && typeof v === "object" && !Array.isArray(v) && "done" in v && typeof v.done === "boolean") return v as YesNoMin;
  return null;
}

export function asWalk(v: RoutineValue | undefined): WalkValue | null {
  if (v && typeof v === "object" && !Array.isArray(v) && "unit" in v && typeof v.value === "number") return v as WalkValue;
  return null;
}

export function validMeals(v: RoutineValue | undefined): Meal[] {
  return Array.isArray(v) ? v.filter((m) => typeof m?.items === "string" && m.items.trim() !== "") : [];
}

/** Uyku süresi kaydedilmez, her seferinde yatış/uyanıştan hesaplanır. */
export const sleepOf = (e?: DayEntry): number | null => sleepMinutes(e?.uyku_yatis, e?.uyku_kalkis);

export function statusOf(r: Routine, e: DayEntry | undefined, g: Goals): Status {
  const v = e?.[r.id];
  switch (r.kind) {
    case "yesno":
    case "yesno_min": {
      const y = asYesNoMin(v);
      return y ? (y.done ? "done" : "missed") : "unrecorded";
    }
    case "count":
      return typeof v === "number" ? (v >= g.waterGlasses ? "done" : "missed") : "unrecorded";
    case "time":
      return typeof v === "string" && /^\d{1,2}:\d{2}$/.test(v) ? "recorded" : "unrecorded";
    case "sleep": {
      const m = sleepOf(e);
      return m === null ? "unrecorded" : m >= g.sleepHours * 60 ? "done" : "missed";
    }
    case "duration":
      return typeof v === "number" ? (v <= g.screenMaxHours * 60 ? "done" : "missed") : "unrecorded";
    case "walk": {
      const w = asWalk(v);
      if (!w) return "unrecorded";
      return w.value >= (w.unit === "steps" ? g.steps : g.walkMinutes) ? "done" : "missed";
    }
    case "meals":
      return validMeals(v).length > 0 ? "done" : "unrecorded";
  }
}

// ---------- gün ve dönem özetleri ----------

export interface Tally {
  done: number;
  missed: number;
  recorded: number;
  unrecorded: number;
  total: number;
  judged: number;
  /** done / judged — yargılanacak veri yoksa null. */
  rate: number | null;
}

const emptyTally = (): Tally => ({ done: 0, missed: 0, recorded: 0, unrecorded: 0, total: 0, judged: 0, rate: null });

function finish(t: Tally): Tally {
  t.judged = t.done + t.missed;
  t.rate = t.judged > 0 ? t.done / t.judged : null;
  return t;
}

export function addStatus(t: Tally, s: Status) {
  t[s]++;
  t.total++;
}

export function daySummary(e: DayEntry | undefined, g: Goals): Tally {
  const t = emptyTally();
  for (const r of ROUTINES) addStatus(t, statusOf(r, e, g));
  return finish(t);
}

export function rangeSummary(dates: string[], entries: Entries, g: Goals): Tally & { daysWithData: number } {
  const t = emptyTally();
  let daysWithData = 0;
  for (const d of dates) {
    const e = entries[d];
    let any = false;
    for (const r of ROUTINES) {
      const s = statusOf(r, e, g);
      if (s !== "unrecorded") any = true;
      addStatus(t, s);
    }
    if (any) daysWithData++;
  }
  return { ...finish(t), daysWithData };
}

export function routineTally(r: Routine, dates: string[], entries: Entries, g: Goals): Tally {
  const t = emptyTally();
  for (const d of dates) addStatus(t, statusOf(r, entries[d], g));
  return finish(t);
}

export interface GroupStat {
  group: GroupId;
  label: string;
  color: string;
  judged: number;
  done: number;
  rate: number;
}

export function groupStats(dates: string[], entries: Entries, g: Goals): GroupStat[] {
  const acc = new Map<GroupId, { done: number; judged: number }>();
  for (const r of ROUTINES) {
    const t = routineTally(r, dates, entries, g);
    const a = acc.get(r.group) ?? { done: 0, judged: 0 };
    a.done += t.done;
    a.judged += t.judged;
    acc.set(r.group, a);
  }
  return [...acc.entries()]
    .filter(([, a]) => a.judged > 0)
    .map(([group, a]) => ({ group, ...GROUPS[group], judged: a.judged, done: a.done, rate: a.done / a.judged }));
}

/** En güçlü / en zayıf kategori — yalnızca yeterli veri (en az `minJudged` değerlendirilmiş kayıt) varsa. */
export function strongestWeakest(stats: GroupStat[], minJudged = 5) {
  const ok = stats.filter((s) => s.judged >= minJudged);
  if (ok.length < 2) return null;
  const sorted = [...ok].sort((a, b) => b.rate - a.rate || b.judged - a.judged);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  if (best.rate === worst.rate) return null;
  return { best, worst };
}

export interface Compare {
  cur: number | null;
  prev: number | null;
  delta: number | null;
  curJudged: number;
  prevJudged: number;
}

/** `dates` ile hemen öncesindeki aynı uzunlukta dönemi karşılaştırır. Her iki tarafta da yeterli veri yoksa delta null. */
export function comparePeriods(dates: string[], entries: Entries, g: Goals, minJudged = 8): Compare {
  const n = dates.length;
  const prevDates = Array.from({ length: n }, (_, i) => addDays(dates[0], i - n));
  const cur = rangeSummary(dates, entries, g);
  const prev = rangeSummary(prevDates, entries, g);
  const ok = cur.judged >= minJudged && prev.judged >= minJudged && cur.rate !== null && prev.rate !== null;
  return {
    cur: cur.rate,
    prev: prev.rate,
    delta: ok ? Math.round(((cur.rate as number) - (prev.rate as number)) * 100) : null,
    curJudged: cur.judged,
    prevJudged: prev.judged,
  };
}

// ---------- seriler (grafikler) ----------

export const dailyRateSeries = (dates: string[], entries: Entries, g: Goals): (number | null)[] =>
  dates.map((d) => {
    const r = daySummary(entries[d], g).rate;
    return r === null ? null : pct(r);
  });

export interface PeriodBar {
  key: string;
  start: string;
  judged: number;
  rate: number | null;
}

export function weeklyBars(end: string, count: number, entries: Entries, g: Goals): PeriodBar[] {
  const last = weekStart(end);
  return Array.from({ length: count }, (_, i) => {
    const start = addDays(last, (i - (count - 1)) * 7);
    const days = Array.from({ length: 7 }, (_, k) => addDays(start, k));
    const s = rangeSummary(days, entries, g);
    return { key: start, start, judged: s.judged, rate: s.rate === null ? null : pct(s.rate) };
  });
}

export function monthlyBars(end: string, count: number, entries: Entries, g: Goals): PeriodBar[] {
  return Array.from({ length: count }, (_, i) => {
    const anchor = addMonths(end.slice(0, 8) + "01", i - (count - 1));
    const s = rangeSummary(monthDaysOf(anchor), entries, g);
    return { key: monthOf(anchor), start: anchor, judged: s.judged, rate: s.rate === null ? null : pct(s.rate) };
  });
}

/** Rutinin grafik değeri (yoksa null — sıfır sayılmaz). Birim: su=bardak, uyku/ekran=saat, kodlama/ders=dk, yürüyüş=seçili birim. */
export function numericOf(r: Routine, e: DayEntry | undefined, walkUnit: WalkUnit = "steps"): number | null {
  const v = e?.[r.id];
  switch (r.kind) {
    case "count":
      return typeof v === "number" ? v : null;
    case "sleep": {
      const m = sleepOf(e);
      return m === null ? null : Math.round((m / 60) * 100) / 100;
    }
    case "duration":
      return typeof v === "number" ? Math.round((v / 60) * 100) / 100 : null;
    case "walk": {
      const w = asWalk(v);
      return w && w.unit === walkUnit ? w.value : null;
    }
    case "yesno_min": {
      const y = asYesNoMin(v);
      return y && y.minutes !== undefined ? y.minutes : null;
    }
    default:
      return null;
  }
}

export const numericSeries = (r: Routine, dates: string[], entries: Entries, walkUnit?: WalkUnit) =>
  dates.map((d) => numericOf(r, entries[d], walkUnit));

export const present = (xs: (number | null)[]): number[] => xs.filter((x): x is number => x !== null);
export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

// ---------- seriler ----------

export const hasRecord = (e?: DayEntry) => !!e && ROUTINES.some((r) => statusOf(r, e, DEFAULT_GOALS_FOR_PRESENCE) !== "unrecorded");
const DEFAULT_GOALS_FOR_PRESENCE: Goals = { waterGlasses: 0, sleepHours: 0, screenMaxHours: 0, steps: 0, walkMinutes: 0 };

/** Bugünden (ya da bugün boşsa dünden) geriye doğru, art arda kayıt girilen gün sayısı. */
export function recordStreak(entries: Entries, today = todayKey()): number {
  let cursor = hasRecord(entries[today]) ? today : addDays(today, -1);
  let n = 0;
  while (hasRecord(entries[cursor]) && n < 3650) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export const routineIdsMissing = (e: DayEntry | undefined, g: Goals): Routine[] =>
  ROUTINES.filter((r) => statusOf(r, e, g) === "unrecorded");
