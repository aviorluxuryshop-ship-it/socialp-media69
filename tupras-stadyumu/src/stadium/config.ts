/**
 * Every dimension and naming rule of the stadium model lives here.
 * Sources and the reasoning behind each value: docs/RESEARCH.md.
 *
 * Frame: origin = centre spot at pitch level, +X → south-east goal (Eski Açık,
 * Dolmabahçe), +Z → south-west main stand (Batı), +Y up. Metres.
 */

/** Pitch level above mean sea level (world Y of the playing surface). */
export const PITCH_ELEVATION = 8.5;

export const PITCH = {
  length: 105,
  width: 68,
  /** grass area incl. run-off, up to the advertising boards */
  grassHalfX: 59.0,
  grassHalfZ: 38.9,
};

/** Front line of the lower tier: goal line + 7.95 m, touchline + 6.15 m (tr wiki). */
export const FRONT_CURVE = { a: 52.5 + 7.95, b: 34 + 6.15, p: 3.7 };
/** Facade / compression-ring footprint: OSM outer ring ≈ roof 215 × 160 m. */
export const OUTER_CURVE = { a: 107.0, b: 80.5, p: 2.85 };
/** Inner edge of the roof (lower/upper tension ring line). */
export const ROOF_INNER_CURVE = { a: 59.2, b: 38.6, p: 3.4 };

export interface TierProfile {
  /** distance of the first row's riser from the front curve, along the normal */
  firstRowD: number;
  /** tread depth (row spacing) */
  tread: number;
  /** elevation of the first row's tread above pitch level */
  firstRowY: number;
  /** rake at first and last row, degrees (increasing C-value) */
  rakeFront: number;
  rakeBack: number;
  /** maximum rows; blocks near the corners get fewer (the "wave") */
  maxRows: number;
  minRows: number;
  seatPitch: number;
  aisle: number;
}

export const LOWER: TierProfile = {
  firstRowD: 1.0,
  tread: 0.78,
  firstRowY: 1.45,
  rakeFront: 22,
  rakeBack: 28,
  maxRows: 26,
  minRows: 26,
  seatPitch: 0.47,
  aisle: 1.1,
};

export const UPPER: TierProfile = {
  firstRowD: 22.3,
  tread: 0.78,
  firstRowY: 16.7,
  rakeFront: 33,
  rakeBack: 38,
  maxRows: 26,
  minRows: 18,
  seatPitch: 0.47,
  aisle: 1.1,
};

/** Suite (loca) ring between the tiers — 147 suites (official count). */
export const SUITES = {
  count: 147,
  /** balcony seat rows in front of the glass */
  balconyRows: 2,
  seatsPerRow: 6,
  seatPitch: 0.52,
  floorY: 11.25,
  frontD: 21.4, // first balcony row riser
  glassD: 23.8,
  backD: 29.4,
  ceilingY: 14.4,
};

/** Upper-tier front fascia with the LED ribbon (seen in every interior photo). */
export const FASCIA = { d: 21.5, bottomY: 14.75, topY: 16.35 };

/** Facade: 82 columns carry the compression ring (Greisch). */
export const FACADE = {
  columns: 82,
  pierTopY: 23.5,
  pierWidth: 2.6,
  pierDepth: 1.4,
  ringY: 33.2, // compression ring centre line (mid-sides; varies with the wave)
  ringWave: 1.6,
  ringDepth: 1.8,
  ringHeight: 1.5,
};

export const ROOF = {
  /** upper tension ring height and depth of the inner truss (two tension rings) */
  innerTopY: 30.2,
  innerBottomY: 23.4,
  radials: 82,
};

export type StandId = 'DOGU' | 'GUNEY' | 'BATI' | 'KUZEY';

export const STANDS: Record<StandId, { name: string; short: string; note: string }> = {
  BATI: { name: 'Batı Tribünü', short: 'Batı', note: 'Ana tribün · VIP · Basın' },
  DOGU: { name: 'Doğu Tribünü', short: 'Doğu', note: 'Çarşı · Boğaz tarafı' },
  KUZEY: { name: 'Kuzey Kale Arkası', short: 'Kuzey', note: 'Maçka · Süzer Plaza tarafı' },
  GUNEY: { name: 'Güney Kale Arkası', short: 'Güney', note: 'Eski Açık · Dolmabahçe tarafı' },
};

/**
 * Stand for a plan angle (0 = +X). Corners are split on the diagonal of the
 * rounded rectangle (where |x|/a = |z|/b on the front curve), not at 45°.
 */
export function standForAngle(t: number): StandId {
  const c = Math.cos(t);
  const s = Math.sin(t);
  const sideness = Math.abs(s) / FRONT_CURVE.b - Math.abs(c) / FRONT_CURVE.a;
  if (sideness > 0) return s > 0 ? 'BATI' : 'DOGU';
  return c > 0 ? 'GUNEY' : 'KUZEY';
}

export interface SectorDef {
  code: string; // "101", "VIP", "BASIN"
  weight: number; // relative width
  kind: 'standard' | 'vip' | 'press' | 'away';
}

/**
 * Sectors are laid out along the tier's front curve starting at the east
 * long-side centre (plan angle 270°) and running east → south → west → north.
 * This puts VIP/press exactly at the west centre, 115/116 & 415/416 next to it,
 * and 404–406 in the south-east corner (see RESEARCH.md).
 */
export const LOWER_SECTORS: SectorDef[] = [
  ...range(101, 112).map((n) => ({ code: String(n), weight: 1, kind: 'standard' as const })),
  { code: 'VIP', weight: 3, kind: 'vip' },
  ...range(113, 124).map((n) => ({ code: String(n), weight: 1, kind: 'standard' as const })),
];

export const UPPER_SECTORS: SectorDef[] = [
  ...range(401, 415).map((n) => ({
    code: String(n),
    weight: 1,
    kind: (n >= 404 && n <= 406 ? 'away' : 'standard') as SectorDef['kind'],
  })),
  { code: 'BASIN', weight: 1.4, kind: 'press' },
  ...range(416, 430).map((n) => ({ code: String(n), weight: 1, kind: 'standard' as const })),
];

/** Start of sector numbering: east long-side centre. */
export const SECTOR_START_ANGLE = (3 * Math.PI) / 2;

function range(a: number, b: number): number[] {
  const out: number[] = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

/** Ticket categories — sample prices for the presentation, not the club's tariff. */
export const CATEGORIES = [
  { id: 0, name: 'Loca', price: 24000 },
  { id: 1, name: 'VIP', price: 9500 },
  { id: 2, name: 'Kategori 1', price: 3900 },
  { id: 3, name: 'Kategori 2', price: 2600 },
  { id: 4, name: 'Kategori 3', price: 1650 },
  { id: 5, name: 'Kale Arkası', price: 1100 },
  { id: 6, name: 'Misafir', price: 1250 },
  { id: 7, name: 'Basın', price: 0 },
] as const;

export const SEAT_COLORS = {
  white: 0xf2f2ef,
  black: 0x17181a,
  vip: 0x232427,
  sold: 0x6e7176,
};
