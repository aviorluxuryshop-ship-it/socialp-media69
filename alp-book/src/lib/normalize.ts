import { isValidKey } from "./dates";
import { DEFAULT_GOALS, ROUTINE_BY_ID } from "./routines";
import { parseTime } from "./time";
import type { AppData, Course, DayEntry, Exam, Goals, Meal, Plan, Profile, Routine, RoutineValue, WalkUnit } from "./types";

export const emptyData = (): AppData => ({
  profile: { name: "Efehan", onboarded: false, walkUnit: "steps", soundOn: true, volume: 0.6 },
  goals: { ...DEFAULT_GOALS },
  entries: {},
  courses: [],
  exams: [],
  plans: [],
  customRoutines: [],
  hidden: [],
});

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

const pad = (n: number) => String(n).padStart(2, "0");

export const LIMITS = { water: 40, minutes: 1440, steps: 200_000, screenMin: 1440, custom: 1_000_000 } as const;

/** Tek bir rutin değerini doğrular; geçersizse undefined döner. */
export function cleanValue(id: string, v: unknown): RoutineValue | undefined {
  const r = ROUTINE_BY_ID[id];
  if (!r) {
    // Kullanıcının eklediği rutin (tanımı henüz yüklenmemiş olabilir): yalnızca genel tür doğrulaması.
    if (!id.startsWith("c_")) return undefined;
    if (typeof v === "boolean") return v;
    if (isNum(v) && v >= 0 && v <= LIMITS.custom) return Math.round(v * 100) / 100;
    const t = parseTime(v);
    return t === null ? undefined : `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
  }
  switch (r.kind) {
    case "yesno":
      return typeof v === "boolean" ? v : undefined;
    case "yesno_min": {
      if (typeof v === "boolean") return v;
      if (isObj(v) && typeof v.done === "boolean") {
        const m = v.minutes;
        if (isNum(m) && m >= 1 && m <= LIMITS.minutes) return { done: v.done, minutes: Math.round(m) };
        return { done: v.done };
      }
      return undefined;
    }
    case "count":
      return isNum(v) && v >= 0 && v <= LIMITS.water ? Math.round(v) : undefined;
    case "time": {
      const m = parseTime(v);
      return m === null ? undefined : `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
    }
    case "duration":
    case "nap":
      return isNum(v) && v >= 0 && v <= LIMITS.screenMin ? Math.round(v) : undefined;
    case "walk": {
      if (!isObj(v) || !isNum(v.value) || v.value < 0) return undefined;
      const unit: WalkUnit | null = v.unit === "steps" || v.unit === "min" ? v.unit : null;
      if (!unit) return undefined;
      const max = unit === "steps" ? LIMITS.steps : LIMITS.minutes;
      return v.value <= max ? { unit, value: Math.round(v.value) } : undefined;
    }
    case "meals": {
      if (!Array.isArray(v)) return undefined;
      const meals: Meal[] = v.filter(isObj).map((m, i) => ({
        id: typeof m.id === "string" ? m.id : `m${i}`,
        type: typeof m.type === "string" ? m.type : "Diğer",
        items: typeof m.items === "string" ? m.items : "",
        ...(typeof m.note === "string" && m.note ? { note: m.note } : {}),
      }));
      return meals.length ? meals : undefined;
    }
    case "number":
      return isNum(v) && v >= 0 && v <= LIMITS.custom ? Math.round(v * 100) / 100 : undefined;
    case "sleep":
      return undefined; // türetilen alan, saklanmaz
  }
}

function cleanEntries(raw: unknown): { entries: Record<string, DayEntry>; dropped: number } {
  const entries: Record<string, DayEntry> = {};
  let dropped = 0;
  if (!isObj(raw)) return { entries, dropped };
  for (const [date, day] of Object.entries(raw)) {
    if (!isValidKey(date) || !isObj(day)) {
      dropped++;
      continue;
    }
    const e: DayEntry = {};
    for (const [id, v] of Object.entries(day)) {
      const c = cleanValue(id, v);
      if (c === undefined) {
        if (id !== "uyku_sure") dropped++;
      } else e[id] = c;
    }
    if (Object.keys(e).length) entries[date] = e;
  }
  return { entries, dropped };
}

function cleanGoals(raw: unknown): Goals {
  const g = { ...DEFAULT_GOALS };
  if (!isObj(raw)) return g;
  for (const k of Object.keys(g) as (keyof Goals)[]) {
    const v = raw[k];
    if (isNum(v) && v > 0 && v < 100_000) g[k] = v;
  }
  return g;
}

function cleanProfile(raw: unknown): Profile {
  const p = emptyData().profile;
  if (!isObj(raw)) return p;
  if (typeof raw.name === "string" && raw.name.trim()) p.name = raw.name.trim().slice(0, 40);
  p.onboarded = raw.onboarded === true;
  if (raw.walkUnit === "min") p.walkUnit = "min";
  if (raw.soundOn === false) p.soundOn = false;
  if (isNum(raw.volume) && raw.volume >= 0 && raw.volume <= 1) p.volume = raw.volume;
  return p;
}

function cleanCourses(raw: unknown): Course[] {
  return Array.isArray(raw)
    ? raw.filter(isObj).filter((c) => typeof c.id === "string" && typeof c.name === "string").map((c) => ({ id: c.id as string, name: c.name as string, color: typeof c.color === "string" ? c.color : "#7c9cff" }))
    : [];
}

