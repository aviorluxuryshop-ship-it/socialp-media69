export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { fail, json, route } from "@/server/auth";

export const GET = route(async ({ db, session }) => {
  if (!session) return fail("Oturum süresi doldu, tekrar giriş yapın.", 401);
  return json(await db.version());
});
