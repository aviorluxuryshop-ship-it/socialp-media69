// Saf hesaplamalar: raporlar, panolar ve personel paneli aynı fonksiyonları kullanır.
import { BUSY_STATUSES, LAPSED_DAYS, REVENUE_STATUSES } from "./constants";
import { addDays, daysBetween, diffDays, formatDayShort, inRange, parseKey, timeToMin, weekday, type Period } from "./dates";
import type { AppData, Appointment, BranchFilter, Customer, PaymentMethod, Staff, Transaction } from "./types";

export const matchBranch = (branchId: string, f: BranchFilter) => f === "all" || branchId === f;

export function apptsIn(data: Pick<AppData, "appointments">, start: string, end: string, f: BranchFilter): Appointment[] {
  return data.appointments.filter((a) => inRange(a.date, start, end) && matchBranch(a.branchId, f));
}

export function txIn(data: Pick<AppData, "transactions">, start: string, end: string, f: BranchFilter): Transaction[] {
  return data.transactions.filter((t) => inRange(t.date, start, end) && matchBranch(t.branchId, f));
}

export const isRevenue = (a: Appointment) => REVENUE_STATUSES.includes(a.status);
export const isBusy = (a: Appointment) => BUSY_STATUSES.includes(a.status);
export const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + f(x), 0);

/** Personelin bir gün çalışıp çalışmadığı. */
export function worksOn(s: Staff, day: string): boolean {
  return s.active && s.workDays.includes(weekday(day));
}

/** Dönemde personelin çalışabileceği toplam dakika (şube açık saatlerine göre). */
export function availableMinutes(data: Pick<AppData, "staff" | "branches">, start: string, end: string, f: BranchFilter, staffId?: string): number {
  const days = daysBetween(start, end);
  let total = 0;
  for (const s of data.staff) {
    if (!matchBranch(s.branchId, f) || (staffId && s.id !== staffId)) continue;
    const b = data.branches.find((x) => x.id === s.branchId);
    if (!b) continue;
    const perDay = (b.closeHour - b.openHour) * 60;
    total += days.filter((d) => worksOn(s, d)).length * perDay;
  }
  return total;
}

export interface Summary {
  serviceRevenue: number;
  otherIncome: number;
  income: number;
  expense: number;
  net: number;
  /** İptal dışı randevu sayısı. */
  appointments: number;
  completed: number;
  cancelled: number;
  noshow: number;
  avgTicket: number;
  newCustomers: number;
  uniqueCustomers: number;
  occupancy: number;
}

export function summarize(data: AppData, start: string, end: string, f: BranchFilter): Summary {
  const as = apptsIn(data, start, end, f);
  const ts = txIn(data, start, end, f);
  const done = as.filter(isRevenue);
  const serviceRevenue = sum(done, (a) => a.price);
  const otherIncome = sum(ts.filter((t) => t.type === "income"), (t) => t.amount);
  const expense = sum(ts.filter((t) => t.type === "expense"), (t) => t.amount);
  const busyMin = sum(as.filter(isBusy), (a) => a.durationMin);
  const avail = availableMinutes(data, start, end, f);
  const firstVisit = firstVisits(data.appointments);
  const unique = new Set(as.filter(isBusy).map((a) => a.customerId));
  let newCustomers = 0;
  for (const id of unique) {
    const fv = firstVisit.get(id);
    if (fv && inRange(fv, start, end)) newCustomers++;
  }
  return {
    serviceRevenue,
    otherIncome,
    income: serviceRevenue + otherIncome,
    expense,
    net: serviceRevenue + otherIncome - expense,
    appointments: as.filter((a) => a.status !== "cancelled").length,
    completed: done.length,
    cancelled: as.filter((a) => a.status === "cancelled").length,
    noshow: as.filter((a) => a.status === "noshow").length,
    avgTicket: done.length ? serviceRevenue / done.length : 0,
    newCustomers,
    uniqueCustomers: unique.size,
    occupancy: avail ? Math.min(1, busyMin / avail) : 0,
  };
}

