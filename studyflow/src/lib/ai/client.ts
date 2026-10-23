"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import type { TutorEvent, TutorRequest } from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function parseError(res: Response): Promise<ApiError> {
  try {
    const j = (await res.json()) as { error?: string; message?: string };
    return new ApiError(res.status, j.error ?? "error", j.message ?? "İstek tamamlanamadı.");
  } catch {
    return new ApiError(res.status, "error", "İstek tamamlanamadı. Bağlantını kontrol edip tekrar dene.");
  }
}

export interface ServerStatus {
  ai: boolean;
  accounts: boolean;
  aiReady: boolean;
}
let statusCache: Promise<ServerStatus> | null = null;
export function useServerStatus(): ServerStatus | null {
  const [s, setS] = useState<ServerStatus | null>(null);
  useEffect(() => {
    statusCache ??= fetch("/api/status", { cache: "no-store" })
      .then((r) => r.json() as Promise<ServerStatus>)
      .catch(() => ({ ai: false, accounts: false, aiReady: false }));
    let alive = true;
    statusCache.then((v) => alive && setS(v));
    return () => {
      alive = false;
    };
  }, []);
  return s;
}

export function useAi() {
  const auth = useAuth();
  const { getToken } = auth;

  const headers = useCallback(async () => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    const t = await getToken();
    if (t) h.Authorization = `Bearer ${t}`;
    return h;
  }, [getToken]);

  const postJson = useCallback(
    async <T,>(url: string, body: unknown, signal?: AbortSignal): Promise<T> => {
      let res: Response;
      try {
        res = await fetch(url, { method: "POST", headers: await headers(), body: JSON.stringify(body), signal });
      } catch (e) {
        if ((e as Error).name === "AbortError") throw e;
        throw new ApiError(0, "network", "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.");
      }
      if (!res.ok) throw await parseError(res);
      return (await res.json()) as T;
    },
    [headers],
  );

  const streamTutor = useCallback(
    async (body: TutorRequest, onEvent: (e: TutorEvent) => void, signal?: AbortSignal) => {
      let res: Response;
      try {
        res = await fetch("/api/ai/tutor", { method: "POST", headers: await headers(), body: JSON.stringify(body), signal });
      } catch (e) {
        if ((e as Error).name === "AbortError") throw e;
        throw new ApiError(0, "network", "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.");
      }
      if (!res.ok || !res.body) throw await parseError(res);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          try {
            onEvent(JSON.parse(line) as TutorEvent);
          } catch {
            /* bozuk satırı atla */
          }
        }
      }
    },
    [headers],
  );

  return useMemo(() => ({ postJson, streamTutor }), [postJson, streamTutor]);
}

/** Kullanıcıya gösterilecek hata metni */
export function errorText(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error && e.name === "AbortError") return "Durduruldu.";
  return "Beklenmeyen bir sorun oluştu. Tekrar dene.";
}
