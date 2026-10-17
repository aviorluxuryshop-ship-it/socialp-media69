/**
 * Olay (an) tespiti — saf fonksiyonlar.
 *
 * Bunlar kural tabanlı sezgisel tespitlerdir (yapay zekâ değil, eğitilmiş bir sınıflandırıcı da değil) ve
 * topu görmezler. Eşik değerleri thresholds.ts içinde tek yerdedir.
 *
 *  • vurus          — "vuruş/pas hareketi ADAYI". Bir bileğin mutlak hız tepesi (GB/sn) + bileğin kalçaya göre
 *                     hızı + o bacağın önceden bükülüp sonradan açılması + komşu adım tepelerine göre baskınlık.
 *                     Top izlenmediği için gerçekten topa vurulup vurulmadığı bilinmez; sallama/şaşırtma
 *                     hareketi de aday çıkabilir.
 *  • yon-degistirme — kalça merkezi hareket yönünün (derece, görüntü düzleminde) kısa bir pencerede ≥ eşik kadar
 *                     değişmesi. Kamera sabit değilse yön kameraya görelidir.
 *  • hizlanma       — kalça hızı tepesi, öncesinde ≥ eşik kadar artışla (≤ 2 sn içinde). Tepe ≥ koşu eşiğini
 *                     aşarsa "sprint" olarak etiketlenir.
 *  • durus          — kalça neredeyse sabitken (a) bir ayağın belirgin kalkık olduğu tek ayak anı ya da
 *                     (b) iki ayakta sakin duruş.
 *  • comelme        — diz açısı ortalaması düşük VE kalça yüksekliği kendi taban çizgisinin altında.
 *
 * GÜVEN (0–1): landmark görünürlüğü ile sinyal belirginliğinin ağırlıklı ortalaması (her olay türünde
 * formül kodda yorumlanmıştır). Bu bir olasılık değildir; olayların birbirine göre güvenilirliğini sıralar.
 */
import {
  angDiff,
  argMax,
  argMin,
  circMean,
  clamp01,
  findPeaks,
  maxOf,
  meanRange,
  median,
  minOf,
  percentile,
  rollingMedian,
  std,
} from './geometry';
import { runs } from './smoothing';
import { THRESH } from './thresholds';
import { EVENT_TITLE, type EventType, type Metrics, type PoseEvent, type Skeleton } from './types';

export { EVENT_TITLE };

/** Ölçüm anahtarı → Türkçe etiket ve birim (arayüz/rapor tabloları için). */
export const MEASURE_INFO: Record<string, { label: string; unit: string }> = {
  bacak: { label: 'Vuran/sallanan bacak', unit: '' },
  tepe_ayak_hizi: { label: 'Tepe ayak hızı', unit: 'GB/sn' },
  bilek_goreli_hiz: { label: 'Bileğin kalçaya göre hızı', unit: 'GB/sn' },
  kalca_hizi: { label: 'Kalça hızı', unit: 'GB/sn' },
  geri_savurma_diz_acisi: { label: 'Geri savurmada diz açısı (en kapalı)', unit: '°' },
  bitis_diz_acisi: { label: 'Vuruş sonrası diz açısı (en açık)', unit: '°' },
  destek_diz_acisi: { label: 'Destek bacağı diz açısı', unit: '°' },
  govde_egimi: { label: 'Gövde eğimi (+ = bakış yönünde öne)', unit: '°' },
  kalca_omuz_donus_farki: { label: 'Kalça–omuz dönüş farkı', unit: '°' },
  denge_gostergesi: { label: 'Denge göstergesi (destek ayağının kalçadan yatay uzaklığı)', unit: 'GB' },
  aci_degisimi: { label: 'Yön değişimi', unit: '°' },
  onceki_yon: { label: 'Önceki hareket yönü (0° = sağ, 90° = yukarı)', unit: '°' },
  sonraki_yon: { label: 'Sonraki hareket yönü', unit: '°' },
  onceki_hiz: { label: 'Önceki hız', unit: 'GB/sn' },
  sonraki_hiz: { label: 'Sonraki hız', unit: 'GB/sn' },
  en_dusuk_hiz: { label: 'Dönüş sırasında en düşük hız', unit: 'GB/sn' },
  kalca_alcalmasi: { label: 'Dönüşte kalça yüksekliği düşüşü', unit: '%' },
  baslangic_hizi: { label: 'Başlangıç hızı', unit: 'GB/sn' },
  tepe_hiz: { label: 'Tepe hız', unit: 'GB/sn' },
  hiz_artisi: { label: 'Hız artışı', unit: 'GB/sn' },
  sure: { label: 'Süre', unit: 'sn' },
  ort_ivme: { label: 'Ortalama ivme', unit: 'GB/sn²' },
  sinif: { label: 'Sınıf', unit: '' },
  tur: { label: 'Tür', unit: '' },
  destek_bacagi: { label: 'Destek bacağı', unit: '' },
  kalca_salinimi: { label: 'Kalça yatay salınımı (std)', unit: 'GB' },
  kaldirilan_ayak_yuksekligi: { label: 'Kaldırılan ayağın yüksekliği', unit: 'GB' },
  en_kucuk_diz_acisi: { label: 'En kapalı diz açısı (ortalama)', unit: '°' },
  kalca_dususu: { label: 'Kalça yüksekliği düşüşü', unit: '%' },
  gorunum: { label: 'Kamera görünümü', unit: '' },
};

