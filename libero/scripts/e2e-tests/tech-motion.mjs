// "Hareketi izle" (teknik hareket gösterimi): bölüm varlığı, oynat/duraklat, kaydırma, evre açıklaması, temas vurgusu,
// hareketi azalt şeridi, 390 px düzen, klavye, görünürlük/sekme duraklatması.
export default async ({ newPage, go, ok, test, txt, txts }) => {
  const SLUG = 'ilk-temas';
  const ROOT = '[data-tm]';
  const live = (page) => page.locator(`${ROOT} .tm__live`);
  const attr = (page, a) => page.locator(ROOT).getAttribute(a);
  const num = async (page, a) => Number(await attr(page, a));
  /** kaydırma çubuğunu belirli saniyeye getirir (yerel değer ayarlayıcı + input olayı; oynatmayı duraklatır) */
  const scrub = async (page, v) => {
    await page.evaluate((x) => {
      const el = document.querySelector('[data-tm-range]');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(x));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, v);
    await page.waitForFunction((x) => Math.abs(Number(document.querySelector('[data-tm]').dataset.t) - x) < 0.02, v);
  };
  const toSection = async (page) => {
    await page.locator('#hareketi-izle').scrollIntoViewIfNeeded();
    const stage = page.locator(`${ROOT} .tm__live .tm__stage`).first();
    if (await stage.isVisible()) await stage.scrollIntoViewIfNeeded(); // hareketi azaltta canlı sahne gizlidir
  };
  const svgHash = (page) => page.locator(`${ROOT} .tm__live svg.tm-svg`).evaluate((e) => e.innerHTML.length + ':' + e.innerHTML.slice(0, 4000).replace(/\s+/g, '').length + ':' + [...e.querySelectorAll('path')].slice(0, 80).map((p) => p.getAttribute('d')).join('|').length);

  await test('Hareketi izle: ilk temas sayfasında bölüm var, hareketi olmayan teknikte yok; dürüst etiket görünür', async () => {
    const { page, ctx } = await newPage();
    await go(page, `/teknikler/${SLUG}/`);
    ok((await page.locator(ROOT).count()) === 1, 'oynatıcı yok');
    const h = await txt(page.locator('#hareketi-izle h2'));
    ok(/Hareketi izle/.test(h), `başlık: ${h}`);
    // BootMap'ten sonra, "Adım adım uygulama"dan önce
    const heads = await txts(page.locator('.tech-main > section > h2'));
    const iM = heads.findIndex((x) => /Hareketi izle/.test(x));
    const iS = heads.findIndex((x) => /Adım adım/.test(x));
    ok(iM === 1 && iS === 2, `bölüm sırası: ${heads.map((x) => x.replace(/\s+/g, ' ').trim()).join(' | ')}`);
    ok(/02/.test(heads[iM]) && /03/.test(heads[iS]), 'bölüm numaraları ardışık değil');
    const honest = await txt(page.locator(`${ROOT} [data-tm-honest]`));
    ok(/Şematik hareket gösterimi; gerçek oyuncu videosu ya da hareket yakalama değildir\./.test(honest), `dürüst etiket: ${honest}`);
    await toSection(page);
    ok(await page.locator(`${ROOT} [data-tm-honest]`).isVisible(), 'dürüst etiket görünmüyor');
    ok(await page.locator('[data-bootmap]').count() === 1, 'krampon haritası yerinde olmalı');
    // hareketi olmayan, foot[] listesi olmayan teknik (doğrulayıcı kuralı gereği hareketi olamaz)
    await go(page, '/teknikler/savunma-durusu/');
    ok((await page.locator(ROOT).count()) === 0 && (await page.locator('#hareketi-izle').count()) === 0, 'hareketi olmayan teknikte bölüm görünüyor');
    const heads2 = await txts(page.locator('.tech-main > section > h2'));
    ok(/01/.test(heads2[0]) && /02/.test(heads2[1]) && !heads2.some((x) => /Hareketi izle/.test(x)), `numaralandırma bozuldu: ${heads2.join(' | ')}`);
    await ctx.close();
  });

  await test('Hareketi izle: görünür olunca kendiliğinden oynar; duraklat/oynat çalışır; rAF yalnızca oynarken', async () => {
    const { page, ctx } = await newPage();
    await go(page, `/teknikler/${SLUG}/`);
    ok((await attr(page, 'data-playing')) === 'false', 'görünmezken oynamamalı');
    ok((await attr(page, 'data-raf')) === 'off', 'görünmezken rAF kapalı olmalı');
    await toSection(page);
    await page.waitForFunction(() => document.querySelector('[data-tm]').dataset.playing === 'true', null, { timeout: 5000 });
    ok((await attr(page, 'data-raf')) === 'on', 'oynarken rAF açık olmalı');
    const t0 = await num(page, 'data-t');
    await page.waitForTimeout(500);
    const t1 = await num(page, 'data-t');
    ok(t1 !== t0, `zaman ilerlemiyor (${t0} → ${t1})`);
    const btn = page.locator('[data-tm-play]');
    ok(/Duraklat/.test(await txt(btn)), `oynarken düğme "Duraklat" olmalı: ${await txt(btn)}`);
    await btn.click();
    ok((await attr(page, 'data-playing')) === 'false' && (await attr(page, 'data-raf')) === 'off', 'duraklatınca oynatma ve rAF kapanmalı');
    const p0 = await num(page, 'data-t');
    await page.waitForTimeout(450);
    ok((await num(page, 'data-t')) === p0, 'duraklatılmışken zaman ilerlememeli');
    ok(/Oynat/.test(await txt(btn)), 'duraklatılmışken düğme "Oynat" olmalı');
    await btn.click();
    await page.waitForFunction((v) => Number(document.querySelector('[data-tm]').dataset.t) !== v, p0, { timeout: 3000 });
    ok((await attr(page, 'data-playing')) === 'true', 'oynat düğmesi oynatmıyor');
    await ctx.close();
  });

  await test('Hareketi izle: sahne dışına çıkınca ve sekme gizlenince durur', async () => {
    const { page, ctx } = await newPage();
    await go(page, `/teknikler/${SLUG}/`);
    await toSection(page);
    await page.waitForFunction(() => document.querySelector('[data-tm]').dataset.playing === 'true', null, { timeout: 5000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => document.querySelector('[data-tm]').dataset.playing === 'false', null, { timeout: 3000 });
    ok((await attr(page, 'data-raf')) === 'off', 'ekran dışında rAF kapalı olmalı');
    const t0 = await num(page, 'data-t');
    await page.waitForTimeout(400);
    ok((await num(page, 'data-t')) === t0, 'ekran dışında zaman ilerliyor');
    await toSection(page);
    await page.waitForFunction(() => document.querySelector('[data-tm]').dataset.playing === 'true', null, { timeout: 3000 });
    // sekme gizlendi
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(() => document.querySelector('[data-tm]').dataset.playing === 'false', null, { timeout: 3000 });
    ok((await attr(page, 'data-raf')) === 'off', 'sekme gizliyken rAF kapalı olmalı');
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(() => document.querySelector('[data-tm]').dataset.playing === 'true', null, { timeout: 3000 });
    // kullanıcı duraklattıysa görünürlük değişince kendiliğinden devam etmez
    await page.locator('[data-tm-play]').click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await toSection(page);
    await page.waitForTimeout(500);
    ok((await attr(page, 'data-playing')) === 'false', 'elle duraklatılan hareket kendiliğinden devam etmemeli');
    await ctx.close();
  });

  await test('Hareketi izle: kaydırma çubuğu kareyi değiştirir; evre adı ve açıklama evreyle birlikte değişir', async () => {
    const { page, ctx } = await newPage();
    await go(page, `/teknikler/${SLUG}/`);
    await toSection(page);
    const range = page.locator('[data-tm-range]');
    ok((await range.getAttribute('aria-label')) === 'Hareket zamanı', 'kaydırma çubuğunun adı yok');
    const dur = Number(await range.getAttribute('max'));
    ok(dur >= 1.8 && dur <= 3.5, `süre ${dur}`);
    await scrub(page, 0.2);
    const pill0 = await txt(page.locator('[data-tm-phase]'));
    const cap0 = await txt(page.locator('[data-tm-caption]'));
    const h0 = await svgHash(page);
    const aria0 = await page.locator(`${ROOT} .tm__live svg.tm-svg`).getAttribute('aria-label');
    ok(/Hazırlık/.test(pill0) && /Şu anki evre: Hazırlık/.test(aria0), `başlangıç evresi: ${pill0} / ${aria0}`);
    ok((await attr(page, 'data-playing')) === 'false', 'kaydırmak oynatmayı durdurmalı');
    await scrub(page, 1.5);
    const pill1 = await txt(page.locator('[data-tm-phase]'));
    const cap1 = await txt(page.locator('[data-tm-caption]'));
    const h1 = await svgHash(page);
    const aria1 = await page.locator(`${ROOT} .tm__live svg.tm-svg`).getAttribute('aria-label');
    ok(/Temas/.test(pill1) && /Şu anki evre: Temas/.test(aria1), `temas evresi: ${pill1} / ${aria1}`);
    ok(/amorti/.test(cap1) && !/amorti/.test(cap0), `Temas açıklaması amortiyi anlatmalı: ${cap1}`);
    ok(h0 !== h1, 'çizim kareleri farklı olmalı');
    await scrub(page, 3.0);
    const pill2 = await txt(page.locator('[data-tm-phase]'));
    const cap2 = await txt(page.locator('[data-tm-caption]'));
    ok(/Takip/.test(pill2) && /önünüze/.test(cap2) && cap1 !== cap2 && cap0 !== cap2, `takip evresi: ${pill2} / ${cap2}`);
    // erişilebilir değer metni
    ok(/3,00 saniye, Takip evresi/.test(await range.getAttribute('aria-valuetext')), `aria-valuetext: ${await range.getAttribute('aria-valuetext')}`);
    // evre çubuğu: üç bölme, Temas bölmesi temas anını içerir
    const segs = await page.locator(`${ROOT} .tm__seg`).evaluateAll((els) => els.map((e) => ({ id: e.getAttribute('data-seg'), w: e.getBoundingClientRect().width, x: e.getBoundingClientRect().x })));
    ok(segs.map((s) => s.id).join() === 'hazirlik,temas,takip' && segs.every((s) => s.w > 10), `evre bölmeleri: ${JSON.stringify(segs)}`);
    await ctx.close();
  });

  await test('Hareketi izle: temas anında yalnızca tekniğin foot[] bölgeleri vurgulanır, iç yüz parlar; adlar BootMap ile aynı', async () => {
    const { page, ctx } = await newPage();
    await go(page, `/teknikler/${SLUG}/`);
    await toSection(page);
    const foot = ((await page.locator('[data-bootmap]').getAttribute('data-foot')) ?? '').split(',').filter(Boolean).sort();
    await scrub(page, 1.5);
    const zones = await page.locator(`${ROOT} .tm__live svg.tm-svg [data-zone]`).evaluateAll((els) => els.map((e) => ({ z: e.getAttribute('data-zone'), on: e.getAttribute('data-active') })));
    ok(zones.map((z) => z.z).sort().join() === foot.join(), `vurgulanan bölgeler ${zones.map((z) => z.z)} ≠ foot[] ${foot}`);
    ok(zones.filter((z) => z.on === 'true').map((z) => z.z).join() === 'ic', `temasta parlayan bölge: ${JSON.stringify(zones)}`);
    ok((await attr(page, 'data-glow')) > '0.9', `temasta vurgu yoğunluğu ${await attr(page, 'data-glow')}`);
    ok((await page.locator(`${ROOT} .tm__live svg.tm-svg [data-lens]`).count()) === 1, 'temas anında yakın çekim yok');
    // bölge adları BootMap'teki ile aynı
    const chips = await txts(page.locator(`${ROOT} .tm__live [data-zone-chip]`));
    const bootNames = await txts(page.locator('[data-zone-item] b'));
    for (const c of chips) ok(bootNames.includes(c), `bölge adı BootMap'te yok: ${c} (${bootNames})`);
    ok(chips.length === foot.length, 'bölge çipi sayısı');
    ok((await page.locator(`${ROOT} [data-zone-chip="ic"]`).getAttribute('data-hot')) === 'true', 'iç yüz çipi temasta parlamalı');
    ok((await page.locator(`${ROOT} [data-zone-chip="dis"]`).getAttribute('data-hot')) === 'false', 'dış kenar çipi parlamamalı');
    // temas dışında hiçbir bölge parlamaz, yakın çekim yok
    await scrub(page, 0.3);
    const idle = await page.locator(`${ROOT} .tm__live svg.tm-svg [data-zone][data-active="true"]`).count();
    ok(idle === 0 && (await page.locator(`${ROOT} .tm__live svg.tm-svg [data-lens]`).count()) === 0, 'temas dışında vurgu/yakın çekim görünüyor');
    // üstten bakış kutusu
    ok((await page.locator(`${ROOT} .tm__live [data-plan]`).count()) === 1 && (await page.locator(`${ROOT} .tm__live [data-press]`).count()) === 1, 'üstten bakış kutusu ya da baskı işareti yok');
    await ctx.close();
  });

  await test('Hareketi izle: hız 0,5× / 1×, başa sar', async () => {
    const { page, ctx } = await newPage();
    await go(page, `/teknikler/${SLUG}/`);
    await toSection(page);
    await scrub(page, 0.1);
    const speeds = page.locator('[data-tm-speed]');
    ok((await speeds.count()) === 2 && (await speeds.nth(1).getAttribute('aria-pressed')) === 'true', 'hız düğmeleri (varsayılan 1×)');
    ok((await txts(speeds)).join() === '0,5×,1×', `hız etiketleri: ${(await txts(speeds)).join()}`);
    const measure = async () => {
      await scrub(page, 0.1);
      await page.locator('[data-tm-play]').click();
      const a = await num(page, 'data-t');
      await page.waitForTimeout(1000);
      const b = await num(page, 'data-t');
      await page.locator('[data-tm-play]').click();
      return b - a;
    };
    const d1 = await measure();
    await page.locator('[data-tm-speed="0.5"]').click();
    ok((await page.locator('[data-tm-speed="0.5"]').getAttribute('aria-pressed')) === 'true' && (await attr(page, 'data-speed')) === '0.5', '0,5× seçilmedi');
    const dh = await measure();
    ok(d1 > 0.5 && dh > 0.15 && dh < d1 * 0.75, `hız oranı: 1× ${d1.toFixed(2)} sn, 0,5× ${dh.toFixed(2)} sn`);
    await page.locator('[data-tm-speed="1"]').click();
    await scrub(page, 2.5);
    await page.locator('[data-tm-restart]').click();
    await page.waitForFunction(() => Number(document.querySelector('[data-tm]').dataset.t) < 0.6, null, { timeout: 2000 });
    ok((await attr(page, 'data-playing')) === 'true', 'başa sar oynatmaya devam etmeli');
    await ctx.close();
  });

  await test('Hareketi izle: hareketi azalt tercihinde oynatıcı yok, kendiliğinden oynamaz; üç karelik şerit açıklamalarla görünür', async () => {
    const { page, ctx } = await newPage({ reducedMotion: 'reduce' });
    await go(page, `/teknikler/${SLUG}/`);
    await toSection(page);
    await page.waitForTimeout(700);
    ok(await page.locator(`${ROOT} [data-tm-strip]`).isVisible(), 'sabit şerit görünmüyor');
    ok(!(await page.locator(`${ROOT} .tm__live`).isVisible()) && !(await page.locator('[data-tm-play]').isVisible()), 'canlı oynatıcı gizli olmalı');
    const frames = page.locator(`${ROOT} [data-tm-strip] figure[data-frame]`);
    ok((await frames.count()) === 3, 'üç kare olmalı');
    ok((await frames.evaluateAll((els) => els.map((e) => e.getAttribute('data-frame')))).join() === 'hazirlik,temas,takip', 'kare evreleri');
    for (let i = 0; i < 3; i++) {
      const f = frames.nth(i);
      ok(await f.isVisible(), `kare ${i} görünmüyor`);
      ok((await txt(f.locator('figcaption'))).trim().length > 40, `kare ${i} açıklaması yok`);
      ok(/evresi sabit kare/.test(await f.locator('svg.tm-svg').getAttribute('aria-label')), `kare ${i} etiketi`);
    }
    const fr = await frames.evaluateAll((els) => els.map((e) => e.querySelector('svg.tm-svg').innerHTML.length));
    ok(new Set(fr).size === 3 || new Set(await frames.evaluateAll((els) => els.map((e) => [...e.querySelectorAll('path')].map((p) => p.getAttribute('d')).join('').length))).size === 3, 'üç kare birbirinden farklı olmalı');
    // temas karesinde iç yüz parlar, diğerlerinde parlamaz
    const act = await frames.evaluateAll((els) => els.map((e) => e.querySelectorAll('[data-zone][data-active="true"]').length));
    ok(act.join() === '0,1,0', `temas karesinde iç yüz parlamalı: ${act}`);
    ok(/Şematik hareket gösterimi/.test(await txt(page.locator(`${ROOT} [data-tm-honest]`))) && (await page.locator(`${ROOT} [data-tm-honest]`).isVisible()), 'dürüst etiket şeritte de görünmeli');
    ok((await attr(page, 'data-playing')) === 'false' && (await attr(page, 'data-raf')) === 'off', 'hareketi azaltta oynamamalı');
    ok((await attr(page, 'data-t')) === (await attr(page, 'data-t')), 'zaman sabit');
    // hareketi azaltmayan kullanıcıda şerit gizli
    const n = await newPage();
    await go(n.page, `/teknikler/${SLUG}/`);
    await toSection(n.page);
    ok(!(await n.page.locator(`${ROOT} [data-tm-strip]`).isVisible()), 'normal modda şerit gizli olmalı');
    await n.ctx.close();
    await ctx.close();
  });

  await test('Hareketi izle: 390 px genişlikte taşma yok, denetimler ve sahne ekrana sığar', async () => {
    const { page, ctx } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await go(page, `/teknikler/${SLUG}/`);
    await toSection(page);
    await scrub(page, 1.5);
    const m = await page.evaluate(() => {
      const r = (s) => document.querySelector(s)?.getBoundingClientRect();
      const root = r('[data-tm]');
      const out = { sw: document.documentElement.scrollWidth, iw: innerWidth, root: root && [root.left, root.right] };
      out.over = [...document.querySelectorAll('[data-tm] .tm__live *')].filter((e) => !e.closest('svg')).filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 1 || b.left < -1); }).map((e) => e.className?.baseVal ?? e.className).slice(0, 5);
      out.stage = r('[data-tm] .tm__stage')?.height;
      out.plan = r('[data-tm] .tm__plan');
      out.btns = [...document.querySelectorAll('[data-tm] .tm__ctl button')].map((b) => { const q = b.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.right), Math.round(q.height)]; });
      return out;
    });
    ok(m.sw <= m.iw, `yatay taşma: ${m.sw} > ${m.iw}`);
    ok(m.over.length === 0, `ekran dışına taşan öğeler: ${m.over}`);
    ok(m.stage > 150, `sahne çok alçak: ${m.stage}`);
    ok(m.btns.every((b) => b[0] >= 0 && b[1] <= 390 && b[2] >= 36), `düğmeler: ${JSON.stringify(m.btns)}`);
    ok(m.plan && m.plan.width >= 80 && m.plan.right <= 390, 'üstten bakış kutusu sığmıyor');
    // reduced motion + 390: şerit de taşmaz
    const rm = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await go(rm.page, `/teknikler/${SLUG}/`);
    await toSection(rm.page);
    const w = await rm.page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    ok(w.sw <= w.iw, `şerit 390 px taşma: ${w.sw}`);
    await rm.ctx.close();
    await ctx.close();
  });

  await test('Hareketi izle: klavyeyle kullanılır (Tab, Enter/Boşluk, ok tuşları, hız düğmeleri), odak halkası görünür; gruplar adlıdır', async () => {
    const { page, ctx } = await newPage();
    await go(page, `/teknikler/${SLUG}/`);
    await toSection(page);
    const grp = page.locator(`${ROOT} .tm__live[role="group"]`);
    ok(/hareket gösterimi/.test((await grp.getAttribute('aria-label')) ?? ''), 'canlı grup aria-label');
    ok((await page.locator(`${ROOT} .tm__live svg.tm-svg`).getAttribute('role')) === 'img', 'svg role=img');
    ok(/İlk temas/.test(await page.locator(`${ROOT} .tm__live svg.tm-svg`).getAttribute('aria-label')), 'svg adı tekniği içermeli');
    ok((await page.locator(`${ROOT} .tm__ctl .seg`).getAttribute('aria-label')) === 'Oynatma hızı', 'hız grubu adı');
    // önce çubuğa odaklan, sonra Tab ile düğmelere
    const range = page.locator('[data-tm-range]');
    await range.focus();
    await page.keyboard.press('Home');
    const t0 = await num(page, 'data-t');
    ok(t0 === 0, `Home başa götürmeli (${t0})`);
    await page.keyboard.press('ArrowRight');
    ok(Math.abs((await num(page, 'data-t')) - 0.1) < 0.011, `→ 0,1 sn ilerletmeli (${await attr(page, 'data-t')})`);
    await page.keyboard.press('Shift+ArrowRight');
    ok(Math.abs((await num(page, 'data-t')) - 0.6) < 0.011, `Shift+→ 0,5 sn ilerletmeli (${await attr(page, 'data-t')})`);
    await page.keyboard.press('ArrowLeft');
    ok(Math.abs((await num(page, 'data-t')) - 0.5) < 0.011, '← geri almalı');
    await page.keyboard.press('End');
    ok(Math.abs((await num(page, 'data-t')) - Number(await range.getAttribute('max'))) < 0.011, 'End sona götürmeli');
    ok((await attr(page, 'data-playing')) === 'false', 'ok tuşları oynatmayı durdurmalı');
    const ring = await range.evaluate((e) => { const c = getComputedStyle(e); return [c.outlineStyle, parseFloat(c.outlineWidth)]; });
    ok(ring[0] !== 'none' && ring[1] >= 2, `kaydırma çubuğunda odak halkası yok: ${ring}`);
    // Tab: çubuk → Oynat → Başa sar → 0,5× → 1×
    await page.keyboard.press('Tab');
    ok(await page.locator('[data-tm-play]').evaluate((e) => e === document.activeElement), 'Tab Oynat düğmesine gitmeli');
    const bring = await page.locator('[data-tm-play]').evaluate((e) => { const c = getComputedStyle(e); return [c.outlineStyle, parseFloat(c.outlineWidth)]; });
    ok(bring[0] !== 'none' && bring[1] >= 2, `düğmede odak halkası yok: ${bring}`);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('[data-tm]').dataset.playing === 'true');
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.querySelector('[data-tm]').dataset.playing === 'false');
    await page.keyboard.press('Tab');
    ok(await page.locator('[data-tm-restart]').evaluate((e) => e === document.activeElement), 'Tab Başa sar düğmesine gitmeli');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    ok((await attr(page, 'data-speed')) === '0.5', 'klavyeyle 0,5× seçilemedi');
    await ctx.close();
  });

  await test('Hareketi izle: sayfada konsol hatası ve hidrasyon uyarısı yok (ilk temas, hareketi azalt dahil)', async () => {
    const errs = [];
    for (const opts of [{}, { reducedMotion: 'reduce' }]) {
      const { page, ctx } = await newPage(opts);
      page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && /hydrat|did not match|Warning:|unique "key"/i.test(m.text()) && errs.push(m.text()));
      await go(page, `/teknikler/${SLUG}/`);
      await toSection(page);
      await page.waitForTimeout(900);
      await ctx.close();
    }
    ok(errs.length === 0, errs.join(' | '));
  });
};
