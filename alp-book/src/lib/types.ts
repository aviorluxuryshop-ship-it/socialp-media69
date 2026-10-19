export type Category = "saglik" | "kod" | "ders" | "fitness" | "beslenme" | "hijyen" | "diger";

export const CATEGORIES: Record<Category, { label: string; color: string }> = {
  saglik: { label: "Sağlık", color: "#00ff66" },
  kod: { label: "Kodlama", color: "#8a2be2" },
  ders: { label: "Dersler", color: "#38bdf8" },
  fitness: { label: "Fitness", color: "#ff3b6b" },
  beslenme: { label: "Beslenme", color: "#ffb020" },
  hijyen: { label: "Hijyen", color: "#2dd4bf" },
  diger: { label: "Diğer", color: "#a1a1aa" },
};

/** toggle: evet = başarı. avoid: "hayır/kaçamak yok" = başarı. */
export type HabitKind = "toggle" | "avoid";

export interface Habit {
  id: string;
  name: string;
  question: string;
  kind: HabitKind;
  category: Category;
}

/** true = evet/yapıldı, false = hayır. undefined = cevaplanmadı. */
export type DayLog = { v: Record<string, boolean>; meal?: string };

export interface Profile {
  name: string;
  ais: string[];
  fitness: string[];
  focus: string[];
  onboarded: boolean;
}

export interface Course {
  id: string;
  name: string;
  color: string;
}

export interface Exam {
  id: string;
  courseId: string;
  title: string;
  date: string; // YYYY-MM-DD
  expected: number | null; // 0-100
  actual: number | null; // 0-100
}

export interface AppData {
  profile: Profile;
  habits: Habit[];
  logs: Record<string, DayLog>;
  courses: Course[];
  exams: Exam[];
}
