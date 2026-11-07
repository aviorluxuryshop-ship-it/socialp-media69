export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { route, json } from "@/server/auth";
import { fromRows } from "@/server/records";

/** Giriş ekranı için herkese açık özet: stüdyo adı ve personel listesi (PIN'ler yalnızca tanıtım modunda). */
export const GET = route(async ({ db }) => {
  const { data, meta } = fromRows(await db.byKinds(["branch", "staff", "settings", "meta"]));
  return json({
    studioName: data.settings.studioName,
    demo: meta.demo,
    branches: data.branches.map(({ id, name, color }) => ({ id, name, color })),
    staff: data.staff.filter((s) => s.active).map(({ id, name, role, color, branchId }) => ({ id, name, role, color, branchId })),
    demoPins: meta.demo ? data.staff.filter((s) => s.active).map(({ id, name, pin }) => ({ id, name, pin })) : null,
  });
});
