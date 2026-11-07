// Tüm veri değişiklikleri bu işlemlerden (op) biridir. Aynı saf fonksiyon hem tarayıcıda (anında
// görünsün diye) hem sunucuda (kalıcı kayıt) uygulanır.
import type { AppData, Appointment, AppointmentStatus, Branch, Customer, PaymentMethod, Service, Settings, Staff, Transaction } from "./types";

export type Op =
  | { t: "appt.save"; a: Appointment }
  | { t: "appt.status"; id: string; status: AppointmentStatus; payment: PaymentMethod | null }
  | { t: "appt.delete"; id: string }
  | { t: "customer.save"; c: Customer }
  | { t: "customer.delete"; id: string }
  | { t: "staff.save"; s: Staff }
  | { t: "service.save"; s: Service }
  | { t: "branch.save"; b: Branch }
  | { t: "tx.save"; tx: Transaction }
  | { t: "tx.delete"; id: string }
  | { t: "settings.save"; p: Partial<Omit<Settings, "ownerPin">> };

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const next = list.slice();
  next[i] = item;
  return next;
}

export function applyOp(d: AppData, op: Op): AppData {
  switch (op.t) {
    case "appt.save":
      return { ...d, appointments: upsert(d.appointments, op.a) };
    case "appt.status":
      return {
        ...d,
        appointments: d.appointments.map((a) =>
          a.id === op.id ? { ...a, status: op.status, payment: op.status === "completed" ? (op.payment ?? a.payment ?? "kart") : null } : a,
        ),
      };
    case "appt.delete":
      return { ...d, appointments: d.appointments.filter((a) => a.id !== op.id) };
    case "customer.save":
      return { ...d, customers: upsert(d.customers, op.c) };
    case "customer.delete":
      return { ...d, customers: d.customers.filter((c) => c.id !== op.id), appointments: d.appointments.filter((a) => a.customerId !== op.id) };
    case "staff.save":
      return { ...d, staff: upsert(d.staff, op.s) };
    case "service.save":
      return { ...d, services: upsert(d.services, op.s) };
    case "branch.save":
      return { ...d, branches: upsert(d.branches, op.b) };
    case "tx.save":
      return { ...d, transactions: upsert(d.transactions, op.tx) };
    case "tx.delete":
      return { ...d, transactions: d.transactions.filter((t) => t.id !== op.id) };
    case "settings.save": {
      const { studioName, ownerName, slotMinutes } = op.p;
      return {
        ...d,
        settings: {
          ...d.settings,
          ...(studioName !== undefined && { studioName }),
          ...(ownerName !== undefined && { ownerName }),
          ...(slotMinutes !== undefined && { slotMinutes }),
        },
      };
    }
  }
}

const OP_TYPES = new Set(["appt.save", "appt.status", "appt.delete", "customer.save", "customer.delete", "staff.save", "service.save", "branch.save", "tx.save", "tx.delete", "settings.save"]);
const str = (x: unknown) => typeof x === "string";
const num = (x: unknown) => typeof x === "number" && Number.isFinite(x);

/** Sunucuya gelen işlemin şeklini doğrular (bozuk kaydın veriye girmesini önler). */
export function isValidOp(x: unknown): x is Op {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (!str(o.t) || !OP_TYPES.has(o.t as string)) return false;
  const obj = (k: string) => (o[k] && typeof o[k] === "object" ? (o[k] as Record<string, unknown>) : null);
  switch (o.t) {
    case "appt.save": {
      const a = obj("a");
      return !!a && ["id", "branchId", "staffId", "customerId", "serviceId", "date", "start", "status"].every((k) => str(a[k])) && num(a.durationMin) && num(a.price);
    }
    case "appt.status":
      return str(o.id) && ["planned", "confirmed", "completed", "cancelled", "noshow"].includes(o.status as string) && (o.payment === null || ["nakit", "kart", "havale"].includes(o.payment as string));
    case "customer.save": {
      const c = obj("c");
      return !!c && str(c.id) && str(c.name) && str(c.phone);
    }
    case "staff.save": {
      const s = obj("s");
      return !!s && str(s.id) && str(s.name) && str(s.branchId) && str(s.pin) && Array.isArray(s.workDays) && num(s.commissionRate);
    }
    case "service.save": {
      const s = obj("s");
      return !!s && str(s.id) && str(s.name) && num(s.durationMin) && num(s.price);
    }
    case "branch.save": {
      const b = obj("b");
      return !!b && str(b.id) && str(b.name) && num(b.openHour) && num(b.closeHour);
    }
    case "tx.save": {
      const t = obj("tx");
      return !!t && str(t.id) && str(t.branchId) && (t.type === "income" || t.type === "expense") && num(t.amount) && str(t.date);
    }
    case "settings.save":
      return !!obj("p");
    default:
      return str(o.id);
  }
}
