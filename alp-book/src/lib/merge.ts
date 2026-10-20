import { DEFAULT_GOALS } from "./routines";
import type { AppData, Course, DayEntry, Exam, Goals, Plan, Routine } from "./types";

/** Bulutta ayrı bir belgede saklanan, ay dışındaki her şey. Cihaza özel tercihler (ses, yürüyüş birimi) dahil değildir. */
export interface MetaDoc {
  name: string;
  onboarded: boolean;
  goals: Goals;
  courses: Course[];
  exams: Exam[];
  plans: Plan[];
  customRoutines: Routine[];
  hidden: string[];
  legacy?: unknown;
}

export const monthOfDate = (date: string) => date.slice(0, 7);

/** { "2026-10-19": {...} } → { "2026-10": { "2026-10-19": {...} } } */
export function splitMonths(entries: Record<string, DayEntry>): Record<string, Record<string, DayEntry>> {
  const out: Record<string, Record<string, DayEntry>> = {};
  for (const [date, e] of Object.entries(entries)) (out[monthOfDate(date)] ??= {})[date] = e;
  return out;
}

export function toMeta(d: AppData): MetaDoc {
  const legacy = d.legacy !== undefined && JSON.stringify(d.legacy).length < 200_000 ? { legacy: d.legacy } : {};
  return { name: d.profile.name, onboarded: d.profile.onboarded, goals: d.goals, courses: d.courses, exams: d.exams, plans: d.plans, customRoutines: d.customRoutines, hidden: d.hidden, ...legacy };
}

const unionById = <T extends { id: string }>(cloud: T[], local: T[]): T[] => {
  const ids = new Set(local.map((x) => x.id));
  return [...cloud.filter((x) => !ids.has(x.id)), ...local];
};

const isDefaultGoals = (g: Goals) => (Object.keys(DEFAULT_GOALS) as (keyof Goals)[]).every((k) => g[k] === DEFAULT_GOALS[k]);

/**
 * İlk bağlanışta bulut ve bu cihazdaki veriyi birleştirir; hiçbir kayıt silinmez.
 * Aynı gün ve rutinde çakışma olursa bu cihazdaki (yeni girilen) değer kazanır.
 */
export function mergeData(cloud: AppData, local: AppData): AppData {
  const entries: Record<string, DayEntry> = {};
  for (const [d, e] of Object.entries(cloud.entries)) entries[d] = { ...e };
  for (const [d, e] of Object.entries(local.entries)) entries[d] = { ...(entries[d] ?? {}), ...e };
  return {
    profile: {
      ...local.profile, // ses, birim gibi cihaz tercihleri yerelde kalır
      name: local.profile.onboarded ? local.profile.name : cloud.profile.name,
      onboarded: local.profile.onboarded || cloud.profile.onboarded,
    },
    goals: isDefaultGoals(local.goals) ? cloud.goals : local.goals,
    entries,
    courses: unionById(cloud.courses, local.courses),
    exams: unionById(cloud.exams, local.exams),
    plans: unionById(cloud.plans, local.plans),
    customRoutines: unionById(cloud.customRoutines, local.customRoutines),
    hidden: local.profile.onboarded ? local.hidden : cloud.hidden,
    ...((local.legacy ?? cloud.legacy) !== undefined ? { legacy: local.legacy ?? cloud.legacy } : {}),
  };
}
