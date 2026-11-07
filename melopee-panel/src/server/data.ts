// Oturuma göre veri: yönetici her şeyi, personel yalnızca kendi programını görür.
import type { AppData, Appointment, Customer, Staff } from "@/lib/types";
import type { Db } from "./db";
import { fromRows, type Meta } from "./records";

export interface Payload {
  data: AppData;
  meta: Meta;
  version: number;
}

export async function ownerPayload(db: Db): Promise<Payload> {
  const v = await db.version();
  const { data, meta } = fromRows(await db.all());
  return { data, meta, version: v.version };
}

/** Personelin görebileceği müşteri alanları (iletişim, not, alerji). */
function slimCustomer(c: Customer): Customer {
  return { ...c, email: "", birthday: "", source: "Diğer" };
}

export async function staffPayload(db: Db, staffId: string): Promise<Payload> {
  const v = await db.version();
  const { data, meta } = fromRows(await db.byKinds(["branch", "service", "staff", "settings", "meta"]));
  const me = data.staff.find((s) => s.id === staffId);
  const appts: Appointment[] = (await db.apptsByStaff(staffId)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const customers = (await db.customersByIds([...new Set(appts.map((a) => a.customerId))])).map(slimCustomer);
  return {
    meta,
    version: v.version,
    data: {
      branches: data.branches.filter((b) => b.id === me?.branchId),
      services: data.services,
      staff: me ? [{ ...me, pin: "", salary: 0 } as Staff] : [],
      customers,
      appointments: appts,
      transactions: [],
      settings: { ...data.settings, ownerPin: "" },
    },
  };
}