const r2 = (v: number) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : null);
const r1 = (v: number) => (Number.isFinite(v) ? Math.round(v * 10) / 10 : null);

interface Raw {
  type: EventType;
  t: number;
  tStart: number;
  tEnd: number;
  confidence: number;
  measures: PoseEvent['measures'];
}

/** İki boolean koşunun arasındaki ≤ gap kare boşlukları kapatıp (başlangıç, bitiş) koşuları verir. */
function boolRuns(flag: boolean[], gap = 1): [number, number][] {
  const num = flag.map((b) => (b ? 1 : NaN));
  const rs = runs(num);
  const out: [number, number][] = [];
  for (const r of rs) {
    const last = out[out.length - 1];
    if (last && r[0] - last[1] - 1 <= gap) last[1] = r[1];
    else out.push([r[0], r[1]]);
  }
  return out;
}

export function detectEvents(sk: Skeleton, m: Metrics): PoseEvent[] {
  const n = m.n;
  const fps = m.fps;
  const W = (sec: number) => Math.max(1, Math.round(sec * fps));
  const raws: Raw[] = [];
  if (n < 5) return [];

  const visAt = (a: number, b: number) => {
    const v = meanRange(m.visMean, a, b);
    return Number.isFinite(v) ? v : 0;
  };

  // ───────────── vuruş / pas hareketi adayı ─────────────
  const K = THRESH.kick;
  for (const side of ['sol', 'sağ'] as const) {
    const L = side === 'sol';
    const ank = L ? m.ankleSpeedL : m.ankleSpeedR;
    const rel = L ? m.ankleRelL : m.ankleRelR;
    const knee = L ? m.kneeL : m.kneeR;
    const sKnee = L ? m.kneeR : m.kneeL;
    const sAnkX = (i: number) => sk.x[i * 33 + (L ? 28 : 27)];
    const peaks = findPeaks(ank, { minValue: K.minPeakTLs, minProminence: K.minPeakTLs * 0.35, minDist: W(0.15) });
    if (!peaks.length) continue;
    // adım tepeleri (baskınlık için taban): düşük eşikli tüm tepeler
    const base = findPeaks(ank, { minValue: 1.5, minProminence: 0.8, minDist: W(0.2) });
    for (const p of peaks) {
      const i = p.index;
      const hipSp = meanRange(m.speed, i - W(0.2), i + W(0.2));
      const relPeak = maxOf(rel, i - 1, i + 1);
      if (!(relPeak >= K.minRelTLs)) continue;
      if (Number.isFinite(hipSp) && !(p.value >= K.minVsHip * hipSp)) continue;
      const near = base.filter((b) => b.index !== i && Math.abs(b.index - i) <= W(1.5)).map((b) => b.value);
      const nearMed = near.length >= 2 ? median(near) : NaN;
      if (Number.isFinite(nearMed) && !(p.value >= K.dominance * nearMed)) continue;

      const a0 = Math.max(0, i - W(K.backswingSec));
      const flexIdx = argMin(knee, a0, i);
      if (flexIdx < 0) continue;
      const flexMin = knee[flexIdx];
      if (!(flexMin <= K.kneeFlexMax)) continue;
      const b1 = Math.min(n - 1, i + W(K.followSec));
      const extIdx = argMax(knee, flexIdx, b1);
      const extMax = extIdx >= 0 ? knee[extIdx] : NaN;
      if (!(extMax - flexMin >= K.kneeExtGain)) continue;

      const support = meanRange(sKnee, i - 1, i + 1);
      const lean = m.leanSigned ? meanRange(m.trunkLean, i - W(0.15), i) : NaN;
      const sep = maxOf(m.hipShoulderSep, i - W(0.3), i + W(0.1));
      const sx = sAnkX(i);
      const balance = Number.isFinite(sx) ? Math.abs(m.hipX[i] - sx) / m.torso[i] : NaN;

      const vis = visAt(a0, b1);
      const sig = clamp01(p.value / (2 * K.minPeakTLs));
      const kin = clamp01((extMax - flexMin) / 60);
      const dom = Number.isFinite(nearMed) ? clamp01((p.value / nearMed - 1) / 2) : 0.5;
      const conf = 0.4 * vis + 0.25 * sig + 0.2 * kin + 0.15 * dom;
      raws.push({
        type: 'vurus',
        t: m.t[i],
        tStart: m.t[flexIdx],
        tEnd: m.t[extIdx >= 0 ? extIdx : i],
        confidence: conf,
        measures: {
          bacak: side,
          tepe_ayak_hizi: r1(p.value),
          bilek_goreli_hiz: r1(relPeak),
          kalca_hizi: r1(hipSp),
          geri_savurma_diz_acisi: r1(flexMin),
          bitis_diz_acisi: r1(extMax),
          destek_diz_acisi: r1(support),
          govde_egimi: r1(lean),
          kalca_omuz_donus_farki: r1(sep),
          denge_gostergesi: r2(balance),
          gorunum: m.viewKind,
        },
      });
    }
  }
  // iki bacaktan gelen yakın adayları birleştir (daha güçlüsünü tut)
  {
    const kicks = raws.filter((r) => r.type === 'vurus').sort((a, b) => b.confidence - a.confidence);
    const keep: Raw[] = [];
    for (const k of kicks) if (keep.every((q) => Math.abs(q.t - k.t) >= K.minSepSec)) keep.push(k);
    for (let i = raws.length - 1; i >= 0; i--) if (raws[i].type === 'vurus' && !keep.includes(raws[i])) raws.splice(i, 1);
  }

  // ───────────── yön değiştirme ─────────────
  {
    const T = THRESH.turn;
    const hw = W(T.halfWinSec);
    const gap = Math.min(W(T.gapSec), Math.max(0, hw - 2));
    const delta = new Float32Array(n).fill(NaN);
    const before = new Float32Array(n).fill(NaN);
    const after = new Float32Array(n).fill(NaN);
    const need = 2;
    for (let i = hw; i < n - hw; i++) {
      const bs: number[] = [];
      const as: number[] = [];
      for (let j = i - hw; j <= i - gap; j++) if (Number.isFinite(m.heading[j])) bs.push(m.heading[j]);
      for (let j = i + gap; j <= i + hw; j++) if (Number.isFinite(m.heading[j])) as.push(m.heading[j]);
      if (bs.length < need || as.length < need) continue;
      const b = circMean(bs);
      const a = circMean(as);
      before[i] = b;
      after[i] = a;
      delta[i] = Math.abs(angDiff(b, a));
    }
    const peaks = findPeaks(delta, { minValue: T.minDeg, minProminence: 8, minDist: W(T.minSepSec) });
    for (const p of peaks) {
      // plato ortası: tepe değerinin %90'ının üstünde kalan komşu aralık
      let lo = p.index;
      let hi = p.index;
      while (lo - 1 >= 0 && delta[lo - 1] >= 0.9 * p.value) lo--;
      while (hi + 1 < n && delta[hi + 1] >= 0.9 * p.value) hi++;
      const i = Math.round((lo + hi) / 2);
      const sBefore = meanRange(m.speed, i - hw, i - gap);
      const sAfter = meanRange(m.speed, i + gap, i + hw);
      const sMin = minOf(m.speed, i - hw, i + hw);
      const hBase = median(Array.from(m.hipHeight.slice(Math.max(0, i - hw), Math.max(1, i - gap + 1))));
      const hMin = minOf(m.hipHeight, i - gap, i + gap);
      const drop = Number.isFinite(hBase) && hBase > 0 && Number.isFinite(hMin) ? Math.max(0, (1 - hMin / hBase) * 100) : NaN;
      const vis = visAt(i - hw, i + hw);
      const conf = 0.5 * vis + 0.3 * clamp01(p.value / 120) + 0.2 * clamp01(Math.min(sBefore, sAfter) / (2 * T.minSpeed));
      raws.push({
        type: 'yon-degistirme',
        t: m.t[i],
        tStart: m.t[Math.max(0, i - hw)],
        tEnd: m.t[Math.min(n - 1, i + hw)],
        confidence: conf,
        measures: {
          aci_degisimi: r1(p.value),
          onceki_yon: r1(before[i]),
          sonraki_yon: r1(after[i]),
          onceki_hiz: r1(sBefore),
          sonraki_hiz: r1(sAfter),
          en_dusuk_hiz: r1(sMin),
          kalca_alcalmasi: r1(drop),
          gorunum: m.viewKind,
        },
      });
    }
  }

  // ───────────── hızlanma / sprint ─────────────
  {
    const A = THRESH.accel;
    const sp = rollingMedian(m.speed, W(0.3) | 1);
    const look = W(A.maxRiseSec);
    // her kare için: son `maxRiseSec` içindeki en düşük hıza göre artış
    const rise = new Float32Array(n).fill(NaN);
    const lowIdx = new Int32Array(n).fill(-1);
    for (let i = 0; i < n; i++) {
      if (!Number.isFinite(sp[i])) continue;
      const mi = argMin(sp, Math.max(0, i - look), i);
      if (mi < 0) continue;
      rise[i] = sp[i] - sp[mi];
      lowIdx[i] = mi;
    }
    const flag = Array.from({ length: n }, (_, i) => sp[i] >= A.minPeak && rise[i] >= A.minRise);
    const cands: { peak: number; start: number }[] = [];
    for (const [a0, b0] of boolRuns(flag, W(0.3))) {
      // tepe: koşunun içinde en yüksek hızın %97'sine ilk ulaşılan kare (yayvan tepede başlangıç)
      const top = maxOf(sp, a0, b0);
      let peak = a0;
      while (peak < b0 && !(sp[peak] >= 0.97 * top)) peak++;
      const low = sp[lowIdx[peak]];
      const rs = sp[peak] - low;
      let st = peak;
      while (st > Math.max(0, peak - look) && sp[st - 1] > low + 0.15 * rs) st--;
      cands.push({ peak, start: st });
    }
    cands.sort((x, y) => sp[y.peak] - sp[x.peak]);
    const kept: typeof cands = [];
    for (const c of cands) if (kept.every((q) => Math.abs(q.peak - c.peak) >= W(A.minSepSec))) kept.push(c);
    for (const { peak: i, start: s } of kept) {
      const dur = m.t[i] - m.t[s];
      if (!(dur >= 0.25)) continue;
      const rs = sp[i] - sp[s];
      const vis = visAt(s, i);
      const conf = 0.5 * vis + 0.5 * clamp01(rs / (2 * A.minRise));
      const mid = Math.round((s + i) / 2);
      raws.push({
        type: 'hizlanma',
        t: m.t[i],
        tStart: m.t[s],
        tEnd: m.t[i],
        confidence: conf,
        measures: {
          sinif: sp[i] >= THRESH.speed.runMax ? 'sprint' : 'hızlanma',
          baslangic_hizi: r1(sp[s]),
          tepe_hiz: r1(sp[i]),
          hiz_artisi: r1(rs),
          sure: r2(dur),
          ort_ivme: r2(rs / dur),
          govde_egimi: m.leanSigned ? r1(meanRange(m.trunkLean, s, mid)) : null,
          gorunum: m.viewKind,
        },
      });
    }
  }

  // ───────────── duruş / tek ayak denge ─────────────
  {
    const S = THRESH.stance;
    const hipSp = rollingMedian(m.speed, W(0.3) | 1);
    const cand: Raw[] = [];
    const single = Array.from({ length: n }, (_, i) => hipSp[i] <= S.maxHipSpeed && Math.abs(m.ankleLift[i]) >= S.liftTL);
    for (const [a, b] of boolRuns(single)) {
      const dur = m.t[b] - m.t[a] + 1 / fps;
      if (dur < S.singleLegSec) continue;
      const lift = meanRange(Float32Array.from(m.ankleLift, Math.abs), a, b);
      const leftLow = meanRange(m.ankleLift, a, b) > 0; // + = sol ayak daha aşağıda → destek sol
      const supKnee = meanRange(leftLow ? m.kneeL : m.kneeR, a, b);
      const sway = std(m.hipX.slice(a, b + 1)) / (median(m.torso.slice(a, b + 1)) || NaN);
      const conf = 0.6 * visAt(a, b) + 0.4 * clamp01(dur / (2 * S.singleLegSec));
      cand.push({
        type: 'durus',
        t: (m.t[a] + m.t[b]) / 2,
        tStart: m.t[a],
        tEnd: m.t[b],
        confidence: conf,
        measures: {
          tur: 'tek ayak',
          sure: r2(dur),
          destek_bacagi: leftLow ? 'sol' : 'sağ',
          destek_diz_acisi: r1(supKnee),
          kaldirilan_ayak_yuksekligi: r2(lift),
          kalca_salinimi: r2(sway),
          govde_egimi: m.leanSigned ? r1(meanRange(m.trunkLean, a, b)) : null,
          gorunum: m.viewKind,
        },
      });
    }
    const quiet = Array.from(
      { length: n },
      (_, i) => hipSp[i] <= S.maxHipSpeed && m.ankleSpeedL[i] <= S.quietAnkleSpeed && m.ankleSpeedR[i] <= S.quietAnkleSpeed && Math.abs(m.ankleLift[i]) <= S.quietLiftTL,
    );
    for (const [a, b] of boolRuns(quiet)) {
      const dur = m.t[b] - m.t[a] + 1 / fps;
      if (dur < S.quietSec) continue;
      // tek ayak olayıyla çakışıyorsa atla
      if (cand.some((c) => c.tStart <= m.t[b] && c.tEnd >= m.t[a])) continue;
      const sway = std(m.hipX.slice(a, b + 1)) / (median(m.torso.slice(a, b + 1)) || NaN);
      const conf = 0.6 * visAt(a, b) + 0.4 * clamp01(dur / (2 * S.quietSec));
      cand.push({
        type: 'durus',
        t: (m.t[a] + m.t[b]) / 2,
        tStart: m.t[a],
        tEnd: m.t[b],
        confidence: conf,
        measures: {
          tur: 'iki ayak',
          sure: r2(dur),
          destek_diz_acisi: r1(meanRange(m.kneeMean, a, b)),
          kalca_salinimi: r2(sway),
          govde_egimi: m.leanSigned ? r1(meanRange(m.trunkLean, a, b)) : null,
          gorunum: m.viewKind,
        },
      });
    }
    cand.sort((x, y) => y.tEnd - y.tStart - (x.tEnd - x.tStart));
    raws.push(...cand.slice(0, S.maxEvents));
  }

  // ───────────── alçalma / çömelme ─────────────
  {
    const C = THRESH.crouch;
    const base = percentile(m.hipHeight, 0.8);
    if (Number.isFinite(base) && base > 0) {
      const flag = Array.from({ length: n }, (_, i) => m.kneeMean[i] <= C.kneeMax && m.hipHeight[i] <= C.hipDropFrac * base);
      for (const [a, b] of boolRuns(flag)) {
        const dur = m.t[b] - m.t[a] + 1 / fps;
        if (dur < C.minSec) continue;
        const lo0 = argMin(m.hipHeight, a, b);
        // en alçak noktanın yayvan tabanının ortası (taban değerinin %3'ü içinde kalan kareler)
        const floor = m.hipHeight[lo0] + 0.03 * base;
        let pa = lo0;
        let pb = lo0;
        while (pa - 1 >= a && m.hipHeight[pa - 1] <= floor) pa--;
        while (pb + 1 <= b && m.hipHeight[pb + 1] <= floor) pb++;
        const lo = Math.round((pa + pb) / 2);
        const drop = (1 - m.hipHeight[lo0] / base) * 100;
        const kneeMin = minOf(m.kneeMean, a, b);
        const conf = 0.5 * visAt(a, b) + 0.3 * clamp01(drop / 40) + 0.2 * clamp01((C.kneeMax - kneeMin) / 50);
        raws.push({
          type: 'comelme',
          t: m.t[lo],
          tStart: m.t[a],
          tEnd: m.t[b],
          confidence: conf,
          measures: {
            en_kucuk_diz_acisi: r1(kneeMin),
            kalca_dususu: r1(drop),
            sure: r2(dur),
            govde_egimi: m.leanSigned ? r1(m.trunkLean[lo]) : null,
            gorunum: m.viewKind,
          },
        });
      }
    }
  }

  // kimlik + sıralama
  raws.sort((a, b) => a.t - b.t);
  const counters: Partial<Record<EventType, number>> = {};
  return raws.map((r) => {
    counters[r.type] = (counters[r.type] ?? 0) + 1;
    return {
      id: `${r.type}-${counters[r.type]}`,
      type: r.type,
      t: Math.round(r.t * 1000) / 1000,
      tStart: Math.round(r.tStart * 1000) / 1000,
      tEnd: Math.round(r.tEnd * 1000) / 1000,
      confidence: Math.round(clamp01(r.confidence) * 100) / 100,
      measures: r.measures,
    };
  });
}
