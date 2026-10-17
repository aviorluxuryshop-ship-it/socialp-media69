/**
 * Otomatik video analizi — ortak türler ve sabitler.
 *
 * KOORDİNAT VE BİRİM SÖZLEŞMESİ
 *  • Ham MediaPipe çıktısı (RawPose.lm): x, y ∈ [0,1] görüntü genişliği/yüksekliğine göre, z göreli derinlik,
 *    görünürlük ∈ [0,1]. Geometri hesapları HER ZAMAN piksele çevrilmiş (x·W, y·H) koordinatlarda yapılır;
 *    aksi hâlde 16:9 bir karede açılar bozulur.
 *  • Dünya koordinatları (RawPose.wl): metre (kalça merkezli, yaklaşık). Yalnızca omuz–kalça dönüşü gibi
 *    derinlik gerektiren ölçümlerde kullanılır; z tahmini gürültülüdür.
 *  • Açılar derece; görüntü düzlemindeki iki boyutlu izdüşümdür (gerçek eklem açısı değildir).
 *  • Hızlar "gövde boyu/sn" (GB/sn): piksel hızı ÷ aynı andaki gövde uzunluğu (omuz merkezi–kalça merkezi).
 *    Kalibrasyon olmadan metre/sn'ye ÇEVRİLMEZ; kamera hareket ediyorsa hızlar kameraya görelidir.
 *  • Eksik değer: Float32Array içinde NaN.
 *
 * DÜRÜST SINIRLAR (rapora da yazılır, bkz. report.ts → LIMITS)
 *  1) Görüntü 2B'dir; kameraya doğru/ters yönde hareket ve eklem bükülmesi küçük görünür.
 *  2) Oyuncu kadrajın ~%15'inden küçükse eklem noktaları güvenilmez.
 *  3) Kamera sabit değilse hız ve yön ölçümleri kameraya görelidir.
 *  4) Top izlenmez; "vuruş/pas hareketi" yalnızca bacak hareketinden çıkarılan ADAYDIR.
 *  5) Örnekleme (kare/sn) düşükse hızlı hareketlerin tepe hızı olduğundan düşük okunur.
 *  6) Aynı kadrajdaki oyuncuları görünümle (forma, yüz) ayırt eden bir model yoktur; takip yalnızca
 *     konum/boyut sürekliliğine dayanır, belirsiz durumlarda kullanıcıya sorulur.
 */

export const NUM_LM = 33;

/** BlazePose/MediaPipe 33 nokta indeksleri ("sol/sağ" oyuncunun kendi sol/sağıdır). */
export const LM = {
  NOSE: 0,
  L_EYE: 2,
  R_EYE: 5,
  L_EAR: 7,
  R_EAR: 8,
  L_SHOULDER: 11,
  R_SHOULDER: 12,
  L_ELBOW: 13,
  R_ELBOW: 14,
  L_WRIST: 15,
  R_WRIST: 16,
  L_HIP: 23,
  R_HIP: 24,
  L_KNEE: 25,
  R_KNEE: 26,
  L_ANKLE: 27,
  R_ANKLE: 28,
  L_HEEL: 29,
  R_HEEL: 30,
  L_FOOT: 31,
  R_FOOT: 32,
} as const;

/** İskeleti çizmek için kemik bağlantıları (yüz noktaları dahil edilmedi; sade görünüm). */
export const BONES: readonly (readonly [number, number])[] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
  [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
  [0, 7], [0, 8],
];

/** Ham tek kişi: 33×4 (x,y,z,görünürlük) + 33×3 dünya (m). */
export interface RawPose {
  lm: Float32Array;
  wl: Float32Array;
}

/** Bir örnekleme anındaki tüm kişiler. t: video zamanı (sn). */
export interface RawFrame {
  t: number;
  poses: RawPose[];
}

export interface Dims {
  w: number;
  h: number;
}

/** Piksel cinsinden tek kişi özeti (takip ve aday seçimi için). */
export interface PoseStats {
  /** kalça merkezi (px) */
  hip: [number, number];
  /** omuz merkezi (px), yoksa NaN */
  shoulder: [number, number];
  /** gövde uzunluğu (px) */
  torso: number;
  /** [x0,y0,x1,y1] px (görünür noktalar) */
  bbox: [number, number, number, number];
  /** ortalama görünürlük (anahtar eklemler) */
  vis: number;
  /** oyuncu yüksekliği / kare yüksekliği (0–1) */
  heightFrac: number;
  valid: boolean;
}

export interface Candidate {
  /** karedeki kişi sırası */
  index: number;
  /** normalize [x0,y0,x1,y1] (0–1) */
  bbox: [number, number, number, number];
  /** normalize kalça merkezi (0–1) */
  hip: [number, number];
  score: number;
  heightPct: number;
}

export interface Seed {
  /** video zamanı (sn) */
  t: number;
  /** normalize (0–1) bir nokta: tıklanan yer ya da adayın kalça merkezi */
  x: number;
  y: number;
}

