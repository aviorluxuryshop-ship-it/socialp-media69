// Ortak tipler — içerik ve depolama katmanları bunları kullanır.

export type Level = 1 | 2 | 3 | 4 | 5;

export const LEVEL_NAMES: Record<Level, string> = {
  1: 'Başlangıç',
  2: 'Gelişen',
  3: 'Orta',
  4: 'İleri',
  5: 'Uzman',
};

export const LEVEL_HINTS: Record<Level, string> = {
  1: 'Hareketi ilk kez öğreniyorum',
  2: 'Temeli biliyorum, tutarlı değilim',
  3: 'Antrenmanda rahat, maçta bazen',
  4: 'Maçta baskı altında uygulayabiliyorum',
  5: 'Her koşulda ve farklı varyasyonlarla',
};

export type PositionId =
  | 'kaleci'
  | 'stoper'
  | 'bek'
  | 'on-libero'
  | 'merkez-orta-saha'
  | 'on-numara'
  | 'kanat'
  | 'santrfor';

export interface PositionInfo {
  id: PositionId;
  name: string;
  short: string;
}

export const POSITIONS: PositionInfo[] = [
  { id: 'kaleci', name: 'Kaleci', short: 'KL' },
  { id: 'stoper', name: 'Stoper', short: 'ST' },
  { id: 'bek', name: 'Bek', short: 'BK' },
  { id: 'on-libero', name: 'Ön libero', short: 'ÖL' },
  { id: 'merkez-orta-saha', name: 'Merkez orta saha', short: 'MO' },
  { id: 'on-numara', name: 'On numara', short: '10' },
  { id: 'kanat', name: 'Kanat', short: 'KN' },
  { id: 'santrfor', name: 'Santrfor', short: 'SF' },
];

export const POSITION_NAME: Record<PositionId, string> = Object.fromEntries(
  POSITIONS.map((p) => [p.id, p.name]),
) as Record<PositionId, string>;

export type CategoryId =
  | 'pas'
  | 'sut'
  | 'kontrol'
  | 'surme'
  | 'kafa'
  | 'bitiricilik'
  | 'hucum'
  | 'savunma'
  | 'kalecilik'
  | 'duran'
  | 'topsuz';

// ── Sahne (saha diyagramı) ─────────────────────────────────

export type ViewId = 'full' | 'half' | 'box' | 'mid' | 'defend' | 'grid';
export type ActorType = 'a' | 'b' | 'k' | 'c' | 'm'; // a: takım, b: rakip, k: kaleci, c: koni, m: hedef işareti
export type Pt = [number, number];

export interface Actor {
  id: string;
  t: ActorType;
  x: number;
  y: number;
  /** Üzerinde görünen kısa etiket (varsayılan: id) */
  l?: string;
}

export interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
  /** free: boş alan, danger: tehlikeli alan, target: hedef */
  k?: 'free' | 'danger' | 'target';
  l?: string;
}

export type ArrowKind = 'pass' | 'run' | 'dribble' | 'shot' | 'press' | 'air';

export interface ManualArrow {
  k: ArrowKind;
  from: Pt;
  to: Pt;
  curve?: number;
}

export interface FrameOpts {
  /** şut ok'u */
  shot?: boolean;
  /** havadan pas (kaldırma) */
  air?: boolean;
  /** pasın yayı (metre cinsinden yan sapma) */
  curve?: number;
  /** boş/tehlikeli alan işaretleri */
  z?: Zone[];
  /** ofsayt/savunma hattı (x konumu) */
  line?: number;
  /** sahada küçük metin notları */
  txt?: { x: number; y: number; s: string }[];
  /** elle çizilmiş oklar */
  arr?: ManualArrow[];
  /** otomatik koşu oklarını bastır (id listesi) */
  quiet?: string[];
}

export type BallState = string | Pt;

export interface Frame {
  /** adım açıklaması (Türkçe) */
  n: string;
  /** o adımda değişen konumlar */
  m?: Record<string, Pt>;
  /** topun sahibi (aktör id) ya da nokta */
  b?: BallState;
  o?: FrameOpts;
}

export interface Scene {
  v: ViewId;
  /** v === 'grid' için alan boyutu (metre) */
  w?: number;
  h?: number;
  a: Actor[];
  f: Frame[];
  /** dikey (hücum yukarı) yerine yatay göster */
  hz?: boolean;
}
