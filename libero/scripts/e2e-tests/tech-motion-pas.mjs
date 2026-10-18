// "Hareketi izle" — pas hareketleri: yerden iç yüz pas, iç yüzle kavisli pas, trivela pası.
// Doğru bölge parlar (kavisli iç/üst iç, trivela üst dış), karışmaz; üstten bakışta kavis yönü ve yazılı ipucu; iki kavisli pas ayırt edilir.
export default async ({ newPage, go, ok, test, txt, txts }) => {
  const ROOT = '[data-tm]';
  const CASES = {
    'yerden-ic-yuz-pas': { foot: ['ic'], hot: 'ic', curve: 'yok', hint: null, absent: ['ustDis', 'dis', 'ustIc'] },
    'kavisli-pas': { foot: ['ic', 'ustIc'], hot: 'ustIc', curve: 'sol', hint: /soluna/, absent: ['ustDis', 'dis'] },
    'trivela-pasi': { foot: ['ustDis'], hot: 'ustDis', curve: 'sag', hint: /sağına/, absent: ['ic', 'ustIc'] },
  };
  const SLUGS = Object.keys(CASES);
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
    if (await stage.isVisible()) await stage.scrollIntoViewIfNeeded();
  };
  const open = async (slug, opts) => {
    const r = await newPage(opts);
    await go(r.page, `/teknikler/${slug}/`);
    await toSection(r.page);
    return r;
  };
  const zonesAt = (page) => page.locator(`${ROOT} .tm__live svg.tm-svg [data-zone]`).evaluateAll((els) => els.map((e) => ({ z: e.getAttribute('data-zone'), on: e.getAttribute('data-active') })));
  /** üstten bakış kutusundaki topun tüm yolu: [x, y] (x sağa = oyuncunun sağı, y yukarı = ileri) */
  const planPath = (page) =>
    page.evaluate(() => {
      const p = document.querySelector('[data-tm] .tm__live [data-plan] path[stroke-dasharray]');
      const nums = (p.getAttribute('d').match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
      const out = [];
      for (let i = 0; i + 1 < nums.length; i += 2) out.push([nums[i], nums[i + 1]]);
      return out;
    });

  await test('Pas hareketleri: üç sayfada da "Hareketi izle" ve dürüst etiket var; bölge çipleri tekniğin foot[] listesiyle ve BootMap adlarıyla aynı', async () => {
    for (const slug of SLUGS) {
      const { page, ctx } = await open(slug);
      const c = CASES[slug];
      ok((await page.locator(ROOT).count()) === 1, `${slug}: oynatıcı yok`);
      ok(/Hareketi izle/.test(await txt(page.locator('#hareketi-izle h2'))), `${slug}: başlık`);
      ok(/Şematik hareket gösterimi; gerçek oyuncu videosu ya da hareket yakalama değildir\./.test(await txt(page.locator(`${ROOT} [data-tm-honest]`))), `${slug}: dürüst etiket`);
      const foot = ((await page.locator('[data-bootmap]').getAttribute('data-foot')) ?? '').split(',').filter(Boolean).sort();
      ok(foot.join() === [...c.foot].sort().join(), `${slug}: BootMap foot ${foot} ≠ beklenen ${c.foot}`);
      const chips = await page.locator(`${ROOT} .tm__live [data-zone-chip]`).evaluateAll((els) => els.map((e) => e.getAttribute('data-zone-chip')));
      ok([...chips].sort().join() === foot.join(), `${slug}: çipler ${chips} ≠ foot[] ${foot}`);
      const names = await txts(page.locator(`${ROOT} .tm__live [data-zone-chip]`));
      const bootNames = await txts(page.locator('[data-zone-item] b'));
      for (const n of names) ok(bootNames.includes(n), `${slug}: bölge adı BootMap'te yok: ${n} (${bootNames})`);
      ok(/Temas yüzeyi/.test(await txt(page.locator(`${ROOT} .tm__zones`))), `${slug}: temas yüzeyi başlığı`);
      await ctx.close();
    }
  });

  await test('Pas hareketleri: temas anında doğru bölge parlar; kavisli pas dış bölgeyi, trivela iç bölgeyi hiçbir anda göstermez', async () => {
    for (const slug of SLUGS) {
      const { page, ctx } = await open(slug);
      const c = CASES[slug];
      const tc = 1.5; // üç hareketin de temas anı
      await scrub(page, tc);
      const at = await zonesAt(page);
      ok(at.map((z) => z.z).sort().join() === [...c.foot].sort().join(), `${slug}: svg bölgeleri ${at.map((z) => z.z)} ≠ ${c.foot}`);
      ok(at.filter((z) => z.on === 'true').map((z) => z.z).join() === c.hot, `${slug}: temasta parlayan bölge ${JSON.stringify(at)}; beklenen ${c.hot}`);
      ok((await page.locator(`${ROOT} [data-zone-chip="${c.hot}"]`).getAttribute('data-hot')) === 'true', `${slug}: ${c.hot} çipi parlamalı`);
      for (const z of c.foot.filter((x) => x !== c.hot)) ok((await page.locator(`${ROOT} [data-zone-chip="${z}"]`).getAttribute('data-hot')) === 'false', `${slug}: ${z} çipi parlamamalı`);
      ok((await page.locator(`${ROOT} .tm__live svg.tm-svg [data-lens]`).count()) === 1, `${slug}: temasta yakın çekim yok`);
      const tag = (await txt(page.locator(`${ROOT} .tm__live svg.tm-svg [data-lens] text`))).trim();
      const bootNames = await txts(page.locator('[data-zone-item] b'));
      ok(tag.length > 2 && bootNames.some((n) => n.toLocaleUpperCase('tr-TR').startsWith(tag) || n.toLocaleUpperCase('tr-TR').includes(tag)), `${slug}: yakın çekim etiketi ${tag} BootMap adlarında yok (${bootNames})`);
      // karışmaz: tüm zaman boyunca yasak bölgeler ne svg'de ne çiplerde vardır; temas dışında hiçbir bölge parlamaz
      for (const t of [0, 0.4, 0.9, 1.3, 1.45, tc, 1.6, 1.9, 2.4, 3.0]) {
        await scrub(page, t);
        const zs = await zonesAt(page);
        for (const bad of c.absent) ok(!zs.some((z) => z.z === bad), `${slug}: t=${t} yasak bölge ${bad} svg'de`);
        if (t === 0 || t === 3.0) ok(zs.every((z) => z.on !== 'true'), `${slug}: t=${t} başta/sonda parlayan bölge var`);
      }
      for (const bad of c.absent) ok((await page.locator(`${ROOT} [data-zone-chip="${bad}"]`).count()) === 0, `${slug}: yasak bölge çipi ${bad}`);
      await ctx.close();
    }
  });

  await test('Pas hareketleri: üstten bakışta kavis yönü — kavisli pas sola, trivela sağa; yerden pas düz; yazılı ipucu ve erişilebilir ad yönü söyler', async () => {
    for (const slug of SLUGS) {
      const { page, ctx } = await open(slug);
      const c = CASES[slug];
      ok((await page.locator(`${ROOT} .tm__live [data-plan]`).count()) === 1, `${slug}: üstten bakış kutusu yok`);
      ok((await page.locator(`${ROOT} .tm__live [data-plan]`).getAttribute('data-curve')) === c.curve, `${slug}: data-curve ${await page.locator(`${ROOT} .tm__live [data-plan]`).getAttribute('data-curve')}`);
      const hint = page.locator(`${ROOT} .tm__plan-note [data-curve-hint]`);
      const label = (await page.locator(`${ROOT} .tm__live [data-plan]`).getAttribute('aria-label')) ?? '';
      const pts = await planPath(page);
      ok(pts.length > 20, `${slug}: yol noktaları yok`);
      const xs = pts.map((p) => p[0]);
      const right = Math.max(...xs) - xs[0]; // sağa şişkinlik (px)
      const left = xs[0] - Math.min(...xs); // sola şişkinlik (px)
      if (c.hint) {
        ok(c.hint.test(await txt(hint)), `${slug}: yazılı ipucu: ${await txt(page.locator(`${ROOT} .tm__plan-note`))}`);
        ok(c.hint.test(label), `${slug}: üstten bakış adı yönü söylemeli: ${label}`);
        ok(/kavis/.test(await txt(hint)), `${slug}: ipucu kavis demeli`);
      } else {
        ok((await hint.count()) === 0 && !/kavis/.test(label), `${slug}: düz pasta kavis ipucu olmamalı`);
      }
      if (slug === 'kavisli-pas') ok(right >= 8 && left <= 4, `kavisli: yol önce sağa açılmalı (sağ ${right.toFixed(1)}, sol ${left.toFixed(1)})`);
      if (slug === 'trivela-pasi') ok(left >= 8 && right <= 4, `trivela: yol önce sola açılmalı (sağ ${right.toFixed(1)}, sol ${left.toFixed(1)})`);
      if (slug === 'yerden-ic-yuz-pas') ok(right <= 2 && left <= 2, `yerden pas: yol düz olmalı (sağ ${right.toFixed(1)}, sol ${left.toFixed(1)})`);
      // yol sonunda kavis yönüne dönmüş: son parçanın yönü ilk parçanın yönüne göre kavis tarafına kaymış (x farkı)
      if (slug !== 'yerden-ic-yuz-pas') {
        const slope = (a, b) => (b[0] - a[0]) / (a[1] - b[1] || 1e-6); // + sağa gidiş (yukarı birim başına)
        const first = slope(pts[Math.floor(pts.length * 0.5)], pts[Math.floor(pts.length * 0.6)]);
        const last = slope(pts[pts.length - 6], pts[pts.length - 1]);
        ok(slug === 'kavisli-pas' ? last < first - 0.1 : last > first + 0.1, `${slug}: yol sonunda kavis yönüne dönmeli (${first.toFixed(2)} → ${last.toFixed(2)})`);
      }
      // rakip işareti topun düz yolunda
      ok((await page.locator(`${ROOT} .tm__live [data-press]`).count()) === (slug === 'yerden-ic-yuz-pas' ? 0 : 1), `${slug}: rakip işareti`);
      // üstten bakış, oynarken topun yolunu çizer: sonda yeşil yol dolu
      await scrub(page, 3.0);
      const lit = await page.locator(`${ROOT} .tm__live [data-plan] path[stroke="#c2f53c"]`).first().getAttribute('d');
      ok((lit.match(/L/g) ?? []).length > 40, `${slug}: gidilen yol çizilmiyor`);
      await ctx.close();
    }
  });

  await test('Pas hareketleri: kavisli pas ile trivela sayfası birbirinden ayırt edilir — bölge, ayak çizimi, kavis yönü, açıklamalar', async () => {
    const grab = async (slug) => {
      const { page, ctx } = await open(slug);
      await scrub(page, 1.5);
      const r = {
        hot: (await zonesAt(page)).filter((z) => z.on === 'true').map((z) => z.z).join(),
        boot: await page.locator(`${ROOT} .tm__live svg.tm-svg .tm-boot`).evaluateAll((els) => els.map((e) => [...e.querySelectorAll('path')].map((p) => p.getAttribute('d')).join('|')).join('#')),
        curve: await page.locator(`${ROOT} .tm__live [data-plan]`).getAttribute('data-curve'),
        capsTemas: await txt(page.locator(`${ROOT} [data-tm-caption]`)),
        label: (await page.locator(`${ROOT} .tm__live svg.tm-svg`).getAttribute('aria-label')) ?? '',
      };
      await scrub(page, 0.3);
      r.capsHazirlik = await txt(page.locator(`${ROOT} [data-tm-caption]`));
      await ctx.close();
      return r;
    };
    const k = await grab('kavisli-pas');
    const t = await grab('trivela-pasi');
    ok(k.hot === 'ustIc' && t.hot === 'ustDis' && k.hot !== t.hot, `parlayan bölgeler: ${k.hot} / ${t.hot}`);
    ok(k.boot.length > 200 && k.boot !== t.boot, 'vuran ayağın çizimi (açısı) iki hareketle aynı olmamalı');
    ok(k.curve === 'sol' && t.curve === 'sag', `kavis yönleri ${k.curve} / ${t.curve}`);
    ok(/dışa/.test(k.capsHazirlik) && /içe/.test(t.capsHazirlik), `hazırlık açıklaması: kavisli "${k.capsHazirlik}" / trivela "${t.capsHazirlik}"`);
    ok(/iç yüz/.test(k.capsTemas) && /dış bölümü/.test(t.capsTemas) && !/iç yüz/.test(t.capsTemas), `temas açıklaması: kavisli "${k.capsTemas}" / trivela "${t.capsTemas}"`);
    ok(/hareket çizimi/.test(k.label) && /Temas/.test(k.label), `svg adı evreyi söylemeli: ${k.label}`);
  });

  await test('Pas hareketleri: kavisli ve trivela sayfasında kaydırma çubuğu evreleri değiştirir, top temas öncesi yerde durur, sonra yükselir', async () => {
    for (const slug of ['kavisli-pas', 'trivela-pasi']) {
      const { page, ctx } = await open(slug);
      const ballY = () =>
        page.locator(`${ROOT} .tm__live svg.tm-svg`).evaluate((svg) => {
          // top, yalnızca top çiziminin kapsayıcı grubu: ilk radyal gradyanlı daire grubu; yerine görünür konumdan okunur
          const c = [...svg.querySelectorAll('g[transform^="translate("] > circle')].find((e) => e.getAttribute('fill')?.includes('ballb'));
          const g = c?.parentElement;
          const m = g?.getAttribute('transform')?.match(/translate\(([-\d.]+) ([-\d.]+)\)/);
          return m ? Number(m[2]) : null;
        });
      await scrub(page, 0.2);
      ok(/Hazırlık/.test(await txt(page.locator(`${ROOT} [data-tm-phase]`))), `${slug}: hazırlık evresi`);
      const y0 = await ballY();
      await scrub(page, 1.4);
      const y1 = await ballY();
      await scrub(page, 1.5);
      ok(/Temas/.test(await txt(page.locator(`${ROOT} [data-tm-phase]`))), `${slug}: temas evresi`);
      await scrub(page, 2.0);
      const y2 = await ballY();
      await scrub(page, 2.9);
      ok(/Takip/.test(await txt(page.locator(`${ROOT} [data-tm-phase]`))), `${slug}: takip evresi`);
      ok(y0 !== null && y1 !== null && y2 !== null, `${slug}: top çizimi bulunamadı`);
      ok(Math.abs(y0 - y1) < 0.6, `${slug}: top temasa kadar yerde durmalı (${y0} → ${y1})`);
      ok(y2 < y1 - 25, `${slug}: temastan sonra top yükselmeli (${y1} → ${y2})`);
      await ctx.close();
    }
  });

  await test('Pas hareketleri: 390 px genişlikte kavisli ve trivela sayfaları taşmaz, ipucu ve üstten bakış görünür; hareketi azaltta üç kare doğru bölgeyi gösterir', async () => {
    for (const slug of ['kavisli-pas', 'trivela-pasi']) {
      const c = CASES[slug];
      const { page, ctx } = await open(slug, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      await scrub(page, 1.5);
      const m = await page.evaluate(() => {
        const r = (s) => document.querySelector(s)?.getBoundingClientRect();
        return { sw: document.documentElement.scrollWidth, iw: innerWidth, plan: r('[data-tm] .tm__plan'), hint: r('[data-tm] [data-curve-hint]'), stage: r('[data-tm] .tm__stage') };
      });
      ok(m.sw <= m.iw, `${slug}: yatay taşma ${m.sw} > ${m.iw}`);
      ok(m.plan && m.plan.right <= 390 && m.plan.width >= 80, `${slug}: üstten bakış kutusu sığmıyor`);
      ok(m.hint && m.hint.right <= 392 && m.hint.left >= -2, `${slug}: kavis ipucu ekrana sığmıyor`);
      ok(m.stage.height > 150, `${slug}: sahne alçak`);
      await ctx.close();
      const rm = await open(slug, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
      const frames = rm.page.locator(`${ROOT} [data-tm-strip] figure[data-frame]`);
      ok((await frames.count()) === 3, `${slug}: üç kare olmalı`);
      const act = await frames.evaluateAll((els) => els.map((e) => [...e.querySelectorAll('[data-zone][data-active="true"]')].map((z) => z.getAttribute('data-zone')).join()));
      ok(act.join('|') === `|${c.hot}|`, `${slug}: şeritte parlayan bölgeler ${JSON.stringify(act)}`);
      const w = await rm.page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
      ok(w.sw <= w.iw, `${slug}: şerit 390 px taşma ${w.sw}`);
      ok(c.hint.test(await txt(rm.page.locator(`${ROOT} [data-tm-strip] .tm__note`))), `${slug}: şeritteki not kavis yönünü söylemeli`);
      await rm.ctx.close();
    }
  });
};