function cleanPlans(raw: unknown): Plan[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isObj)
    .filter((p) => typeof p.id === "string" && isValidKey(p.date) && typeof p.title === "string" && p.title.trim() !== "")
    .map((p) => {
      const t = parseTime(p.time);
      return {
        id: p.id as string,
        date: p.date as string,
        title: (p.title as string).trim().slice(0, 120),
        ...(t !== null ? { time: `${pad(Math.floor(t / 60))}:${pad(t % 60)}` } : {}),
        ...(typeof p.note === "string" && p.note.trim() ? { note: p.note.trim().slice(0, 500) } : {}),
        done: p.done === true,
      };
    });
}

const KINDS = ["yesno", "number", "time"] as const;

export function cleanRoutines(raw: unknown): Routine[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Routine[] = [];
  for (const r of raw.filter(isObj)) {
    if (typeof r.id !== "string" || !r.id.startsWith("c_") || seen.has(r.id)) continue;
    if (typeof r.label !== "string" || !r.label.trim()) continue;
    const kind = KINDS.find((k) => k === r.kind);
    if (!kind) continue;
    seen.add(r.id);
    out.push({
      id: r.id,
      emoji: typeof r.emoji === "string" && r.emoji ? r.emoji.slice(0, 8) : "📌",
      group: "ozel",
      label: r.label.trim().slice(0, 30),
      question: typeof r.question === "string" && r.question.trim() ? r.question.trim().slice(0, 140) : r.label.trim().slice(0, 30),
      kind,
      custom: true,
      ...(kind === "number" && typeof r.unit === "string" && r.unit.trim() ? { unit: r.unit.trim().slice(0, 12) } : {}),
      ...(kind === "number" && isNum(r.goal) && r.goal > 0 && r.goal <= LIMITS.custom ? { goal: r.goal, goalDir: r.goalDir === "max" ? ("max" as const) : ("min" as const) } : {}),
    });
    if (out.length >= 60) break;
  }
  return out;
}

const cleanHidden = (raw: unknown): string[] => (Array.isArray(raw) ? [...new Set(raw.filter((x): x is string => typeof x === "string").slice(0, 200))] : []);

const score = (x: unknown) => (isNum(x) ? Math.max(0, Math.min(100, x)) : null);

function cleanExams(raw: unknown): Exam[] {
  return Array.isArray(raw)
    ? raw
        .filter(isObj)
        .filter((e) => typeof e.id === "string" && typeof e.courseId === "string" && isValidKey(e.date))
        .map((e) => ({ id: e.id as string, courseId: e.courseId as string, title: typeof e.title === "string" ? e.title : "Sınav", date: e.date as string, expected: score(e.expected), actual: score(e.actual) }))
    : [];
}

/** Eski (v1) kayıtlardan yeni rutinlere eşleşebilenleri taşır. Geri kalan her şey `legacy` altında korunur. */
export function migrateV1(raw: unknown): AppData | null {
  if (!isObj(raw) || !isObj(raw.logs)) return null;
  const data = emptyData();
  const habits = Array.isArray(raw.habits) ? raw.habits.filter(isObj) : [];
  const map: Record<string, string> = {};
  for (const h of habits) {
    if (h.id === "code") map[h.id as string] = "yazilim";
    if (h.id === "study") map[h.id as string] = "egitim";
  }
  const entries: Record<string, DayEntry> = {};
  for (const [date, log] of Object.entries(raw.logs)) {
    if (!isValidKey(date) || !isObj(log)) continue;
    const e: DayEntry = {};
    if (isObj(log.v)) {
      for (const [hid, val] of Object.entries(log.v)) if (map[hid] && typeof val === "boolean") e[map[hid]] = val;
    }
    if (typeof log.meal === "string" && log.meal.trim()) e.beslenme = [{ id: `m-${date}`, type: "Diğer", items: log.meal.trim() }];
    if (Object.keys(e).length) entries[date] = e;
  }
  data.entries = entries;
  if (isObj(raw.profile)) {
    data.profile = { ...data.profile, name: typeof raw.profile.name === "string" && raw.profile.name.trim() ? raw.profile.name.trim() : "Efehan", onboarded: raw.profile.onboarded === true };
  }
  data.courses = cleanCourses(raw.courses);
  data.exams = cleanExams(raw.exams);
  data.legacy = { version: 1, profile: raw.profile, habits: raw.habits, logs: raw.logs };
  return data;
}

/** Bilinmeyen kaynaktan (localStorage, yedek dosyası) gelen veriyi güvenli bir AppData'ya çevirir. */
export function normalizeData(raw: unknown): { data: AppData; dropped: number } | null {
  if (!isObj(raw)) return null;
  // Yedek dosyası { app, version, data } sarmalayıcısıyla gelebilir.
  const src = isObj(raw.data) && !("entries" in raw) && !("logs" in raw) ? raw.data : raw;
  if (!isObj(src)) return null;
  if ("logs" in src && !("entries" in src)) {
    const m = migrateV1(src);
    return m ? { data: m, dropped: 0 } : null;
  }
  if (!("entries" in src)) return null;
  const { entries, dropped } = cleanEntries(src.entries);
  return {
    dropped,
    data: {
      profile: cleanProfile(src.profile),
      goals: cleanGoals(src.goals),
      entries,
      courses: cleanCourses(src.courses),
      exams: cleanExams(src.exams),
      plans: cleanPlans(src.plans),
      customRoutines: cleanRoutines(src.customRoutines),
      hidden: cleanHidden(src.hidden),
      ...(src.legacy !== undefined ? { legacy: src.legacy } : {}),
    },
  };
}
