"use client";

import { useEffect } from "react";
import { hydrateStore, useStore } from "@/lib/store";
import { Brand } from "./Brand";

/** Yerel depodan veri yüklenene kadar sade bir açılış gösterir (sunucu/istemci uyuşmazlığını da önler). */
export function Boot({ children }: { children: React.ReactNode }) {
  const hydrated = useStore((s) => s.hydrated);
  useEffect(() => {
    void hydrateStore();
  }, []);
  if (!hydrated)
    return (
      <div className="grid min-h-dvh place-items-center" aria-busy="true">
        <div className="anim-fade opacity-80">
          <Brand size="lg" />
        </div>
      </div>
    );
  return <>{children}</>;
}
