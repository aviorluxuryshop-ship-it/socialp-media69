'use client';

import { useSyncExternalStore } from 'react';

/**
 * Önemsiz arayüz tercihleri — kritik veri deposundan (libero:v1) AYRI anahtar.
 * Yedeğe girmez; silinse/engellense bile site çalışır (her okuma/yazma try/catch içinde).
 */

export const UI_KEY = 'libero:ui';

export interface UiPrefs {
  /** Video kapaklarını YouTube'dan (i.ytimg.com) yükle. Kapalıyken dış görsel isteği yapılmaz. */
  ytThumbs: boolean;
}

export const DEFAULT_UI: UiPrefs = { ytThumbs: true };

export function sanitizeUi(raw: unknown): UiPrefs {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return { ytThumbs: typeof r.ytThumbs === 'boolean' ? r.ytThumbs : DEFAULT_UI.ytThumbs };
}

export function readUi(): UiPrefs {
  try {
    const raw = window.localStorage.getItem(UI_KEY);
    return sanitizeUi(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULT_UI };
  }
}

interface Snapshot extends UiPrefs {
  /** İstemcide okundu mu? (sunucu çıktısında ve ilk karede false → dış görsel istenmez) */
  hydrated: boolean;
}

const SERVER: Snapshot = { ...DEFAULT_UI, hydrated: false };
let current: Snapshot | null = null;
const listeners = new Set<() => void>();
let wired = false;

function snap(): Snapshot {
  if (!current) current = { ...readUi(), hydrated: true };
  return current;
}

function wire() {
  if (wired || typeof window === 'undefined') return;
  wired = true;
  window.addEventListener('storage', (e) => {
    if (e.key !== UI_KEY) return;
    current = { ...readUi(), hydrated: true };
    listeners.forEach((l) => l());
  });
}

function subscribe(cb: () => void) {
  wire();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setUi(patch: Partial<UiPrefs>) {
  const next = { ...snap(), ...patch, hydrated: true };
  current = next;
  try {
    window.localStorage.setItem(UI_KEY, JSON.stringify({ ytThumbs: next.ytThumbs }));
  } catch {
    /* depolama kapalı: tercih yalnızca bu oturumda geçerli */
  }
  listeners.forEach((l) => l());
}

export function useUiPrefs(): Snapshot {
  return useSyncExternalStore(subscribe, snap, () => SERVER);
}
