// Yazım yardımcısı: vuran (yakın) bacağı "bilek konumu + ayak eğimi" terimleriyle (IK) yazıp SERT ayaklı (FK) kareye çevirir.
// React yok, DOM yok.
//
// Neden: IK bacakta negatif ayak eğimi (parmaklar aşağı) ön ayağı otomatik yukarı büker (topuk kalkık yürüyüş: parmak yerde kalır).
// Parmak ucu aşağı bakan sert bir ayak (ayak üstü / dış ayak üstü vuruşu) için bacak FK olmalıdır (legs: ['fk', 'ik']).
// FK değerlerini elle hesaplamak yerine, vuran bacak yine bilek konumu (n0 = x, n1 = y, n2 = eğim) olarak yazılır;
// `nearIkToFk` her anahtarı (ve araya 1/30 sn'lik örnekler ekleyerek) uyluk açısı / diz bükülmesi / bilek eğmesine çevirir.
// Böylece yere basan vuran ayak kaymaz, hedef bilek menzil dışındaysa yazım anında hata alınır.
import { compilePose, footLowest, poseAt, solveLegFK, solveLegIK, type PoseKey } from './rig';

/**
 * Sert (parmak bükülmeyen) ayağın en alçak noktası tam yere değsin diye gereken bilek yüksekliği (m).
 * pitch: ayak eğimi (derece, + parmak yukarı, − parmak aşağı). Örn. topuk vuruşunda groundYRigid(15).
 */
export function groundYRigid(pitch: number, yaw = 0): number {
  const leg = solveLegFK([0, 1.0], 0, 0, -pitch, yaw, 1);
  return Math.round((leg.ankle[1] - footLowest(leg.foot)) * 1000) / 1000;
}

/**
 * Yakın bacağı IK ile yazılmış anahtarları (n0 = bilek x, n1 = bilek y, n2 = ayak eğimi) FK anahtarlarına çevirir
 * (n0 = uyluk açısı, n1 = diz bükülmesi, n2 = bilek eğmesi). Diğer kanallar aynen korunur.
 * Anahtar zamanları korunur; aralara `step` sn'lik örnekler eklenir (FK eğrisi IK yolunu milimetre altı hatayla izler).
 */
export function nearIkToFk(keys: readonly PoseKey[], step = 1 / 30): PoseKey[] {
  const track = compilePose(keys);
  const t0 = keys[0].t;
  const t1 = keys[keys.length - 1].t;
  const times = new Set<number>(keys.map((k) => k.t));
  for (let t = t0 + step; t < t1 - 1e-6; t += step) times.add(Math.round(t * 1000) / 1000);
  return [...times]
    .sort((a, b) => a - b)
    .map((t) => {
      const p = poseAt(track, t);
      const leg = solveLegIK([p.px, p.py], p.n0, p.n1, p.n2, p.ny, 1);
      if (leg.over > 0.004) throw new Error(`nearIkToFk: t=${t.toFixed(2)} vuran bilek bacağın erişemeyeceği kadar uzak (${leg.over.toFixed(3)} m)`);
      return { t, p: { ...p, n0: leg.thigh, n1: leg.flex, n2: leg.shank - p.n2 } };
    });
}
