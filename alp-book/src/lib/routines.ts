import type { GroupId, Goals, Routine } from "./types";

export const GROUPS: Record<GroupId, { label: string; color: string }> = {
  yazilim: { label: "Yazılım", color: "#7c9cff" },
  egitim: { label: "Eğitim", color: "#b794f6" },
  okul: { label: "Okul", color: "#5ec8e5" },
  saglik: { label: "Sağlık", color: "#4de0a0" },
  uyku: { label: "Uyku", color: "#8f9bff" },
  dijital: { label: "Dijital yaşam", color: "#f2b35e" },
  bakim: { label: "Kişisel bakım", color: "#52d6c4" },
  duzen: { label: "Düzen", color: "#c3b58a" },
  aktivite: { label: "Aktivite", color: "#f0788a" },
  beslenme: { label: "Beslenme", color: "#a3d96a" },
};

/** Varsayılan rutin listesi — sıra sabittir. */
export const ROUTINES: Routine[] = [
  { id: "yazilim", emoji: "💻", group: "yazilim", label: "Kodlama", question: "Bugün kodlama yaptın mı?", kind: "yesno_min" },
  { id: "egitim", emoji: "📚", group: "egitim", label: "Ders çalışma", question: "Ders çalıştın mı?", kind: "yesno_min" },
  { id: "okul_gitti", emoji: "🏫", group: "okul", label: "Okula gitme", question: "Bugün okula gittin mi?", kind: "yesno" },
  { id: "okul_odev", emoji: "🏫", group: "okul", label: "Ödevler", question: "Ödevlerini tamamladın mı?", kind: "yesno" },
  { id: "su", emoji: "💧", group: "saglik", label: "Su", question: "Kaç bardak su içtin?", kind: "count" },
  { id: "uyku_yatis", emoji: "😴", group: "uyku", label: "Yatış saati", question: "Saat kaçta yattın?", kind: "time" },
  { id: "uyku_kalkis", emoji: "😴", group: "uyku", label: "Uyanış saati", question: "Saat kaçta uyandın?", kind: "time" },
  { id: "uyku_sure", emoji: "😴", group: "uyku", label: "Uyku süresi", question: "Kaç saat uyudun?", kind: "sleep" },
  { id: "uyku_gunici", emoji: "💤", group: "uyku", label: "Gün içi uyku", question: "Gün içinde uyudun mu? Ne kadar?", kind: "nap" },
  { id: "ekran", emoji: "📱", group: "dijital", label: "Ekran süresi", question: "Kaç saat ekran başında kaldın?", kind: "duration" },
  { id: "dis_sabah", emoji: "🪥", group: "bakim", label: "Sabah dişler", question: "Sabah dişlerini fırçaladın mı?", kind: "yesno" },
  { id: "dis_aksam", emoji: "🪥", group: "bakim", label: "Akşam dişler", question: "Akşam dişlerini fırçaladın mı?", kind: "yesno" },
  { id: "yatak", emoji: "🛏️", group: "duzen", label: "Yatak toplama", question: "Yatağını topladın mı?", kind: "yesno" },
  { id: "yuruyus", emoji: "🚶", group: "aktivite", label: "Yürüyüş", question: "Bugün ne kadar yürüdün?", kind: "walk" },
  { id: "beslenme", emoji: "🥗", group: "beslenme", label: "Yemekler", question: "Bugün ne yedin?", kind: "meals" },
];

export const ROUTINE_BY_ID: Record<string, Routine> = Object.fromEntries(ROUTINES.map((r) => [r.id, r]));

export const MEAL_TYPES = ["Kahvaltı", "Öğle yemeği", "Akşam yemeği", "Ara öğün", "Diğer"];

export const DEFAULT_GOALS: Goals = {
  waterGlasses: 8,
  sleepHours: 7,
  screenMaxHours: 4,
  steps: 6000,
  walkMinutes: 30,
};
