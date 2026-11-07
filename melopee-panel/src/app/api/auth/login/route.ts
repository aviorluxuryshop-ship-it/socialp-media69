export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { checkOwnerPassword, checkStaffPin, clearFails, fail, lockedFor, recordFail, route, setSession } from "@/server/auth";
import type { Staff } from "@/lib/types";

export const POST = route(
  async ({ req, db }) => {
    const body = (await req.json().catch(() => null)) as { role?: string; staffId?: string; secret?: string } | null;
    const secret = typeof body?.secret === "string" ? body.secret : "";
    if (!body || !secret) return fail("Şifre ya da PIN girin.", 400);
    const who = body.role === "owner" ? "owner" : `staff:${body.staffId ?? ""}`;
    const wait = await lockedFor(db, who);
    if (wait) return fail(`Çok fazla hatalı deneme. ${wait} dakika sonra tekrar deneyin.`, 429);

    let ok = false;
    if (body.role === "owner") ok = await checkOwnerPassword(db, secret);
    else if (body.role === "staff" && typeof body.staffId === "string") ok = checkStaffPin(await db.get<Staff>("staff", body.staffId), secret);

    if (!ok) {
      await recordFail(db, who);
      await new Promise((r) => setTimeout(r, 400));
      return fail(body.role === "owner" ? "Şifre hatalı. Tekrar deneyin." : "PIN hatalı. Tekrar deneyin.", 401);
    }
    await clearFails(db, who);
    const res = NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
    setSession(res, body.role === "owner" ? { role: "owner" } : { role: "staff", staffId: body.staffId! });
    return res;
  },
  { write: true },
);
