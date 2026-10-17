/**
 * Türkçe rapor verisi (saf; DOM yok). Aşama 2'nin arayüzü bu nesneyi gösterecek.
 *
 *   { meta, reliability, measured: { summary, series, events }, ruleBased, ai }
 *
 * İKİ AYRI KATMAN
 *  • measured  — doğrudan iskeletten hesaplanan sayılar ve tespit edilen anlar. Yorum içermez.
 *  • ruleBased — sabit eşiklerle üretilen yönlendirme cümleleri. Her cümle ölçülen sayıyı ve kullanılan
 *                eşiği yazar; "kural tabanlı — yapay zekâ değildir" diye etiketlenir; yumuşak dil kullanır;
 *                sağlık/sakatlık iddiası içermez. Ortak vücut pozisyonu rehberine (data/body-position.ts)
 *                ve teknik sayfalarına bağlanır.
 *  • ai        — AÇIKÇA devre dışı yer tutucu. Hiçbir ağ çağrısı yapılmaz, yapay zekâ benzeri metin üretilmez.
 *
 * Tüm hızlar "gövde boyu/sn (GB/sn)"dir; kalibrasyon olmadan metre/sn'ye çevrilmez.
 */
import { BODY_LABEL, BODY_POSITION, type BodyKey } from '../../data/body-position';
import { maxOf, median } from './geometry';
import { seriesStats } from './metrics';
import { THRESH } from './thresholds';
import {
  type EventType,
  type Metrics,
  type PoseEvent,
  type Skeleton,
  type Track,
  type VideoAnalysisSummary,
  type ViewKind,
} from './types';

export const REPORT_VERSION = 1;
export const RULE_LABEL = 'kural tabanlı — yapay zekâ değildir';
export const SOFT_NOTE = 'Genel yönlendirme; kişiden kişiye değişir. Antrenörünüzün değerlendirmesinin yerine geçmez.';
export const PRIVACY_LINE = 'Video cihazınızdan çıkmaz; analiz tarayıcıda yapılır.';

/** Her raporda yer alan dürüst sınırlar. */
export const LIMITS: readonly string[] = [
  'Görüntü iki boyutludur: açılar görüntü düzlemindeki izdüşümdür, gerçek eklem açısı değildir. Kameraya doğru ya da ters yöndeki hareketler ve eklem bükülmeleri küçük görünür.',
  `Oyuncu kadrajın yaklaşık %${THRESH.reliability.playerHeightWarnPct}'inden küçükse (geniş çekimler) eklem noktaları güvenilmez olur.`,
  'Kamera sabit değilse hız ve yön ölçümleri kameraya görelidir (oyuncunun sahadaki gerçek hızı değildir).',
  'Top izlenmez. "Vuruş/pas hareketi" yalnızca bacak hareketinden çıkarılan bir adaydır; topa gerçekten vurulup vurulmadığı bilinmez.',
  'Örnekleme (kare/sn) düşükse hızlı hareketlerin tepe değeri eksik ya da farklı ölçülür. Hızlar gövde boyu/sn cinsindendir; kalibrasyon olmadan metre/sn\'ye çevrilmez.',
  'Oyuncu takibi yalnızca konum ve boyut sürekliliğine dayanır; forma ya da yüz ayırt edilmez. Oyuncular iç içe geçerse seçim yeniden doğrulanmalıdır.',
];

export interface ReportInput {
  fileName?: string;
  quality: 'lite' | 'full';
  delegate: 'CPU' | 'GPU';
  video: { width: number; height: number; durationSec: number | null };
  startSec: number;
  endSec: number;
  /** Tekniğe özgü rehber seçimi (sonraki aşamada kullanıcı seçer); varsayılan: sert pas + sert şut */
  techniqueHints?: string[];
  processing?: { totalMs: number; msPerFrame: number };
  generatedAt?: string;
}

export interface Finding {
  id: string;
  level: 'bilgi' | 'dikkat';
  title: string;
  text: string;
  /** alıntılanan ölçüm(ler) */
  measured: string;
  /** kullanılan eşik; eşik kullanılmadıysa null */
  threshold: string | null;
  /** olay zamanı (sn) */
  at?: number;
  eventId?: string;
  /** vücut pozisyonu rehberinden alıntı(lar) */
  guidance: { technique: string; techniqueTitle: string; field: BodyKey; label: string; text: string; href: string }[];
  refs: { label: string; href: string }[];
  /** her zaman RULE_LABEL */
  source: typeof RULE_LABEL;
}

