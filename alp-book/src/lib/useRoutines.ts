"use client";

import { useMemo } from "react";
import { ROUTINES, setRoutineRegistry } from "./routines";
import { useStore } from "./store";
import type { Routine } from "./types";

/** Etkin rutin listesi. Kullanan bileşen, rutinler değişince yeniden çizilir. */
export function useRoutines(): Routine[] {
  const custom = useStore((s) => s.customRoutines);
  const hidden = useStore((s) => s.hidden);
  return useMemo(() => {
    setRoutineRegistry(custom, hidden);
    return ROUTINES;
  }, [custom, hidden]);
}
