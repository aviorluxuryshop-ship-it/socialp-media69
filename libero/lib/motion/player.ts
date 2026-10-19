// Teknik hareket oynatıcısının saf mantığı (React yok, DOM yok): zaman ilerletme, biçimlendirme, evre çubuğu oranları.
import { PHASES, phaseBounds, stripTimes, type PhaseId, type TechMotion } from './timeline';

/** Hareket bitince son karede beklenen süre (sn); sonra başa sarılır (döngü). */
export const HOLD_SEC = 0.9;

export interface Clock {
  /** hareket zamanı (sn, 0…dur) */
  t: number;
  /** son karede kalan bekleme (sn); > 0 iken zaman ilerlemez */
  hold: number;
}

/** `dt` gerçek saniyedir; `speed` ile çarpılır. Bitişte HOLD_SEC bekler, sonra 0'a döner. */
export function advance(c: Clock, dt: number, speed: number, dur: number): Clock {
  if (c.hold > 0) {
    const hold = c.hold - dt;
    return hold > 0 ? { t: c.t, hold } : { t: 0, hold: 0 };
  }
  const t = c.t + dt * speed;
  return t >= dur ? { t: dur, hold: HOLD_SEC } : { t, hold: 0 };
}

/** 1,45 gibi Türkçe ondalık biçim. */
export function fmtSec(t: number, digits = 2): string {
  return t.toFixed(digits).replace('.', ',');
}

export interface BarModel {
  /** evre başına [başlangıç, bitiş] oranı (0–1) ve kimliği */
  segs: { id: PhaseId; from: number; to: number }[];
  /** temas anının oranı */
  tc: number;
}

/** Evre çubuğu: Hazırlık / Temas (temas penceresi) / Takip bölmeleri, toplam süreye oranla. */
export function barModel(m: TechMotion): BarModel {
  const b = phaseBounds(m);
  const segs = PHASES.map((id, i) => ({ id, from: b[i] / m.dur, to: b[i + 1] / m.dur }));
  return { segs, tc: m.tc / m.dur };
}

/** Hareketi azalt şeridinin üç karesi için [zaman, evre]. */
export function stripFrames(m: TechMotion): { t: number; phase: PhaseId }[] {
  const ts = stripTimes(m);
  return PHASES.map((phase, i) => ({ t: ts[i], phase }));
}
