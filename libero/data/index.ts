import type { CategoryId, PositionId } from '@/lib/types';
import { CAT_BY_ID } from './categories';
import type { Technique } from './types';
import { PAS } from './techniques/pas';

export const TECHNIQUES: Technique[] = [...PAS];

export const TECH_BY_ID: Record<string, Technique> = Object.fromEntries(TECHNIQUES.map((t) => [t.id, t]));

export interface LightTech {
  id: string;
  name: string;
  en?: string;
  cat: CategoryId;
  lv: number;
  sub: string;
  contact: string;
  sum: string;
  purpose: string;
  pos: PositionId[];
  alias: string[];
}

export const LIGHT_TECHS: LightTech[] = TECHNIQUES.map((t) => ({
  id: t.id,
  name: t.name,
  en: t.en,
  cat: t.cat,
  lv: t.lv,
  sub: t.sub,
  contact: t.contact,
  sum: t.summary,
  purpose: t.purpose,
  pos: t.positions,
  alias: t.aliases,
}));

export function techsByCat(cat: CategoryId) {
  return TECHNIQUES.filter((t) => t.cat === cat);
}

export { CAT_BY_ID };
