import { TECHNIQUES } from '@/data';
import { TACTICS } from '@/data/tactics';
import { POSITION_PROFILES } from '@/data/positions';

export const dynamic = 'force-static';

export function GET() {
  const out = [
    ...TACTICS.map((t) => ({ g: 'Taktik', id: t.id, name: t.title, scene: t.scene })),
    ...POSITION_PROFILES.map((p) => ({ g: 'Pozisyon', id: p.id, name: p.name, scene: p.scene })),
    ...TECHNIQUES.map((t) => ({ g: 'Teknik', id: t.id, name: t.name, scene: t.scene })),
  ];
  return Response.json(out);
}
