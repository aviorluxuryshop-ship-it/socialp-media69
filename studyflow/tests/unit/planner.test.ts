import { describe, expect, it } from "vitest";
import { addDays, diffDays, minutesOf, weekdayOf } from "@/lib/dates";
import { freeSlots, generatePlan, type PlanTopic, proposeReschedule, SESSION_MIN, weekDays } from "@/lib/planner/schedule";
import type { DayWindow, TaskRecord } from "@/lib/types";

const MONDAY = "2026-11-02"; // Pazartesi
const avail: DayWindow[] = [0, 1, 2, 3, 4].map((day) => ({ day, from: "17:00", to: "20:00" })).concat([5, 6].map((day) => ({ day, from: "10:00", to: "16:00" })));
const topics = (n: number, weight = 1): PlanTopic[] => Array.from({ length: n }, (_, i) => ({ topicId: `b1-t1.${i + 1}`, subjectId: "mat", weight, title: `Konu ${i + 1}` }));

describe("tarih yardımcıları", () => {
  it("hafta günü Pazartesi=0", () => {
    expect(weekdayOf(MONDAY)).toBe(0);
    expect(weekdayOf(addDays(MONDAY, 6))).toBe(6);
    expect(diffDays(addDays(MONDAY, 10), MONDAY)).toBe(10);
  });
  it("weekDays 7 gün döndürür ve Pazartesi'den başlar", () => {
    const w = weekDays(addDays(MONDAY, 3));
    expect(w).toHaveLength(7);
    expect(w[0]).toBe(MONDAY);
  });
});

describe("freeSlots", () => {
  it("meşgul aralığı müsaitlikten çıkarır", () => {
    const slots = freeSlots([MONDAY], avail, [{ type: "class", date: MONDAY, start: "18:00", end: "19:00", status: "todo" }]);
    expect(slots).toEqual([
      { day: MONDAY, from: 17 * 60, to: 18 * 60 },
      { day: MONDAY, from: 19 * 60, to: 20 * 60 },
    ]);
  });
  it("haftalık tekrarlı dersi yalnızca ilgili günde uygular", () => {
    const cls = { type: "class" as const, date: MONDAY, start: "17:00", end: "20:00", weekly: true, weekday: 0, status: "todo" as const };
    expect(freeSlots([MONDAY], avail, [cls])).toEqual([]);
    expect(freeSlots([addDays(MONDAY, 1)], avail, [cls])).toHaveLength(1);
    // dersin başlangıç tarihinden önceki günlere uygulanmaz
    expect(freeSlots([addDays(MONDAY, -7)], avail, [cls])).toHaveLength(1);
  });
  it("oturum süresinden kısa boşlukları yok sayar", () => {
    const slots = freeSlots([MONDAY], avail, [{ type: "homework", date: MONDAY, start: "17:20", end: "20:00", status: "todo" }]);
    expect(slots).toEqual([]);
  });
});

