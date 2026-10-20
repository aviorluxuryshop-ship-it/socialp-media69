import type { Plan } from "./types";

/** Aynı gün içinde saatli planlar saate göre, saatsizler sonra (eklenme sırasıyla). */
export function sortPlans(plans: Plan[]): Plan[] {
  return plans
    .map((p, i) => ({ p, i }))
    .sort((a, b) => {
      if (a.p.time && b.p.time) return a.p.time.localeCompare(b.p.time) || a.i - b.i;
      if (a.p.time) return -1;
      if (b.p.time) return 1;
      return a.i - b.i;
    })
    .map((x) => x.p);
}

export function plansByDate(plans: Plan[]): Map<string, Plan[]> {
  const m = new Map<string, Plan[]>();
  for (const p of plans) m.set(p.date, [...(m.get(p.date) ?? []), p]);
  for (const [k, v] of m) m.set(k, sortPlans(v));
  return m;
}
