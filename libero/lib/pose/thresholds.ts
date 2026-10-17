/**
 * Tüm eşikler tek yerde. Bunlar kalibre EDİLMİŞ bilimsel sınırlar değil, sezgisel (heuristic)
 * başlangıç değerleridir: gerçek çekimlerde ayarlanması gerekebilir. Raporda alıntılanan her
 * eşik buradan okunur; böylece rapor metni ile kod aynı sayıyı gösterir.
 *
 * Hız birimi: GB/sn = gövde boyu/sn (kalça merkezi hızı ÷ omuz–kalça uzaklığı). Yetişkinde gövde
 * (omuz–kalça) ≈ 0,5 m olduğundan 1 GB/sn kabaca 0,5 m/sn eder; ancak bu YALNIZCA bir büyüklük sırası
 * fikridir — kalibrasyon yapılmadan metre/sn'ye çevrilmez ve kamera hareketliyse hız kameraya görelidir.
 */
export const THRESH = {
  /** bir eklemin kullanılması için en düşük görünürlük */
  visMin: 0.45,
  /** doldurulacak en uzun boşluk (kare) */
  maxGapFrames: 3,
  /** 3'lü medyan sıçrama ayıklama eşiği (gövde boyu) */
  despikeTL: 1.5,

  /** hız sınıfları (GB/sn): duruş < walk ≤ yürüyüş < run ≤ koşu < fast ≤ yüksek tempo */
  speed: { standMax: 0.8, walkMax: 4, runMax: 9, minSegmentSec: 0.3 },

  /** vuruş/pas hareketi adayı */
  kick: {
    /** vuruş bileği tepe hızı (mutlak, GB/sn) */
    minPeakTLs: 10,
    /** kalçaya göre bilek tepe hızı (GB/sn) */
    minRelTLs: 7,
    /** tepe hızı ÷ kalça hızı (yürüme/koşu adımlarını elemek için) */
    minVsHip: 2.2,
    /** komşu bilek tepelerinin medyanına oranı (periyodik adım ≠ vuruş) */
    dominance: 1.6,
    /** geri savurma: diz iç açısı en çok bu kadar (derece) */
    kneeFlexMax: 125,
    /** sonrasında diz açısı en az bu kadar açılmalı (derece) */
    kneeExtGain: 25,
    backswingSec: 0.6,
    followSec: 0.35,
    minSepSec: 0.5,
  },
  /** destek dizi bu açının üstündeyse "neredeyse düz" denir (derece) */
  supportKneeStraight: 165,
  /** gövde bu kadar geriye eğikse not düşülür (derece, − = geriye) */
  trunkBackLean: -10,

  turn: { minDeg: 55, minSpeed: 1.5, halfWinSec: 0.4, gapSec: 0.1, minSepSec: 0.8 },
  accel: { minPeak: 7, minRise: 4, maxRiseSec: 2.0, minSepSec: 1.0 },
  stance: { maxHipSpeed: 0.8, liftTL: 0.3, quietLiftTL: 0.15, quietAnkleSpeed: 1.0, singleLegSec: 0.5, quietSec: 1.0, maxEvents: 5 },
  crouch: { kneeMax: 125, hipDropFrac: 0.8, minSec: 0.25 },
  steps: { minProminenceTL: 0.25, minSepSec: 0.2, minMoveSpeed: 0.8 },

  /** güvenilirlik */
  reliability: {
    playerHeightWarnPct: 15,
    playerHeightLowPct: 25,
    coverageWarnPct: 70,
    coverageBadPct: 50,
    interpWarnPct: 20,
    visWarn: 0.6,
    lowFps: 15,
    minDurationSec: 1.5,
    frontalWarnRatio: 0.62,
  },
} as const;
