import type { AppData } from "./types";

/** Yedek dosyasının panel verisi olup olmadığını denetler. */
export function isAppData(x: unknown): x is AppData {
  if (!x || typeof x !== "object") return false;
  const d = x as Record<string, unknown>;
  return ["branches", "staff", "services", "customers", "appointments", "transactions"].every((k) => Array.isArray(d[k])) && !!d.settings && typeof d.settings === "object";
}
