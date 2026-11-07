// Uygulama verisi ⇄ veritabanı satırları. Her kayıt (şube, personel, randevu…) ayrı bir satırdır;
// böylece bir randevu değişince yalnızca o satır yazılır ve diğer cihazlara yalnızca o gider.
import { DEFAULT_SETTINGS } from "@/lib/seed";
import type { AppData, Settings } from "@/lib/types";

export const KIND_TO_KEY = {
  branch: "branches",
  staff: "staff",
  service: "services",
  customer: "customers",
  appt: "appointments",
  tx: "transactions",
} as const;
export type RecordKind = keyof typeof KIND_TO_KEY | "settings" | "meta";

export interface Row {
  kind: RecordKind;
  id: string;
  data: unknown;
  deleted?: boolean;
}

export interface Meta {
  demo: boolean;
  /** Toplu sıfırlama/geri yüklemede değişir; istemciler tam yeniden yükleme yapar. */
  epoch: string;
}

export function toRows(data: AppData, meta: Meta): Row[] {
  const rows: Row[] = [];
  for (const [kind, key] of Object.entries(KIND_TO_KEY) as [keyof typeof KIND_TO_KEY, keyof AppData][]) {
    for (const item of data[key] as { id: string }[]) rows.push({ kind, id: item.id, data: item });
  }
  const { ownerPin: _pin, ...settings } = data.settings;
  rows.push({ kind: "settings", id: "main", data: settings });
  rows.push({ kind: "meta", id: "main", data: meta });
  return rows;
}

export function fromRows(rows: Row[]): { data: AppData; meta: Meta } {
  const data: AppData = { branches: [], staff: [], services: [], customers: [], appointments: [], transactions: [], settings: { ...DEFAULT_SETTINGS, ownerPin: "" } };
  let meta: Meta = { demo: false, epoch: "" };
  for (const r of rows) {
    if (r.deleted) continue;
    if (r.kind === "settings") data.settings = { ...data.settings, ...(r.data as Partial<Settings>), ownerPin: "" };
    else if (r.kind === "meta") meta = r.data as Meta;
    else (data[KIND_TO_KEY[r.kind]] as unknown[]).push(r.data);
  }
  data.appointments.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  data.transactions.sort((a, b) => a.date.localeCompare(b.date));
  return { data, meta };
}

/** Türkiye saatine göre bugünün tarihi ve günün dakikası (sunucu UTC çalışır). */
export function istanbulNow(): { today: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { today: `${get("year")}-${get("month")}-${get("day")}`, minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
}
