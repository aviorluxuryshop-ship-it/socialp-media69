"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { uid } from "@/lib/ids";
import type { DataOf, RecordKind, RecordOf } from "@/lib/types";
import { CloudStore } from "./cloud";
import { LocalStore } from "./local";
import type { ListOptions, Store } from "./types";

export type SyncState = "idle" | "saving" | "error";

interface StoreCtx {
  store: Store;
  /** Kayıt türü başına değişim sayacı; kancalar yeniden okur */
  versions: Record<string, number>;
  sync: SyncState;
  syncError: string | null;
  create: <K extends RecordKind>(kind: K, data: DataOf<K>, id?: string) => Promise<RecordOf<K>>;
  update: <K extends RecordKind>(kind: K, id: string, patch: Partial<DataOf<K>>) => Promise<RecordOf<K> | null>;
  save: <K extends RecordKind>(rec: RecordOf<K>) => Promise<void>;
  remove: (kind: RecordKind, id: string) => Promise<void>;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const userId = auth.user?.id ?? null;
  const cloud = auth.status === "signed-in";
  const waiting = auth.status === "loading";

  const store = useMemo<Store>(() => {
    const sb = getSupabase();
    if (cloud && sb && userId) return new CloudStore(sb, userId);
    return new LocalStore();
  }, [cloud, userId]);

  const [versions, setVersions] = useState<Record<string, number>>({});
  const [sync, setSync] = useState<SyncState>("idle");
  const [syncError, setSyncError] = useState<string | null>(null);
  const pending = useRef(0);

  const bump = useCallback((kind: RecordKind) => setVersions((v) => ({ ...v, [kind]: (v[kind] ?? 0) + 1 })), []);

  const track = useCallback(async <T,>(work: Promise<T>): Promise<T> => {
    pending.current++;
    setSync("saving");
    try {
      const r = await work;
      setSyncError(null);
      return r;
    } catch (e) {
      setSync("error");
      setSyncError(e instanceof Error ? e.message : "Kaydedilemedi");
      throw e;
    } finally {
      pending.current--;
      if (pending.current === 0) setSync((s) => (s === "error" ? "error" : "idle"));
    }
  }, []);

  const actions = useMemo(() => {
    const save = async <K extends RecordKind>(rec: RecordOf<K>) => {
      await track(store.put(rec));
      bump(rec.kind);
    };
    return {
      save,
      async create<K extends RecordKind>(kind: K, data: DataOf<K>, id?: string) {
        const now = Date.now();
        const rec = { ...(data as object), id: id ?? uid(), kind, createdAt: now, updatedAt: now } as unknown as RecordOf<K>;
        await save(rec);
        return rec;
      },
      async update<K extends RecordKind>(kind: K, id: string, patch: Partial<DataOf<K>>) {
        const cur = await store.get(kind, id);
        if (!cur) return null;
        const next = { ...cur, ...(patch as object), updatedAt: Date.now() } as RecordOf<K>;
        await save(next);
        return next;
      },
      async remove(kind: RecordKind, id: string) {
        await track(store.remove(kind, id));
        bump(kind);
      },
    };
  }, [store, track, bump]);

  const value = useMemo<StoreCtx>(() => ({ store, versions, sync, syncError, ...actions }), [store, versions, sync, syncError, actions]);

  if (waiting) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStoreCtx(): StoreCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider eksik");
  return v;
}

export function useRecords<K extends RecordKind>(kind: K, opts?: ListOptions) {
  const { store, versions } = useStoreCtx();
  const [state, setState] = useState<{ items: RecordOf<K>[]; loading: boolean; error: string | null }>({ items: [], loading: true, error: null });
  const v = versions[kind] ?? 0;
  const limit = opts?.limit;
  const offset = opts?.offset;
  useEffect(() => {
    let alive = true;
    store
      .list(kind, { limit, offset })
      .then((items) => alive && setState({ items, loading: false, error: null }))
      .catch((e) => alive && setState({ items: [], loading: false, error: e instanceof Error ? e.message : "Okunamadı" }));
    return () => {
      alive = false;
    };
  }, [store, kind, v, limit, offset]);
  return state;
}

const NO_RECORD = { item: null, loading: false, error: null } as const;

export function useRecord<K extends RecordKind>(kind: K, id: string | null) {
  const { store, versions } = useStoreCtx();
  const [state, setState] = useState<{ item: RecordOf<K> | null; loading: boolean; error: string | null }>({ item: null, loading: Boolean(id), error: null });
  const v = versions[kind] ?? 0;
  useEffect(() => {
    let alive = true;
    if (!id) return;
    store
      .get(kind, id)
      .then((item) => alive && setState({ item, loading: false, error: null }))
      .catch((e) => alive && setState({ item: null, loading: false, error: e instanceof Error ? e.message : "Okunamadı" }));
    return () => {
      alive = false;
    };
  }, [store, kind, id, v]);
  return id ? state : NO_RECORD;
}
