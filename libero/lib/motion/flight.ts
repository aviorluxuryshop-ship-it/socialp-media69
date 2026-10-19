// Yazım yardımcısı: vuruştan sonra havada giden (ve yana kavis çizen) topun anahtarlarını üretir. React yok, DOM yok.
//
// Hareketler şematik ve anlatım için yavaşlatılmıştır: top gerçek hızından çok daha yavaş uçar ki yandan görünümde izlenebilsin.
// Yol: yatayda sabit hız, dikeyde parabol (yerçekimi `g` burada "yavaşlatılmış" bir değerdir), yanalda (z) kavis.
// Kavis: top temas anındaki z0'dan, `bend` kadar yana açılıp (örn. − sol) hedef çizgisine geri döner: z = z0 + bend · 4u(1−u).
// `bend` > 0: oyuncunun SAĞINA doğru şişkin yol (başlangıçta sağa açılır, sonra sola döner = SOLA kavis, sağ ayağın iç yüzü).
// `bend` < 0: oyuncunun SOLUNA doğru şişkin yol (başlangıçta sola açılır, sonra sağa döner = SAĞA kavis, trivela).
import type { BallKey } from './rig';

export interface FlightSpec {
  /** vuruş anı (sn) */
  t0: number;
  /** çıkış konumu: x, y (top merkezi) ve derinlik z (m) */
  x0: number;
  y0: number;
  z0: number;
  /** çıkış hızı (m/sn): yatay (x) ve dikey (y) */
  vx: number;
  vy: number;
  /** anlatım için yavaşlatılmış yerçekimi (m/sn²) */
  g: number;
  /** yanal şişkinlik (m), işaret için yukarıya bakın */
  bend: number;
  /** son anahtarın zamanı (sn) */
  tEnd: number;
  /** örnekleme aralığı (sn) */
  step?: number;
  /** toplam dönüş (derece, yandan görünümde; + saat yönünün tersi = ileri giden topta geri dönüş, − saat yönü) tEnd'e kadar */
  spin?: number;
}

/** Vuruş anındaki `cut` anahtarıyla başlayan top anahtarları. Top yere inmez: dikey konum en az 0,11 m'de tutulur. */
export function flightKeys(o: FlightSpec): BallKey[] {
  const step = o.step ?? 0.1;
  const T = o.tEnd - o.t0;
  const keys: BallKey[] = [];
  const n = Math.max(1, Math.round(T / step));
  for (let i = 0; i <= n; i++) {
    const tau = (T * i) / n;
    const u = tau / T;
    const y = Math.max(0.11, o.y0 + o.vy * tau - 0.5 * o.g * tau * tau);
    const k: BallKey = {
      t: Math.round((o.t0 + tau) * 1000) / 1000,
      x: o.x0 + o.vx * tau,
      y,
      z: o.z0 + o.bend * 4 * u * (1 - u),
      r: (o.spin ?? 0) * u,
    };
    if (i === 0) Object.assign(k, { vx: o.vx, vy: o.vy, cut: true });
    keys.push(k);
  }
  return keys;
}