export interface Report {
  version: number;
  meta: {
    generatedAt: string;
    fileName: string | null;
    engine: { name: string; model: 'lite' | 'full'; delegate: 'CPU' | 'GPU'; license: string };
    video: { width: number; height: number; durationSec: number | null };
    segment: { startSec: number; endSec: number; durationSec: number };
    fps: number;
    frames: number;
    processing: { totalMs: number; msPerFrame: number } | null;
    privacy: string;
    units: string;
  };
  reliability: {
    level: 'yüksek' | 'orta' | 'düşük';
    score: number;
    warnings: string[];
    limits: readonly string[];
    stats: {
      coveragePct: number;
      interpolatedPct: number;
      meanVisibility: number | null;
      playerHeightPct: number | null;
      ambiguousPct: number;
      reacquisitions: number;
      needsUser: boolean;
    };
  };
  measured: {
    summary: Summary;
    series: Series;
    events: PoseEvent[];
  };
  ruleBased: {
    label: typeof RULE_LABEL;
    note: string;
    findings: Finding[];
  };
  ai: { status: 'devre dışı'; reason: string };
}

export interface Range {
  min: number | null;
  max: number | null;
  mean: number | null;
}

export interface Summary {
  frames: number;
  trackedFrames: number;
  viewKind: ViewKind;
  facing: 'sağa' | 'sola' | 'belirsiz';
  hipSpeed: { mean: number | null; p95: number | null; max: number | null };
  ankleSpeedMax: { sol: number | null; sağ: number | null };
  angles: Record<'kneeL' | 'kneeR' | 'hipL' | 'hipR' | 'elbowL' | 'elbowR' | 'ankleL' | 'ankleR', Range>;
  trunkLean: Range | null;
  trunkTilt: Range;
  stanceWidth: { mean: number | null; max: number | null };
  steps: number;
  cadence: number | null;
  segments: { kind: string; sec: number }[];
  eventCounts: Record<EventType, number>;
}

export interface Series {
  fps: number;
  /** kare başına; NaN → null. Yuvarlanmış. */
  t: number[];
  hipSpeed: (number | null)[];
  kneeL: (number | null)[];
  kneeR: (number | null)[];
  trunkLean: (number | null)[];
  ankleSpeedL: (number | null)[];
  ankleSpeedR: (number | null)[];
  /** 0 yok, 1 ölçüldü, 2 doldurulmuş */
  state: number[];
}

// ── biçimlendirme ────────────────────────────────────────────

const nz = (v: number | undefined | null): v is number => typeof v === 'number' && Number.isFinite(v);
/** Türkçe ondalık virgül */
export function fmt(v: number | null | undefined, d = 1): string {
  return nz(v) ? v.toFixed(d).replace('.', ',') : '—';
}
const sec = (t: number) => `${fmt(t, 1)}. sn`;
const orNull = (v: number): number | null => (Number.isFinite(v) ? Math.round(v * 100) / 100 : null);
const range = (a: ArrayLike<number>): Range => {
  const s = seriesStats(a);
  return s.n ? { min: orNull(s.min), max: orNull(s.max), mean: orNull(s.mean) } : { min: null, max: null, mean: null };
};
const num = (m: PoseEvent['measures'], k: string): number | null => {
  const v = m[k];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
};

export const TECH_TITLES: Record<string, string> = {
  'sert-pas': 'Sert pas',
  'sert-sut': 'Sert şut',
  'yerden-ic-yuz-pas': 'Yerden iç yüz pas',
  'ic-yuz-plase-sut': 'İç yüz plase şut',
  'uzun-pas': 'Uzun pas',
  'derinlik-pasi': 'Derinlik pası',
};

const techLink = (id: string) => `/teknikler/${id}/`;

function guide(hints: string[], field: BodyKey): Finding['guidance'] {
  const out: Finding['guidance'] = [];
  for (const id of hints) {
    const bp = BODY_POSITION[id];
    if (!bp) continue;
    out.push({ technique: id, techniqueTitle: TECH_TITLES[id] ?? id, field, label: BODY_LABEL[field], text: bp[field], href: `${techLink(id)}#vucut-pozisyonu` });
  }
  return out;
}
const refsFor = (hints: string[]): Finding['refs'] => hints.map((id) => ({ label: TECH_TITLES[id] ?? id, href: techLink(id) }));

// ── güvenilirlik ─────────────────────────────────────────────

