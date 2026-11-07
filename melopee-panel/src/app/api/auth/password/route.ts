export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { checkOwnerPassword, fail, hashPassword, json, route } from "@/server/auth";

export const POST = route(
  async ({ req, db, session }) => {
    if (session?.role !== "owner") return fail("Oturum süresi doldu, tekrar giriş yapın.", 401);
    const body = (await req.json().catch(() => null)) as { current?: string; next?: string } | null;
    if (!body?.current || !(await checkOwnerPassword(db, body.current))) return fail("Mevcut şifre hatalı.", 400);
    if (!body.next || body.next.length < 6) return fail("Yeni şifre en az 6 karakter olmalı.", 400);
    await db.authSet("owner", { hash: hashPassword(body.next) });
    return json({ ok: true });
  },
  { write: true },
);
