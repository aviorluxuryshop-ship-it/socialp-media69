'use client';

// Beslenme sayfasının tarayıcı depoları: libero:v1 DIŞINDA, kendi anahtarlarında.
// useSyncExternalStore: sunucuda ve ilk çizimde varsayılan, ardından kayıtlı değer (hidrasyon uyumsuzluğu olmaz).
import { useCallback, useSyncExternalStore } from 'react';
import { DEFAULT_WATER, PLAN_KEY, WATER_KEY, emptyPlan, normalizePlan, normalizeWater, type PlanState, type WaterState } from './nutrition';

function makeStore<T>(key: string, normalize: (raw: unknown) => T, fallback: T) {
  let snap: T = fallback;
  let loaded = false;
  const listeners = new Set<() => void>();
  const load = () => {
    try {
      const raw = localStorage.getItem(key);
      snap = raw ? normalize(JSON.parse(raw)) : fallback;
    } catch {
      snap = fallback;
    }
    loaded = true;
  };
  const emit = () => listeners.forEach((l) => l());
  return {
    get: (): T => {
      if (!loaded) load();
      return snap;
    },
    server: (): T => fallback,
    subscribe: (cb: () => void) => {
      listeners.add(cb);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key || e.key === null) {
          load();
          emit();
        }
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(cb);
        window.removeEventListener('storage', onStorage);
      };
    },
    set: (fn: (cur: T) => T) => {
      if (!loaded) load();
      snap = normalize(fn(snap));
      try {
        localStorage.setItem(key, JSON.stringify(snap));
      } catch {
        /* depolama kapalı olabilir: bu oturumda bellekte kalır */
      }
      emit();
    },
  };
}

const water = makeStore<WaterState>(WATER_KEY, normalizeWater, DEFAULT_WATER);
const plan = makeStore<PlanState>(PLAN_KEY, normalizePlan, emptyPlan());

export function useWater(): [WaterState, (fn: (cur: WaterState) => WaterState) => void] {
  const s = useSyncExternalStore(water.subscribe, water.get, water.server);
  return [s, useCallback((fn) => water.set(fn), [])];
}

export function usePlan(): [PlanState, (fn: (cur: PlanState) => PlanState) => void] {
  const s = useSyncExternalStore(plan.subscribe, plan.get, plan.server);
  return [s, useCallback((fn) => plan.set(fn), [])];
}