export const TRACK_AMBIGUOUS = 1;
export const TRACK_REACQUIRED = 2;

export interface Track {
  n: number;
  /** her karede seçilen kişi sırası; -1 = yok */
  sel: Int16Array;
  /** 0–1 kare güveni */
  conf: Float32Array;
  /** bit bayrakları: TRACK_AMBIGUOUS | TRACK_REACQUIRED */
  flags: Uint8Array;
  seedFrame: number;
  /** eşleşen kare oranı (0–1) */
  coverage: number;
  ambiguousFrac: number;
  reacquisitions: number;
  /** kullanıcıya sorulmalı mı */
  needsUser: boolean;
  reasons: string[];
}

/** Düzleştirilmiş, boşluğu doldurulmuş iskelet (px koordinat). */
export interface Skeleton {
  n: number;
  fps: number;
  dims: Dims;
  t: Float64Array;
  /** n×33 */
  x: Float32Array;
  y: Float32Array;
  v: Float32Array;
  /** dünya (m) n×33 */
  wx: Float32Array;
  wy: Float32Array;
  wz: Float32Array;
  /** kare durumu: 0 yok, 1 ölçüldü, 2 doldurulmuş (≤3 kare) */
  state: Uint8Array;
  /** takip güveni (n) */
  conf: Float32Array;
  /** oyuncu yüksekliği / kare yüksekliği (n), NaN olabilir */
  heightFrac: Float32Array;
}

export type ViewKind = 'yan' | 'önden-arkadan' | 'çapraz' | 'belirsiz';

export interface Segment {
  kind: 'duruş' | 'yürüyüş' | 'koşu' | 'yüksek tempo';
  start: number;
  end: number;
  tStart: number;
  tEnd: number;
  meanSpeed: number;
}

export interface Metrics {
  n: number;
  fps: number;
  t: Float64Array;
  /** gövde uzunluğu (px), kayan medyan */
  torso: Float32Array;
  hipX: Float32Array;
  hipY: Float32Array;
  /** kalça merkezi hızı (GB/sn) ve bileşenleri (x sağa, y aşağı) */
  speed: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  /** hareket yönü (derece; 0=sağ, 90=yukarı), yavaşken NaN */
  heading: Float32Array;
  kneeL: Float32Array;
  kneeR: Float32Array;
  hipL: Float32Array;
  hipR: Float32Array;
  elbowL: Float32Array;
  elbowR: Float32Array;
  ankleL: Float32Array;
  ankleR: Float32Array;
  /** gövde (kalça→omuz) dikeyden sapma: + = görüntüde sağa (işaretsiz yön) */
  trunkTilt: Float32Array;
  /** gövde eğimi: + = bakış yönünde öne; bakış belirsizse NaN */
  trunkLean: Float32Array;
  /** bakış yönü: +1 görüntüde sağa, −1 sola, 0 belirsiz */
  facing: Int8Array;
  shoulderTilt: Float32Array;
  hipTilt: Float32Array;
  /** omuz–kalça çizgisi dönüş farkı (derece, dünya x–z düzlemi); NaN olabilir */
  hipShoulderSep: Float32Array;
  /** ayak bilekleri arası uzaklık / gövde uzunluğu */
  stanceWidth: Float32Array;
  /** ayak bilekleri hızı (GB/sn): mutlak (kameraya göre) */
  ankleSpeedL: Float32Array;
  ankleSpeedR: Float32Array;
  /** kalçaya göre */
  ankleRelL: Float32Array;
  ankleRelR: Float32Array;
  /** (sol bilek y − sağ bilek y) / gövde: + = sol ayak daha aşağıda */
  ankleLift: Float32Array;
  /** dizler ortalaması */
  kneeMean: Float32Array;
  /** (bilek ortası y − kalça y) / gövde uzunluğu: çömelince küçülür */
  hipHeight: Float32Array;
  steps: { t: number; index: number; strength: number }[];
  cadence: number | null;
  segments: Segment[];
  viewKind: ViewKind;
  shoulderWidthRatio: number;
  /** bakış yönünden işaretli eğim hesaplanabildi mi */
  leanSigned: boolean;
  /** üst-alt gövdede ortalama görünürlük (n) */
  visMean: Float32Array;
}

export type EventType = 'vurus' | 'yon-degistirme' | 'hizlanma' | 'durus' | 'comelme';

export interface PoseEvent {
  id: string;
  type: EventType;
  /** olay anı (sn) */
  t: number;
  tStart: number;
  tEnd: number;
  /** 0–1: landmark görünürlüğü ve sinyal belirginliğinden */
  confidence: number;
  /** ölçümler (birimler measureUnits içinde) */
  measures: Record<string, number | string | boolean | null>;
}

export const EVENT_TITLE: Record<EventType, string> = {
  vurus: 'Vuruş / pas hareketi adayı',
  'yon-degistirme': 'Yön değiştirme',
  hizlanma: 'Hızlanma / sprint',
  durus: 'Duruş / tek ayak denge anı',
  comelme: 'Alçalma / çömelme',
};