export function assessReliability(sk: Skeleton, m: Metrics, track: Track, durationSec: number): Report['reliability'] {
  const R = THRESH.reliability;
  const warnings: string[] = [];
  const n = sk.n;
  let measuredN = 0;
  let filledN = 0;
  for (let i = 0; i < n; i++) {
    if (sk.state[i] === 1) measuredN++;
    else if (sk.state[i] === 2) filledN++;
  }
  const coveragePct = n ? Math.round(((measuredN + filledN) / n) * 100) : 0;
  const interpolatedPct = n ? Math.round((filledN / n) * 100) : 0;
  const vis = median(Array.from(m.visMean));
  const heightPct = (() => {
    const v = median(Array.from(sk.heightFrac));
    return Number.isFinite(v) ? Math.round(v * 1000) / 10 : null;
  })();
  let score = 100;

  if (n < 3 || coveragePct === 0) {
    warnings.push('Oyuncu bu aralıkta bulunamadı; ölçüm üretilemedi. Oyuncunun net göründüğü başka bir aralık deneyin.');
    score = 0;
  }
  if (nz(heightPct)) {
    if (heightPct < R.playerHeightWarnPct) {
      warnings.push(`Oyuncu kadrajın yalnızca %${fmt(heightPct, 0)}'i kadar (eşik %${R.playerHeightWarnPct}). Eklem noktaları büyük olasılıkla güvenilmez; oyuncuya daha yakın çekilmiş bir görüntü kullanın.`);
      score -= 40;
    } else if (heightPct < R.playerHeightLowPct) {
      warnings.push(`Oyuncu kadrajın %${fmt(heightPct, 0)}'i kadar (%${R.playerHeightLowPct} altı). Ayak bileği ve ayak ucu gibi küçük noktalar daha az güvenilir olabilir.`);
      score -= 15;
    }
  }
  if (coveragePct > 0 && coveragePct < R.coverageBadPct) {
    warnings.push(`Oyuncu karelerin yalnızca %${coveragePct}'inde izlenebildi (eşik %${R.coverageBadPct}).`);
    score -= 35;
  } else if (coveragePct > 0 && coveragePct < R.coverageWarnPct) {
    warnings.push(`Oyuncu karelerin %${coveragePct}'inde izlenebildi (%${R.coverageWarnPct} altı); olaylar eksik kalabilir.`);
    score -= 15;
  }
  if (interpolatedPct > R.interpWarnPct) {
    warnings.push(`Karelerin %${interpolatedPct}'i komşu karelerden doldurulmuş değerlere dayanıyor (eşik %${R.interpWarnPct}).`);
    score -= 10;
  }
  if (Number.isFinite(vis) && vis < R.visWarn) {
    warnings.push(`Eklem noktalarının ortalama görünürlüğü ${fmt(vis, 2)} (eşik ${fmt(R.visWarn, 2)}); kısmen örtülü ya da bulanık olabilir.`);
    score -= 15;
  }
  if (sk.fps < R.lowFps) {
    warnings.push(`Örnekleme ${fmt(sk.fps, 0)} kare/sn: hızlı hareketlerin (ör. vuruş) tepe hızı eksik ölçülebilir ve düzleştirme uygulanamaz.`);
    score -= 5;
  }
  if (durationSec < R.minDurationSec && n > 0) {
    warnings.push(`Aralık yalnızca ${fmt(durationSec, 1)} sn; olay tespiti için çok kısa.`);
    score -= 10;
  }
  if (m.viewKind === 'önden-arkadan') {
    warnings.push('Kamera oyuncuya önden ya da arkadan bakıyor görünüyor: bakış yönü ve gövde eğimi işaretli hesaplanamaz; yan görünüm çok daha güvenilirdir.');
    score -= 8;
  } else if (!m.leanSigned && n > 0) {
    warnings.push('Bakış yönü yeterince belirlenemedi; gövde eğimi (öne/geriye) işaretli verilmedi.');
    score -= 5;
  }
  if (track.needsUser) {
    for (const r of track.reasons) warnings.push(r);
    score -= 20;
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  const level: Report['reliability']['level'] = score >= 75 ? 'yüksek' : score >= 50 ? 'orta' : 'düşük';
  return {
    level,
    score,
    warnings,
    limits: LIMITS,
    stats: {
      coveragePct,
      interpolatedPct,
      meanVisibility: Number.isFinite(vis) ? Math.round(vis * 100) / 100 : null,
      playerHeightPct: heightPct,
      ambiguousPct: Math.round(track.ambiguousFrac * 100),
      reacquisitions: track.reacquisitions,
      needsUser: track.needsUser,
    },
  };
}

// ── ölçülen (yorumsuz) ───────────────────────────────────────

function buildSeries(sk: Skeleton, m: Metrics): Series {
  const n = sk.n;
  const step = n > 900 ? Math.ceil(n / 900) : 1;
  const out: Series = { fps: sk.fps / step, t: [], hipSpeed: [], kneeL: [], kneeR: [], trunkLean: [], ankleSpeedL: [], ankleSpeedR: [], state: [] };
  const r = (v: number, d = 100): number | null => (Number.isFinite(v) ? Math.round(v * d) / d : null);
  for (let i = 0; i < n; i += step) {
    out.t.push(Math.round(sk.t[i] * 1000) / 1000);
    out.hipSpeed.push(r(m.speed[i]));
    out.kneeL.push(r(m.kneeL[i], 10));
    out.kneeR.push(r(m.kneeR[i], 10));
    out.trunkLean.push(r(m.trunkLean[i], 10));
    out.ankleSpeedL.push(r(m.ankleSpeedL[i], 10));
    out.ankleSpeedR.push(r(m.ankleSpeedR[i], 10));
    out.state.push(sk.state[i]);
  }
  return out;
}

function buildSummary(sk: Skeleton, m: Metrics, events: PoseEvent[]): Summary {
  const sp = seriesStats(m.speed);
  let right = 0;
  let left = 0;
  for (let i = 0; i < m.n; i++) {
    if (m.facing[i] > 0) right++;
    else if (m.facing[i] < 0) left++;
  }
  const facing: Summary['facing'] = right + left < m.n * 0.3 ? 'belirsiz' : right >= left ? 'sağa' : 'sola';
  const segTotals = new Map<string, number>();
  for (const s of m.segments) segTotals.set(s.kind, (segTotals.get(s.kind) ?? 0) + (s.tEnd - s.tStart + 1 / m.fps));
  const counts: Record<EventType, number> = { vurus: 0, 'yon-degistirme': 0, hizlanma: 0, durus: 0, comelme: 0 };
  for (const e of events) counts[e.type]++;
  let tracked = 0;
  for (let i = 0; i < sk.n; i++) if (sk.state[i] !== 0) tracked++;
  const sw = seriesStats(m.stanceWidth);
  return {
    frames: sk.n,
    trackedFrames: tracked,
    viewKind: m.viewKind,
    facing,
    hipSpeed: { mean: orNull(sp.mean), p95: orNull(sp.p95), max: orNull(sp.max) },
    ankleSpeedMax: { sol: orNull(maxOf(m.ankleSpeedL)), sağ: orNull(maxOf(m.ankleSpeedR)) },
    angles: {
      kneeL: range(m.kneeL),
      kneeR: range(m.kneeR),
      hipL: range(m.hipL),
      hipR: range(m.hipR),
      elbowL: range(m.elbowL),
      elbowR: range(m.elbowR),
      ankleL: range(m.ankleL),
      ankleR: range(m.ankleR),
    },
    trunkLean: m.leanSigned ? range(m.trunkLean) : null,
    trunkTilt: range(m.trunkTilt),
    stanceWidth: { mean: orNull(sw.mean), max: orNull(sw.max) },
    steps: m.steps.length,
    cadence: m.cadence,
    segments: [...segTotals].map(([kind, s]) => ({ kind, sec: Math.round(s * 10) / 10 })),
    eventCounts: counts,
  };
}

// ── kural tabanlı yönlendirme ────────────────────────────────

function ruleFindings(sk: Skeleton, m: Metrics, events: PoseEvent[], hints: string[]): Finding[] {
  const out: Finding[] = [];
  const fpsTxt = `${fmt(sk.fps, 0)} kare/sn`;
  const refs = refsFor(hints);

  const kicks = events.filter((e) => e.type === 'vurus').sort((a, b) => b.confidence - a.confidence).slice(0, 5).sort((a, b) => a.t - b.t);
  for (const k of kicks) {
    const side = String(k.measures.bacak ?? '');
    const where = `${sec(k.t)}, ${side} bacak`;
    const sup = num(k.measures, 'destek_diz_acisi');
    if (nz(sup)) {
      const straight = sup >= THRESH.supportKneeStraight;
      out.push({
        id: `kural-${k.id}-destek`,
        level: straight ? 'dikkat' : 'bilgi',
        title: straight ? 'Destek bacağı neredeyse düz görünüyor' : 'Destek dizi hafif bükülü görünüyor',
        text: straight
          ? `Vuruş/pas hareketi adayında (${where}) destek bacağının diz açısı ${fmt(sup, 0)}° ölçüldü; bu, "neredeyse düz" sayılan ${THRESH.supportKneeStraight}° eşiğinin üstünde. Teknik anlatımlarında destek dizinin hafif bükülü olması genel olarak önerilir. ${SOFT_NOTE}`
          : `Vuruş/pas hareketi adayında (${where}) destek bacağının diz açısı ${fmt(sup, 0)}° ölçüldü; "neredeyse düz" eşiği olan ${THRESH.supportKneeStraight}°'nin altında, yani diz hafif bükülü. Bu, teknik anlatımlarındaki genel yönlendirmeyle uyumlu görünüyor. ${SOFT_NOTE}`,
        measured: `destek bacağı diz açısı ${fmt(sup, 0)}° (görüntü düzleminde)`,
        threshold: `≥ ${THRESH.supportKneeStraight}° = neredeyse düz`,
        at: k.t,
        eventId: k.id,
        guidance: guide(hints, 'support'),
        refs,
        source: RULE_LABEL,
      });
    }
    const lean = num(k.measures, 'govde_egimi');
    if (nz(lean)) {
      const back = lean <= THRESH.trunkBackLean;
      out.push({
        id: `kural-${k.id}-govde`,
        level: back ? 'dikkat' : 'bilgi',
        title: back ? 'Gövde vuruş anında geriye eğik görünüyor' : 'Gövde eğimi',
        text: back
          ? `Vuruş/pas hareketi adayında (${where}) gövde bakış yönüne göre ${fmt(Math.abs(lean), 0)}° geriye eğik ölçüldü (eşik: ${Math.abs(THRESH.trunkBackLean)}° ve üzeri geriye eğim). Teknik anlatımlarında gövdenin topun üstünde, hafif öne eğik olması tarif edilir. ${SOFT_NOTE}`
          : `Vuruş/pas hareketi adayında (${where}) gövde eğimi ${fmt(lean, 0)}° (+ = bakış yönünde öne). Geriye eğim eşiği ${THRESH.trunkBackLean}°; bu değer o eşiğin üstünde. ${SOFT_NOTE}`,
        measured: `gövde eğimi ${fmt(lean, 0)}° (+ = bakış yönünde öne)`,
        threshold: `≤ ${THRESH.trunkBackLean}° = geriye eğik`,
        at: k.t,
        eventId: k.id,
        guidance: guide(hints, 'torso'),
        refs,
        source: RULE_LABEL,
      });
    }
    const sep = num(k.measures, 'kalca_omuz_donus_farki');
    if (nz(sep)) {
      out.push({
        id: `kural-${k.id}-donus`,
        level: 'bilgi',
        title: 'Kalça–omuz dönüş farkı',
        text: `Vuruş/pas hareketi adayı çevresinde (${where}) omuz çizgisi ile kalça çizgisi arasındaki dönüş farkı en çok yaklaşık ${fmt(sep, 0)}° ölçüldü. Bu değer derinlik (z) tahminine dayanır ve gürültülüdür; kesin bir açı olarak değil büyüklük sırası olarak okuyun. ${SOFT_NOTE}`,
        measured: `kalça–omuz dönüş farkı ≈ ${fmt(sep, 0)}°`,
        threshold: null,
        at: k.t,
        eventId: k.id,
        guidance: guide(hints, 'hips'),
        refs,
        source: RULE_LABEL,
      });
    }
    const bal = num(k.measures, 'denge_gostergesi');
    if (nz(bal) && bal >= THRESH.balanceFarTL) {
      out.push({
        id: `kural-${k.id}-denge`,
        level: 'bilgi',
        title: 'Destek ayağı kalçadan yanda',
        text: `Vuruş/pas hareketi adayında (${where}) destek ayağı, kalça merkezinden yatayda ${fmt(bal, 2)} gövde boyu uzaktaydı (eşik: ${fmt(THRESH.balanceFarTL, 1)}). Bu bir denge göstergesidir, kesin bir denge ölçümü değildir; kamera açısından da etkilenir. ${SOFT_NOTE}`,
        measured: `destek ayağı–kalça yatay uzaklığı ${fmt(bal, 2)} GB`,
        threshold: `≥ ${fmt(THRESH.balanceFarTL, 1)} GB`,
        at: k.t,
        eventId: k.id,
        guidance: guide(hints, 'balance'),
        refs,
        source: RULE_LABEL,
      });
    }
  }
  if (kicks.length) {
    const peak = Math.max(...kicks.map((k) => num(k.measures, 'tepe_ayak_hizi') ?? 0));
    const l = kicks.filter((k) => k.measures.bacak === 'sol').length;
    const r = kicks.filter((k) => k.measures.bacak === 'sağ').length;
    out.push({
      id: 'kural-vurus-ozet',
      level: 'bilgi',
      title: 'Vuruş/pas hareketi adayları',
      text: `${kicks.length} aday bulundu (${l} sol, ${r} sağ bacak). En yüksek ayak hızı ${fmt(peak, 1)} GB/sn; bu değer ${fpsTxt} örneklemeyle ölçüldü, gerçek tepe hız farklı olabilir ve metre/sn karşılığı verilmez. Top izlenmediği için bunlar yalnızca bacak hareketinden çıkarılan adaylardır.`,
      measured: `aday sayısı ${kicks.length}; tepe ayak hızı ${fmt(peak, 1)} GB/sn`,
      threshold: `tepe ayak hızı ≥ ${THRESH.kick.minPeakTLs} GB/sn, bileğin kalçaya göre hızı ≥ ${THRESH.kick.minRelTLs} GB/sn`,
      guidance: [],
      refs,
      source: RULE_LABEL,
    });
  }

  for (const e of events.filter((x) => x.type === 'yon-degistirme').slice(0, 4)) {
    const ang = num(e.measures, 'aci_degisimi');
    const drop = num(e.measures, 'kalca_alcalmasi');
    const sb = num(e.measures, 'onceki_hiz');
    const sa = num(e.measures, 'sonraki_hiz');
    const minSp = num(e.measures, 'en_dusuk_hiz');
    const flat = nz(drop) && drop < THRESH.turnDropMinPct;
    out.push({
      id: `kural-${e.id}`,
      level: 'bilgi',
      title: 'Yön değiştirme',
      text: `${sec(e.t)} civarında hareket yönü yaklaşık ${fmt(ang, 0)}° değişti (eşik: ${THRESH.turn.minDeg}°); hız ${fmt(sb, 1)} → ${fmt(sa, 1)} GB/sn, dönüş sırasındaki en düşük hız ${fmt(minSp, 1)} GB/sn. ${
        nz(drop)
          ? flat
            ? `Kalça yüksekliği dönüş sırasında yalnızca %${fmt(drop, 0)} azaldı (eşik: %${THRESH.turnDropMinPct}); belirgin bir alçalma ölçülmedi. Dönüşlerde ağırlık merkezini biraz alçaltmak genel bir yönlendirmedir.`
            : `Kalça yüksekliği dönüş sırasında %${fmt(drop, 0)} azaldı.`
          : ''
      } Yön, görüntü düzlemindedir; kamera hareketliyse kameraya görelidir. ${SOFT_NOTE}`,
      measured: `yön değişimi ${fmt(ang, 0)}°; hız ${fmt(sb, 1)} → ${fmt(sa, 1)} GB/sn${nz(drop) ? `; kalça düşüşü %${fmt(drop, 0)}` : ''}`,
      threshold: `yön değişimi ≥ ${THRESH.turn.minDeg}°${nz(drop) ? `; belirgin alçalma ≥ %${THRESH.turnDropMinPct}` : ''}`,
      at: e.t,
      eventId: e.id,
      guidance: [],
      refs: [],
      source: RULE_LABEL,
    });
  }

  for (const e of events.filter((x) => x.type === 'hizlanma').slice(0, 3)) {
    const lean = num(e.measures, 'govde_egimi');
    const ramp = num(e.measures, 'hiz_artisi');
    const dur = num(e.measures, 'sure');
    const peak = num(e.measures, 'tepe_hiz');
    out.push({
      id: `kural-${e.id}`,
      level: 'bilgi',
      title: e.measures.sinif === 'sprint' ? 'Sprint' : 'Hızlanma',
      text: `${sec(e.tStart)} – ${sec(e.tEnd)} arasında kalça hızı ${fmt(num(e.measures, 'baslangic_hizi'), 1)} → ${fmt(peak, 1)} GB/sn çıktı (artış ${fmt(ramp, 1)} GB/sn, ${fmt(dur, 1)} sn; eşik: en az ${THRESH.accel.minRise} GB/sn artış, tepe ≥ ${THRESH.accel.minPeak} GB/sn). ${
        nz(lean)
          ? lean >= THRESH.startLeanDeg
            ? `Hızlanmanın ilk yarısında gövde ortalama ${fmt(lean, 0)}° öne eğikti (eşik: ${THRESH.startLeanDeg}°); ilk adımlarda öne eğim genel bir yönlendirmedir.`
            : `Hızlanmanın ilk yarısında gövde eğimi ortalama ${fmt(lean, 0)}° idi (öne eğim eşiği ${THRESH.startLeanDeg}°).`
          : ''
      } Hızlar kameraya görelidir ve metre/sn'ye çevrilmez. ${SOFT_NOTE}`,
      measured: `${fmt(num(e.measures, 'baslangic_hizi'), 1)} → ${fmt(peak, 1)} GB/sn, ${fmt(dur, 1)} sn`,
      threshold: `artış ≥ ${THRESH.accel.minRise} GB/sn ve tepe ≥ ${THRESH.accel.minPeak} GB/sn`,
      at: e.tEnd,
      eventId: e.id,
      guidance: [],
      refs: [],
      source: RULE_LABEL,
    });
  }

  for (const e of events.filter((x) => x.type === 'durus' && x.measures.tur === 'tek ayak').slice(0, 3)) {
    out.push({
      id: `kural-${e.id}`,
      level: 'bilgi',
      title: 'Tek ayak üzerinde duruş',
      text: `${sec(e.tStart)} – ${sec(e.tEnd)} arasında ${fmt(num(e.measures, 'sure'), 1)} sn boyunca kalça neredeyse sabitken bir ayak yerden kalkıktı (destek: ${String(e.measures.destek_bacagi)} bacak; eşik: kalça hızı ≤ ${THRESH.stance.maxHipSpeed} GB/sn, ayak ≥ ${THRESH.stance.liftTL} gövde boyu kalkık, ≥ ${THRESH.stance.singleLegSec} sn). Kalça yatay salınımı (standart sapma) ${fmt(num(e.measures, 'kalca_salinimi'), 2)} gövde boyu. Bu, bir denge ölçümü değil, sabit görüntüden çıkarılan bir göstergedir. ${SOFT_NOTE}`,
      measured: `süre ${fmt(num(e.measures, 'sure'), 1)} sn; kalça salınımı ${fmt(num(e.measures, 'kalca_salinimi'), 2)} GB`,
      threshold: `kalça hızı ≤ ${THRESH.stance.maxHipSpeed} GB/sn; ayak yüksekliği farkı ≥ ${THRESH.stance.liftTL} GB; süre ≥ ${THRESH.stance.singleLegSec} sn`,
      at: e.t,
      eventId: e.id,
      guidance: guide(hints.slice(0, 1), 'balance'),
      refs: [],
      source: RULE_LABEL,
    });
  }

  for (const e of events.filter((x) => x.type === 'comelme').slice(0, 3)) {
    out.push({
      id: `kural-${e.id}`,
      level: 'bilgi',
      title: 'Alçalma / çömelme',
      text: `${sec(e.tStart)} – ${sec(e.tEnd)} arasında ortalama diz açısı en çok ${fmt(num(e.measures, 'en_kucuk_diz_acisi'), 0)}°'ye indi ve kalça yüksekliği taban çizgisinin %${fmt(num(e.measures, 'kalca_dususu'), 0)} altına düştü (eşik: diz ≤ ${THRESH.crouch.kneeMax}° ve kalça yüksekliği ≤ taban × ${THRESH.crouch.hipDropFrac}, ≥ ${THRESH.crouch.minSec} sn). Açılar görüntü düzlemindedir. ${SOFT_NOTE}`,
      measured: `en kapalı diz açısı ${fmt(num(e.measures, 'en_kucuk_diz_acisi'), 0)}°; kalça düşüşü %${fmt(num(e.measures, 'kalca_dususu'), 0)}`,
      threshold: `diz ≤ ${THRESH.crouch.kneeMax}° ve kalça yüksekliği ≤ taban × ${THRESH.crouch.hipDropFrac}`,
      at: e.t,
      eventId: e.id,
      guidance: [],
      refs: [],
      source: RULE_LABEL,
    });
  }

  if (nz(m.cadence)) {
    out.push({
      id: 'kural-adim-sikligi',
      level: 'bilgi',
      title: 'Adım sıklığı',
      text: `Hareketli bölümlerde ${m.steps.length} adım sezildi; adımlar arası ortanca süreden yaklaşık ${m.cadence} adım/dk bulundu (eşik: kalça hızı ≥ ${THRESH.steps.minMoveSpeed} GB/sn olan anlar sayılır). ${fpsTxt} örneklemede hızlı adımlar eksik sayılabilir. ${SOFT_NOTE}`,
      measured: `${m.steps.length} adım; ≈ ${m.cadence} adım/dk`,
      threshold: `kalça hızı ≥ ${THRESH.steps.minMoveSpeed} GB/sn`,
      guidance: [],
      refs: [],
      source: RULE_LABEL,
    });
  }
  return out;
}

// ── ana derleyici ────────────────────────────────────────────

export const AI_BLOCK: Report['ai'] = {
  status: 'devre dışı',
  reason:
    'Yapay zekâ yorumu bu sürümde etkin değildir. Böyle bir yorum, kullanıcının kendi sağlayacağı bir API anahtarı gerektirir ve ölçümlerin üçüncü bir hizmete gönderilmesi anlamına gelir. Şu an hiçbir ağ çağrısı yapılmaz ve yapay zekâ tarafından üretilmiş hiçbir metin yoktur; yukarıdaki yönlendirmeler yalnızca sabit eşiklere dayanan kurallardır.',
};

export function buildReport(sk: Skeleton, m: Metrics, track: Track, events: PoseEvent[], input: ReportInput): Report {
  const hints = input.techniqueHints?.length ? input.techniqueHints : ['sert-pas', 'sert-sut'];
  const durationSec = Math.max(0, input.endSec - input.startSec);
  const reliability = assessReliability(sk, m, track, durationSec);
  const summary = buildSummary(sk, m, events);
  return {
    version: REPORT_VERSION,
    meta: {
      generatedAt: input.generatedAt ?? new Date().toISOString(),
      fileName: input.fileName ?? null,
      engine: { name: 'MediaPipe Pose Landmarker', model: input.quality, delegate: input.delegate, license: 'Apache-2.0' },
      video: input.video,
      segment: { startSec: Math.round(input.startSec * 100) / 100, endSec: Math.round(input.endSec * 100) / 100, durationSec: Math.round(durationSec * 100) / 100 },
      fps: sk.fps,
      frames: sk.n,
      processing: input.processing ?? null,
      privacy: PRIVACY_LINE,
      units: 'GB = gövde boyu (omuz merkezi–kalça merkezi). Hızlar GB/sn; açılar derece (görüntü düzleminde).',
    },
    reliability,
    measured: { summary, series: buildSeries(sk, m), events },
    ruleBased: { label: RULE_LABEL, note: SOFT_NOTE, findings: ruleFindings(sk, m, events, hints) },
    ai: AI_BLOCK,
  };
}

/** Kalıcı depo için küçük özet (en çok 40 olay, 6 uyarı). */
export function summarizeReport(report: Report, name: string, at = new Date().toISOString()): VideoAnalysisSummary {
  return {
    v: 1,
    name: name.slice(0, 120),
    at,
    startSec: report.meta.segment.startSec,
    endSec: report.meta.segment.endSec,
    fps: Math.round(report.meta.fps * 10) / 10,
    quality: report.meta.engine.model,
    frames: report.meta.frames,
    coveragePct: report.reliability.stats.coveragePct,
    reliability: report.reliability.level,
    reliabilityScore: report.reliability.score,
    viewKind: report.measured.summary.viewKind,
    playerHeightPct: report.reliability.stats.playerHeightPct,
    hipSpeedMax: report.measured.summary.hipSpeed.max,
    cadence: report.measured.summary.cadence,
    eventCounts: { ...report.measured.summary.eventCounts },
    events: report.measured.events.slice(0, 40).map((e) => ({ type: e.type, t: e.t, conf: e.confidence })),
    warnings: report.reliability.warnings.slice(0, 6).map((w) => w.slice(0, 220)),
  };
}

/** Rapor metinlerinin tamamı (yasak ifade denetimi ve dışa aktarma için). */
export function reportTexts(report: Report): string[] {
  const t: string[] = [report.ruleBased.note, report.ai.reason, ...report.reliability.warnings, ...report.reliability.limits];
  for (const f of report.ruleBased.findings) t.push(f.title, f.text, f.measured, f.threshold ?? '', ...f.guidance.map((g) => g.text));
  return t;
}

