export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { isAppData } from "@/lib/validate";
import { fail, json, route } from "@/server/auth";
import { newEpoch } from "@/server/db";
import { toRows } from "@/server/records";

export const POST = route(
  async ({ req, db, session }) => {
    if (session?.role !== "owner") return fail("Oturum süresi doldu, tekrar giriş yapın.", 401);
    const body = (await req.json().catch(() => null)) as { data?: unknown } | null;
    if (!isAppData(body?.data)) return fail("Yedek dosyası okunamadı.", 400);
    await db.replaceAll(toRows(body.data, { demo: false, epoch: newEpoch() }));
    return json({ ok: true });
  },
  { write: true },
);
