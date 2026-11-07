export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { fail, json, route } from "@/server/auth";
import { ownerPayload, staffPayload } from "@/server/data";

export const GET = route(async ({ db, session }) => {
  if (!session) return fail("Oturum süresi doldu, tekrar giriş yapın.", 401);
  return json(session.role === "owner" ? await ownerPayload(db) : await staffPayload(db, session.staffId));
});
