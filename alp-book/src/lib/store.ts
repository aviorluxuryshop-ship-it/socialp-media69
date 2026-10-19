"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { isValidKey, todayKey } from "./dates";
import { migrateV1, emptyData, normalizeData, cleanValue } from "./normalize";
import { uid } from "./uid";
import type { AppData, Course, Exam, Goals, Profile, RoutineValue } from "./types";

export const STORAGE_KEY = "alpbook:v2";
const LEGACY_KEY = "alpbook:v1";

interface Actions {
  hydrated: boolean;
  finishOnboarding: (name: string) => void;
  setProfile: (p: Partial<Profile>) => void;
  setGoals: (g: Partial<Goals>) => void;
  /** value === undefined → kaydı siler ("kaydedilmedi"ye döndürür). Geçersiz değerler reddedilir (false döner). */
  setValue: (date: string, routineId: string, value: RoutineValue | undefined) => boolean;
  addCourse: (name: string, color: string) => Course;
  removeCourse: (id: string) => void;
  addExam: (e: Omit<Exam, "id">) => void;
  updateExam: (id: string, patch: Partial<Exam>) => void;
  removeExam: (id: string) => void;
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

      finishOnboarding: (name) => set((s) => ({ profile: { ...s.profile, name: name.trim().slice(0, 40) || "Efehan", onboarded: true } })),
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

      replaceData: (d) => set({ ...emptyData(), ...d }),
      reset: () => set({ ...emptyData() }),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => storage),
      partialize: (s) => ({ profile: s.profile, goals: s.goals, entries: s.entries, courses: s.courses, exams: s.exams, legacy: s.legacy }),
      // Kayıtlı veri bozuk/kısmi olsa bile uygulama açılır; geçerli kısımlar korunur.
      merge: (persisted, current) => {
        const n = normalizeData(persisted);
        return n ? { ...current, ...n.data } : current;
      },
    },
  ),
);

export const snapshot = (): AppData => {
  const { profile, goals, entries, courses, exams, legacy } = useStore.getState();
  return { profile, goals, entries, courses, exams, ...(legacy !== undefined ? { legacy } : {}) };
};
