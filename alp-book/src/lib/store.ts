"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildHabits, emptyData, uid } from "./defaults";
import type { AppData, Course, Exam, Habit, Profile } from "./types";

interface Actions {
  hydrated: boolean;
  finishOnboarding: (p: Omit<Profile, "onboarded">) => void;
  setProfile: (p: Partial<Profile>) => void;
  setValue: (date: string, habitId: string, value: boolean | undefined) => void;
  setMeal: (date: string, meal: string) => void;
  addHabit: (h: Omit<Habit, "id">) => void;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  removeHabit: (id: string) => void;
  addCourse: (name: string, color: string) => Course;
  removeCourse: (id: string) => void;
  addExam: (e: Omit<Exam, "id">) => void;
  updateExam: (id: string, patch: Partial<Exam>) => void;
  removeExam: (id: string) => void;
  importData: (d: AppData) => void;
  reset: () => void;
}

export type Store = AppData & Actions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...emptyData(),
      hydrated: false,

      finishOnboarding: ({ name, ais, fitness, focus }) =>
        set({
          profile: { name: name.trim() || "Efehan", ais, fitness, focus, onboarded: true },
          habits: buildHabits(ais, fitness, focus),
        }),

      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),

      setValue: (date, habitId, value) =>
        set((s) => {
          const log = s.logs[date] ?? { v: {} };
          const v = { ...log.v };
          if (value === undefined) delete v[habitId];
          else v[habitId] = value;
          return { logs: { ...s.logs, [date]: { ...log, v } } };
        }),

      setMeal: (date, meal) =>
        set((s) => {
          const log = s.logs[date] ?? { v: {} };
          return { logs: { ...s.logs, [date]: { ...log, meal } } };
        }),

      addHabit: (h) => set((s) => ({ habits: [...s.habits, { ...h, id: uid() }] })),
      updateHabit: (id, patch) => set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      removeHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),

      addCourse: (name, color) => {
        const c = { id: uid(), name: name.trim(), color };
        set((s) => ({ courses: [...s.courses, c] }));
        return c;
      },
      removeCourse: (id) =>
        set((s) => ({ courses: s.courses.filter((c) => c.id !== id), exams: s.exams.filter((e) => e.courseId !== id) })),

      addExam: (e) => set((s) => ({ exams: [...s.exams, { ...e, id: uid() }] })),
      updateExam: (id, patch) => set((s) => ({ exams: s.exams.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      removeExam: (id) => set((s) => ({ exams: s.exams.filter((e) => e.id !== id) })),

      importData: (d) => set({ ...emptyData(), ...d }),
      reset: () => set({ ...emptyData() }),
    }),
    {
      name: "alpbook:v1",
      version: 1,
      partialize: (s) => ({ profile: s.profile, habits: s.habits, logs: s.logs, courses: s.courses, exams: s.exams }),
    },
  ),
);

export const snapshot = (): AppData => {
  const { profile, habits, logs, courses, exams } = useStore.getState();
  return { profile, habits, logs, courses, exams };
};
