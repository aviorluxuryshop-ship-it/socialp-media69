// Teknik hareket verisi doğrulayıcısı (derleme sırasında sayfa modülü yüklenirken çalışır; hata varsa derleme durur).
// Saf mantık: React yok, DOM yok. Kinematik denetimler lib/motion/check.ts içindedir.
import type { FootZone, Technique } from '@/data/types';
import { checkMotion, LIMITS } from '@/lib/motion/check';
import type { TechMotion } from '@/lib/motion/timeline';

type TechLite = Pick<Technique, 'id' | 'cat' | 'foot'>;

const text = (s: unknown, min: number, max: number) => typeof s === 'string' && s.trim().length >= min && s.length <= max;

/** Bir hareketin yapısal ve kinematik sorunlarını döndürür (boşsa geçerli). */
export function validateMotion(key: string, m: TechMotion, tech: TechLite | undefined): string[] {
  const out: string[] = [];
  const err = (msg: string) => out.push(`${key}: ${msg}`);
  if (m.id !== key) err(`kayıt anahtarı ile id farklı (${m.id})`);
  if (!tech) {
    err('data/techniques içinde böyle bir teknik yok');
    return out;
  }
  // bölge uyumu: hareketin zones'u tekniğin foot[] listesiyle aynı küme olmalı
  if (m.zones === 'alin') {
    if (tech.cat !== 'kafa') err(`zones 'alin' yalnızca kafa vuruşları için (kategori ${tech.cat})`);
    if (m.contact !== 'alin') err(`zones 'alin' iken contact da 'alin' olmalı (${m.contact})`);
  } else {
    const foot = tech.foot ?? [];
    if (foot.length === 0) err('tekniğin foot[] listesi boş; zones bu durumda bir ayak bölgesi içeremez');
    const zs = [...m.zones];
    if (new Set(zs).size !== zs.length) err('zones içinde yinelenen bölge var');
    const a = [...new Set<FootZone>(zs)].sort().join(',');
    const b = [...new Set<FootZone>(foot)].sort().join(',');
    if (a !== b) err(`zones (${a}) tekniğin foot[] listesiyle (${b}) aynı olmalı`);
    if (m.contact === 'alin' || !zs.includes(m.contact)) err(`contact (${m.contact}) zones içinde olmalı`);
  }
  // süre ve zaman çizelgesi
  if (!(m.dur >= LIMITS.dur[0] && m.dur <= LIMITS.dur[1])) err(`süre ${m.dur} sn; ${LIMITS.dur[0]}–${LIMITS.dur[1]} sn aralığında olmalı`);
  if (!(m.tc > 0.4 && m.tc < m.dur - 0.5)) err(`tc (${m.tc}) hazırlık ve takibe yer bırakmalı`);
  if (m.win && !(m.win[0] > 0 && m.win[1] > 0 && m.tc - m.win[0] > 0.05 && m.tc + m.win[1] < m.dur - 0.05)) err('win temas penceresi hareketin dışına taşıyor');
  if (m.carry && !(m.carry[0] >= m.tc - 0.02 && m.carry[1] > m.carry[0] && m.carry[1] <= m.dur)) err('carry aralığı temas anından başlamalı ve süre içinde bitmeli');
  const sorted = (ts: number[]) => ts.every((t, i) => Number.isFinite(t) && (i === 0 || t > ts[i - 1]));
  if (m.keys.length < 3 || !sorted(m.keys.map((k) => k.t))) err('keys en az 3 anahtar içermeli ve zamanları artan olmalı');
  else if (m.keys[0].t > 0.001 || m.keys[m.keys.length - 1].t < m.dur - 0.001) err('keys hareketin başından (t=0) sonuna (t=dur) kadar uzanmalı');
  if (m.ball.length < 2) err('ball en az 2 anahtar içermeli');
  else {
    const bt = m.ball.map((k) => k.t);
    if (!bt.every((t, i) => Number.isFinite(t) && (i === 0 || t >= bt[i - 1]))) err('ball anahtarlarının zamanı azalmamalı');
    if (bt[0] > 0.001) err('ball ilk anahtarı t=0 olmalı');
  }
  // metinler
  if (!text(m.label, 8, 90)) err('label 8–90 karakter olmalı');
  if (!Array.isArray(m.caps) || m.caps.length !== 3 || !m.caps.every((c) => text(c, 30, 260))) err('caps [Hazırlık, Temas, Takip] üç açıklama (30–260 karakter) olmalı');
  if (m.note !== undefined && !text(m.note, 10, 220)) err('note 10–220 karakter olmalı');
  if (!Number.isFinite(m.cam)) err('cam sayı olmalı');
  if (out.length) return out;
  return [...out, ...checkMotion(m)];
}

/** Kayıt defterini tekniklerle çapraz doğrular. */
export function validateMotions(motions: Record<string, TechMotion>, techs: Record<string, TechLite>): string[] {
  return Object.entries(motions).flatMap(([k, m]) => validateMotion(k, m, techs[k]));
}

/** Sorun varsa derlemeyi durdurur. */
export function assertMotions(motions: Record<string, TechMotion>, techs: Record<string, TechLite>): void {
  const problems = validateMotions(motions, techs);
  if (problems.length) throw new Error('Teknik hareket verisi hatalı:\n' + problems.join('\n'));
}
