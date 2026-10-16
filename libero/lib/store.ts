'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { Level, PositionId } from './types';
import type { Program, SessionLog } from './program-types';
import {
  defaultEquipByEnv,
  migrateEquipment,
  sanitizeEnvs,
  sanitizeEquipByEnv,
  type Env,
  type EquipByEnv,
  type EquipId as EquipIdT,
} from './environments';

/* ───────────────────────────────────────────────────────────
   Kalıcı depolama
   İlk sürümde veri yalnızca bu tarayıcının localStorage'ında tutulur.
   Hesap/sunucu yok → aynı cihaz + aynı tarayıcı. Dışa/içe aktarma ile
   yedek alınabilir (Profil sayfası).
   ─────────────────────────────────────────────────────────── */

export const STORAGE_KEY = 'libero:v1';
/** 2: ortam başına ekipman (equipByEnv); hedef 'teknik' kaldırıldı. Anahtar (libero:v1) değişmez; v1 verisi okunurken dönüştürülür. */
export const SCHEMA_VERSION = 2;

export type Goal = 'dengeli' | 'hiz-cio' | 'dayaniklilik' | 'kuvvet-guc';
export type EquipId = EquipIdT;
export type EnvId = Env;

export interface Profile {
  name: string;
  age: number | null;
  level: Level; // genel/varsayılan yetenek seviyesi
  positions: PositionId[];
  goal: Goal;
  /** her ortamda kullanıcının seçtiği ekipman */
  equipByEnv: EquipByEnv;
  envs: EnvId[];
  perWeek: number;
  minutes: number;
}

export interface TestEntry {
  id: string;
  kind: string; // test kimliği (sprint10, sprint30, tTest, cmj, juggle, passAcc ...)
  value: number;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface BoardSave {
  id: string;
  name: string;
  at: string;
  scene: unknown; // Scene (tahta modülü doğrular)
}

export interface VideoMarker {
  id: string;
  t: number; // saniye
  label: string;
  note: string;
  scores?: Record<string, number>;
  strokes?: unknown[];
}

export interface QuizRecord {
  tries: number;
  right: number;
  last: boolean;
  at: string;
}

export interface AppState {
  v: number;
  profile: Profile;
  levels: Record<string, { level: Level; at: string }>;
  levelLog: { id: string; level: Level; at: string }[];
  practiced: Record<string, { count: number; last: string }>;
  fav: string[];
  program: Program | null;
  logs: SessionLog[];
  quiz: Record<string, QuizRecord>;
  tests: TestEntry[];
  board: BoardSave[];
  videoNotes: Record<string, { name: string; markers: VideoMarker[]; updated: string }>;
  lastVisit: { path: string; title: string; at: string } | null;
  createdAt: string;
}

export const DEFAULT_PROFILE: Profile = {
  name: '',
  age: null,
  level: 2,
  positions: [],
  goal: 'dengeli',
  equipByEnv: defaultEquipByEnv(),
  envs: ['saha'],
  perWeek: 4,
  minutes: 60,
};

export function makeDefault(): AppState {
  return {
    v: SCHEMA_VERSION,
    profile: { ...DEFAULT_PROFILE, equipByEnv: defaultEquipByEnv() },
    levels: {},
    levelLog: [],
    practiced: {},
    fav: [],
    program: null,
    logs: [],
    quiz: {},
    tests: [],
    board: [],
    videoNotes: {},
    lastVisit: null,
    createdAt: '',
  };
}

const DEFAULT_STATE = makeDefault();

interface Meta {
  ready: boolean;
  storageOk: boolean;
}

let state: AppState = DEFAULT_STATE;
let meta: Meta = { ready: false, storageOk: true };
const listeners = new Set<() => void>();
let writeTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}


const GOALS_OK: Goal[] = ['dengeli', 'hiz-cio', 'dayaniklilik', 'kuvvet-guc'];

/**
 * Profil okuma + sürüm dönüşümü (v1 → v2). Eski kayıtlarda:
 *  - tek düz `equipment` listesi vardı → ortam başına `equipByEnv`'e bölünür,
 *  - hedef 'teknik' vardı (program artık fiziksel gelişime odaklı) → 'dengeli'.
 * Kullanıcının yaş, seviye, pozisyon, süre ve sıklık seçimleri aynen korunur.
 */
export function sanitizeProfile(raw: unknown, base: Profile): Profile {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const merged = { ...base, ...(r as Partial<Profile>) } as Profile;
  const envs = sanitizeEnvs(r.envs, base.envs);
  const legacy = r.equipment;
  const by = r.equipByEnv
    ? sanitizeEquipByEnv(r.equipByEnv, base.equipByEnv)
    : legacy !== undefined
      ? migrateEquipment(legacy, envs)
      : base.equipByEnv;
  const goal = GOALS_OK.includes(merged.goal as Goal) ? merged.goal : 'dengeli';
  const out: Profile & { equipment?: unknown } = { ...merged, envs, equipByEnv: by, goal };
  delete out.equipment;
  return out;
}

