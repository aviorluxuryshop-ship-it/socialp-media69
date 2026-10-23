"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { playTone, setSoundEnabled } from "./sound";
import { useRecord, useStoreCtx } from "./store/provider";
import type { ProfileData, ProfileRecord, ThemeMode } from "./types";

export interface Toast {
  id: number;
  kind: "ok" | "error" | "info";
  text: string;
}

interface AppCtx {
  profile: ProfileRecord | null;
  profileLoading: boolean;
  saveProfile: (data: ProfileData) => Promise<void>;
  patchProfile: (patch: Partial<ProfileData>) => Promise<void>;
  toast: (text: string, kind?: Toast["kind"]) => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export const DEFAULT_AVAILABILITY = [0, 1, 2, 3, 4].map((day) => ({ day, from: "17:30", to: "20:30" })).concat([5, 6].map((day) => ({ day, from: "10:00", to: "17:00" })));

function applyTheme(theme: ThemeMode, reduce: boolean) {
  const el = document.documentElement;
  if (theme === "system") el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", theme);
  if (reduce) el.setAttribute("data-motion", "reduce");
  else el.removeAttribute("data-motion");
  try {
    localStorage.setItem("sf-theme", theme);
  } catch {
    /* tercih yalnızca bir kolaylık */
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { create, update } = useStoreCtx();
  const { item, loading } = useRecord("profile", "me");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    if (item) {
      applyTheme(item.theme, item.reduceMotion);
      setSoundEnabled(item.sound);
    }
  }, [item]);

  const toast = useCallback((text: string, kind: Toast["kind"] = "info") => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-2), { id, kind, text }]);
    if (kind === "ok") playTone("success");
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 6500 : 3800);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const value = useMemo<AppCtx>(
    () => ({
      profile: item,
      profileLoading: loading,
      async saveProfile(data) {
        if (item) await update("profile", "me", data);
        else await create("profile", data, "me");
      },
      async patchProfile(patch) {
        if (item) await update("profile", "me", patch);
      },
      toast,
      toasts,
      dismissToast,
    }),
    [item, loading, create, update, toast, toasts, dismissToast],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("AppProvider eksik");
  return v;
}
