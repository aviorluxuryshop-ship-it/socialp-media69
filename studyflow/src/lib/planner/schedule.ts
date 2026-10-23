// Gerçekçi çalışma planı: müsaitlik, ders programı, sınav tarihleri ve öğrenme geçmişine göre.
// Saf fonksiyonlar (test edilebilir). Rastgelelik yok: aynı girdi aynı planı üretir.
import { addDays, diffDays, hhmm, minutesOf, toDay, weekdayOf } from "@/lib/dates";
import { uid } from "@/lib/ids";
import type { DayWindow, TaskData, TaskRecord } from "@/lib/types";

export interface Slot {
  day: string;
  from: number; // dakika
  to: number;
}

export const SESSION_MIN = 40;
export const BREAK_MIN = 10;

type Busy = Pick<TaskData, "type" | "date" | "start" | "end" | "weekday" | "weekly" | "status">;

/** Bir gün için meşgul aralıklar: o günün görevleri + haftalık tekrarlı dersler */
export function busyOn(day: string, tasks: Busy[]): [number, number][] {
  const wd = weekdayOf(day);
  const out: [number, number][] = [];
  for (const t of tasks) {
    if (!t.start || !t.end) continue;
    if (t.status === "skipped") continue;
    const applies = t.type === "class" && t.weekly ? t.weekday === wd && t.date <= day : t.date === day;
    if (applies) out.push([minutesOf(t.start), minutesOf(t.end)]);
  }
  return out.sort((a, b) => a[0] - b[0]);
}

/** Müsaitlik pencerelerinden meşgul aralıkları çıkarır. */
export function freeSlots(days: string[], availability: DayWindow[], tasks: Busy[], minLen = SESSION_MIN): Slot[] {
  const slots: Slot[] = [];
  for (const day of days) {
    const wd = weekdayOf(day);
    const busy = busyOn(day, tasks);
    for (const w of availability.filter((a) => a.day === wd)) {
      let cur = minutesOf(w.from);
      const end = minutesOf(w.to);
      for (const [bs, be] of busy) {
        if (be <= cur || bs >= end) continue;
        if (bs - cur >= minLen) slots.push({ day, from: cur, to: bs });
        cur = Math.max(cur, be);
      }
      if (end - cur >= minLen) slots.push({ day, from: cur, to: end });
    }
  }
  return slots;
}

export interface PlanTopic {
  topicId: string;
  subjectId: string | null;
  /** Ağırlık: tekrar önerilen konu 2, diğer 1 */
  weight: number;
  title: string;
}

export interface PlanInput {
  today: string;
  availability: DayWindow[];
  existing: Busy[];
  topics: PlanTopic[];
  /** Hedef sınav tarihi (yoksa horizon kullanılır) */
  examDate?: string | null;
  horizonDays?: number;
  /** Günlük üst sınır (hafta içi / hafta sonu) */
  perDay?: { weekday: number; weekend: number };
  now?: number;
}

export type NewTask = Omit<TaskData, "status"> & { status: "todo" };

/**
 * Konuları yaklaşan tarihe doğru dağıtır; sınavdan 1–2 gün önce kapsayıcı tekrar bırakır.
 * Aşırı yüklemeyi önlemek için günlük oturum sayısı sınırlıdır; yer yoksa kalan konuları raporlar.
 */
