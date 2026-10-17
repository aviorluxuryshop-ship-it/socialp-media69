// Otomatik video analizi — tarayıcı testi (GERÇEK MediaPipe, başsız Chromium, CPU).
//
// Girdi: scripts/fixtures/pose.jpg (kumsalda yoga duruşunda tek kişi; futbol değil) + ffmpeg ile üretilen
// kısa videolar (yavaş kaydırma/yakınlaştırma). Bu test motorun gerçek bir görüntüde iskelet bulup izlediğini,
// çıktının makul aralıklarda kaldığını, iptalin ve arayüzün çalıştığını, hiçbir dış ağ isteği yapılmadığını sınar.
// Vuruş/yön değiştirme gibi olayların GERÇEK futbol görüntüsündeki doğruluğunu SINAMAZ (bkz. README: yalnızca sentetik).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const FIXTURE = fileURLToPath(new URL('../fixtures/pose.jpg', import.meta.url));
const SHOTS = process.env.SHOTS_DIR ?? '/tmp/video-shots';

export default async function videoAnalysis(h) {
  const { BASE, newPage, go, ok, test, tmp } = h;
  const ff = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args]);
  const vid = (name) => path.join(tmp, name);
  let ffmpegError = '';
  fs.mkdirSync(SHOTS, { recursive: true });
  try {
    ok(fs.existsSync(FIXTURE), 'scripts/fixtures/pose.jpg yok');
    // 10 sn, yatay (640×360): yavaş kaydırma + yakınlaştırma
    ff(['-loop', '1', '-framerate', '25', '-i', FIXTURE, '-t', '10', '-vf', "scale=1280:-2,zoompan=z='1.0+0.0004*on':x='iw/2-(iw/zoom/2)+on*0.35':y='ih/2-(ih/zoom/2)':d=1:s=640x360:fps=25,format=yuv420p", '-c:v', 'libvpx', '-b:v', '500k', '-g', '25', vid('yatay.webm')]);
    // 3 sn, dikey (360×640)
    ff(['-loop', '1', '-framerate', '25', '-i', FIXTURE, '-t', '3', '-vf', "crop=ih*0.6:ih:iw*0.2:0,scale=360:640,zoompan=z='1.0+0.0008*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=360x640:fps=25,format=yuv420p", '-c:v', 'libvpx', '-b:v', '500k', '-g', '25', vid('dikey.webm')]);
    // 4 sn, yan yana iki kişi (ikincisi ayna görüntüsü → eklem tarafları yer değiştirir)
    ff(['-loop', '1', '-framerate', '25', '-i', FIXTURE, '-t', '4', '-filter_complex', "[0:v]scale=480:320,split[a][b];[b]hflip[c];[a][c]hstack,zoompan=z='1.0+0.0006*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=960x320:fps=25,format=yuv420p", '-c:v', 'libvpx', '-b:v', '700k', '-g', '25', vid('iki-kisi.webm')]);
  } catch (e) {
    ffmpegError = String(e.message ?? e);
  }

  /** Sayfayı açar, videoyu yükler; dış istekleri ve konsol hatalarını toplar. */
  async function open(file, opts = {}) {
    const { ctx, page } = await newPage(opts);
    const external = [];
    const requests = [];
    const errors = [];
    page.on('request', (r) => {
      const u = r.url();
      requests.push({ url: u, method: r.method() });
      if (!u.startsWith(BASE) && !u.startsWith('blob:') && !u.startsWith('data:')) external.push(u);
    });
    page.on('console', (m) => {
      if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    await go(page, '/analiz/video/');
    await page.setInputFiles('input[type=file]', file);
    await page.waitForSelector('[data-testid=vauto]', { timeout: 15000 });
    return { ctx, page, external, requests, errors };
  }

  const phaseOf = (page) => page.getAttribute('[data-testid=vauto-out]', 'data-phase');
  async function waitPhase(page, wanted, timeout = 150000) {
    const t0 = Date.now();
    for (;;) {
      const ph = await phaseOf(page);
      if (wanted.includes(ph)) return ph;
      if (Date.now() - t0 > timeout) throw new Error(`zaman aşımı: aşama "${ph}" (beklenen ${wanted.join('/')})`);
      await page.waitForTimeout(250);
    }
  }
  async function configure(page, { start, end, fps, quality, delegate }) {
    if (start !== undefined) await page.fill('#va-start', String(start));
    if (end !== undefined) await page.fill('#va-end', String(end));
    if (fps) await page.locator('[aria-labelledby=va-fps-l] button', { hasText: new RegExp(`^${fps}$`) }).click();
    if (quality) await page.locator('[aria-labelledby=va-q-l] button', { hasText: quality === 'full' ? 'Daha doğru' : 'Hızlı' }).click();
    if (delegate) await page.locator('[aria-labelledby=va-d-l] button', { hasText: delegate === 'GPU' ? 'Ekran kartı' : 'İşlemci' }).click();
  }
  async function readReport(page) {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-testid=vauto-download]')]);
    return JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  }
  const okAngles = (rep) => {
    for (const [k, r] of Object.entries(rep.measured.summary.angles)) {
      for (const v of [r.min, r.max, r.mean]) ok(v === null || (v >= 0 && v <= 180), `${k} açısı 0–180 dışında: ${v}`);
    }
    for (const key of ['kneeL', 'kneeR']) for (const v of rep.measured.series[key]) ok(v === null || (v >= 0 && v <= 180), `${key} serisi 0–180 dışında: ${v}`);
  };
  const lone = (rep) => {
    const A = rep.measured.summary.angles;
    return { l: A.kneeL, r: A.kneeR };
  };

  let mainReport = null;

  await test('Video analizi (otomatik): ffmpeg ile test videoları üretildi', async () => {
    ok(!ffmpegError, `ffmpeg/fixture: ${ffmpegError}`);
    for (const f of ['yatay.webm', 'dikey.webm', 'iki-kisi.webm']) ok(fs.existsSync(vid(f)) && fs.statSync(vid(f)).size > 20000, `${f} üretilemedi`);
  });

  await test('Video analizi (otomatik): panel görünür, gizlilik satırı ve MediaPipe atfı var; manuel araçlar yerinde', async () => {
    const { ctx, page } = await open(vid('yatay.webm'));
    ok((await page.textContent('[data-testid=vauto-privacy]')).includes('Video cihazınızdan çıkmaz; analiz tarayıcıda yapılır.'), 'gizlilik satırı yok');
    const credit = await page.locator('.vauto__credit').textContent();
    ok(/MediaPipe/.test(credit) && /Apache-2\.0/.test(credit), `atıf: ${credit}`);
    // manuel araçlar bozulmadı
    ok((await page.getByRole('button', { name: 'Kalem' }).count()) === 1 && (await page.getByRole('button', { name: /İşaret ekle/ }).count()) === 1, 'manuel araçlar kayboldu');
    ok((await page.locator('video:visible').count()) === 1, 'ana oynatıcı yok');
    // üçüncü taraf bildirimi sunuluyor
    const r = await page.request.get(BASE + '/third-party-notices.txt');
    ok(r.status() === 200 && /Apache License/.test(await r.text()) && /MediaPipe/.test(await r.text()), 'third-party-notices.txt');
    // tahmini süre gösteriliyor
    ok(/kare · tahmini süre/.test(await page.textContent('[data-testid=vauto-estimate]')), 'tahmini süre yok');
    await ctx.close();
  });

  await test('Video analizi (otomatik): 10 sn × 10 kare/sn tam analiz tamamlanır (<90 sn), ≥%70 kare izlenir, açılar 0–180, dış ağ isteği yok, konsol hatası yok', async () => {
    const { ctx, page, external, requests, errors } = await open(vid('yatay.webm'));
    await configure(page, { start: 0, end: 10, fps: 10 });
    const t0 = Date.now();
    await page.click('[data-testid=vauto-start]');
    await waitPhase(page, ['done', 'error'], 120000);
    const sec = (Date.now() - t0) / 1000;
    ok((await phaseOf(page)) === 'done', `analiz tamamlanamadı: ${await page.textContent('[data-testid=vauto-out]')}`);
    ok(sec < 90, `10 sn × 10 kare/sn analiz ${sec.toFixed(1)} sn sürdü (sınır 90)`);
    console.log(`      10 sn × 10 kare/sn (lite, CPU): ${sec.toFixed(1)} sn`);
    mainReport = await readReport(page);
    const rep = mainReport;
    ok(rep.meta.frames === 101 && rep.meta.fps === 10 && rep.meta.engine.model === 'lite', `meta: ${JSON.stringify(rep.meta)}`);
    ok(rep.reliability.stats.coveragePct >= 70, `kapsama %${rep.reliability.stats.coveragePct}`);
    const tracked = rep.measured.series.state.filter((s) => s !== 0).length;
    ok(tracked / rep.meta.frames >= 0.7, `izlenen kare oranı ${tracked}/${rep.meta.frames}`);
    okAngles(rep);
    // gerçek model çıktısı mantıklı mı: duruşta bir bacak düz (≥150°), diğeri bükülü (≤130°)
    const { l, r } = lone(rep);
    ok((l.mean >= 150 && r.mean <= 130) || (r.mean >= 150 && l.mean <= 130), `diz açıları: sol ${l.mean}, sağ ${r.mean}`);
    ok(rep.reliability.stats.playerHeightPct > 30 && rep.measured.summary.hipSpeed.max < 2, `oyuncu boyu %${rep.reliability.stats.playerHeightPct}, kalça hızı ${rep.measured.summary.hipSpeed.max}`);
    ok(rep.ai.status === 'devre dışı' && rep.ruleBased.label === 'kural tabanlı — yapay zekâ değildir', 'ai/etiket');
    ok(!/https?:\/\//.test(JSON.stringify(rep)), 'raporda URL var');
    // ağ: model ve wasm siteden, başka hiçbir yere istek yok
    ok(external.length === 0, `dış istek: ${external.slice(0, 3).join(', ')}`);
    ok(requests.some((r) => /\/models\/pose_landmarker_lite\.task$/.test(r.url)) && requests.some((r) => /\/mediapipe\/wasm\/.*\.wasm$/.test(r.url)), 'model/wasm siteden yüklenmedi');
    ok(!requests.some((r) => ['POST', 'PUT'].includes(r.method) && !r.url.startsWith('blob:')), 'giden POST/PUT isteği var');
    ok(errors.length === 0, `konsol hataları: ${errors.slice(0, 3).join(' | ')}`);
    // bellek: analiz bittiğinde gizli analiz <video> öğesi sökülmüş olmalı
    ok((await page.locator('video').count()) === 1, 'analiz videosu DOM’da kaldı');
    // sonuç görünümü
    ok(/yüksek|orta|düşük/.test(await page.textContent('[data-testid=vauto-reliability]')), 'güvenilirlik rozeti');
    ok((await page.locator('[data-testid=vauto-ai]').textContent()).includes('devre dışı'), 'yapay zekâ devre dışı notu');
    ok((await page.locator('[data-testid=vauto-rule-label]').textContent()).includes('yapay zekâ değildir'), 'kural etiketi');
    await page.screenshot({ path: path.join(SHOTS, 'e2e-sonuc-1280.png'), fullPage: false }).catch(() => {});
    // özet depoya yazıldı (küçük) ve yedeğe girer
    await page.waitForTimeout(400);
    const raw = await page.evaluate(() => localStorage.getItem('libero:v1'));
    const st = JSON.parse(raw);
    const keys = Object.keys(st.videoAnalyses ?? {});
    ok(keys.length === 1 && st.videoAnalyses[keys[0]].v === 1 && JSON.stringify(st.videoAnalyses[keys[0]]).length < 4000, `depo özeti: ${keys.length}`);
    ok(st.v === 2, 'şema sürümü değişmemeli');
    await ctx.close();
  });

  await test('Video analizi (otomatik): taşma yok (390 / 820 / 1280 genişlik), klavye odağı görünür', async () => {
    const { ctx, page } = await open(vid('yatay.webm'));
    await configure(page, { start: 0, end: 3, fps: 10 });
    await page.click('[data-testid=vauto-start]');
    await waitPhase(page, ['done', 'error'], 120000);
    ok((await phaseOf(page)) === 'done', 'analiz bitmedi');
    for (const w of [390, 820, 1280]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(300);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      ok(over <= 1, `${w}px genişlikte yatay taşma ${over}px`);
      await page.locator('[data-testid=vauto]').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(SHOTS, `e2e-panel-${w}.png`) }).catch(() => {});
    }
    // klavye: Tab ile bir düğmeye gelinince odak halkası (outline ya da kutu gölgesi) görünür
    await page.locator('[data-testid=vauto-download]').focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => {
      const el = document.activeElement;
      const cs = el ? getComputedStyle(el) : null;
      return { tag: el?.tagName, outline: cs?.outlineStyle, w: cs?.outlineWidth, shadow: cs?.boxShadow };
    });
    ok(focus.tag === 'BUTTON' && ((focus.outline !== 'none' && focus.w !== '0px') || (focus.shadow && focus.shadow !== 'none')), `odak görünmüyor: ${JSON.stringify(focus)}`);
    await ctx.close();
  });

  await test('Video analizi (otomatik): iptal çalışır, arayüz yanıt verir, sonra yeniden başlatılabilir', async () => {
    const { ctx, page, errors } = await open(vid('yatay.webm'));
    // sayfa tarafında olay döngüsü gecikmesi ölçülür (yanıt verebilirlik)
    await page.evaluate(() => {
      window.__lag = { max: 0 };
      let last = performance.now();
      setInterval(() => {
        const now = performance.now();
        window.__lag.max = Math.max(window.__lag.max, now - last - 50);
        last = now;
      }, 50);
    });
    await configure(page, { start: 0, end: 10, fps: 15 });
    await page.click('[data-testid=vauto-start]');
    await page.waitForSelector('[data-testid=vauto-progress]', { timeout: 60000 });
    for (let i = 0; i < 60; i++) {
      const t = await page.textContent('[data-testid=vauto-progress]');
      const m = /Kare (\d+) \//.exec(t);
      if (m && Number(m[1]) >= 4) break;
      await page.waitForTimeout(200);
    }
    const tc = Date.now();
    await page.click('[data-testid=vauto-cancel]');
    await waitPhase(page, ['cancelled', 'done', 'error'], 15000);
    const cancelMs = Date.now() - tc;
    ok((await phaseOf(page)) === 'cancelled', `iptal sonrası aşama: ${await phaseOf(page)}`);
    ok(cancelMs < 5000, `iptal ${cancelMs} ms sürdü`);
    ok((await page.locator('[data-testid=vauto-cancelled]').count()) === 1, 'iptal bildirimi yok');
    const lag = await page.evaluate(() => window.__lag.max);
    console.log(`      iptal ${cancelMs} ms; analiz sırasında en uzun olay döngüsü gecikmesi ${Math.round(lag)} ms`);
    ok(lag < 2500, `arayüz ${Math.round(lag)} ms donmuş`);
    // iptal sonrası denetimler etkin, yeniden başlatılabilir
    ok(await page.locator('[data-testid=vauto-start]').isEnabled(), 'başlat düğmesi etkin değil');
    await configure(page, { end: 2, fps: 5 });
    await page.click('[data-testid=vauto-start]');
    await waitPhase(page, ['done', 'error'], 90000);
    ok((await phaseOf(page)) === 'done', 'iptalden sonra yeniden başlatma başarısız');
    ok((await page.locator('video').count()) === 1, 'iptalden sonra analiz videosu DOM’da kaldı');
    ok(errors.length === 0, `konsol hataları: ${errors.slice(0, 2).join(' | ')}`);
    await ctx.close();
  });

  await test('Video analizi (otomatik): dikey (portre) video işlenir', async () => {
    const { ctx, page } = await open(vid('dikey.webm'));
    await configure(page, { start: 0, end: 2, fps: 10 });
    await page.click('[data-testid=vauto-start]');
    await waitPhase(page, ['done', 'error'], 90000);
    ok((await phaseOf(page)) === 'done', `portre analiz: ${await page.textContent('[data-testid=vauto-out]')}`);
    const rep = await readReport(page);
    ok(rep.meta.video.height > rep.meta.video.width, `boyut ${rep.meta.video.width}×${rep.meta.video.height}`);
    ok(rep.reliability.stats.coveragePct >= 70, `kapsama %${rep.reliability.stats.coveragePct}`);
    okAngles(rep);
    await ctx.close();
  });

  await test('Video analizi (otomatik): süresi Infinity olan MediaRecorder WebM dosyası işlenir', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/');
    const b64 = await page.evaluate(async (dataUrl) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = 640;
      c.height = 360;
      const g = c.getContext('2d');
      const stream = c.captureStream(25);
      const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const stopped = new Promise((r) => (rec.onstop = r));
      rec.start(200);
      const t0 = performance.now();
      await new Promise((res) => {
        const draw = () => {
          const t = (performance.now() - t0) / 1000;
          g.fillStyle = '#000';
          g.fillRect(0, 0, 640, 360);
          const z = 1 + 0.03 * t;
          const w = 640 * z * (img.width / img.height) / (640 / 360);
          g.drawImage(img, -((w - 640) / 2) - t * 4, -((360 * z - 360) / 2), w, 360 * z);
          if (t < 3) requestAnimationFrame(draw);
          else res();
        };
        draw();
      });
      rec.stop();
      await stopped;
      const blob = new Blob(chunks, { type: 'video/webm' });
      const v = document.createElement('video');
      v.src = URL.createObjectURL(blob);
      await new Promise((r) => (v.onloadedmetadata = r));
      const dur = v.duration;
      const buf = new Uint8Array(await blob.arrayBuffer());
      let s = '';
      for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return { b64: btoa(s), dur };
    }, 'data:image/jpeg;base64,' + fs.readFileSync(FIXTURE).toString('base64'));
    await ctx.close();
    console.log(`      MediaRecorder videosunun süresi (üst veri): ${b64.dur}`);
    ok(b64.b64.length > 20000, 'MediaRecorder videosu üretilemedi');
    const f = await open({ name: 'kayit.webm', mimeType: 'video/webm', buffer: Buffer.from(b64.b64, 'base64') });
    // süre Infinity ise arayüz bunu söyler; varsayılan bitiş (10 sn) gerçek süreye kırpılır
    await configure(f.page, { start: 0, fps: 10 });
    await f.page.click('[data-testid=vauto-start]');
    await waitPhase(f.page, ['done', 'error'], 90000);
    ok((await phaseOf(f.page)) === 'done', `Infinity süreli video: ${await f.page.textContent('[data-testid=vauto-out]')}`);
    const rep = await readReport(f.page);
    ok(rep.meta.frames >= 20 && rep.meta.frames <= 45, `kare sayısı ${rep.meta.frames} (≈31 beklenir)`);
    ok(rep.reliability.stats.coveragePct >= 70, `kapsama %${rep.reliability.stats.coveragePct}`);
    await f.ctx.close();
  });

  await test('Video analizi (otomatik): birden çok kişi — kullanıcı seçer; seçilen kişi izlenir (ayna görüntüsü tarafları yer değiştirir)', async () => {
    const results = {};
    for (const side of ['sol', 'sağ']) {
      const { ctx, page, errors } = await open(vid('iki-kisi.webm'));
      await configure(page, { start: 0, end: 3, fps: 10 });
      await page.click('[data-testid=vauto-start]');
      await waitPhase(page, ['pick', 'done', 'error'], 90000);
      ok((await phaseOf(page)) === 'pick', `iki kişide seçim ekranı beklenir, aşama ${await phaseOf(page)}`);
      const cands = page.locator('[data-testid=vauto-cand]');
      ok((await cands.count()) >= 2, `aday sayısı ${await cands.count()}`);
      if (side === 'sol') await page.screenshot({ path: path.join(SHOTS, 'e2e-oyuncu-secimi.png') }).catch(() => {});
      // kutunun yatay konumuna göre soldaki / sağdaki kişiyi seç
      const lefts = await cands.evaluateAll((els) => els.map((e) => parseFloat(e.style.left)));
      const idx = side === 'sol' ? lefts.indexOf(Math.min(...lefts)) : lefts.indexOf(Math.max(...lefts));
      await cands.nth(idx).click();
      await waitPhase(page, ['done', 'error'], 90000);
      ok((await phaseOf(page)) === 'done', `${side} kişi analizi: ${await page.textContent('[data-testid=vauto-out]')}`);
      const rep = await readReport(page);
      ok(rep.reliability.stats.coveragePct >= 70, `${side}: kapsama %${rep.reliability.stats.coveragePct}`);
      okAngles(rep);
      results[side] = lone(rep);
      ok(errors.length === 0, `konsol hataları: ${errors.slice(0, 2).join(' | ')}`);
      await ctx.close();
    }
    const bentLeft = results.sol.r.mean < results.sol.l.mean ? 'sağ' : 'sol';
    const bentRight = results.sağ.r.mean < results.sağ.l.mean ? 'sağ' : 'sol';
    console.log(`      soldaki kişi: bükülü diz ${bentLeft}; sağdaki (ayna) kişi: bükülü diz ${bentRight}`);
    ok(bentLeft !== bentRight, `seçim izlenen kişiyi değiştirmedi: ${JSON.stringify(results)}`);
  });

  await test('Video analizi (otomatik): "Daha doğru" model ve ekran kartı seçeneği çalışır (GPU yoksa işlemciye düşer)', async () => {
    const { ctx, page, errors } = await open(vid('yatay.webm'));
    await configure(page, { start: 0, end: 2, fps: 5, quality: 'full' });
    await page.click('[data-testid=vauto-start]');
    await waitPhase(page, ['done', 'error'], 120000);
    ok((await phaseOf(page)) === 'done', `full model: ${await page.textContent('[data-testid=vauto-out]')}`);
    const rep = await readReport(page);
    ok(rep.meta.engine.model === 'full' && rep.reliability.stats.coveragePct >= 70, `full: ${rep.meta.engine.model} %${rep.reliability.stats.coveragePct}`);
    // oyuncu düzeltme: kayıtlı karelerden aday çıkar, tıklayınca takip yeniden hesaplanır (video yeniden işlenmez)
    await page.click('[data-testid=vauto-fix-open]');
    await page.waitForSelector('.vauto__fix .vauto__cand', { timeout: 30000 });
    await page.locator('.vauto__fix .vauto__cand').first().click();
    await page.waitForSelector('[data-testid=vauto-results]', { timeout: 10000 });
    ok((await page.locator('.vauto__fix').count()) === 0, 'düzeltme paneli kapanmalı');
    ok((await readReport(page)).reliability.stats.coveragePct >= 70, 'düzeltmeden sonra kapsama');
    await configure(page, { quality: 'lite', delegate: 'GPU' });
    await page.click('[data-testid=vauto-start]');
    await waitPhase(page, ['done', 'error'], 120000);
    ok((await phaseOf(page)) === 'done', `GPU seçeneği: ${await page.textContent('[data-testid=vauto-out]')}`);
    const rep2 = await readReport(page);
    console.log(`      GPU seçildi → kullanılan: ${rep2.meta.engine.delegate}`);
    ok(['CPU', 'GPU'].includes(rep2.meta.engine.delegate), 'delegate');
    ok(errors.length === 0, `konsol hataları: ${errors.slice(0, 2).join(' | ')}`);
    await ctx.close();
  });

  await test('Video analizi (otomatik): oyuncu bulunamazsa anlaşılır hata gösterilir (boş görüntü)', async () => {
    ok(!ffmpegError, 'ffmpeg yok');
    ff(['-f', 'lavfi', '-i', 'color=c=0x14301f:size=480x270:rate=25', '-t', '2', '-c:v', 'libvpx', '-b:v', '200k', vid('bos.webm')]);
    const { ctx, page } = await open(vid('bos.webm'));
    await configure(page, { start: 0, end: 1, fps: 5 });
    await page.click('[data-testid=vauto-start]');
    await waitPhase(page, ['error', 'done', 'pick'], 90000);
    ok((await phaseOf(page)) === 'error', `aşama ${await phaseOf(page)}`);
    ok(/oyuncu bulunamadı/i.test(await page.textContent('[data-testid=vauto-error]')), 'hata metni');
    ok(await page.locator('[data-testid=vauto-start]').isEnabled(), 'hatadan sonra yeniden denenebilmeli');
    await ctx.close();
  });
}
