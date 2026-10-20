"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { isValidKey, todayKey } from "./dates";
import { migrateV1, emptyData, normalizeData, cleanValue } from "./normalize";
import { DEFAULT_ROUTINES, setRoutineRegistry } from "./routines";
import { uid } from "./uid";
import type { AppData, Course, Exam, Goals, Plan, Profile, Routine, RoutineValue } from "./types";

export const STORAGE_KEY = "alpbook:v2";
const LEGACY_KEY = "alpbook:v1";

interface Actions {
  hydrated: boolean;
  /** useDefaults=false: hazır rutinleri gizleyerek boş başlar. */
  finishOnboarding: (name: string, useDefaults?: boolean) => void;
  addRoutine: (r: Omit<Routine, "id" | "group" | "custom">) => string | null;
  hideRoutine: (id: string) => void;
  showRoutine: (id: string) => void;
  setProfile: (p: Partial<Profile>) => void;
  setGoals: (g: Partial<Goals>) => void;
  /** value === undefined → kaydı siler ("kaydedilmedi"ye döndürür). Geçersiz değerler reddedilir (false döner). */
  setValue: (date: string, routineId: string, value: RoutineValue | undefined) => boolean;
  addCourse: (name: string, color: string) => Course;
  removeCourse: (id: string) => void;
  addExam: (e: Omit<Exam, "id">) => void;
  updateExam: (id: string, patch: Partial<Exam>) => void;
  removeExam: (id: string) => void;
  addPlan: (p: Omit<Plan, "id" | "done">) => boolean;
  updatePlan: (id: string, patch: Partial<Omit<Plan, "id">>) => void;
  togglePlan: (id: string) => void;
  removePlan: (id: string) => void;
  replaceData: (d: AppData) => void;
  reset: () => void;
}

export type Store = AppData & Actions;

/** Kaydetme geri bildirimi için kalıcı olmayan küçük arayüz durumu. */
export const useUi = create<{ savedAt: number | null }>(() => ({ savedAt: null }));

/** Yeni (v2) anahtar yoksa eski (v1) kaydı okuyup dönüştürür. Eski anahtara dokunulmaz, silinmez. */
const storage: StateStorage = {
  getItem: (name) => {
    try {
      const cur = localStorage.getItem(name);
      if (cur !== null) return cur;
      const old = localStorage.getItem(LEGACY_KEY);
      if (old === null) return null;
      const parsed = JSON.parse(old);
      const migrated = migrateV1(parsed?.state);
      return migrated ? JSON.stringify({ state: migrated, version: 2 }) : null;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* depolama dolu/engelli */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* yoksay */
    }
  },
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...emptyData(),
      hydrated: false,

      finishOnboarding: (name, useDefaults = true) =>
        set((s) => ({
          profile: { ...s.profile, name: name.trim().slice(0, 40), onboarded: true },
          hidden: useDefaults ? s.hidden : DEFAULT_ROUTINES.map((r) => r.id),
        })),

      addRoutine: (r) => {
        const label = r.label.trim().slice(0, 30);
        if (!label) return null;
        const id = `c_${uid()}`;
        const routine: Routine = {
          ...r,
          id,
          label,
          question: r.question.trim().slice(0, 140) || label,
          group: "ozel",
          custom: true,
          ...(r.kind === "number" ? {} : { unit: undefined, goal: undefined, goalDir: undefined }),
        };
        if (routine.kind !== "number") {
          delete routine.unit;
          delete routine.goal;
          delete routine.goalDir;
        }
        set((s) => ({ customRoutines: [...s.customRoutines, routine] }));
        return id;
      },
      hideRoutine: (id) => set((s) => (s.hidden.includes(id) ? s : { hidden: [...s.hidden, id] })),
      showRoutine: (id) => set((s) => ({ hidden: s.hidden.filter((x) => x !== id) })),
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setGoals: (g) => set((s) => ({ goals: { ...s.goals, ...g } })),

      setValue: (date, routineId, value) => {
        if (!isValidKey(date) || date > todayKey()) return false;
        let clean: RoutineValue | undefined;
        if (value !== undefined) {
          clean = cleanValue(routineId, value);
          // Boş öğün listesi / geçersiz değer: kaydetme.
          if (clean === undefined && !(Array.isArray(value) && value.length === 0)) return false;
        }
        const day = { ...(get().entries[date] ?? {}) };
        if (clean === undefined) delete day[routineId];
        else day[routineId] = clean;
        const entries = { ...get().entries };
        if (Object.keys(day).length) entries[date] = day;
        else delete entries[date];
        set({ entries });
        useUi.setState({ savedAt: Date.now() });
        return true;
      },

      addCourse: (name, color) => {
        const c = { id: uid(), name: name.trim(), color };
        set((s) => ({ courses: [...s.courses, c] }));
        return c;
      },
      removeCourse: (id) => set((s) => ({ courses: s.courses.filter((c) => c.id !== id), exams: s.exams.filter((e) => e.courseId !== id) })),
      addExam: (e) => set((s) => ({ exams: [...s.exams, { ...e, id: uid() }] })),
      updateExam: (id, patch) => set((s) => ({ exams: s.exams.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      removeExam: (id) => set((s) => ({ exams: s.exams.filter((e) => e.id !== id) })),

      addPlan: (p) => {
        const title = p.title.trim().slice(0, 120);
        if (!title || !isValidKey(p.date)) return false;
        const plan: Plan = { id: uid(), date: p.date, title, done: false, ...(p.time ? { time: p.time } : {}), ...(p.note?.trim() ? { note: p.note.trim().slice(0, 500) } : {}) };
        set((s) => ({ plans: [...s.plans, plan] }));
        return true;
      },
      updatePlan: (id, patch) => set((s) => ({ plans: s.plans.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      togglePlan: (id) => set((s) => ({ plans: s.plans.map((p) => (p.id === id ? { ...p, done: !p.done } : p)) })),
      removePlan: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),

      replaceData: (d) => set({ ...emptyData(), ...d }),
      reset: () => set({ ...emptyData() }),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => storage),
      partialize: (s) => ({ profile: s.profile, goals: s.goals, entries: s.entries, courses: s.courses, exams: s.exams, plans: s.plans, customRoutines: s.customRoutines, hidden: s.hidden, legacy: s.legacy }),
      // Kayıtlı veri bozuk/kısmi olsa bile uygulama açılır; geçerli kısımlar korunur.
      merge: (persisted, current) => {
        const n = normalizeData(persisted);
        return n ? { ...current, ...n.data } : current;
      },
    },
  ),
);

export const snapshot = (): AppData => {
  const { profile, goals, entries, courses, exams, plans, customRoutines, hidden, legacy } = useStore.getState();
  return { profile, goals, entries, courses, exams, plans, customRoutines, hidden, ...(legacy !== undefined ? { legacy } : {}) };
};

// Etkin rutin listesini store ile senkron tut (hidrasyon, içe aktarma, bulut eşitlemesi dahil).
setRoutineRegistry(useStore.getState().customRoutines, useStore.getState().hidden);
useStore.subscribe((s, prev) => {
  if (s.customRoutines !== prev.customRoutines || s.hidden !== prev.hidden) setRoutineRegistry(s.customRoutines, s.hidden);
});