export function sanitize(raw: unknown): AppState {
  const base = makeDefault();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppState>;
  return {
    ...base,
    ...r,
    v: SCHEMA_VERSION,
    profile: sanitizeProfile(r.profile, base.profile),
    levels: r.levels && typeof r.levels === 'object' ? r.levels : {},
    levelLog: Array.isArray(r.levelLog) ? r.levelLog : [],
    practiced: r.practiced && typeof r.practiced === 'object' ? r.practiced : {},
    fav: Array.isArray(r.fav) ? r.fav : [],
    logs: Array.isArray(r.logs) ? r.logs : [],
    quiz: r.quiz && typeof r.quiz === 'object' ? r.quiz : {},
    tests: Array.isArray(r.tests) ? r.tests : [],
    board: Array.isArray(r.board) ? r.board : [],
    videoNotes: r.videoNotes && typeof r.videoNotes === 'object' ? r.videoNotes : {},
    program: r.program ?? null,
    lastVisit: r.lastVisit ?? null,
  };
}

function flush() {
  if (typeof window === 'undefined') return;
  writeTimer = null;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (!meta.storageOk) {
      meta = { ...meta, storageOk: true };
      emit();
    }
  } catch {
    if (meta.storageOk) {
      meta = { ...meta, storageOk: false };
      emit();
    }
  }
}

function scheduleWrite() {
  if (typeof window === 'undefined') return;
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(flush, 120);
}

/** Tarayıcıdan oku (yalnızca istemcide, bir kez) */
export function hydrateStore() {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) state = sanitize(JSON.parse(raw));
    else state = { ...makeDefault(), createdAt: new Date().toISOString() };
    meta = { ready: true, storageOk: true };
  } catch {
    state = { ...makeDefault(), createdAt: new Date().toISOString() };
    meta = { ready: true, storageOk: false };
  }
  emit();

  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    try {
      state = e.newValue ? sanitize(JSON.parse(e.newValue)) : makeDefault();
      emit();
    } catch {
      /* yoksay */
    }
  });
  window.addEventListener('pagehide', () => {
    if (writeTimer) flush();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && writeTimer) flush();
  });
}

export function update(fn: (s: AppState) => AppState) {
  state = fn(state);
  emit();
  scheduleWrite();
}

export function getState() {
  return state;
}

export function useStore<T>(selector: (s: AppState) => T): T {
  const get = useCallback(() => selector(state), [selector]);
  const getServer = useCallback(() => selector(DEFAULT_STATE), [selector]);
  return useSyncExternalStore(subscribe, get, getServer);
}

export function useMeta(): Meta {
  return useSyncExternalStore(
    subscribe,
    () => meta,
    () => ({ ready: false, storageOk: true }),
  );
}

// ── Dışa/İçe aktarma, sıfırlama ───────────────────────────

export function exportData(): string {
  return JSON.stringify({ app: 'libero', exportedAt: new Date().toISOString(), data: state }, null, 2);
}

export function importData(text: string): { ok: true } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || parsed.app !== 'libero' || !parsed.data) {
      return { ok: false, error: 'Bu dosya bir Libero yedeği gibi görünmüyor.' };
    }
    update(() => sanitize(parsed.data));
    flush();
    return { ok: true };
  } catch {
    return { ok: false, error: 'Dosya okunamadı. Geçerli bir JSON yedeği seçin.' };
  }
}

export function resetAll() {
  update(() => ({ ...makeDefault(), createdAt: new Date().toISOString() }));
  flush();
}

// ── Kısayol eylemleri ─────────────────────────────────────

export const nowIso = () => new Date().toISOString();

export function setProfile(patch: Partial<Profile>) {
  update((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
}

export function setTechLevel(id: string, level: Level) {
  update((s) => ({
    ...s,
    levels: { ...s.levels, [id]: { level, at: nowIso() } },
    levelLog: [...s.levelLog, { id, level, at: nowIso() }].slice(-500),
  }));
}

export function markPracticed(id: string) {
  update((s) => {
    const cur = s.practiced[id];
    return {
      ...s,
      practiced: { ...s.practiced, [id]: { count: (cur?.count ?? 0) + 1, last: nowIso() } },
    };
  });
}

export function toggleFav(id: string) {
  update((s) => ({
    ...s,
    fav: s.fav.includes(id) ? s.fav.filter((x) => x !== id) : [...s.fav, id],
  }));
}

export function recordVisit(path: string, title: string) {
  update((s) => ({ ...s, lastVisit: { path, title, at: nowIso() } }));
}

export function recordQuiz(id: string, correct: boolean) {
  update((s) => {
    const cur = s.quiz[id];
    return {
      ...s,
      quiz: {
        ...s.quiz,
        [id]: {
          tries: (cur?.tries ?? 0) + 1,
          right: (cur?.right ?? 0) + (correct ? 1 : 0),
          last: correct,
          at: nowIso(),
        },
      },
    };
  });
}

// ── Test kayıtları (performans analizi) ───────────────────

export function addTest(entry: Omit<TestEntry, 'id'>) {
  const id = Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  update((s) => ({ ...s, tests: [...s.tests, { ...entry, id }].slice(-2000) }));
  return id;
}

export function deleteTest(id: string) {
  update((s) => ({ ...s, tests: s.tests.filter((t) => t.id !== id) }));
}

// ── Video analiz notları ───────────────────────────────────

export function saveVideoNotes(key: string, name: string, markers: VideoMarker[]) {
  update((s) => {
    const next = { ...s.videoNotes };
    if (markers.length === 0) delete next[key];
    else next[key] = { name, markers, updated: nowIso() };
    return { ...s, videoNotes: next };
  });
}

export function deleteVideoNotes(key: string) {
  update((s) => {
    const next = { ...s.videoNotes };
    delete next[key];
    return { ...s, videoNotes: next };
  });
}
