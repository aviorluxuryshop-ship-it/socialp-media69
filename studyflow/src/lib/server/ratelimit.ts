// Basit, bellek içi kayan pencere sınırlayıcı. Sunucusuz ortamda örnek başına çalışır (en iyi çaba);
// asıl koruma oturum zorunluluğu ve günlük üst sınırdır. Kalıcı kota için veritabanı gerekir.
const buckets = new Map<string, number[]>();
const daily = new Map<string, { day: string; n: number }>();

export interface LimitResult {
  ok: boolean;
  retryAfterSec?: number;
  reason?: "burst" | "daily";
}

export function checkLimit(key: string, opts: { perMinute: number; perDay: number; now?: number }): LimitResult {
  const now = opts.now ?? Date.now();
  const winStart = now - 60_000;
  const arr = (buckets.get(key) ?? []).filter((t) => t > winStart);
  if (arr.length >= opts.perMinute) {
    buckets.set(key, arr);
    return { ok: false, reason: "burst", retryAfterSec: Math.max(1, Math.ceil((arr[0] + 60_000 - now) / 1000)) };
  }
  const day = new Date(now).toISOString().slice(0, 10);
  const d = daily.get(key);
  const used = d && d.day === day ? d.n : 0;
  if (used >= opts.perDay) return { ok: false, reason: "daily", retryAfterSec: 3600 };
  arr.push(now);
  buckets.set(key, arr);
  daily.set(key, { day, n: used + 1 });
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.some((t) => t > winStart)) buckets.delete(k);
  }
  return { ok: true };
}

export function _resetLimits() {
  buckets.clear();
  daily.clear();
}