export function generatePlan(input: PlanInput): { tasks: NewTask[]; unplaced: PlanTopic[]; days: number } {
  const perDay = input.perDay ?? { weekday: 2, weekend: 3 };
  const today = input.today;
  const horizon = input.horizonDays ?? 14;
  const lastDay = input.examDate && diffDays(input.examDate, today) >= 1 ? addDays(input.examDate, -1) : addDays(today, horizon - 1);
  const span = Math.max(1, Math.min(28, diffDays(lastDay, today) + 1));
  const days = Array.from({ length: span }, (_, i) => addDays(today, i));
  const nowMin = input.now !== undefined ? new Date(input.now).getHours() * 60 + new Date(input.now).getMinutes() : 0;

  // Sıralı yerleştirme için serbest aralıkları tüket
  const slots = freeSlots(days, input.availability, input.existing).map((s) => (s.day === today ? { ...s, from: Math.max(s.from, Math.ceil((nowMin + 15) / 5) * 5) } : s)).filter((s) => s.to - s.from >= SESSION_MIN);
  const used = new Map<string, number>();
  const cap = (day: string) => (weekdayOf(day) >= 5 ? perDay.weekend : perDay.weekday);

  const queue: PlanTopic[] = [];
  // Ağırlıklı kuyruk: ağırlığı 2 olan konu iki kez çalışılır (öğrenme + pekiştirme), araya diğerleri girer
  const maxW = Math.max(1, ...input.topics.map((t) => t.weight));
  for (let round = 0; round < maxW; round++) for (const t of input.topics) if (t.weight > round) queue.push(t);

  const planId = uid();
  const tasks: NewTask[] = [];
  const unplaced: PlanTopic[] = [];
  const final: PlanTopic[] = []; // sınav öncesi kapsayıcı tekrar için konular
  let q = 0;
  const lastStudyDay = input.examDate ? addDays(input.examDate, -2) : lastDay;

  for (const slot of slots) {
    if (q >= queue.length) break;
    if (slot.day > lastStudyDay && input.examDate) continue; // son gün(ler) kapsayıcı tekrara ayrılır
    let cur = slot.from;
    while (cur + SESSION_MIN <= slot.to && q < queue.length && (used.get(slot.day) ?? 0) < cap(slot.day)) {
      const t = queue[q++];
      const first = !tasks.some((x) => x.topicId === t.topicId);
      tasks.push({
        type: first ? "study" : "revision",
        title: `${first ? "Çalış" : "Pekiştir"}: ${t.title}`,
        subjectId: t.subjectId,
        topicId: t.topicId,
        date: slot.day,
        start: hhmm(cur),
        end: hhmm(cur + SESSION_MIN),
        status: "todo",
        auto: true,
        planId,
      });
      final.push(t);
      used.set(slot.day, (used.get(slot.day) ?? 0) + 1);
      cur += SESSION_MIN + BREAK_MIN;
    }
  }
  while (q < queue.length) unplaced.push(queue[q++]);

  // Sınavdan önce kapsayıcı tekrar (1 oturum): sınav gününden önceki son uygun slot
  if (input.examDate && final.length) {
    const uniq = [...new Map(final.map((t) => [t.topicId, t])).values()];
    const lastSlot = freeSlots([addDays(input.examDate, -1), addDays(input.examDate, -2)].filter((d) => diffDays(d, today) >= 0), input.availability, [...input.existing, ...tasks]).sort((a, b) => (a.day === b.day ? a.from - b.from : b.day.localeCompare(a.day)))[0];
    if (lastSlot) {
      tasks.push({
        type: "revision",
        title: `Sınav öncesi tekrar (${uniq.length} konu)`,
        subjectId: uniq[0]?.subjectId ?? null,
        topicId: null,
        topicIds: uniq.map((t) => t.topicId),
        date: lastSlot.day,
        start: hhmm(lastSlot.from),
        end: hhmm(Math.min(lastSlot.to, lastSlot.from + 60)),
        status: "todo",
        auto: true,
        planId,
      });
    }
  }
  return { tasks: tasks.sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? "").localeCompare(b.start ?? "")), unplaced, days: span };
}

export interface Reschedule {
  id: string;
  from: { date: string; start: string | null };
  to: { date: string; start: string; end: string } | null;
}

/**
 * Kaçan (tarihi geçmiş, yapılmamış) çalışma görevlerini önümüzdeki boş zamanlara önerir.
 * Bağlı bir sınav tarihi varsa sınavdan önceki güne kadar yerleştirir.
 */
export function proposeReschedule(opts: { today: string; availability: DayWindow[]; tasks: TaskRecord[]; horizonDays?: number; now?: number }): Reschedule[] {
  const { today, tasks } = opts;
  const missed = tasks.filter((t) => (t.type === "study" || t.type === "revision" || t.type === "homework") && t.status === "todo" && t.date < today).sort((a, b) => a.date.localeCompare(b.date));
  if (!missed.length) return [];
  const exams = tasks.filter((t) => t.type === "exam" && t.date >= today);
  const horizon = opts.horizonDays ?? 10;
  const days = Array.from({ length: horizon }, (_, i) => addDays(today, i));
  const nowMin = opts.now !== undefined ? new Date(opts.now).getHours() * 60 + new Date(opts.now).getMinutes() : 0;
  const placed: Busy[] = [];
  const out: Reschedule[] = [];
  const perDayUsed = new Map<string, number>();
  for (const m of missed) {
    const examFor = exams.filter((e) => e.subjectId === m.subjectId || (e.topicIds ?? []).includes(m.topicId ?? "")).sort((a, b) => a.date.localeCompare(b.date))[0];
    const limit = examFor ? addDays(examFor.date, -1) : null;
    const dur = m.start && m.end ? Math.max(20, minutesOf(m.end) - minutesOf(m.start)) : SESSION_MIN;
    const usable = days.filter((d) => !limit || d <= limit);
    const slots = freeSlots(usable, opts.availability, [...tasks.filter((t) => t.id !== m.id), ...placed], dur).map((s) => (s.day === today ? { ...s, from: Math.max(s.from, Math.ceil((nowMin + 15) / 5) * 5) } : s)).filter((s) => s.to - s.from >= dur);
    const slot = slots.find((s) => (perDayUsed.get(s.day) ?? 0) < (weekdayOf(s.day) >= 5 ? 3 : 2));
    if (!slot) {
      out.push({ id: m.id, from: { date: m.date, start: m.start }, to: null });
      continue;
    }
    const to = { date: slot.day, start: hhmm(slot.from), end: hhmm(slot.from + dur) };
    placed.push({ type: "study", date: to.date, start: to.start, end: to.end, status: "todo" });
    perDayUsed.set(slot.day, (perDayUsed.get(slot.day) ?? 0) + 1);
    out.push({ id: m.id, from: { date: m.date, start: m.start }, to });
  }
  return out;
}

export function weekDays(anchor: string): string[] {
  const start = addDays(anchor, -weekdayOf(anchor));
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function todayStr(now = Date.now()) {
  return toDay(new Date(now));
}
