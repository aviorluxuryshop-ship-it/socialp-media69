import type { CardRecord } from "./types";

/** Leitner aralıkları (gün): kutu 0..5 */
export const INTERVALS = [0, 1, 3, 7, 14, 30];
const DAY = 86_400_000;

/** Bildiyse bir üst kutuya geçer ve seyrekleşir; bilmediyse kutu 1'e döner ve 10 dakika sonra yeniden gelir. */
export function nextReview(card: Pick<CardRecord, "box" | "lapses" | "reps">, knew: boolean, now = Date.now()) {
  if (!knew) return { box: 1, due: now + 10 * 60_000, reps: card.reps + 1, lapses: card.lapses + 1 };
  const box = Math.min(5, card.box + 1);
  return { box, due: now + INTERVALS[box] * DAY, reps: card.reps + 1, lapses: card.lapses };
}
