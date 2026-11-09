export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { emptyData } from "@/lib/seed";
import { fail, json, route } from "@/server/auth";
import { demoRows, newEpoch } from "@/server/db";
import { fromRows, toRows } from "@/server/records";

/** Tanıtım verisini yükler ya da her şeyi boşaltır (şubeler, hizmetler ve ayarlar korunur; tanıtımdan çıkarken hizmet fiyatları sıfırlanır). */
export const POST = route(
  async ({ req, db, session }) => {
    if (session?.role !== "owner") return fail("Oturum süresi doldu, tekrar giriş yapın.", 401);
    const body = (await req.json().catch(() => null)) as { mode?: string } | null;
    if (body?.mode === "demo") await db.replaceAll(demoRows());
    else if (body?.mode === "empty") {
      const { data, meta } = fromRows(await db.byKinds(["branch", "service", "settings", "meta"]));
      const base = emptyData();
      // Tanıtım verisinden çıkılıyorsa uydurma hizmet fiyatları da gider (hizmet adları kalır, fiyat 0).
      const keepServices = data.services.length > 0 && !meta.demo;
      await db.replaceAll(
        toRows(
          { ...base, branches: data.branches.length ? data.branches : base.branches, services: keepServices ? data.services : base.services, settings: { ...base.settings, ...data.settings } },
          { demo: false, epoch: newEpoch() },
        ),
      );
    } else return fail("Geçersiz istek.", 400);
    return json({ ok: true });
  },
  { write: true },
);
