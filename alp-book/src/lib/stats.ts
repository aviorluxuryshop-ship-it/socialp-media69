import { addDays, lastNDays, todayKey } from "./dates";
import type { AppData, Category, DayLog, Habit } from "./types";

export const STREAK_THRESHOLD = 0.5;

export const isSuccess = (h: Habit, log?: DayLog): boolean => {
  const v = log?.v[h.id];
  return h.kind === "toggle" ? v === true : v === false;
};

export const isAnswered = (h: Habit, log?: DayLog): boolean => log?.v[h.id] !== undefined;

export function dayScore(date: string, data: Pick<AppData, "habits" | "logs">): number {
  const { habits, logs } = data;
  if (!habits.length) return 0;
  const log = logs[date];
  return habits.filter((h) => isSuccess(h, log)).length / habits.length;
}

export function streak(data: Pick<AppData, "habits" | "logs">, today = todayKey()): number {
  let cursor = today;
  if (dayScore(cursor, data) < STREAK_THRESHOLD) cursor = addDays(cursor, -1);
  let n = 0;
  while (dayScore(cursor, data) >= STREAK_THRESHOLD && n < 3650) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function bestStreak(data: Pick<AppData, "habits" | "logs">, span = 365, today = todayKey()): number {
  let best = 0;
  let run = 0;
  for (const d of lastNDays(span, today)) {
    if (dayScore(d, data) >= STREAK_THRESHOLD) best = Math.max(best, ++run);
    else run = 0;
  }
  return best;
}

export function habitStreak(h: Habit, logs: AppData["logs"], today = todayKey()): number {
  let cursor = today;
  if (!isSuccess(h, logs[cursor])) cursor = addDays(cursor, -1);
  let n = 0;
  while (isSuccess(h, logs[cursor]) && n < 3650) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function categoryTotals(data: Pick<AppData, "habits" | "logs">, days: string[]) {
  const out = new Map<Category, { done: number; total: number }>();
  for (const h of data.habits) {
    const row = out.get(h.category) ?? { done: 0, total: 0 };
    for (const d of days) {
      row.total++;
      if (isSuccess(h, data.logs[d])) row.done++;
    }
    out.set(h.category, row);
  }
  return [...out.entries()].map(([category, v]) => ({ category, ...v }));
}

export const pct = (x: number) => Math.round(x * 100);
