// Tasarım sistemi + ana sayfa + hareket sistemi + 3B top (tarayıcı testleri).
// WebGL yolunu gerçekten sınamak için kendi tarayıcısını SwiftShader bayraklarıyla açar.
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const CHROME = [process.env.CHROME_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'].filter(Boolean).find((p) => fs.existsSync(p));
const GL = ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

/** Yerleşim kayması ve uzun görev gözlemcileri: sayfa betiklerinden önce kurulur. */
const OBSERVE = () => {
  window.__cls = 0;
  window.__lt = [];
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration));
    }).observe({ type: 'longtask', buffered: true });
  } catch {}
};

export default async (h) => {
  const { BASE, ok, test } = h;
  const errs = [];
  const gl = await chromium.launch({ executablePath: CHROME, args: GL });
  const mk = async (opts = {}, init, forceGL = false) => {
    const ctx = await gl.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
    await ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (r) => r.abort());
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error' && !/net::|ERR_FAILED/.test(m.text())) errs.push(`console: ${m.text().slice(0, 200)}`);
    });
    // SwiftShader yazılım WebGL'dir; uygulama orada SVG topa düşer. Bu testler WebGL yolunu sınadığından zorlanır.
    if (forceGL) await ctx.addInitScript(() => { try { localStorage.setItem('libero:ball', 'webgl'); } catch {} });
    if (init) await ctx.addInitScript(init.fn, init.arg);
    return { ctx, page };
  };
  const goHome = async (page) => {
    const r = await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    ok(r && r.status() === 200, 'ana sayfa 200 dönmüyor');
  };
  const hiddenReveals = (page) =>
    page.evaluate(() =>
      [...document.querySelectorAll('[data-reveal]')]
        .filter((e) => Number(getComputedStyle(e).opacity) < 0.99)
        .map((e) => e.className.slice(0, 40)),
    );

  try {
    await test('Ana sayfa (WebGL): konsol hatası yok, 3B top tuvali çizilir, SVG yedeği yumuşakça kapanır', async () => {
      const { ctx, page } = await mk({}, { fn: OBSERVE }, true);
      errs.length = 0;
      await goHome(page);
      await page.waitForSelector('.hero-ball[data-state="ready"]', { timeout: 30000 });
      const info = await page.evaluate(() => {
        const r = document.querySelector('.hero-ball');
        const c = r.querySelector('canvas.hero-ball__canvas');
        const box = c ? c.getBoundingClientRect() : null;
        return {
          mode: r.dataset.mode,
          reason: r.dataset.reason,
          hasCanvas: !!c,
          w: box ? Math.round(box.width) : 0,
          h: box ? Math.round(box.height) : 0,
          svg: !!r.querySelector('svg.hero-ball__svg'),
          ready: performance.getEntriesByName('libero-ball-ready').length,
        };
      });
      ok(info.svg, 'SVG yedek top yok');
      ok(info.mode === 'webgl', `SwiftShader ile webgl modu beklenirdi: ${JSON.stringify(info)}`);
      ok(info.hasCanvas && info.w > 200 && Math.abs(info.w - info.h) <= 2, `tuval boyutu: ${info.w}x${info.h}`);
      ok(info.ready === 1, '3B top "hazır" işareti yok');
      await page.waitForTimeout(900);
      const op = await page.evaluate(() => [Number(getComputedStyle(document.querySelector('.hero-ball__canvas')).opacity), Number(getComputedStyle(document.querySelector('.hero-ball__svg')).opacity)]);
      ok(op[0] > 0.95 && op[1] < 0.05, `geçiş tamamlanmadı: tuval ${op[0]}, svg ${op[1]}`);
      ok(errs.length === 0, `hata: ${errs.slice(0, 2).join(' | ')}`);
      await ctx.close();
    });

    await test('3B top: sürükleyince döner, ekran dışında ve sekme gizliyken döngü durur, ayrılınca kaynaklar serbest kalır', async () => {
      const { ctx, page } = await mk({}, undefined, true);
      try {
      await goHome(page);
      await page.waitForSelector('.hero-ball[data-mode="webgl"][data-state="ready"]', { timeout: 30000 });
      // locator.screenshot() "öğe kararlı olsun" diye bekler; top CSS ile süzüldüğünden bunun yerine kırpılmış sayfa görüntüsü alınır
      const shot = async () => {
        const r = await page.locator('.hero-ball__canvas').boundingBox();
        return (await page.screenshot({ clip: { x: r.x, y: r.y, width: r.width, height: r.height } })).toString('base64');
      };
      const a = await shot();
      const box = await page.locator('.hero-ball__canvas').boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      ok((await page.locator('.hero-ball__stage[data-drag="true"]').count()) === 1, 'sürükleme başlamadı (data-drag)');
      await page.mouse.move(box.x + box.width / 2 + 160, box.y + box.height / 2 + 20, { steps: 8 });
      await page.mouse.up();
      ok((await page.locator('.hero-ball__stage[data-drag="true"]').count()) === 0, 'sürükleme bitmedi');
      await page.waitForTimeout(500);
      const b = await shot();
      ok(a !== b, 'sürükleme topu döndürmedi');
      // ekran dışı: aşağı kaydır, döngü durmalı (kare sayacı artmaz)
      await page.evaluate(() => {
        window.__frames = 0;
        const raf = window.requestAnimationFrame.bind(window);
        window.requestAnimationFrame = (cb) => raf((t) => { window.__frames++; cb(t); });
      });
      await page.evaluate(() => window.scrollTo({ top: 2600, behavior: 'instant' }));
      await page.waitForTimeout(1200);
      const f1 = await page.evaluate(() => window.__frames);
      await page.waitForTimeout(800);
      const f2 = await page.evaluate(() => window.__frames);
      ok(f2 - f1 < 8, `ekran dışındayken top döngüsü sürüyor (${f2 - f1} kare)`);
      // başka sayfaya geçince tuval kaldırılır
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.locator('a[href="/teknikler/"]:visible').first().click();
      await page.waitForURL('**/teknikler/');
      await page.waitForTimeout(500);
      ok((await page.locator('canvas.hero-ball__canvas').count()) === 0, 'sayfadan çıkınca tuval kaldırılmadı');
      } finally {
        await ctx.close();
      }
    });

    await test('Hareket azaltma: içerik hemen görünür, top tek sabit kare, sonsuz animasyon yok, sayaçlar son değerde', async () => {
      const { ctx, page } = await mk({ reducedMotion: 'reduce' });
      errs.length = 0;
      await goHome(page);
      await page.waitForSelector('.hero-ball[data-state="ready"]', { timeout: 30000 });
      ok((await page.locator('.hero-ball').getAttribute('data-motion')) === 'off', 'data-motion="off" olmalı');
      const hidden = await hiddenReveals(page);
      ok(hidden.length === 0, `gizli kalan öğeler: ${hidden.slice(0, 4)}`);
      const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations === Infinity).map((a) => a.animationName || a.constructor.name));
      ok(running.length === 0, `sonsuz animasyon sürüyor: ${running}`);
      const mode = await page.locator('.hero-ball').getAttribute('data-mode');
      if (mode === 'webgl') {
        const s1 = (await page.locator('.hero-ball__canvas').screenshot()).toString('base64');
        await page.waitForTimeout(1200);
        const s2 = (await page.locator('.hero-ball__canvas').screenshot()).toString('base64');
        ok(s1 === s2, 'sabit kare olmalı (top dönüyor)');
      }
      const nums = await page.locator('.hero__stat-n').evaluateAll((els) => els.map((e) => [e.dataset.count, e.textContent.replace(/\D/g, '')]));
      ok(nums.length === 5 && nums.every(([c, t]) => c === t), `sayaç son değerde değil: ${JSON.stringify(nums)}`);
      ok(errs.length === 0, `hata: ${errs.slice(0, 2).join(' | ')}`);
      await ctx.close();
    });

    await test('Gözlemci hiç ateşlenmese bile tüm içerik görünür olur (IntersectionObserver kapalı)', async () => {
      const { ctx, page } = await mk({}, {
        fn: () => {
          window.IntersectionObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
            takeRecords() { return []; }
          };
        },
      });
      await page.goto(BASE + '/', { waitUntil: 'load' });
      await page.waitForTimeout(9500); // yazılım WebGL ilk bağlamı ~3 sn kilitleyebilir; yedek zamanlayıcı sonra çalışır
      const hidden = await hiddenReveals(page);
      ok(hidden.length === 0, `gözlemci ölüyken ${hidden.length} öğe görünmez kaldı: ${hidden.slice(0, 4)}`);
      ok((await page.evaluate(() => document.querySelectorAll('[data-reveal]:not(.is-in)').length)) === 0, 'is-in eklenmemiş öğe var');
      await ctx.close();
    });

    await test('Hızlı kaydırma / sayfa sonuna atlama: yukarıda kalan hiçbir içerik görünmez kalmaz', async () => {
      const { ctx, page } = await mk();
      await goHome(page);
      await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
      const H = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.evaluate((y) => window.scrollTo(0, y), H);
      await page.waitForTimeout(1800);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      const hidden = await hiddenReveals(page);
      ok(hidden.length === 0, `hızlı kaydırmadan sonra ${hidden.length} öğe görünmez: ${hidden.slice(0, 4)}`);
      await ctx.close();
    });

    await test('JavaScript kapalıyken sayfa tam görünür (hero, vitrin, SVG top), tuval yok', async () => {
      const ctx = await gl.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
      await ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (r) => r.abort());
      const page = await ctx.newPage();
      await page.goto(BASE + '/', { waitUntil: 'load' });
      const vis = await page.evaluate(() => {
        const q = (s) => document.querySelector(s);
        const op = (s) => Number(getComputedStyle(q(s)).opacity);
        return { h1: op('.hero__title') + 0, bento: op('.bento__cell'), honest: op('.honest__list .reveal'), svg: !!q('svg.hero-ball__svg'), canvas: !!q('canvas'), stat: q('.hero__stat-n').textContent.trim() };
      });
      ok(vis.h1 === 1 && vis.bento === 1 && vis.honest === 1, `JS kapalıyken gizli içerik: ${JSON.stringify(vis)}`);
      ok(vis.svg && !vis.canvas && /^\d+$/.test(vis.stat), `yedek top/sayaç: ${JSON.stringify(vis)}`);
      await ctx.close();
    });

    await test('Ana sayfa 390 / 820 / 1280 px: yatay taşma yok, başlık ve top görünür, yerleşim kayması ≈ 0', async () => {
      for (const [w, mobile] of [[390, true], [820, false], [1280, false]]) {
        const { ctx, page } = await mk({ viewport: { width: w, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile }, { fn: OBSERVE });
        await goHome(page);
        await page.waitForSelector('.hero-ball[data-state="ready"]', { timeout: 30000 });
        await page.waitForTimeout(1800);
        const m = await page.evaluate(() => ({
          over: document.documentElement.scrollWidth - window.innerWidth,
          title: document.querySelector('.hero__title').getBoundingClientRect().width,
          ball: document.querySelector('.hero-ball').getBoundingClientRect().width,
          mode: document.querySelector('.hero-ball').dataset.mode,
          cls: window.__cls,
          lt: window.__lt,
        }));
        ok(m.over <= 1, `${w}px: ${m.over}px yatay taşma`);
        ok(m.title > 150 && m.ball > 150, `${w}px: başlık ${m.title}, top ${m.ball}`);
        ok(m.cls < 0.02, `${w}px: yerleşim kayması ${m.cls.toFixed(4)}`);
        if (mobile) ok(m.mode === 'svg', '390px dokunmatik: hafif SVG top beklenir, WebGL açılmamalı');
        // masaüstünde WebGL yoklaması (yazılım çizicide GPU işlemini ilk kez ayağa kaldırır) ~1–3 sn sürebilir; mobilde yoklama yapılmaz
        ok(Math.max(0, ...m.lt) < (mobile ? 400 : 3500), `${w}px: ana iş parçacığı ${Math.max(...m.lt)} ms bloklandı`);
        // tüm sayfayı gez: taşma ve gizli içerik kalmasın
        const H = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < H; y += 700) {
          await page.evaluate((yy) => window.scrollTo(0, yy), y);
          await page.waitForTimeout(60);
        }
        await page.waitForTimeout(2200);
        // Ekranda görünen öğeler eksiksiz görünmeli (ekran dışındaki animasyonlar tarayıcıda görüntüye gelince başlar)
        const end = await page.evaluate(() => ({
          over: document.documentElement.scrollWidth - window.innerWidth,
          hidden: [...document.querySelectorAll('[data-reveal]')].filter((e) => {
            const r = e.getBoundingClientRect();
            return r.bottom > 0 && r.top < window.innerHeight && Number(getComputedStyle(e).opacity) < 0.99;
          }).length,
        }));
        ok(end.over <= 1, `${w}px: gezinti sonrası ${end.over}px taşma`);
        ok(end.hidden === 0, `${w}px: ${end.hidden} öğe görünmez`);
        await ctx.close();
      }
    });

    await test('Akıllı giriş: boş durumda teknik önerir; yarım kalan antrenman, bugünün oturumu ve bozuk veri', async () => {
      const readToday = async (page) => {
        await page.waitForSelector('[data-today][data-ready="true"]', { timeout: 15000 });
        return page.evaluate(() => {
          const el = document.querySelector('[data-today]');
          const a = el.querySelector('a.today__cta');
          return { kind: el.dataset.kind, title: el.querySelector('.today__title').textContent, href: a.getAttribute('href'), text: el.querySelector('.today__main').textContent };
        });
      };
      // boş
      let c = await mk({}, { fn: () => { try { localStorage.removeItem('libero:v1'); } catch {} } });
      errs.length = 0;
      await goHome(c.page);
      let r = await readToday(c.page);
      ok(r.kind === 'technique' && /^\/teknikler\/[a-z0-9-]+\/$/.test(r.href) && r.title.length > 2, `boş durum: ${JSON.stringify(r)}`);
      // seviye değiştir → kalıcı
      await c.page.getByRole('radio', { name: /4 yıldız/ }).click();
      await c.page.waitForTimeout(500);
      const saved = await c.page.evaluate(() => JSON.parse(localStorage.getItem('libero:v1')).profile.level);
      ok(saved === 4, `seviye kaydedilmedi: ${saved}`);
      ok(errs.length === 0, `hata: ${errs.slice(0, 2).join(' | ')}`);
      await c.ctx.close();

      // yarım kalan antrenman
      const active = JSON.stringify({
        v: 2,
        profile: { level: 3, positions: ['kanat'] },
        logs: [{ id: 'l1', programId: null, sessionId: null, title: 'Sürat günü', focus: 'serbest', date: '2026-10-17', startedAt: '2026-10-17T09:00:00.000Z', status: 'active', progress: { k1: 1 }, items: [{ key: 'k1', ref: 'x', kind: 'ex', name: 'Çıkış koşusu', sets: 3, dose: '8 tekrar', rest: '60 sn' }] }],
      });
      c = await mk({}, { fn: (raw) => { try { localStorage.setItem('libero:v1', raw); } catch {} }, arg: active });
      await goHome(c.page);
      r = await readToday(c.page);
      ok(r.kind === 'continue-session' && /Sürat günü/.test(r.title) && /1\/3/.test(r.text) && r.href === '/program/', `yarım kalan: ${JSON.stringify(r)}`);
      ok((await c.page.locator('.today__bar').count()) === 1, 'ilerleme çubuğu yok');
      await c.ctx.close();

      // bugünün oturumu
      const todayIdx = (new Date().getDay() + 6) % 7;
      const prog = JSON.stringify({
        v: 2,
        profile: { level: 2 },
        program: {
          id: 'p1',
          createdAt: '2026-10-01T10:00:00.000Z',
          input: { age: 16, band: '15-17', level: 2, goal: 'dengeli', positions: [], equipment: [], envs: ['saha'], perWeek: 3, minutes: 50 },
          notes: [],
          sessions: [{ id: 's1', title: 'Sürat ve çeviklik', focus: 'hiz-ceviklik', env: 'saha', minutes: 50, items: [], day: todayIdx }],
        },
      });
      c = await mk({}, { fn: (raw) => { try { localStorage.setItem('libero:v1', raw); } catch {} }, arg: prog });
      await goHome(c.page);
      r = await readToday(c.page);
      ok(r.kind === 'todays-session' && /Sürat ve çeviklik/.test(r.title) && /50 dk/.test(r.text), `bugünün oturumu: ${JSON.stringify(r)}`);
      await c.ctx.close();

      // bozuk JSON ve garip ama geçerli JSON
      for (const bad of ['{bu json değil', '{"profile":5,"program":"x","logs":[1,null,{"items":3}],"lastVisit":{"path":3},"practiced":7,"v":"?"}', 'null', '[]']) {
        c = await mk({}, { fn: (raw) => { try { localStorage.setItem('libero:v1', raw); } catch {} }, arg: bad });
        errs.length = 0;
        await goHome(c.page);
        r = await readToday(c.page);
        ok(['technique', 'start', 'continue-visit'].includes(r.kind) && r.href.startsWith('/'), `bozuk veri (${bad.slice(0, 18)}): ${JSON.stringify(r)}`);
        ok(errs.length === 0, `bozuk veride hata: ${errs.slice(0, 2).join(' | ')}`);
        await c.ctx.close();
      }
    });

    await test('Başlık yazı tipi yüklenir ve Türkçe karakterleri çizer; marka adı noktalı İ almaz', async () => {
      const { ctx, page } = await mk();
      await goHome(page);
      const f = await page.evaluate(async () => {
        await document.fonts.ready;
        return {
          ok: document.fonts.check('800 40px "Libero Display"', 'ĞÜŞİÖÇığüşöç'),
          family: getComputedStyle(document.querySelector('.hero__title')).fontFamily,
          loaded: [...document.fonts].filter((x) => x.family.includes('Libero Display') && x.status === 'loaded').length,
          brand: document.querySelector('.wordmark__name').lang,
          brandText: getComputedStyle(document.querySelector('.wordmark__name')).textTransform,
        };
      });
      ok(f.family.includes('Libero Display') && f.ok && f.loaded >= 1, `yazı tipi: ${JSON.stringify(f)}`);
      ok(f.brand === 'en' && f.brandText === 'uppercase', 'marka adı lang="en" olmalı (LIBERO, İ yok)');
      await ctx.close();
    });

    await test('Üst çubuk: kaydırınca gölge/zemin değişir (yükseklik sabit), mega menü ve Esc, aktif bağlantı göstergesi', async () => {
      const { ctx, page } = await mk();
      await page.goto(BASE + '/teknikler/', { waitUntil: 'networkidle' });
      const hh = () => page.evaluate(() => Math.round(document.querySelector('.site-header').getBoundingClientRect().height));
      const h0 = await hh();
      ok((await page.locator('.site-header').getAttribute('data-scrolled')) === 'false', 'başlangıçta data-scrolled=false');
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
      await page.waitForFunction(() => document.querySelector('.site-header')?.getAttribute('data-scrolled') === 'true', null, { timeout: 4000 }).catch(() => {});
      ok((await page.locator('.site-header').getAttribute('data-scrolled')) === 'true', 'kaydırınca data-scrolled=true');
      ok((await hh()) === h0, 'üst çubuk yüksekliği değişmemeli (yerleşim kayması)');
      ok((await page.evaluate(() => Math.round(document.querySelector('.site-header').getBoundingClientRect().top))) === 0, 'üst çubuk kaydırınca yapışık kalmalı (sticky)');
      ok((await page.locator('.site-nav__btn[data-active]').count()) >= 1, 'etkin bağlantı göstergesi yok');
      await page.locator('.site-nav__btn', { hasText: 'Analiz' }).hover();
      await page.waitForTimeout(350);
      ok((await page.locator('.mega[data-open="true"]').count()) === 1, 'mega menü açılmadı');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      ok((await page.locator('.mega[data-open="true"]').count()) === 0, 'Esc mega menüyü kapatmadı');
      await ctx.close();
    });

    await test('Tasarım sistemi: odak halkası görünür, birincil düğme volt, eski --brass adları çalışır, kart hover yükselir', async () => {
      const { ctx, page } = await mk();
      await goHome(page);
      const t = await page.evaluate(() => {
        const cs = (el) => getComputedStyle(el);
        const root = cs(document.documentElement);
        const btn = document.querySelector('.hero__cta .btn--primary');
        const tmp = document.createElement('i');
        tmp.style.color = 'var(--brass)';
        document.body.appendChild(tmp);
        const brass = cs(tmp).color;
        tmp.style.color = 'var(--accent)';
        const accent = cs(tmp).color;
        tmp.remove();
        return { brass, accent, accentVar: root.getPropertyValue('--accent').trim(), btnBg: cs(btn).backgroundImage, btnColor: cs(btn).color };
      });
      ok(t.brass === t.accent && t.accentVar === '#c2f53c', `--brass takma adı: ${JSON.stringify(t)}`);
      ok(/gradient/.test(t.btnBg), 'birincil düğme degrade değil');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      const ring = await page.evaluate(() => {
        const a = document.activeElement;
        const s = getComputedStyle(a);
        return { w: parseFloat(s.outlineWidth), style: s.outlineStyle, tag: a.tagName };
      });
      ok(ring.style === 'solid' && ring.w >= 2, `odak halkası yok: ${JSON.stringify(ring)}`);
      await page.goto(BASE + '/teknikler/', { waitUntil: 'networkidle' });
      const card = page.locator('a.card').first();
      const y0 = (await card.boundingBox()).y;
      await card.hover();
      await page.waitForTimeout(500);
      const y1 = (await card.boundingBox()).y;
      ok(y1 < y0 - 1.5, `kart yükselmedi (${y0} → ${y1})`);
      await ctx.close();
    });
  } finally {
    await gl.close();
  }
};
