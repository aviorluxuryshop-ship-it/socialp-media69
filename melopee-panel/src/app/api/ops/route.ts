export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { isValidOp } from "@/lib/ops";
import { applyServerOp, OpError } from "@/server/apply";
import { fail, json, route } from "@/server/auth";

export const POST = route(
  async ({ req, db, session }) => {
    if (!session) return fail("Oturum süresi doldu, tekrar giriş yapın.", 401);
    const body = (await req.json().catch(() => null)) as { op?: unknown } | null;
    if (!isValidOp(body?.op)) return fail("Geçersiz işlem.", 400);
    try {
      await applyServerOp(db, body.op, session);
    } catch (e) {
      if (e instanceof OpError) return fail(e.message, e.status);
      throw e;
    }
    return json({ ok: true });
  },
  { write: true },
);