/** Müşterinin iptal/gelmedi dışındaki ilk randevu tarihi. */
export function firstVisits(appts: Appointment[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const a of appts) {
    if (!isBusy(a)) continue;
    const cur = m.get(a.customerId);
    if (!cur || a.date < cur) m.set(a.customerId, a.date);
  }
  return m;
}

export interface Bucket {
  key: string;
  label: string;
  income: number;
  expense: number;
  count: number;
}

/** Grafik dilimleri: günlük dönemde saat saat, haftalık/aylıkta gün gün. */
export function buckets(data: AppData, p: Period, f: BranchFilter): Bucket[] {
  const as = apptsIn(data, p.start, p.end, f);
  const ts = txIn(data, p.start, p.end, f);
  if (p.kind === "day") {
    const hours: Bucket[] = [];
    const open = Math.min(...data.branches.filter((b) => matchBranch(b.id, f)).map((b) => b.openHour), 10);
    const close = Math.max(...data.branches.filter((b) => matchBranch(b.id, f)).map((b) => b.closeHour), 20);
    for (let h = open; h < close; h++) {
      const inHour = as.filter((a) => Math.floor(timeToMin(a.start) / 60) === h);
      hours.push({
        key: String(h),
        label: `${String(h).padStart(2, "0")}:00`,
        income: sum(inHour.filter(isRevenue), (a) => a.price),
        expense: 0,
        count: inHour.filter((a) => a.status !== "cancelled").length,
      });
    }
    // Günlük elle girilen gelir/gider saatsizdir; ilk dilime eklenmez, özet kartlarında görünür.
    return hours;
  }
  return daysBetween(p.start, p.end).map((d) => {
    const da = as.filter((a) => a.date === d);
    const dt = ts.filter((t) => t.date === d);
    return {
      key: d,
      label: p.kind === "week" ? formatDayShort(d) : String(parseKey(d).getDate()),
      income: sum(da.filter(isRevenue), (a) => a.price) + sum(dt.filter((t) => t.type === "income"), (t) => t.amount),
      expense: sum(dt.filter((t) => t.type === "expense"), (t) => t.amount),
      count: da.filter((a) => a.status !== "cancelled").length,
    };
  });
}

export interface Row {
  id: string;
  label: string;
  value: number;
  count: number;
  color?: string;
}

export function byService(data: AppData, start: string, end: string, f: BranchFilter): Row[] {
  const done = apptsIn(data, start, end, f).filter(isRevenue);
  const m = new Map<string, Row>();
  for (const a of done) {
    const svc = data.services.find((s) => s.id === a.serviceId);
    const r = m.get(a.serviceId) ?? { id: a.serviceId, label: svc?.name ?? "Silinmiş hizmet", value: 0, count: 0 };
    r.value += a.price;
    r.count++;
    m.set(a.serviceId, r);
  }
  return [...m.values()].sort((a, b) => b.value - a.value);
}

export function byExpenseCategory(data: AppData, start: string, end: string, f: BranchFilter): Row[] {
  const m = new Map<string, Row>();
  for (const t of txIn(data, start, end, f)) {
    if (t.type !== "expense") continue;
    const r = m.get(t.category) ?? { id: t.category, label: t.category, value: 0, count: 0 };
    r.value += t.amount;
    r.count++;
    m.set(t.category, r);
  }
  return [...m.values()].sort((a, b) => b.value - a.value);
}

export function byPayment(data: AppData, start: string, end: string, f: BranchFilter): Record<PaymentMethod, number> {
  const out: Record<PaymentMethod, number> = { nakit: 0, kart: 0, havale: 0 };
  for (const a of apptsIn(data, start, end, f)) if (isRevenue(a) && a.payment) out[a.payment] += a.price;
  for (const t of txIn(data, start, end, f)) if (t.type === "income" && t.payment) out[t.payment] += t.amount;
  return out;
}

export interface StaffPerf {
  staff: Staff;
  appointments: number;
  completed: number;
  noshow: number;
  revenue: number;
  commission: number;
  occupancy: number;
  avgTicket: number;
  customers: number;
}

