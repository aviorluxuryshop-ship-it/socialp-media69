// Otomatik video analizi — saf mantık testleri (tarayıcısız, MediaPipe'sız).
// Sentetik iskeletlerle (scripts/logic-tests/_helpers/pose-synth.mjs) açı matematiği, düzleştirme, boşluk doldurma,
// takip sürekliliği, olay tespiti (kesinlik/duyarlık), rapor yapısı ve depo (store) uyumluluğu sınanır.
// Bu testler GERÇEK video doğrulaması DEĞİLDİR: gerçek kayıtlardaki başarı ayrıca ölçülmelidir.
import fs from 'node:fs';
import path from 'node:path';
import * as S from './_helpers/pose-synth.mjs';

export const include = [
  'lib/pose/types.ts',
  'lib/pose/thresholds.ts',
  'lib/pose/geometry.ts',
  'lib/pose/smoothing.ts',
  'lib/pose/tracking.ts',
  'lib/pose/skeleton.ts',
  'lib/pose/metrics.ts',
  'lib/pose/events.ts',
  'lib/pose/report.ts',
  'lib/pose/pipeline.ts',
  'data/body-position.ts',
];

const near = (a, b, tol) => Math.abs(a - b) <= tol;

export default async ({ ok, test, load, root }) => {
  const G = await load('lib/pose/geometry.js');
  const SM = await load('lib/pose/smoothing.js');
  const TR = await load('lib/pose/tracking.js');
  const SK = await load('lib/pose/skeleton.js');
  const ME = await load('lib/pose/metrics.js');
  const EV = await load('lib/pose/events.js');
  const RP = await load('lib/pose/report.js');
  const PL = await load('lib/pose/pipeline.js');
  const TY = await load('lib/pose/types.js');
  const TH = await load('lib/pose/thresholds.js');
  const store = await load('lib/store.js');
  const data = await load('data/index.js');

  const seedOf = (frames, pi = 0) => {
    const f = frames.find((x) => x.poses.length > pi) ?? frames[0];
    const lm = f.poses[pi].lm;
    return { t: f.t, x: (lm[23 * 4] + lm[24 * 4]) / 2, y: (lm[23 * 4 + 1] + lm[24 * 4 + 1]) / 2 };
  };
  const run = (frames, fps, opt = {}) =>
    PL.runPipeline(frames, S.DIMS, fps, [opt.seed ?? seedOf(frames)], {
      quality: 'lite',
      delegate: 'CPU',
      video: { width: S.DIMS.w, height: S.DIMS.h, durationSec: frames.length / fps },
      startSec: 0,
      endSec: frames.length / fps,
      fileName: 'sentetik.mp4',
      generatedAt: '2026-01-01T00:00:00.000Z',
    });

  // ── Geometri ──────────────────────────────────────────────
  await test('pose: angle3 dik/düz/kapalı açıyı ve sıfır uzunluğu doğru verir', async () => {
    ok(near(G.angle3(1, 0, 0, 0, 0, 1), 90, 1e-9), 'dik açı');
    ok(near(G.angle3(-1, 0, 0, 0, 1, 0), 180, 1e-9), 'düz açı');
    ok(near(G.angle3(1, 0, 0, 0, 1, 0), 0, 1e-6), 'kapalı açı');
    ok(Number.isNaN(G.angle3(0, 0, 0, 0, 1, 1)), 'sıfır uzunluk NaN olmalı');
    ok(near(G.angle3(0, -1, 0, 0, Math.cos(Math.PI / 3), Math.sin(Math.PI / 3)), 150, 1e-6), 'tutarlı geometri: 150°');
    // 3B ile 2B tutarlı
    ok(near(G.angle3d([1, 0, 0], [0, 0, 0], [0, 1, 0]), 90, 1e-9), '3B dik açı');
  });

  await test('pose: wrapDeg, angDiff ve circMean 0°/360° sınırında doğru çalışır', async () => {
    ok(G.wrapDeg(190) === -170 && G.wrapDeg(-190) === 170 && G.wrapDeg(180) === 180 && G.wrapDeg(360) === 0, 'wrapDeg');
    ok(near(G.angDiff(350, 10), 20, 1e-9) && near(G.angDiff(10, 350), -20, 1e-9), 'angDiff');
    ok(near(Math.abs(G.circMean([350, 10])), 0, 1e-6), 'circMean(350,10) ≈ 0');
  });

  await test('pose: findPeaks belirginliği ve en az uzaklığı uygular, NaN tepeyi böler', async () => {
    const a = [0, 1, 0, 3, 0, 1.2, 1.3, 1.1, 0, NaN, 2, 0];
    const pk = G.findPeaks(a, { minProminence: 1.5 });
    ok(pk.map((p) => p.index).join() === '3,10' || pk.map((p) => p.index).join() === '3', `beklenmeyen tepeler: ${pk.map((p) => p.index)}`);
    const close = G.findPeaks([0, 5, 0, 4, 0], { minDist: 3 });
    ok(close.length === 1 && close[0].index === 1, 'yakın zayıf tepe elenmeli');
    ok(near(G.percentile([1, 2, 3, 4, 5], 0.5), 3, 1e-9) && near(G.median([3, 1, 2, NaN]), 2, 1e-9), 'percentile/median');
    ok(near(G.bboxIoU([0, 0, 10, 10], [5, 0, 15, 10]), 1 / 3, 1e-9) && G.bboxIoU([0, 0, 1, 1], [2, 2, 3, 3]) === 0, 'bboxIoU');
  });

  // ── Düzleştirme / boşluk doldurma ────────────────────────
  await test('pose: Savitzky–Golay polinomu bozmaz, türevi doğru verir, gürültüyü azaltır', async () => {
    const n = 40;
    const fps = 30;
    const quad = Float32Array.from({ length: n }, (_, i) => 0.02 * i * i - 0.3 * i + 5);
    const sm = SM.savgol(quad, { window: 7, order: 3 });
    let e = 0;
    for (let i = 0; i < n; i++) e = Math.max(e, Math.abs(sm[i] - quad[i]));
    ok(e < 1e-3, `ikinci derece polinom bozuldu (en büyük sapma ${e})`);
    const ramp = Float32Array.from({ length: n }, (_, i) => 3 * (i / fps)); // eğim 3/sn
    const d = SM.savgol(ramp, { window: 5, order: 2, deriv: 1, fps });
    ok(near(d[10], 3, 1e-3) && near(d[0], 3, 1e-2) && near(d[n - 1], 3, 1e-2), `türev ${d[10]}`);
    // gürültü
    const R = S.rng(5);
    const clean = Float32Array.from({ length: 120 }, (_, i) => Math.sin(i / 8) * 40);
    const noisy = Float32Array.from(clean, (v) => v + S.gauss(R) * 4);
    const out = SM.savgol(noisy, SM.smoothParams(30));
    const rms = (a) => Math.sqrt(a.reduce((s, v, i) => s + (v - clean[i]) ** 2, 0) / a.length);
    ok(rms(out) < 0.7 * rms(noisy), `düzleştirme gürültüyü yeterince azaltmadı ${rms(out)} / ${rms(noisy)}`);
    // düşük fps'te düzleştirme yok (tepe hızı korunur)
    const lowp = SM.smoothParams(10);
    ok(lowp.window === 3 && lowp.order === 2, 'düşük fps parametreleri');
    const sp = Float32Array.from([0, 0, 0, 10, 0, 0, 0]);
    const keep = SM.savgol(sp, lowp);
    ok(near(keep[3], 10, 1e-4), 'düşük fps tek karelik değeri korumalı');
  });

  await test('pose: despike tek karelik sıçramayı atar, basamağı korur; fillGaps ≤3 kareyi doldurur', async () => {
    const a = Float32Array.from([0, 0, 0, 90, 0, 0, 0]);
    const d = SM.despike(a, 30);
    ok(Number.isNaN(d[3]) && d[2] === 0, 'sıçrama atılmalı');
    const step = Float32Array.from([0, 0, 0, 100, 100, 100]);
    ok(SM.despike(step, 30).every((v) => Number.isFinite(v)), 'basamak korunmalı');
    const g = Float32Array.from([1, NaN, NaN, NaN, 5, NaN, NaN, NaN, NaN, 10]);
    const f = SM.fillGaps(g, 3);
    ok(near(f.y[2], 3, 1e-5) && f.filled[1] === 1 && f.filled[3] === 1, '3 kare doğrusal doldurulmalı');
    ok(Number.isNaN(f.y[6]) && f.filled[6] === 0, '4 karelik boşluk doldurulmamalı');
    const edge = SM.fillGaps(Float32Array.from([NaN, NaN, 1, 2]), 3);
    ok(Number.isNaN(edge.y[0]), 'baştaki boşluk doldurulmamalı');
  });

  // ── İskelet: boşluk doldurma ve gürültü ──────────────────
  await test('pose: iskelette ≤3 karelik kayıp doldurulur (işaretlenir), 5 karelik kayıp doldurulmaz', async () => {
    const fps = 30;
    const { frames } = S.runningClip({ fps, duration: 4 });
    const clean = run(frames.map((f) => ({ ...f, poses: f.poses.slice() })), fps);
    const gapped = frames.map((f) => ({ ...f, poses: f.poses.slice() }));
    for (const i of [30, 31, 32]) gapped[i].poses = [];
    for (const i of [80, 81, 82, 83, 84]) gapped[i].poses = [];
    const r = run(gapped, fps, { seed: seedOf(frames) });
    ok(r.skeleton.state[31] === 2, `3 kare doldurulmalı (durum ${r.skeleton.state[31]})`);
    ok(r.skeleton.state[82] === 0, `5 kare doldurulmamalı (durum ${r.skeleton.state[82]})`);
    // doldurulan değer gerçeğe yakın mı (sağ diz x)
    const j = 26;
    const err = Math.abs(r.skeleton.x[31 * 33 + j] - clean.skeleton.x[31 * 33 + j]);
    ok(err < 12, `doldurma hatası ${err.toFixed(1)} px`);
    ok(near(r.track.coverage, 1 - 5 / frames.length, 0.001) || r.track.coverage > 0.9, `kapsama ${r.track.coverage}`);
    ok(r.report.reliability.stats.interpolatedPct >= 1, 'rapor doldurulan oranı yazmalı');
  });

  await test('pose: gürültülü girdide eklem açısı titreşimi düzleştirmeyle azalır', async () => {
    const fps = 30;
    const { frames } = S.standingClip({ fps, noise: 0.015 });
    const r = run(frames, fps);
    const raw = [];
    for (let i = 0; i < frames.length; i++) {
      const lm = frames[i].poses[0].lm;
      const P = (j) => [lm[j * 4] * S.DIMS.w, lm[j * 4 + 1] * S.DIMS.h];
      const h = P(24);
      const k = P(26);
      const a = P(28);
      raw.push(G.angle3(h[0], h[1], k[0], k[1], a[0], a[1]));
    }
    const sRaw = G.std(raw);
    const sSm = G.std(Array.from(r.metrics.kneeR));
    ok(sSm < 0.6 * sRaw, `diz açısı std ${sRaw.toFixed(2)}° → ${sSm.toFixed(2)}°`);
  });

  // ── Ölçümler ─────────────────────────────────────────────
  await test('pose: ölçümler bilinen değerleri verir (diz/gövde açısı, hız GB/sn, yön, görünüm)', async () => {
    const fps = 30;
    // diz: ayakta k=0.1 rad → iç açı 180−5,7 = 174,3°
    const st = run(S.standingClip({ fps }).frames, fps);
    ok(near(G.median(Array.from(st.metrics.kneeR)), 174.3, 1.5), `ayakta diz ${G.median(Array.from(st.metrics.kneeR))}`);
    ok(G.median(Array.from(st.metrics.speed)) < 0.3, 'ayakta hız ~0');
    // koşu: v=8 GB/sn
    const rn = run(S.runningClip({ fps, v: 8 }).frames, fps);
    ok(near(G.median(Array.from(rn.metrics.speed)), 8, 0.6), `koşu hızı ${G.median(Array.from(rn.metrics.speed))}`);
    ok(rn.metrics.segments.length === 1 && rn.metrics.segments[0].kind === 'koşu', 'tek koşu parçası');
    ok(near(rn.metrics.cadence, 168, 20), `adım sıklığı ${rn.metrics.cadence}`);
    ok(rn.metrics.viewKind === 'yan' && rn.metrics.leanSigned, 'yan görünüm');
    // gövde eğimi: lean 0.14 rad = 8°, sağa bakıyor → +
    ok(near(G.median(Array.from(rn.metrics.trunkLean)), 8.0, 1.5), `gövde eğimi ${G.median(Array.from(rn.metrics.trunkLean))}`);
    // sola koşu → işaretli eğim yine pozitif (bakış yönünde öne), ham eğim negatif
    const left = S.simulate(() => ({ v: -8, stride: 1.4, lean: 0.14, yaw: Math.PI }), { fps, duration: 4, x0: 30 });
    const lr = run(left, fps);
    ok(near(G.median(Array.from(lr.metrics.trunkLean)), 8.0, 1.5), `sola koşuda gövde eğimi ${G.median(Array.from(lr.metrics.trunkLean))}`);
    ok(G.median(Array.from(lr.metrics.trunkTilt)) < -6, 'ham eğim sola negatif olmalı');
    ok(lr.report.measured.summary.facing === 'sola' && rn.report.measured.summary.facing === 'sağa', 'bakış yönü');
    // önden görünüm
    const front = S.simulate(() => ({ v: 0, stride: 0, yaw: Math.PI / 2 }), { fps, duration: 3 });
    const fr = run(front, fps);
    ok(fr.metrics.viewKind === 'önden-arkadan', `önden görünüm: ${fr.metrics.viewKind}`);
    ok(fr.report.reliability.warnings.some((w) => /önden ya da arkadan/.test(w)), 'önden görünüm uyarısı');
    // kalça–omuz dönüş farkı
    const tw = S.simulate(() => ({ v: 0, stride: 0, twist: 0.5, yaw: 0.2 }), { fps, duration: 2 });
    const tr = run(tw, fps);
    ok(near(G.median(Array.from(tr.metrics.hipShoulderSep)), 28.6, 3), `dönüş farkı ${G.median(Array.from(tr.metrics.hipShoulderSep))}`);
    // çömelme: en küçük diz açısı ≈ 65°
    const cr = run(S.crouchClip({ fps }).frames, fps);
    ok(near(G.minOf(cr.metrics.kneeMean), 65, 4), `çömelme diz ${G.minOf(cr.metrics.kneeMean)}`);
  });

  await test('pose: hız piksel boyutundan bağımsızdır (gövde boyuna normalize)', async () => {
    const fps = 30;
    const big = run(S.simulate(() => ({ v: 6, stride: 1.4 }), { fps, duration: 3, T: 120 }), fps);
    const small = run(S.simulate(() => ({ v: 6, stride: 1.4 }), { fps, duration: 3, T: 60 }), fps);
    const a = G.median(Array.from(big.metrics.speed));
    const b = G.median(Array.from(small.metrics.speed));
    ok(near(a, b, 0.4) && near(a, 6, 0.5), `GB/sn ölçeğe bağımlı: ${a} vs ${b}`);
  });

  // ── Olay tespiti ─────────────────────────────────────────
  const detail = [];
  const agg = { tp: 0, fp: 0, fn: 0 };
  const evalKicks = (label, frames, fps, truth) => {
    const r = run(frames, fps);
    const sc = S.score(r.events, truth, 'vurus', 0.25);
    agg.tp += sc.tp;
    agg.fp += sc.fp;
    agg.fn += sc.fn;
    detail.push(`${label}: TP=${sc.tp} FP=${sc.fp} FN=${sc.fn}`);
    return { r, sc };
  };

  await test('pose: vuruş/pas adayı — temiz sentetik klipte (30 ve 10 kare/sn) 3/3 bulunur, doğru bacak ve ölçümlerle', async () => {
    for (const fps of [30, 10]) {
      const { frames, truth } = S.kicksClip({ fps });
      const { r, sc } = evalKicks(`vuruş ${fps}fps`, frames, fps, truth);
      ok(sc.recall === 1 && sc.precision === 1, `${fps} kare/sn: duyarlık ${sc.recall}, kesinlik ${sc.precision}: ${JSON.stringify(r.events.filter((e) => e.type === 'vurus').map((e) => [e.t, e.measures.bacak]))}`);
      const ks = r.events.filter((e) => e.type === 'vurus');
      ok(ks.map((e) => e.measures.bacak).join() === 'sağ,sol,sağ', `bacaklar: ${ks.map((e) => e.measures.bacak)}`);
      const k = ks[0];
      ok(near(k.measures.destek_diz_acisi, 154, 5), `destek diz ${k.measures.destek_diz_acisi}`);
      ok(near(k.measures.geri_savurma_diz_acisi, 71, 8) && k.measures.bitis_diz_acisi > 160, 'diz açıları');
      ok(near(k.measures.kalca_omuz_donus_farki, 28.6, 6), `dönüş ${k.measures.kalca_omuz_donus_farki}`);
      ok(k.confidence > 0.5 && k.confidence <= 1 && k.tStart < k.t && k.t < k.tEnd, 'güven ve zaman aralığı');
      ok(k.id === 'vurus-1' && ks[2].id === 'vurus-3', 'kimlikler');
    }
  });

  await test('pose: vuruş/pas adayı — gürültü, 2 karelik kayıp ve sıçramalarla da (30 ve 10 kare/sn) çoğu bulunur, yanlış aday azdır', async () => {
    for (const fps of [30, 10]) {
      const { frames, truth } = S.kicksClip({ fps, noise: 0.012, dropouts: [[2.4, 2.4 + 2 / fps]], spikes: 2, seed: 21 });
      const { sc, r } = evalKicks(`vuruş gürültülü ${fps}fps`, frames, fps, truth);
      ok(sc.recall >= 2 / 3, `${fps} kare/sn gürültülü duyarlık ${sc.recall}`);
      ok(sc.fp <= 1, `${fps} kare/sn gürültülü yanlış aday ${sc.fp}: ${JSON.stringify(r.events.filter((e) => e.type === 'vurus').map((e) => e.t))}`);
    }
  });

  await test('pose: koşu, yürüyüş ve duruşta vuruş adayı ÇIKMAZ (yanlış pozitif yok)', async () => {
    for (const fps of [30, 10]) {
      for (const [name, mk] of [['koşu', S.runningClip], ['yürüyüş', S.walkingClip], ['duruş', S.standingClip]]) {
        for (const noise of [0, 0.012]) {
          const { frames, truth } = mk({ fps, noise });
          const { r, sc } = evalKicks(`${name} ${fps}fps gürültü=${noise}`, frames, fps, truth);
          ok(sc.fp === 0, `${name} ${fps} kare/sn gürültü ${noise}: ${sc.fp} yanlış vuruş (${JSON.stringify(r.events.filter((e) => e.type === 'vurus').map((e) => e.t))})`);
        }
      }
    }
    // adayların dayandığı eşikler thresholds.ts'te tek yerde
    ok(TH.THRESH.kick.minPeakTLs > 0 && TH.THRESH.kick.kneeFlexMax < 180, 'eşikler');
  });

  await test('pose: yön değiştirme (180°) bulunur; düz koşuda bulunmaz', async () => {
    for (const fps of [30, 10]) {
      const { frames, truth } = S.turnClip({ fps });
      const r = run(frames, fps);
      const sc = S.score(r.events, truth, 'yon-degistirme', 0.3);
      ok(sc.tp === 1 && sc.fp === 0, `${fps} kare/sn: ${JSON.stringify(r.events.filter((e) => e.type === 'yon-degistirme').map((e) => [e.t, e.measures.aci_degisimi]))}`);
      const e = r.events.find((x) => x.type === 'yon-degistirme');
      ok(e.measures.aci_degisimi > 150, `açı değişimi ${e.measures.aci_degisimi}`);
      const straight = run(S.runningClip({ fps }).frames, fps);
      ok(!straight.events.some((x) => x.type === 'yon-degistirme'), 'düz koşuda dönüş bulunmamalı');
    }
    // 90°: yatay koşudan "yukarı" (kameradan uzağa) koşuya
    const fps = 30;
    const f90 = S.simulate((t) => ({ v: t < 1.5 ? 6 : 0, vUp: t < 1.5 ? 0 : 6, stride: 1.4 }), { fps, duration: 3.5 });
    const r90 = run(f90, fps);
    const e90 = r90.events.find((x) => x.type === 'yon-degistirme');
    ok(e90 && near(e90.measures.aci_degisimi, 90, 20) && near(e90.t, 1.5, 0.35), `90° dönüş: ${JSON.stringify(e90)}`);
  });

  await test('pose: hızlanma/sprint, çömelme ve tek ayak duruşu bulunur (her iki örneklemede)', async () => {
    for (const fps of [30, 10]) {
      const sp = run(S.sprintClip({ fps }).frames, fps);
      const h = sp.events.filter((e) => e.type === 'hizlanma');
      ok(h.length === 1 && near(h[0].t, 2.8, 0.4) && h[0].measures.sinif === 'sprint', `${fps}: ${JSON.stringify(h)}`);
      ok(h[0].measures.tepe_hiz > 10 && h[0].measures.hiz_artisi > 6, 'tepe/artış');
      const cr = run(S.crouchClip({ fps }).frames, fps);
      const c = cr.events.filter((e) => e.type === 'comelme');
      ok(c.length === 1 && near(c[0].t, 1.8, 0.4) && c[0].measures.kalca_dususu > 30, `${fps}: ${JSON.stringify(c)}`);
      const ol = run(S.oneLegClip({ fps }).frames, fps);
      const d = ol.events.filter((e) => e.type === 'durus' && e.measures.tur === 'tek ayak');
      ok(d.length === 1 && d[0].measures.destek_bacagi === 'sol' && near(d[0].t, 1.8, 0.4), `${fps}: ${JSON.stringify(d)}`);
      // düz koşuda hızlanma yok, sabit duruşta çömelme yok
      ok(!run(S.runningClip({ fps }).frames, fps).events.some((e) => e.type === 'comelme'), 'koşuda çömelme yok');
      ok(!run(S.standingClip({ fps }).frames, fps).events.some((e) => e.type === 'hizlanma' || e.type === 'comelme'), 'duruşta hızlanma/çömelme yok');
    }
  });

  await test('pose: olay şeması — kimlik, tür, t∈[tStart,tEnd], güven 0–1, ölçümler', async () => {
    const fps = 30;
    const all = [S.kicksClip({ fps }).frames, S.turnClip({ fps }).frames, S.sprintClip({ fps }).frames, S.crouchClip({ fps }).frames];
    const types = new Set();
    for (const fr of all) {
      for (const e of run(fr, fps).events) {
        types.add(e.type);
        ok(typeof e.id === 'string' && e.id.startsWith(e.type) && Object.keys(TY.EVENT_TITLE).includes(e.type), `tür/kimlik ${e.id}`);
        ok(e.tStart <= e.t + 1e-9 && e.t <= e.tEnd + 1e-9 || e.type === 'hizlanma', `zaman sırası ${JSON.stringify(e)}`);
        ok(e.confidence >= 0 && e.confidence <= 1 && Number.isFinite(e.t), 'güven');
        ok(e.measures && typeof e.measures === 'object' && Object.keys(e.measures).length > 2, 'ölçümler');
        for (const k of Object.keys(e.measures)) ok(k in EV.MEASURE_INFO, `MEASURE_INFO eksik: ${k}`);
      }
    }
    ok(['vurus', 'yon-degistirme', 'hizlanma', 'comelme'].every((t) => types.has(t)), `bulunan türler ${[...types]}`);
  });

  await test('pose: toplam vuruş adayı kesinlik/duyarlık (sentetik) raporlanır', async () => {
    const p = agg.tp / Math.max(1, agg.tp + agg.fp);
    const r = agg.tp / Math.max(1, agg.tp + agg.fn);
    console.log(`      sentetik vuruş: TP=${agg.tp} FP=${agg.fp} FN=${agg.fn} → kesinlik ${(p * 100).toFixed(0)}%, duyarlık ${(r * 100).toFixed(0)}%  (${detail.length} klip)`);
    ok(p >= 0.9 && r >= 0.85, `kesinlik ${p}, duyarlık ${r}`);
  });

  // ── Takip ────────────────────────────────────────────────
  const accuracy = (track, merged, who = 0) => {
    let good = 0;
    let bad = 0;
    for (let i = 0; i < track.n; i++) {
      if (track.sel[i] < 0) continue;
      if (merged[i].ids[track.sel[i]] === who) good++;
      else bad++;
    }
    return { good, bad };
  };

  await test('pose: iki kişi, sıra karışık — oyuncu karelerin ≥%97\'sinde doğru izlenir', async () => {
    const fps = 15;
    const A = S.simulate(() => ({ v: 4, stride: 1.2 }), { fps, duration: 6, x0: 0 });
    const B = S.simulate(() => ({ v: 0.3, stride: 0 }), { fps, duration: 6, x0: 6, baseY: 600 });
    const merged = S.merge([A, B], 9);
    const seed = seedOf(A);
    const tr = TR.trackPlayer(merged, S.DIMS, fps, [seed]);
    const { good, bad } = accuracy(tr, merged);
    ok(good / (good + bad) >= 0.97 && tr.coverage > 0.95, `doğru ${good}, yanlış ${bad}, kapsama ${tr.coverage}`);
  });

  await test('pose: iki oyuncu yan yana kesişir — süreklilik korunur ve belirsiz kareler işaretlenir', async () => {
    const fps = 20;
    // A sağa, B sola 4 GB/sn; arada B 40 px aşağıda (daha yakın/önde)
    const A = S.simulate(() => ({ v: 4, stride: 1.2 }), { fps, duration: 5, x0: 0 });
    const B = S.simulate(() => ({ v: -4, stride: 1.2, yaw: Math.PI }), { fps, duration: 5, x0: 9, baseY: 690 });
    const merged = S.merge([A, B], 4);
    const tr = TR.trackPlayer(merged, S.DIMS, fps, [seedOf(A)]);
    const { good, bad } = accuracy(tr, merged);
    ok(good / (good + bad) >= 0.9, `kesişme sonrası doğruluk: doğru ${good}, yanlış ${bad}`);
    // belirsizlik: iki oyuncu birbirinin yerine geçebilecek kadar yakınsa kullanıcıya sorulur
    const C = S.simulate(() => ({ v: 4, stride: 1.2 }), { fps, duration: 5, x0: 0 });
    const D = S.simulate(() => ({ v: 4, stride: 1.2 }), { fps, duration: 5, x0: 0.6, baseY: 648 });
    const close = S.merge([C, D], 4);
    const tc = TR.trackPlayer(close, S.DIMS, fps, [seedOf(C)]);
    ok(tc.needsUser && tc.ambiguousFrac > 0.1, `iç içe iki oyuncuda kullanıcıya sorulmalı (belirsiz ${tc.ambiguousFrac})`);
    ok(tc.reasons.length > 0 && tc.reasons.every((x) => /[a-zçğıöşü]/i.test(x)), 'neden metni');
  });

  await test('pose: oyuncu kadrajdan çıkıp dönerse yeniden yakalama işaretlenir ve kullanıcıya sorulur', async () => {
    const fps = 15;
    const frames = S.simulate(() => ({ v: 2, stride: 0.9, amp: 0.35, flex: 0.5 }), { fps, duration: 5.5, x0px: 40 });
    const cut = frames.map((f) => ({ ...f, poses: f.poses.slice() }));
    for (const f of cut) if (f.t >= 2.0 && f.t < 3.2) f.poses = [];
    const tr = TR.trackPlayer(cut, S.DIMS, fps, [seedOf(frames)]);
    ok(tr.reacquisitions >= 1 && tr.needsUser, `yeniden yakalama ${tr.reacquisitions}`);
    ok(tr.flags.some((f) => f & TY.TRACK_REACQUIRED), 'REACQUIRED bayrağı');
    ok(tr.coverage < 0.9 && tr.coverage > 0.6, `kapsama ${tr.coverage}`);
    // kısa kayıp (2 kare) işaretlenmez
    const short = frames.map((f) => ({ ...f, poses: f.poses.slice() }));
    short[20].poses = [];
    short[21].poses = [];
    ok(!TR.trackPlayer(short, S.DIMS, fps, [seedOf(frames)]).needsUser, 'kısa kayıpta kullanıcıya sorulmamalı');
  });

  await test('pose: seçilen noktada kimse yoksa kullanıcıya sorulur; tohum yoksa da', async () => {
    const fps = 15;
    const { frames } = S.runningClip({ fps, duration: 3 });
    const none = TR.trackPlayer(frames, S.DIMS, fps, [{ t: 0, x: 0.95, y: 0.05 }]);
    ok(none.needsUser && none.coverage === 0, 'boş noktada kapsama 0 ve soru');
    const noSeed = TR.trackPlayer(frames, S.DIMS, fps, []);
    ok(noSeed.needsUser && noSeed.coverage === 0, 'tohum yok');
    const cands = TR.candidatesFromFrame(frames[0], S.DIMS);
    ok(cands.length === 1 && cands[0].heightPct > 30 && cands[0].bbox.every((v) => v >= 0 && v <= 1), 'aday listesi');
  });

  // ── Rapor ────────────────────────────────────────────────
  // kelime başında eşleşir ("ağ çağrısı" içindeki "ağrı" gibi sözcük içi rastlantılar yanlış alarm vermesin)
  const forbidden = /(?<!\p{L})(sakat|yaralan|yaralı|ağrı|acı|tedavi|teşhis|tanı|ameliyat|hastalık|rehabilit|fizyoterap|doktor|kırık|burkul|risk)/iu;

  await test('pose: rapor yapısı — meta, güvenilirlik, ölçülen, kural tabanlı, yapay zekâ devre dışı', async () => {
    const fps = 30;
    const r = run(S.kicksClip({ fps }).frames, fps);
    const rep = r.report;
    ok(rep.version === 1 && rep.meta.fps === 30 && rep.meta.frames === r.skeleton.n && rep.meta.engine.license === 'Apache-2.0', 'meta');
    ok(rep.meta.privacy === 'Video cihazınızdan çıkmaz; analiz tarayıcıda yapılır.', 'gizlilik satırı');
    ok(['yüksek', 'orta', 'düşük'].includes(rep.reliability.level) && rep.reliability.limits.length >= 6, 'güvenilirlik');
    ok(rep.reliability.limits.some((l) => /Top izlenmez/.test(l)) && rep.reliability.limits.some((l) => /iki boyutlu/.test(l)), 'dürüst sınırlar');
    ok(rep.measured.events.length === r.events.length && rep.measured.series.t.length === r.skeleton.n, 'ölçülen');
    ok(rep.measured.summary.eventCounts.vurus === 3 && rep.measured.summary.hipSpeed.max !== null, 'özet');
    ok(rep.ai.status === 'devre dışı' && /API anahtar/.test(rep.ai.reason) && /ağ çağrısı yapılmaz/.test(rep.ai.reason), 'yapay zekâ bloğu yer tutucu');
    ok(rep.ruleBased.label === 'kural tabanlı — yapay zekâ değildir', 'etiket');
    ok(JSON.stringify(rep).length < 400000, `rapor boyutu ${JSON.stringify(rep).length}`);
    // JSON'a dönüşebilir (NaN yok)
    ok(!/NaN|Infinity/.test(JSON.stringify(rep)), 'JSON içinde NaN');
  });

  await test('pose: kural tabanlı bulgular ölçülen sayıyı ve eşiği yazar, yumuşak dil kullanır, sağlık iddiası içermez', async () => {
    const fps = 30;
    const sets = [
      S.kicksClip({ fps }).frames,
      S.kicksClip({ fps, supportK: 0.05, lean: -0.3 }).frames,
      S.turnClip({ fps }).frames,
      S.sprintClip({ fps }).frames,
      S.crouchClip({ fps }).frames,
      S.oneLegClip({ fps }).frames,
      S.runningClip({ fps }).frames,
    ];
    let total = 0;
    const kinds = new Set();
    for (const fr of sets) {
      const rep = run(fr, fps).report;
      for (const f of rep.ruleBased.findings) {
        total++;
        kinds.add(f.id.replace(/\d+/g, '#'));
        ok(f.source === 'kural tabanlı — yapay zekâ değildir', 'kaynak etiketi');
        ok(/\d/.test(f.measured), `ölçülen sayı yok: ${f.id}`);
        ok(/\d/.test(f.text), `metinde sayı yok: ${f.id}`);
        if (f.level === 'dikkat') ok(f.threshold && /\d/.test(f.threshold), `eşik yok: ${f.id}`);
        ok(/Genel yönlendirme; kişiden kişiye değişir|Top izlenmediği|yalnızca bacak hareketinden|gösterge/.test(f.text), `yumuşak dil yok: ${f.id}`);
        ok(!forbidden.test(f.title + ' ' + f.text), `yasak ifade: ${f.id}: ${f.text}`);
        for (const g of f.guidance) ok(g.text.length > 30 && /^\/teknikler\/[a-z0-9-]+\/#vucut-pozisyonu$/.test(g.href), 'rehber alıntısı');
      }
      for (const t of RP.reportTexts(rep)) ok(!forbidden.test(t), `yasak ifade (rapor): ${t}`);
      ok(rep.ai.status === 'devre dışı', 'ai');
    }
    ok(total >= 12, `bulgu sayısı ${total}`);
    ok([...kinds].some((k) => /destek/.test(k)) && [...kinds].some((k) => /govde/.test(k)), `bulgu türleri: ${[...kinds]}`);
    // destek dizi düz + geriye eğik gövde senaryosu 'dikkat' ve eşik yazmalı
    const bad = run(S.kicksClip({ fps, supportK: 0.05, lean: -0.3 }).frames, fps).report.ruleBased.findings;
    ok(bad.some((f) => f.level === 'dikkat' && /destek/.test(f.id) && /165/.test(f.threshold)), 'düz destek dizi bulgusu');
    ok(bad.some((f) => f.level === 'dikkat' && /govde/.test(f.id) && /-10/.test(f.threshold)), 'geriye eğik gövde bulgusu');
    // iyi senaryoda 'dikkat' yok
    const fine = run(S.kicksClip({ fps, supportK: 0.45, lean: 0.12 }).frames, fps).report.ruleBased.findings;
    ok(!fine.some((f) => f.level === 'dikkat'), 'uyarı olmamalı');
  });

  await test('pose: rapordaki teknik bağlantıları ve rehber alıntıları gerçek veriden gelir', async () => {
    const rep = run(S.kicksClip({ fps: 30 }).frames, 30).report;
    const ids = new Set(data.TECHNIQUES.map((t) => t.id));
    const links = rep.ruleBased.findings.flatMap((f) => [...f.refs.map((r) => r.href), ...f.guidance.map((g) => g.href)]);
    ok(links.length > 0, 'bağlantı yok');
    for (const href of links) {
      const m = /^\/teknikler\/([a-z0-9-]+)\/(#vucut-pozisyonu)?$/.exec(href);
      ok(m && ids.has(m[1]), `bilinmeyen teknik bağlantısı ${href}`);
    }
    const bp = await load('data/body-position.js');
    for (const f of rep.ruleBased.findings) for (const g of f.guidance) ok(g.text === bp.BODY_POSITION[g.technique][g.field], 'rehber metni data/body-position.ts ile aynı olmalı');
    for (const id of Object.keys(RP.TECH_TITLES)) ok(ids.has(id), `TECH_TITLES: ${id}`);
  });

  await test('pose: güvenilirlik uyarıları — küçük oyuncu, düşük kapsama, düşük fps, kısa aralık', async () => {
    const fps = 10;
    const small = run(S.simulate(() => ({ v: 4, stride: 1.2 }), { fps, duration: 4, T: 28 }), fps);
    ok(small.report.reliability.stats.playerHeightPct < TH.THRESH.reliability.playerHeightWarnPct, `oyuncu yüksekliği %${small.report.reliability.stats.playerHeightPct}`);
    ok(small.report.reliability.warnings.some((w) => /kadrajın yalnızca/.test(w)) && small.report.reliability.level !== 'yüksek', 'küçük oyuncu uyarısı');
    ok(small.report.reliability.warnings.some((w) => /10 kare\/sn/.test(w)), 'düşük fps uyarısı');
    const big = run(S.simulate(() => ({ v: 4, stride: 1.2 }), { fps: 30, duration: 4 }), 30);
    ok(big.report.reliability.level === 'yüksek' && big.report.reliability.stats.playerHeightPct > 40, `büyük oyuncu güvenilirliği ${big.report.reliability.level}/${big.report.reliability.score}`);
    // düşük kapsama
    const frames = S.simulate(() => ({ v: 2, stride: 0.9, amp: 0.35, flex: 0.5 }), { fps: 15, duration: 6, x0px: 40 });
    const cut = frames.map((f, i) => ({ ...f, poses: i % 6 < 2 ? f.poses : [] }));
    const lc = run(cut, 15, { seed: seedOf(frames) });
    ok(lc.report.reliability.stats.coveragePct < 70 && lc.report.reliability.warnings.some((w) => /izlenebildi/.test(w)), `kapsama uyarısı (${lc.report.reliability.stats.coveragePct}%)`);
    // kısa aralık
    const tiny = run(S.simulate(() => ({ v: 4, stride: 1.2 }), { fps: 30, duration: 0.8 }), 30);
    ok(tiny.report.reliability.warnings.some((w) => /çok kısa/.test(w)), 'kısa aralık uyarısı');
    // hiç oyuncu yok
    const empty = run(frames.map((f) => ({ ...f, poses: [] })).map((f, i) => (i === 0 ? frames[0] : f)), 15);
    ok(empty.report.reliability.level === 'düşük', 'boş klipte düşük güvenilirlik');
  });

  await test('pose: ağ erişimi yok — lib/pose kaynağı fetch/XHR/URL içermez (engine.ts hariç model yolu göreli)', async () => {
    const dir = path.join(root, 'lib/pose');
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.ts'))) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      ok(!/https?:\/\//.test(src), `${f}: mutlak URL`);
      ok(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|anthropic|openai|api\.key/i.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), `${f}: ağ çağrısı izi`);
    }
  });

  // ── Depo (store): videoAnalyses ──────────────────────────
  const golden = JSON.parse(fs.readFileSync(path.join(root, 'scripts/logic-tests/_helpers/store-golden.json'), 'utf8'));

  await test('store: eski (v1/v2) yedekler videoAnalyses eklenmeden ÖNCEKİYLE AYNI yüklenir (altın örnekler)', async () => {
    for (const [name, raw] of Object.entries(golden.cases)) {
      const now = JSON.parse(JSON.stringify(store.sanitize(raw)));
      ok(JSON.stringify(now.videoAnalyses) === '{}', `${name}: videoAnalyses varsayılanı {} olmalı`);
      delete now.videoAnalyses;
      delete now.videoMoments; // video kütüphanesi (sonradan eklenen isteğe bağlı alan)
      ok(JSON.stringify(now) === JSON.stringify(golden.golden[name]), `${name}: yükleme sonucu eskisinden farklı`);
    }
    ok(store.STORAGE_KEY === 'libero:v1' && store.SCHEMA_VERSION === 2, 'anahtar ve şema sürümü değişmedi');
    ok(JSON.stringify(store.makeDefault().videoAnalyses) === '{}', 'varsayılan durum');
  });

  const sample = (i, at) => ({
    v: 1,
    name: `video${i}.mp4`,
    at,
    startSec: 0,
    endSec: 10,
    fps: 10,
    quality: 'lite',
    frames: 100,
    coveragePct: 96,
    reliability: 'yüksek',
    reliabilityScore: 88,
    viewKind: 'yan',
    playerHeightPct: 45.5,
    hipSpeedMax: 8.2,
    cadence: 160,
    eventCounts: { vurus: 2, 'yon-degistirme': 1, hizlanma: 0, durus: 1, comelme: 0 },
    events: [{ type: 'vurus', t: 1.5, conf: 0.8 }],
    warnings: ['uyarı'],
  });

  await test('store: videoAnalyses temizlenir, 20 kayıtla sınırlanır (en yeniler), geçersizler atılır', async () => {
    const raw = { videoAnalyses: {} };
    for (let i = 0; i < 25; i++) raw.videoAnalyses[`k${i}|1|1`] = sample(i, `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`);
    raw.videoAnalyses.bad1 = { v: 1, name: 5 };
    raw.videoAnalyses.bad2 = 'x';
    raw.videoAnalyses.bad3 = { ...sample(99, '2026-02-01T00:00:00.000Z'), fps: 'x' };
    const s = store.sanitize(raw).videoAnalyses;
    const keys = Object.keys(s);
    ok(keys.length === 20, `20 kayıt beklenir, ${keys.length}`);
    ok(!keys.includes('k0|1|1') && keys.includes('k24|1|1') && !keys.includes('bad1') && !keys.includes('bad3'), 'en yeniler korunmalı, bozuklar atılmalı');
    // alan temizliği
    const dirty = store.sanitize({ videoAnalyses: { a: { ...sample(1, 'x'), quality: 'zzz', reliability: '??', viewKind: 'q', coveragePct: 500, events: [{ type: 'x', t: 1, conf: 1 }, { type: 'vurus', t: 'a', conf: 1 }, { type: 'durus', t: 2, conf: 9 }], warnings: [1, 'tamam', ...Array(10).fill('u')], extra: 'sızmamalı' } } }).videoAnalyses.a;
    ok(dirty.quality === 'lite' && dirty.reliability === 'düşük' && dirty.viewKind === 'belirsiz' && dirty.coveragePct === 100, 'enum/aralık');
    ok(dirty.events.length === 1 && dirty.events[0].type === 'durus' && dirty.events[0].conf === 1, 'olaylar');
    ok(dirty.warnings.length === 6 && !('extra' in dirty), 'uyarı sayısı ve fazla alan');
    ok(JSON.stringify(store.sanitize({ videoAnalyses: [1, 2] }).videoAnalyses) === '{}' && JSON.stringify(store.sanitize({ videoAnalyses: 'x' }).videoAnalyses) === '{}', 'dizi/metin');
  });

  await test('store: özet kaydet/sil, dışa aktar → içe aktar (videoAnalyses dahil) kayıpsız', async () => {
    store.importData(JSON.stringify({ app: 'libero', data: golden.cases.v2 }));
    const before = JSON.stringify(store.getState());
    const rep = run(S.kicksClip({ fps: 30 }).frames, 30).report;
    const sum = RP.summarizeReport(rep, 'deneme.mp4', '2026-03-01T00:00:00.000Z');
    ok(JSON.stringify(store.sanitizeVideoAnalyses({ k: sum }).k) === JSON.stringify(sum), 'özet sanitize ile değişmemeli');
    ok(JSON.stringify(sum).length < 4000, `özet boyutu ${JSON.stringify(sum).length}`);
    ok(sum.events.length === rep.measured.events.length && sum.eventCounts.vurus === 3 && !('series' in sum), 'özet içeriği');
    store.saveVideoAnalysis('deneme.mp4|10|20', sum);
    const exported = store.exportData();
    ok(JSON.parse(exported).data.videoAnalyses['deneme.mp4|10|20'].name === 'deneme.mp4', 'dışa aktarmada var');
    store.deleteVideoAnalysis('deneme.mp4|10|20');
    ok(Object.keys(store.getState().videoAnalyses).length === 0, 'silme');
    ok(store.importData(exported).ok, 'içe aktarma');
    ok(store.getState().videoAnalyses['deneme.mp4|10|20'].eventCounts.vurus === 3, 'içe aktarmada geri geldi');
    // diğer veriler değişmedi
    const after = JSON.parse(JSON.stringify(store.getState()));
    delete after.videoAnalyses;
    const b = JSON.parse(before);
    delete b.videoAnalyses;
    ok(JSON.stringify(after) === JSON.stringify(b), 'diğer veriler aynı kalmalı');
    ok(Object.keys(TY.EVENT_TITLE).join() === 'vurus,yon-degistirme,hizlanma,durus,comelme', 'olay türleri depo listesiyle uyumlu');
    // depo: 21. kayıt en eskiyi atar
    for (let i = 0; i < 22; i++) store.saveVideoAnalysis(`z${i}`, sample(i, `2026-04-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`));
    ok(Object.keys(store.getState().videoAnalyses).length === 20, 'saveVideoAnalysis 20 ile sınırlar');
    store.resetAll();
  });
};
