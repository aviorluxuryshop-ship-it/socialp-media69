import { POSITIONS } from '@/lib/types';
import { fitView, timeline } from '@/lib/scene';
import type { Technique } from './types';

/** Çakışan (üst üste binen) oyuncular: okunabilirlik uyarısı */
export function overlapWarnings(list: Technique[]): string[] {
  const out: string[] = [];
  for (const t of list) {
    const tl = timeline(t.scene);
    const u = fitView(t.scene, tl).unit;
    tl.forEach((f, k) => {
      const ids = t.scene.a.filter((a) => a.t === 'a' || a.t === 'b' || a.t === 'k');
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const p = f.pos[ids[i].id];
          const q = f.pos[ids[j].id];
          if (!p || !q) continue;
          if (/^W\d/.test(ids[i].id) && /^W\d/.test(ids[j].id)) continue; // duvar oyuncuları omuz omuza
          const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
          if (d < 2 * u + 0.2) out.push(`${t.id} kare ${k + 1}: ${ids[i].id}–${ids[j].id} çakışıyor (${d.toFixed(1)} m < ${(2 * u + 0.2).toFixed(1)})`);
        }
      }
    });
  }
  return out;
}

/** İçerik bütünlüğü kontrolü: derleme sırasında hatalı veriyi yakalar. */
export function validateTechniques(list: Technique[]): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  const posIds = new Set<string>(POSITIONS.map((p) => p.id));
  for (const t of list) {
    if (ids.has(t.id)) errs.push(`Yinelenen kimlik: ${t.id}`);
    ids.add(t.id);
  }
  for (const t of list) {
    for (const r of t.related) if (!ids.has(r)) errs.push(`${t.id}: bilinmeyen ilgili teknik "${r}"`);
    for (const p of t.positions) if (!posIds.has(p)) errs.push(`${t.id}: bilinmeyen pozisyon "${p}"`);
    const levels = new Set(t.drills.map((d) => d.lvl));
    for (const l of [1, 2, 3, 4, 5]) if (!levels.has(l as 1)) errs.push(`${t.id}: ${l}. seviye alıştırması yok`);
    if (t.steps.length < 3) errs.push(`${t.id}: adım sayısı az`);
    const actors = new Set(t.scene.a.map((a) => a.id));
    t.scene.f.forEach((f, i) => {
      if (f.m) for (const id of Object.keys(f.m)) if (!actors.has(id)) errs.push(`${t.id}: kare ${i + 1} bilinmeyen oyuncu "${id}"`);
      if (typeof f.b === 'string' && !actors.has(f.b)) errs.push(`${t.id}: kare ${i + 1} top sahibi "${f.b}" yok`);
      if (f.o?.quiet) for (const id of f.o.quiet) if (!actors.has(id)) errs.push(`${t.id}: quiet "${id}" yok`);
    });
    if (/makas/i.test(`${t.name} ${t.aliases.join(' ')}`)) errs.push(`${t.id}: "makas" içeren teknik adı kullanılamaz`);
  }
  return errs;
}

import type { Scene } from '@/lib/types';
import type { PositionProfile } from './positions';
import type { QuizQuestion } from './quiz';
import type { Tactic } from './tactics';

function sceneErrors(id: string, scene: Scene): string[] {
  const out: string[] = [];
  const actors = new Set(scene.a.map((a) => a.id));
  scene.f.forEach((f, i) => {
    if (f.m) for (const k of Object.keys(f.m)) if (!actors.has(k)) out.push(`${id}: kare ${i + 1} bilinmeyen oyuncu "${k}"`);
    if (typeof f.b === 'string' && !actors.has(f.b)) out.push(`${id}: kare ${i + 1} top sahibi "${f.b}" yok`);
  });
  return out;
}

export function validateRest(args: { techIds: Set<string>; tactics: Tactic[]; positions: PositionProfile[]; quiz: QuizQuestion[] }): string[] {
  const { techIds, tactics, positions, quiz } = args;
  const out: string[] = [];
  const tacticIds = new Set(tactics.map((t) => t.id));
  for (const t of tactics) {
    out.push(...sceneErrors(`taktik:${t.id}`, t.scene));
    for (const r of t.related) if (!techIds.has(r) && !tacticIds.has(r)) out.push(`taktik:${t.id}: bilinmeyen ilgili "${r}"`);
  }
  for (const p of positions) {
    out.push(...sceneErrors(`pozisyon:${p.id}`, p.scene));
    for (const k of p.keyTechs) if (!techIds.has(k)) out.push(`pozisyon:${p.id}: bilinmeyen teknik "${k}"`);
    for (const k of p.keyTactics) if (!tacticIds.has(k)) out.push(`pozisyon:${p.id}: bilinmeyen taktik "${k}"`);
  }
  const qids = new Set<string>();
  for (const q of quiz) {
    if (qids.has(q.id)) out.push(`quiz: yinelenen ${q.id}`);
    qids.add(q.id);
    out.push(...sceneErrors(`quiz:${q.id}`, q.scene));
    if (q.opts.filter((o) => o.ok).length !== 1) out.push(`quiz:${q.id}: tam bir doğru seçenek olmalı`);
    if (q.opts.length < 3) out.push(`quiz:${q.id}: seçenek sayısı az`);
    if (q.scene.f.length < 2) out.push(`quiz:${q.id}: en az 2 kare gerekli`);
  }
  return out;
}
