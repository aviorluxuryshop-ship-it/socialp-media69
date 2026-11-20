/**
 * Locked camera views (STEP 02). Every view is a fixed pose — position,
 * target, field of view — in the stadium frame, so a view always frames the
 * same geometry whatever the time of day or quality tier. Seat-based views
 * are derived from the seat layout itself (a real seat's eye point).
 */
import { Vector3 } from 'three';
import { PITCH_ELEVATION } from '../stadium/config.ts';
import { seatEye, type StadiumLayout } from '../stadium/layout.ts';

export interface CameraPose {
  position: Vector3;
  target: Vector3;
  fov: number;
}

export interface LockedView extends CameraPose {
  id: ViewId;
  label: string;
  caption: string;
  /** seat index when the view is a spectator's eye */
  seat?: number;
}

export type ViewId = 'ustten' | 'dis' | 'uzun' | 'kale' | 'vip' | 'cati' | 'bogaz' | 'seat';

const Y = PITCH_ELEVATION;

/**
 * Seat nearest the middle of a block's row (1-based). Rows that pass a
 * vomitory are moved to the nearest clear row so the view is never blocked
 * by the tunnel's guard walls.
 */
export function middleSeat(layout: StadiumLayout, blockIndex: number, row: number, across = 0.5): number {
  const b = layout.blocks[blockIndex];
  let r = Math.min(Math.max(1, row), b.rows) - 1;
  const blocked = (rr: number) => b.vomitories.some((v) => rr >= v.rowFrom - 1 && rr <= v.rowTo + 2);
  for (let k = 0; k < b.rows && blocked(r); k++) r = Math.min(b.rows - 1, r + 1);
  const a = b.rowStart[r];
  const e = b.rowStart[r + 1];
  return Math.min(e - 1, a + Math.floor((e - a - 1) * across));
}

/** Camera pose for a seated spectator looking at the centre spot. */
export function seatPose(layout: StadiumLayout, seat: number, fov = 62): CameraPose {
  const e = seatEye(layout, seat);
  const position = new Vector3(e.x, e.y + Y, e.z);
  // look slightly past the centre towards the far side, a natural resting gaze
  const target = new Vector3(e.x * -0.12, Y + 1.2, e.z * -0.12);
  return { position, target, fov };
}

function blockClosestTo(layout: StadiumLayout, tier: 'lower' | 'upper' | 'suite', angle: number, kinds?: string[]): number {
  let best = -1;
  let bd = Infinity;
  for (const b of layout.blocks) {
    if (b.tier !== tier) continue;
    if (kinds && !kinds.includes(b.kind)) continue;
    const t = ((b.tc % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let d = Math.abs(t - angle);
    d = Math.min(d, Math.PI * 2 - d);
    if (d < bd) {
      bd = d;
      best = b.index;
    }
  }
  return best;
}

export function buildViews(layout: StadiumLayout): LockedView[] {
  // west main stand, upper tier, block 416 (next to the press box), row 9
  const uzunBlock = layout.blocks.find((b) => b.code === '416')!.index;
  const uzunSeat = middleSeat(layout, uzunBlock, 9, 0.3);
  // north goal end, lower tier, centre block, row 14
  const kaleBlock = blockClosestTo(layout, 'lower', Math.PI, ['standard']);
  const kaleSeat = middleSeat(layout, kaleBlock, 14, 0.3);
  // the suite at the centre of the west side, front balcony row
  const vipBlock = blockClosestTo(layout, 'suite', Math.PI / 2);
  const vipSeat = middleSeat(layout, vipBlock, 1);

  const uzun = seatPose(layout, uzunSeat, 60);
  const uzunRow = layout.seats.row[uzunSeat];
  const kaleRow = layout.seats.row[kaleSeat];
  const kale = seatPose(layout, kaleSeat, 64);
  const vip = seatPose(layout, vipSeat, 64);

  return [
    {
      id: 'ustten',
      label: 'Üstten',
      caption: 'Stadyum ve çevresi, kuşbakışı',
      position: new Vector3(18, Y + 470, 70),
      target: new Vector3(0, Y, 0),
      fov: 42,
    },
    {
      id: 'dis',
      label: 'Dış Cephe',
      caption: 'Dolmabahçe tarafından geniş açı · Eski Açık',
      position: new Vector3(305, Y + 62, -175),
      target: new Vector3(10, Y + 14, 6),
      fov: 48,
    },
    { id: 'uzun', label: 'Uzun Tribün', caption: `Batı Üst · Blok 416 · Sıra ${uzunRow}`, seat: uzunSeat, ...uzun },
    {
      id: 'kale',
      label: 'Kale Arkası',
      caption: `Kuzey Alt · Blok ${layout.blocks[kaleBlock].code} · Sıra ${kaleRow}`,
      seat: kaleSeat,
      ...kale,
    },
    { id: 'vip', label: 'VIP Loca', caption: `${layout.blocks[vipBlock].label} · Batı`, seat: vipSeat, ...vip },
    {
      id: 'cati',
      label: 'Çatı',
      caption: 'PTFE membran ve radyal taşıyıcılar',
      position: new Vector3(-95, Y + 88, 175),
      target: new Vector3(18, Y + 22, -12),
      fov: 46,
    },
    {
      id: 'bogaz',
      label: 'Boğaz',
      caption: 'Dolmabahçe, Boğaz ve 15 Temmuz Şehitler Köprüsü',
      position: new Vector3(-30, Y + 165, 185),
      target: new Vector3(860, Y - 30, -1300),
      fov: 50,
    },
  ];
}
