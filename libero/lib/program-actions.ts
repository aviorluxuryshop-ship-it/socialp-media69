import { EX_BY_ID } from '@/data/exercises';
import { doseFor } from './training';
import { update } from './store';
import type { PlannedItem, PlannedSession, Program, SessionFocus, SessionLog } from './program-types';
import { addDays, todayKey, uid, weekStart } from './utils';

export function saveProgram(p: Program) {
  update((s) => ({ ...s, program: p }));
}

export function clearProgram() {
  update((s) => ({ ...s, program: null }));
}

function patchSession(id: string, fn: (s: PlannedSession) => PlannedSession) {
  update((s) =>
    s.program ? { ...s, program: { ...s.program, sessions: s.program.sessions.map((x) => (x.id === id ? fn(x) : x)) } } : s,
  );
}

export function assignDay(sessionId: string, day: number | null) {
  patchSession(sessionId, (x) => ({ ...x, day }));
}

export function removeItem(sessionId: string, key: string) {
  patchSession(sessionId, (x) => ({ ...x, items: x.items.filter((i) => i.key !== key) }));
}

export function swapItem(sessionId: string, key: string, newId: string, age: number, level: 1 | 2 | 3 | 4 | 5) {
  const ex = EX_BY_ID[newId];
  if (!ex) return;
  const d = doseFor(ex, age < 12 ? 'u12' : age < 15 ? '12-14' : age < 18 ? '15-17' : '18+', level);
  patchSession(sessionId, (x) => ({
    ...x,
    items: x.items.map((i) => (i.key === key ? { ...i, ref: ex.id, kind: 'ex', name: ex.name, sets: d.sets, dose: d.text, rest: d.rest, note: d.note } : i)),
  }));
}

export function weekRange(offset = 0): { start: string; end: string; startDate: Date } {
  const start = addDays(weekStart(), offset * 7);
  return { start: todayKey(start), end: todayKey(addDays(start, 6)), startDate: start };
}

/** Belirli bir haftada, bu oturum için kayıt var mı? */
export function logForSession(logs: SessionLog[], sessionId: string, offset = 0): SessionLog | undefined {
  const { start, end } = weekRange(offset);
  return logs
    .filter((l) => l.sessionId === sessionId && l.date >= start && l.date <= end)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0];
}

export function startSession(session: PlannedSession, program: Program, logs: SessionLog[]): string {
  const existing = logs.find((l) => l.sessionId === session.id && l.status === 'active');
  if (existing) return existing.id;
  const id = uid();
  const log: SessionLog = {
    id,
    programId: program.id,
    sessionId: session.id,
    title: session.title,
    focus: session.focus,
    date: todayKey(),
    startedAt: new Date().toISOString(),
    status: 'active',
    progress: {},
    items: session.items,
    minutes: session.minutes,
  };
  update((s) => ({ ...s, logs: [...s.logs, log] }));
  return id;
}

export function toggleSet(logId: string, key: string, n: number) {
  update((s) => ({
    ...s,
    logs: s.logs.map((l) => {
      if (l.id !== logId) return l;
      const cur = l.progress[key] ?? 0;
      return { ...l, progress: { ...l.progress, [key]: cur >= n ? n - 1 : n } };
    }),
  }));
}

export function finishLog(logId: string, status: 'done' | 'partial', rpe?: number, note?: string) {
  update((s) => ({
    ...s,
    logs: s.logs.map((l) => (l.id === logId ? { ...l, status, rpe, note, finishedAt: new Date().toISOString() } : l)),
  }));
}

export function deleteLog(logId: string) {
  update((s) => ({ ...s, logs: s.logs.filter((l) => l.id !== logId) }));
}

export function addManualLog(focus: SessionFocus | 'serbest', minutes: number, rpe: number | undefined, note: string, date = todayKey()) {
  const items: PlannedItem[] = [{ key: 'manuel', ref: 'manuel', kind: 'drill', name: `Serbest kayıt (${minutes} dk)`, sets: 1, dose: `${minutes} dk`, rest: '—' }];
  const log: SessionLog = {
    id: uid(),
    programId: null,
    sessionId: null,
    title: 'Serbest antrenman',
    focus,
    date,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    status: 'done',
    progress: { manuel: 1 },
    items,
    rpe,
    note,
    minutes,
  };
  update((s) => ({ ...s, logs: [...s.logs, log] }));
}

export function logProgress(l: SessionLog): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const it of l.items) {
    total += it.sets;
    done += Math.min(it.sets, l.progress[it.key] ?? 0);
  }
  return { done, total };
}

export function logMinutes(l: SessionLog): number {
  return l.minutes ?? 45;
}
