/**
 * Regions for the seat picker: what a visitor would ask for at the box
 * office — "Doğu Alt", "Kuzey Üst (kale arkası)", VIP, a loca — rather than
 * block numbers. Every sellable block belongs to exactly one region.
 */
import { Vector3 } from 'three';
import { PITCH_ELEVATION, STANDS, type StandId } from '../stadium/config.ts';
import type { Block, StadiumLayout } from '../stadium/layout.ts';
import type { RegionKind } from '../camera/clips.ts';

export interface Region {
  id: string;
  /** "Doğu Alt" */
  name: string;
  /** "Boğaz tarafı" */
  note: string;
  kind: RegionKind;
  stand: StandId | null;
  blocks: Block[];
  /** the block the 3D label sits on */
  anchor: Block;
  /** the block the camera faces: the middle of the region (VIP / press box on Batı) */
  frameBlock: Block;
  /** world position of the 3D label */
  labelAt: Vector3;
}

const STAND_ORDER: StandId[] = ['DOGU', 'KUZEY', 'BATI', 'GUNEY'];
const NOTES: Record<StandId, string> = {
  DOGU: 'Boğaz tarafı',
  KUZEY: 'Kale arkası',
  BATI: 'Ana tribün',
  GUNEY: 'Kale arkası · Eski Açık',
};
const MID: Record<StandId, number> = { GUNEY: 0, BATI: Math.PI / 2, KUZEY: Math.PI, DOGU: (3 * Math.PI) / 2 };

function angDist(a: number, b: number): number {
  return Math.abs((((a - b) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
}

function label(b: Block, up: number): Vector3 {
  return new Vector3(b.center[0], b.center[1] + PITCH_ELEVATION + up, b.center[2]);
}

export function buildRegions(L: StadiumLayout): Region[] {
  const out: Region[] = [];
  for (const stand of STAND_ORDER) {
    for (const tier of ['lower', 'upper'] as const) {
      const blocks = L.blocks.filter((b) => b.stand === stand && b.tier === tier && b.kind !== 'vip' && b.kind !== 'press');
      if (!blocks.length) continue;
      // the block nearest the stand's middle (next to VIP / the press box on Batı)
      const anchor = blocks.slice().sort((a, b) => angDist(a.tc, MID[stand]) - angDist(b.tc, MID[stand]))[0];
      // the camera faces the middle of the whole tier, VIP / press box included
      const tierAll = L.blocks.filter((b) => b.stand === stand && b.tier === tier);
      const frameBlock = tierAll.slice().sort((a, b) => angDist(a.tc, MID[stand]) - angDist(b.tc, MID[stand]))[0];
      out.push({
        id: `${stand}-${tier}`,
        name: `${STANDS[stand].short} ${tier === 'upper' ? 'Üst' : 'Alt'}`,
        note: NOTES[stand],
        kind: tier,
        stand,
        blocks,
        anchor,
        frameBlock,
        labelAt: label(anchor, tier === 'upper' ? 6 : 4),
      });
    }
  }
  const vip = L.blocks.filter((b) => b.kind === 'vip');
  if (vip.length) out.push({ id: 'VIP', name: 'VIP Tribün', note: 'Batı Alt · protokol', kind: 'vip', stand: 'BATI', blocks: vip, anchor: vip[0], frameBlock: vip[0], labelAt: label(vip[0], 3) });
  const suites = L.blocks.filter((b) => b.tier === 'suite');
  if (suites.length) {
    // off the middle of Doğu, so its label does not sit between Doğu Alt and Doğu Üst
    const at = MID.DOGU + 0.75;
    const anchor = suites.slice().sort((a, b) => angDist(a.tc, at) - angDist(b.tc, at))[0];
    out.push({ id: 'LOCA', name: 'Localar', note: '147 loca · 12 kişilik', kind: 'suite', stand: null, blocks: suites, anchor, frameBlock: anchor, labelAt: label(anchor, 2.5) });
  }
  return out;
}

export function regionOfBlock(regions: Region[], block: number): Region | null {
  for (const r of regions) if (r.blocks.some((b) => b.index === block)) return r;
  return null;
}

/** Free seats, cheapest price of a region. */
export function regionStats(L: StadiumLayout, r: Region, priceOf: (seat: number) => number): { free: number; total: number; from: number } {
  const S = L.seats;
  let free = 0;
  let total = 0;
  let from = Infinity;
  for (const b of r.blocks) {
    for (let i = b.seatStart; i < b.seatStart + b.seatCount; i++) {
      total++;
      if (S.sold[i] !== 0) continue;
      free++;
      const p = priceOf(i);
      if (p > 0 && p < from) from = p;
    }
  }
  return { free, total, from: Number.isFinite(from) ? from : 0 };
}

/**
 * The free seat closest to a seat in the same block (rows weigh like ~4
 * seats), or for a block alone: a central seat of a middle row.
 */
export function nearestFreeSeat(L: StadiumLayout, b: Block, near?: number): number {
  const S = L.seats;
  let refRow: number;
  let refNum: number;
  if (near !== undefined && near >= 0) {
    refRow = S.row[near];
    refNum = S.num[near];
  } else {
    refRow = Math.ceil(b.rows * 0.45);
    const a = b.rowStart[refRow - 1];
    const e = b.rowStart[refRow];
    refNum = S.num[Math.floor((a + e - 1) / 2)];
  }
  let best = -1;
  let bd = Infinity;
  for (let i = b.seatStart; i < b.seatStart + b.seatCount; i++) {
    if (S.sold[i] !== 0) continue;
    const d = Math.abs(S.row[i] - refRow) * 4 + Math.abs(S.num[i] - refNum);
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best;
}
