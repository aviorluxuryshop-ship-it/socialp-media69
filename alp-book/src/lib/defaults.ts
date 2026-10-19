import type { AppData, Category, Habit } from "./types";

export const AI_OPTIONS = ["Claude", "Cursor", "ChatGPT", "Gemini", "Copilot", "Perplexity", "Midjourney"];
export const FITNESS_OPTIONS = ["Boks", "Fitness / Ağırlık", "Koşu", "Yürüyüş", "Esneme", "Yüzme", "Bisiklet"];
export const FOCUS_OPTIONS: { label: string; category: Category }[] = [
  { label: "Dersler", category: "ders" },
  { label: "Kodlama", category: "kod" },
  { label: "Beslenme", category: "beslenme" },
  { label: "Uyku", category: "saglik" },
  { label: "Su içme", category: "saglik" },
  { label: "Okuma", category: "diger" },
  { label: "Meditasyon", category: "saglik" },
];

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

/** Her kullanıcıda bulunan çekirdek kartlar. */
export function coreHabits(): Habit[] {
  return [
    { id: "snack", name: "Atıştırmalık kaçamağı", question: "Atıştırmalık kaçamağı oldu mu?", kind: "avoid", category: "beslenme" },
    { id: "teeth", name: "Diş fırçalama", question: "Diş fırçalandı mı?", kind: "toggle", category: "hijyen" },
  ];
}

/** Onboarding cevaplarından kişiselleştirilmiş alışkanlık listesi üretir. */
export function buildHabits(ais: string[], fitness: string[], focus: string[]): Habit[] {
  const list: Habit[] = [];
  const ai = ais.includes("Claude") ? "Claude" : ais[0];
  if (ai || focus.includes("Kodlama")) {
    list.push({
      id: "code",
      name: ai ? `${ai} ile kodlama` : "Kodlama",
      question: ai ? `${ai} ile kod yazdın / proje yaptın mı?` : "Kod yazdın / proje yaptın mı?",
      kind: "toggle",
      category: "kod",
    });
  }
  list.push(...coreHabits());
  if (fitness.length) {
    const label = fitness[0];
    list.push({ id: "workout", name: label, question: `${label} antrenmanı yaptın mı?`, kind: "toggle", category: "fitness" });
  }
  if (focus.includes("Dersler")) list.push({ id: "study", name: "Ders çalışma", question: "Ders çalıştın mı?", kind: "toggle", category: "ders" });
  if (focus.includes("Uyku")) list.push({ id: "sleep", name: "Erken yatış", question: "Zamanında uyudun mu?", kind: "toggle", category: "saglik" });
  if (focus.includes("Su içme")) list.push({ id: "water", name: "Su", question: "Yeterince su içtin mi?", kind: "toggle", category: "saglik" });
  if (focus.includes("Okuma")) list.push({ id: "read", name: "Okuma", question: "Kitap okudun mu?", kind: "toggle", category: "diger" });
  if (focus.includes("Meditasyon")) list.push({ id: "mind", name: "Meditasyon", question: "Meditasyon yaptın mı?", kind: "toggle", category: "saglik" });
  return list;
}

export function emptyData(): AppData {
  return {
    profile: { name: "Efehan", ais: [], fitness: [], focus: [], onboarded: false },
    habits: [],
    logs: {},
    courses: [],
    exams: [],
  };
}
