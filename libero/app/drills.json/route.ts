import { TECHNIQUES } from '@/data';
import type { DrillTech } from '@/lib/program';

export const dynamic = 'force-static';

export function GET() {
  const out: DrillTech[] = TECHNIQUES.map((t) => ({
    id: t.id,
    name: t.name,
    cat: t.cat,
    lv: t.lv,
    pos: t.positions,
    safe: !!t.safety,
    drills: t.drills.map((d) => ({ lvl: d.lvl, name: d.name, how: d.how, dose: d.dose })),
  }));
  return Response.json(out);
}
