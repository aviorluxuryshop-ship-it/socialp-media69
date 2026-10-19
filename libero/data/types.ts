import type { CategoryId, Level, PositionId, Scene } from '@/lib/types';

/** Ayak temas bölgeleri (temas yüzeyi haritası için) */
export type FootZone = 'ic' | 'dis' | 'ustTam' | 'ustDis' | 'ustIc' | 'uc' | 'topuk' | 'taban';

export interface Drill {
  lvl: Level;
  name: string;
  how: string;
  dose: string;
}

export interface Technique {
  id: string;
  name: string;
  en?: string;
  cat: CategoryId;
  /** tekniğin kendi zorluk derecesi (1–5) */
  lv: Level;
  /** alt grup (ör. "Yerden paslar") */
  sub: string;
  /** temas yüzeyi / uygulama biçimi */
  contact: string;
  /** oyun içindeki amaç */
  purpose: string;
  summary: string;
  steps: string[];
  mistakes: string[];
  usage: string[];
  drills: Drill[];
  scene: Scene;
  aliases: string[];
  positions: PositionId[];
  related: string[];
  /** YouTube arama sorgusu (video bölümü için) */
  q: string;
  /** güvenlik notu (ör. çocuk yaş grupları) */
  safety?: string;
  /** temas yüzeyi haritasında vurgulanacak bölgeler */
  foot?: FootZone[];
  /** karıştırılan benzer teknikler: bu teknik onlardan nasıl ayrılır */
  distinct?: DistinctNote[];
}

/** "Karıştırılmasın" notu: benzer teknikle farkı kısaca anlatır */
export interface DistinctNote {
  id: string;
  note: string;
}

export type DrillTuple = [lvl: Level, name: string, how: string, dose: string];

export interface TechInput {
  id: string;
  name: string;
  en?: string;
  cat: CategoryId;
  lv: Level;
  sub: string;
  contact: string;
  purpose: string;
  sum: string;
  steps: string[];
  err: string[];
  use: string[];
  drills: DrillTuple[];
  scene: Scene;
  alias?: string[];
  pos?: PositionId[];
  rel?: string[];
  q?: string;
  safe?: string;
  foot?: FootZone[];
  diff?: DistinctNote[];
}

export function tech(i: TechInput): Technique {
  return {
    id: i.id,
    name: i.name,
    en: i.en,
    cat: i.cat,
    lv: i.lv,
    sub: i.sub,
    contact: i.contact,
    purpose: i.purpose,
    summary: i.sum,
    steps: i.steps,
    mistakes: i.err,
    usage: i.use,
    drills: i.drills.map(([lvl, name, how, dose]) => ({ lvl, name, how, dose })),
    scene: i.scene,
    aliases: i.alias ?? [],
    positions: i.pos ?? [],
    related: i.rel ?? [],
    q: i.q ?? `${i.name} futbol nasıl yapılır`,
    safety: i.safe,
    foot: i.foot,
    distinct: i.diff,
  };
}
