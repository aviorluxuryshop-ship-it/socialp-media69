export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { fail, json, route } from "@/server/auth";

/** Yalnızca yönetici: verilen sürümden sonra değişen kayıtlar. */
export const GET = route(async ({ req, db, session }) => {
  if (!session) return fail("Oturum süresi doldu, tekrar giriş yapın.", 401);
  if (session.role !== "owner") return fail("Bu işlem için yetkiniz yok.", 403);
  const since = Number(req.nextUrl.searchParams.get("since") ?? "0");
  if (!Number.isFinite(since) || since < 0) return fail("Geçersiz sürüm.", 400);
  const v = await db.version();
  const rows = (await db.changes(since)).filter((r) => r.kind !== "meta" || !r.deleted);
  return json({ ...v, rows });
});
