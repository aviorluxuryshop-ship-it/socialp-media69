// İstemciden gelen işlemi yetki ve çakışma kontrolüyle veritabanına yazar.
import { applyOp, type Op } from "@/lib/ops";
import { findConflict } from "@/lib/stats";
import { endTime } from "@/lib/dates";
import type { Appointment, Customer, Session, Settings, Staff } from "@/lib/types";
import type { Db } from "./db";

export class OpError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export async function applyServerOp(db: Db, op: Op, session: NonNullable<Session>) {
  if (session.role === "staff") {
    // Personel yalnızca kendi randevusunu "tamamlandı" ya da "gelmedi" yapabilir.
    if (op.t !== "appt.status" || !["completed", "noshow"].includes(op.status)) throw new OpError("Bu işlem için yetkiniz yok.", 403);
    const a = await db.get<Appointment>("appt", op.id);
    if (!a || a.staffId !== session.staffId) throw new OpError("Bu randevu size ait değil.", 403);
    if (a.status !== "planned" && a.status !== "confirmed") throw new OpError("Bu randevu zaten kapatılmış.", 409);
  }

  switch (op.t) {
    case "appt.save": {
      const a = op.a;
      if (a.status !== "cancelled" && a.status !== "noshow") {
        const sameDay = await db.apptsByStaff(a.staffId, a.date);
        const c = findConflict(sameDay, a);
        if (c) throw new OpError(`Bu saat az önce doldu: personelin ${c.start}–${endTime(c.start, c.durationMin)} arasında başka randevusu var.`, 409);
      }
      return db.upsert("appt", a.id, a);
    }
    case "appt.status": {
      const a = await db.get<Appointment>("appt", op.id);
      if (!a) throw new OpError("Randevu bulunamadı; başka bir cihazdan silinmiş olabilir.", 404);
      const next = applyOp({ appointments: [a] } as never, op) as unknown as { appointments: Appointment[] };
      return db.upsert("appt", a.id, next.appointments[0]);
    }
    case "appt.delete":
      return db.remove("appt", op.id);
    case "customer.save": {
      const prev = await db.get<Customer>("customer", op.c.id);
      return db.upsert("customer", op.c.id, { ...op.c, createdAt: prev?.createdAt ?? op.c.createdAt });
    }
    case "customer.delete":
      await db.removeApptsOfCustomer(op.id);
      return db.remove("customer", op.id);
    case "staff.save": {
      // Boş gelen PIN mevcut PIN'i silmesin.
      const prev = await db.get<Staff>("staff", op.s.id);
      return db.upsert("staff", op.s.id, { ...op.s, pin: op.s.pin || prev?.pin || "" });
    }
    case "service.save":
      return db.upsert("service", op.s.id, op.s);
    case "branch.save":
      return db.upsert("branch", op.b.id, op.b);
    case "tx.save":
      return db.upsert("tx", op.tx.id, op.tx);
    case "tx.delete":
      return db.remove("tx", op.id);
    case "settings.save": {
      const prev = (await db.get<Omit<Settings, "ownerPin">>("settings", "main")) ?? {};
      const merged = applyOp({ settings: { ...prev, ownerPin: "" } } as never, op) as unknown as { settings: Settings };
      const { ownerPin: _p, ...settings } = merged.settings;
      return db.upsert("settings", "main", settings);
    }
  }
}
