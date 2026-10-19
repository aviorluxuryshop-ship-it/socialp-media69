import type { CategoryId, PositionId } from '@/lib/types';
import { CAT_BY_ID } from './categories';
import type { Technique } from './types';
import { PAS } from './techniques/pas';
import { SUT } from './techniques/sut';
import { KONTROL } from './techniques/kontrol';
import { SURME } from './techniques/surme';
import { KAFA } from './techniques/kafa';
import { BITIRICILIK } from './techniques/bitiricilik';
import { HUCUM } from './techniques/hucum';
import { SAVUNMA } from './techniques/savunma';
import { KALECILIK } from './techniques/kalecilik';
import { DURAN } from './techniques/duran';
import { TOPSUZ } from './techniques/topsuz';

export const TECHNIQUES: Technique[] = [
  ...PAS,
  ...SUT,
  ...KONTROL,
  ...SURME,
  ...KAFA,
  ...BITIRICILIK,
  ...HUCUM,
  ...SAVUNMA,
  ...KALECILIK,
  ...DURAN,
  ...TOPSUZ,
];

import { overlapWarnings, validateBodyPositions, validateRest, validateTechniques } from './validate';
import { BODY_POSITION } from './body-position';
import { POSITION_PROFILES } from './positions';
import { QUIZ } from './quiz';
import { TACTICS } from './tactics';
import { EX_BY_ID, validateExercises } from './exercises';
import { PATTERNS } from '@/lib/program';

const patternErrs: string[] = [];
for (const [k, rows] of Object.entries(PATTERNS)) for (const r of rows) for (const id of r) if (!EX_BY_ID[id]) patternErrs.push(`program deseni ${k}: bilinmeyen egzersiz ${id}`);

const problems = [
  ...validateExercises(),
  ...patternErrs,
  ...validateTechniques(TECHNIQUES),
  ...validateBodyPositions(BODY_POSITION, new Set(TECHNIQUES.map((t) => t.id))),
  ...validateRest({ techIds: new Set(TECHNIQUES.map((t) => t.id)), tactics: TACTICS, positions: POSITION_PROFILES, quiz: QUIZ }),
];
if (problems.length) {
  throw new Error('Teknik verisi hatalı:\n' + problems.join('\n'));
}

if (process.env.LIBERO_OVERLAPS) {
  for (const w of overlapWarnings(TECHNIQUES)) console.warn('[çakışma] ' + w);
}

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