export function byStaff(data: AppData, start: string, end: string, f: BranchFilter): StaffPerf[] {
  const as = apptsIn(data, start, end, f);
  return data.staff
    .filter((s) => matchBranch(s.branchId, f) && (s.active || as.some((a) => a.staffId === s.id)))
    .map((s) => {
      const mine = as.filter((a) => a.staffId === s.id);
      const done = mine.filter(isRevenue);
      const revenue = sum(done, (a) => a.price);
      const avail = availableMinutes(data, start, end, "all", s.id);
      return {
        staff: s,
        appointments: mine.filter((a) => a.status !== "cancelled").length,
        completed: done.length,
        noshow: mine.filter((a) => a.status === "noshow").length,
        revenue,
        commission: (revenue * s.commissionRate) / 100,
        occupancy: avail ? Math.min(1, sum(mine.filter(isBusy), (a) => a.durationMin) / avail) : 0,
        avgTicket: done.length ? revenue / done.length : 0,
        customers: new Set(mine.filter(isBusy).map((a) => a.customerId)).size,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export interface CustomerStat {
  visits: number;
  spend: number;
  lastVisit: string | null;
  nextVisit: string | null;
  firstVisit: string | null;
  noshows: number;
}

/** today'e göre geçmiş ve gelecek ziyaretler. */
export function customerStats(appts: Appointment[], today: string): Map<string, CustomerStat> {
  const m = new Map<string, CustomerStat>();
  for (const a of appts) {
    const s = m.get(a.customerId) ?? { visits: 0, spend: 0, lastVisit: null, nextVisit: null, firstVisit: null, noshows: 0 };
    if (a.status === "noshow") s.noshows++;
    if (isRevenue(a)) {
      s.visits++;
      s.spend += a.price;
      if (!s.lastVisit || a.date > s.lastVisit) s.lastVisit = a.date;
      if (!s.firstVisit || a.date < s.firstVisit) s.firstVisit = a.date;
    }
    if ((a.status === "planned" || a.status === "confirmed") && a.date >= today) {
      if (!s.nextVisit || a.date < s.nextVisit) s.nextVisit = a.date;
    }
    m.set(a.customerId, s);
  }
  return m;
}

/** Uzun süredir gelmeyen ve ileri randevusu olmayan müşteriler. */
export function lapsedCustomers(customers: Customer[], stats: Map<string, CustomerStat>, today: string, days = LAPSED_DAYS) {
  return customers
    .map((c) => ({ c, s: stats.get(c.id) }))
    .filter(({ s }) => s?.lastVisit && !s.nextVisit && diffDays(s.lastVisit, today) >= days)
    .sort((a, b) => (b.s!.spend ?? 0) - (a.s!.spend ?? 0));
}

/** Önümüzdeki n gün içindeki doğum günleri (bugün dahil). */
export function upcomingBirthdays(customers: Customer[], today: string, days = 14) {
  const out: { c: Customer; date: string; inDays: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(today, i);
    const md = d.slice(5);
    for (const c of customers) if (c.birthday === md) out.push({ c, date: d, inDays: i });
  }
  return out;
}

/** Aynı personelin aynı günde çakışan randevusu (iptal/gelmedi hariç). */
export function findConflict(appts: Appointment[], cand: Pick<Appointment, "id" | "staffId" | "date" | "start" | "durationMin">): Appointment | null {
  const s = timeToMin(cand.start);
  const e = s + cand.durationMin;
  return (
    appts.find(
      (a) =>
        a.id !== cand.id &&
        a.staffId === cand.staffId &&
        a.date === cand.date &&
        isBusy(a) &&
        timeToMin(a.start) < e &&
        timeToMin(a.start) + a.durationMin > s,
    ) ?? null
  );
}

export function byBranch(data: AppData, start: string, end: string) {
  return data.branches.map((b) => ({ branch: b, ...summarize(data, start, end, b.id) }));
}