describe("generatePlan", () => {
  const base = { today: MONDAY, availability: avail, existing: [], topics: topics(4) };
  it("deterministiktir ve günlük sınıra uyar", () => {
    const a = generatePlan(base);
    const b = generatePlan(base);
    expect(a.tasks.map((t) => [t.date, t.start, t.topicId])).toEqual(b.tasks.map((t) => [t.date, t.start, t.topicId]));
    const perDay = new Map<string, number>();
    for (const t of a.tasks) perDay.set(t.date, (perDay.get(t.date) ?? 0) + 1);
    for (const [d, n] of perDay) expect(n).toBeLessThanOrEqual(weekdayOf(d) >= 5 ? 3 : 2);
    expect(a.unplaced).toEqual([]);
  });
  it("oturumlar çakışmaz, mola bırakır ve müsaitlik içinde kalır", () => {
    const { tasks } = generatePlan({ ...base, topics: topics(8) });
    tasks.forEach((t) => {
      expect(minutesOf(t.end!) - minutesOf(t.start!)).toBe(SESSION_MIN);
      const w = avail.find((x) => x.day === weekdayOf(t.date))!;
      expect(minutesOf(t.start!)).toBeGreaterThanOrEqual(minutesOf(w.from));
      expect(minutesOf(t.end!)).toBeLessThanOrEqual(minutesOf(w.to));
    });
    for (let i = 1; i < tasks.length; i++) {
      if (tasks[i].date === tasks[i - 1].date) expect(minutesOf(tasks[i].start!)).toBeGreaterThanOrEqual(minutesOf(tasks[i - 1].end!) + 10);
    }
  });
  it("mevcut ders programıyla çakışmaz", () => {
    const existing = [{ type: "class" as const, date: MONDAY, start: "17:00", end: "19:00", weekly: true, weekday: 0, status: "todo" as const }];
    const { tasks } = generatePlan({ ...base, existing });
    for (const t of tasks.filter((x) => x.date === MONDAY)) expect(minutesOf(t.start!)).toBeGreaterThanOrEqual(19 * 60);
  });
  it("ağırlığı 2 olan konu iki kez çalışılır (öğrenme + pekiştirme)", () => {
    const { tasks } = generatePlan({ ...base, topics: [{ ...topics(1)[0], weight: 2 }] });
    expect(tasks.map((t) => t.type)).toEqual(["study", "revision"]);
  });
  it("sınav varsa sınav gününden önce kalır ve kapsayıcı tekrar ekler", () => {
    const examDate = addDays(MONDAY, 7);
    const { tasks } = generatePlan({ ...base, examDate });
    expect(tasks.every((t) => t.date < examDate)).toBe(true);
    expect(tasks.some((t) => /Sınav öncesi tekrar/.test(t.title))).toBe(true);
  });
  it("yer yoksa konuları 'yerleştirilemedi' diye bildirir (sessizce düşürmez)", () => {
    const tiny: DayWindow[] = [{ day: 0, from: "17:00", to: "17:45" }];
    const r = generatePlan({ ...base, availability: tiny, topics: topics(50), horizonDays: 7 });
    expect(r.tasks.length).toBeLessThan(50);
    expect(r.tasks.length + r.unplaced.length).toBe(50);
  });
  it("müsaitlik yoksa hiçbir şey uydurmaz", () => {
    const r = generatePlan({ ...base, availability: [] });
    expect(r.tasks).toEqual([]);
    expect(r.unplaced).toHaveLength(4);
  });
});

describe("proposeReschedule", () => {
  const task = (o: Partial<TaskRecord>): TaskRecord =>
    ({ id: "x", kind: "task", createdAt: 0, updatedAt: 0, type: "study", title: "Çalış", subjectId: "mat", topicId: null, date: addDays(MONDAY, -2), start: "17:00", end: "17:40", status: "todo", auto: true, ...o }) as TaskRecord;
  it("kaçan görevi boş zamana önerir ama kendisi değiştirmez", () => {
    const t = task({ id: "a" });
    const r = proposeReschedule({ today: MONDAY, availability: avail, tasks: [t] });
    expect(r).toHaveLength(1);
    expect(r[0].to).not.toBeNull();
    expect(r[0].to!.date >= MONDAY).toBe(true);
    expect(t.date).toBe(addDays(MONDAY, -2));
  });
  it("sınavdan sonrasına yerleştirmez", () => {
    const exam = task({ id: "e", type: "exam", date: addDays(MONDAY, 1), start: null, end: null });
    const r = proposeReschedule({ today: MONDAY, availability: avail, tasks: [task({ id: "a" }), exam] });
    expect(r[0].to === null || r[0].to.date <= MONDAY).toBe(true);
  });
  it("yapılmış veya gelecekteki görevlere dokunmaz", () => {
    const r = proposeReschedule({ today: MONDAY, availability: avail, tasks: [task({ id: "d", status: "done" }), task({ id: "f", date: addDays(MONDAY, 1) })] });
    expect(r).toEqual([]);
  });
});
