// Krampon temas yüzeyi haritası (BootMap): bölge vurgusu, görünümler, sağ/sol ayak, top, mobil yerleşim.
export default async ({ newPage, go, ok, test, BASE }) => {
  const MAP = '[data-bootmap]';
  const MAIN = '[data-bootmap-main]';

  /** Bir teknik sayfasında tüm görünümleri gezip vurgulanan bölgelerin birleşimini döndürür. */
  async function collect(page, slug) {
    await go(page, `/teknikler/${slug}/`);
    const map = page.locator(MAP);
    ok((await map.count()) === 1, `${slug}: krampon haritası yok`);
    const foot = ((await map.getAttribute('data-foot')) ?? '').split(',').filter(Boolean);
    const first = await map.getAttribute('data-view');
    const buttons = page.locator('[data-view-btn]');
    const views = (await buttons.count()) > 0 ? await buttons.evaluateAll((els) => els.map((e) => e.getAttribute('data-view-btn'))) : [first];
    const perView = {};
    const union = new Set();
    for (const v of views) {
      if ((await buttons.count()) > 0) await page.locator(`[data-view-btn="${v}"]`).click();
      ok((await map.getAttribute('data-view')) === v, `${slug}: ${v} görünümüne geçilemedi`);
      const act = await page.locator(`${MAIN} [data-zone][data-active="true"]`).evaluateAll((els) => els.map((e) => e.getAttribute('data-zone')).sort());
      perView[v] = act;
      for (const z of act) union.add(z);
    }
    const aria = await page.locator(`${MAIN} svg[role="img"]`).getAttribute('aria-label');
    return { foot, first, views, perView, union: [...union].sort(), aria };
  }

  await test('Krampon: trivela pası, kavisli pas ve dış ayak pası farklı bölgeleri vurgular (veriyle eşleşir)', async () => {
    const { page, ctx } = await newPage();
    const tri = await collect(page, 'trivela-pasi');
    const kav = await collect(page, 'kavisli-pas');
    const dis = await collect(page, 'dis-ayak-pasi');
    // vurgulanan bölgelerin birleşimi = sayfadaki foot[] verisi
    for (const [name, r] of [['trivela-pasi', tri], ['kavisli-pas', kav], ['dis-ayak-pasi', dis]]) {
      ok(r.union.join(',') === [...r.foot].sort().join(','), `${name}: vurgulanan ${r.union} ≠ veri ${r.foot}`);
    }
    ok(tri.union.join(',') === 'ustDis', `trivela: ${tri.union}`);
    ok(kav.union.join(',') === 'ic,ustIc', `kavisli pas: ${kav.union}`);
    ok(dis.union.join(',') === 'dis', `dış ayak pası: ${dis.union}`);
    const key = (r) => r.union.join('+');
    ok(new Set([key(tri), key(kav), key(dis)]).size === 3, 'üç tekniğin vurgulu bölge kümesi birbirinden farklı olmalı');
    // trivela dış kenarı, dış ayak pası üst dışı vurgulamaz; iç yüz yalnız kavisli pasta
    ok(!tri.union.includes('dis') && !tri.union.includes('ic'), 'trivela: dış kenar/iç yüz vurgulanmamalı');
    ok(!dis.union.includes('ustDis') && !dis.union.includes('ic'), 'dış ayak pası: üst dış/iç yüz vurgulanmamalı');
    ok(!kav.union.includes('ustDis') && !kav.union.includes('dis'), 'kavisli pas: dış bölgeler vurgulanmamalı');
    // ilk açılan görünüm ve erişilebilir ad
    ok(tri.first === 'ust', `trivela ilk görünüm: ${tri.first}`);
    ok(kav.first === 'ic', `kavisli pas ilk görünüm: ${kav.first}`);
    ok(dis.first === 'dis', `dış ayak pası ilk görünüm: ${dis.first}`);
    ok(tri.views.join(',') === 'ust,dis', `trivela görünümleri: ${tri.views}`);
    ok(kav.views.join(',') === 'ust,ic', `kavisli pas görünümleri: ${kav.views}`);
    ok(/Üst dış — trivela yüzeyi/.test(tri.aria) && !/Dış kenar/.test(tri.aria), `trivela aria: ${tri.aria}`);
    ok(/Dış kenar/.test(dis.aria) && !/trivela/.test(dis.aria), `dış ayak pası aria: ${dis.aria}`);
    ok(/İç yüz — ayak içi/.test(kav.aria) && /Üst iç/.test(kav.aria) && !/Üst dış/.test(kav.aria), `kavisli pas aria: ${kav.aria}`);
    await ctx.close();
  });

  await test('Krampon: sağ/sol ayak seçimi (varsayılan sağ), görünümler ve aria-label', async () => {
    const { page, ctx } = await newPage();
    await go(page, '/teknikler/trivela-pasi/');
    const art = page.locator(`${MAIN} .bootart`);
    const svg = page.locator(`${MAIN} svg[role="img"]`);
    ok((await page.locator('[data-foot-btn="right"]').getAttribute('aria-pressed')) === 'true', 'sağ ayak varsayılan olmalı');
    ok(/Sağ krampon, üstten görünüm\.$/.test(await svg.getAttribute('aria-label')), 'sağ ayak aria-label');
    ok(!(await art.getAttribute('transform')), 'sağ ayak üstten görünümde çevrilmemeli');
    await page.locator('[data-foot-btn="left"]').click();
    ok((await page.locator('[data-foot-btn="left"]').getAttribute('aria-pressed')) === 'true', 'sol ayak seçili olmalı');
    ok(/Sol krampon, üstten görünüm\.$/.test(await svg.getAttribute('aria-label')), 'sol ayak aria-label');
    ok(/scale\(-1 1\)/.test((await art.getAttribute('transform')) ?? ''), 'sol ayak üstten görünümde aynalanmalı');
    // dış yüz: sağ ayak aynalı çizilir (burun sağa), sol ayak çizildiği gibi (burun sola)
    await page.locator('[data-view-btn="dis"]').click();
    ok(!(await art.getAttribute('transform')), 'sol ayak dış yüz görünümü çevrilmemeli');
    await page.locator('[data-foot-btn="right"]').click();
    ok(/scale\(-1 1\)/.test((await art.getAttribute('transform')) ?? ''), 'sağ ayak dış yüz görünümü aynalanmalı');
    ok(/Sağ krampon, dış yüz görünümü\.$/.test(await svg.getAttribute('aria-label')), 'dış yüz aria-label');
    // etiket metinleri aynalansa da okunur kalır (yazı dönmez)
    const flippedTexts = await page.locator(`${MAIN} .bootlab__t`).evaluateAll((els) => els.map((e) => e.textContent));
    ok(flippedTexts.includes('DIŞ KENAR') && flippedTexts.includes('ÜST DIŞ'), `etiketler: ${flippedTexts}`);
    await ctx.close();
  });

  await test('Krampon: top açma/kapama ve görünüm sekmeleri çalışır', async () => {
    const { page, ctx } = await newPage();
    await go(page, '/teknikler/kavisli-pas/');
    const ballBtn = page.locator('[data-ball-btn]');
    ok((await page.locator(`${MAIN} .boot-ball`).count()) === 1, 'ana görünümde top olmalı');
    ok((await ballBtn.getAttribute('aria-pressed')) === 'true', 'top varsayılan açık');
    await ballBtn.click();
    ok((await page.locator(`${MAIN} .boot-ball`).count()) === 0, 'top kapatılınca kalkmalı');
    ok((await ballBtn.getAttribute('aria-pressed')) === 'false', 'top düğmesi durumu');
    await ballBtn.click();
    ok((await page.locator(`${MAIN} .boot-ball`).count()) === 1, 'top geri gelmeli');
    // sekmeler: iç yüz → üstten
    const ic = page.locator('[data-view-btn="ic"]');
    const ust = page.locator('[data-view-btn="ust"]');
    ok((await ic.getAttribute('aria-pressed')) === 'true' && (await ust.getAttribute('aria-pressed')) === 'false', 'iç yüz ilk seçili olmalı');
    await ust.click();
    ok((await ust.getAttribute('aria-pressed')) === 'true' && (await ic.getAttribute('aria-pressed')) === 'false', 'üstten sekmesi seçilmeli');
    const act = await page.locator(`${MAIN} [data-zone][data-active="true"]`).evaluateAll((els) => els.map((e) => e.getAttribute('data-zone')));
    ok(act.join(',') === 'ustIc', `üstten görünümde yalnız iç ayak üstü vurgulanmalı: ${act}`);
    await ctx.close();
  });

  await test('Krampon: topuk, taban ve tek görünümlü teknikler', async () => {
    const { page, ctx } = await newPage();
    const heel = await collect(page, 'topukla-pas');
    ok(heel.union.join(',') === 'topuk', `topukla-pas: ${heel.union}`);
    ok(heel.views.includes('ic') && heel.views.includes('taban'), `topukla-pas görünümleri: ${heel.views}`);
    ok(heel.first === 'ic', `topukla-pas topuk koruyucusunu yandan açmalı: ${heel.first}`);
    const sole = await collect(page, 'taban-kontrol');
    ok(sole.views.join(',') === 'taban' && sole.union.join(',') === 'taban', `taban-kontrol: ${sole.views} / ${sole.union}`);
    ok((await page.locator('[data-view-btn]').count()) === 0, 'tek görünümlü teknikte sekme olmamalı');
    ok(/Taban/.test(sole.aria), `taban aria: ${sole.aria}`);
    // foot[] olmayan tekniklerde harita yok
    await go(page, '/teknikler/gogus-kontrolu/');
    ok((await page.locator(MAP).count()) === 0, 'foot[] olmayan teknikte harita çizilmemeli');
    await ctx.close();
  });

  await test('Krampon: tüm teknik sayfalarında harita ile veri tutarlı (127 sayfa)', async () => {
    const { page, ctx } = await newPage();
    await go(page, '/teknikler/');
    const slugs = await page.locator('a[href^="/teknikler/"]').evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('href')).filter((h) => /^\/teknikler\/[^/?#]+\/$/.test(h)))]);
    ok(slugs.length >= 120, `teknik sayfası sayısı: ${slugs.length}`);
    let withMap = 0;
    for (const href of slugs) {
      const r = await page.goto(BASE + href, { waitUntil: 'domcontentloaded' });
      ok(r && r.status() === 200, `${href}: HTTP ${r?.status()}`);
      const info = await page.evaluate(() => {
        const m = document.querySelector('[data-bootmap]');
        if (!m) return null;
        const foot = (m.getAttribute('data-foot') || '').split(',').filter(Boolean);
        const act = [...m.querySelectorAll('[data-bootmap-main] [data-zone][data-active="true"]')].map((e) => e.getAttribute('data-zone'));
        const items = [...m.querySelectorAll('[data-zone-item]')].map((e) => e.getAttribute('data-zone-item'));
        const label = m.querySelector('[data-bootmap-main] svg[role="img"]')?.getAttribute('aria-label') ?? '';
        const imgs = m.querySelectorAll('svg[role="img"]').length;
        return { foot, act, items, label, imgs };
      });
      if (!info) continue;
      withMap++;
      ok(info.foot.length > 0, `${href}: boş foot`);
      ok(info.act.length >= 1 && info.act.every((z) => info.foot.includes(z)), `${href}: ilk görünümde vurgulanan bölgeler (${info.act}) veriyle (${info.foot}) uyuşmuyor`);
      ok(info.items.join(',') === info.foot.join(','), `${href}: bölge listesi (${info.items}) ≠ veri (${info.foot})`);
      ok(/^Temas yüzeyi: /.test(info.label) && /krampon, /.test(info.label), `${href}: aria-label eksik: ${info.label}`);
      ok(info.imgs === 1, `${href}: role=img sayısı ${info.imgs} (küçük önizlemeler gizli olmalı)`);
    }
    ok(withMap >= 60, `haritalı teknik sayısı beklenenden az: ${withMap}`);
    await ctx.close();
  });

  await test('Krampon: telefon (390 px) ve tablet (820 px) düzeni — yatay taşma yok, çizim büyük ve üstte', async () => {
    for (const width of [390, 820]) {
      const { page, ctx } = await newPage({ viewport: { width, height: 844 } });
      await go(page, '/teknikler/trivela-pasi/');
      const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
      ok(o.sw <= o.iw + 1, `${width}px: yatay taşma ${o.sw} > ${o.iw}`);
      const card = page.locator(MAP);
      const fig = await page.locator('.bootmap').boundingBox();
      const info = await page.locator('.bootcard__info').boundingBox();
      const svg = await page.locator(`${MAIN} svg`).boundingBox();
      const cb = await card.boundingBox();
      ok(fig && info && svg && cb, `${width}px: kutular ölçülemedi`);
      ok(info.y >= fig.y + fig.height - 2, `${width}px: bilgi sütunu çizimin altında olmalı (üst üste/yan yana değil)`);
      ok(svg.width >= Math.min(300, cb.width * 0.6), `${width}px: çizim yeterince büyük değil (${Math.round(svg.width)} px)`);
      ok(svg.x >= cb.x - 1 && svg.x + svg.width <= cb.x + cb.width + 1, `${width}px: çizim kart dışına taşıyor`);
      for (const sel of ['[data-foot-btn="right"]', '[data-foot-btn="left"]', '[data-ball-btn]', '[data-view-btn="ust"]', '[data-view-btn="dis"]']) {
        const b = await page.locator(sel).boundingBox();
        ok(b && b.height >= 40 && b.x >= 0 && b.x + b.width <= width, `${width}px: ${sel} dokunma hedefi/konum uygun değil (${b && Math.round(b.height)}px)`);
      }
      // etiketler okunur boyutta (çizim ölçeğiyle)
      const fs = await page.locator(`${MAIN} .bootlab--on .bootlab__t`).first().evaluate((e) => {
        const r = e.getBoundingClientRect();
        return r.height;
      });
      ok(fs >= 9, `${width}px: etiket yüksekliği ${fs}px çok küçük`);
      await ctx.close();
    }
  });

  await test('Krampon: masaüstü (1280 px) — yatay taşma yok; vurgulu bölge nabzı hareket azaltmada durur', async () => {
    const { page, ctx } = await newPage();
    await go(page, '/teknikler/trivela-pasi/');
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    ok(o.sw <= o.iw + 1, `yatay taşma ${o.sw} > ${o.iw}`);
    const anim = await page.locator(`${MAIN} .boot-z--on .boot-z__fill`).first().evaluate((e) => getComputedStyle(e).animationName);
    ok(anim === 'bootpulse', `nabız animasyonu beklenirdi: ${anim}`);
    const inactive = await page.locator(`${MAIN} .boot-z:not(.boot-z--on) .boot-z__fill`).first().evaluate((e) => getComputedStyle(e).animationName);
    ok(inactive === 'none', `pasif bölge animasyonsuz olmalı: ${inactive}`);
    await ctx.close();
    const rm = await newPage({ reducedMotion: 'reduce' });
    await go(rm.page, '/teknikler/trivela-pasi/');
    const anim2 = await rm.page.locator(`${MAIN} .boot-z--on .boot-z__fill`).first().evaluate((e) => getComputedStyle(e).animationName);
    ok(anim2 === 'none', `hareket azaltmada animasyon durmalı: ${anim2}`);
    await rm.ctx.close();
  });

  await test('Krampon: klavye ile gezilir ve odak görünür; renk dışında da ayırt edilir', async () => {
    const { page, ctx } = await newPage();
    await go(page, '/teknikler/trivela-pasi/');
    // sekme tuşuyla ayak düğmelerine ulaş
    let reached = false;
    for (let i = 0; i < 60 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(() => document.activeElement?.getAttribute('data-foot-btn') === 'right');
    }
    ok(reached, 'sağ ayak düğmesine Tab ile ulaşılamadı');
    await page.waitForTimeout(450); // odak halkası geçişle (transition) belirir
    const ring = await page.evaluate(() => {
      const cs = getComputedStyle(document.activeElement);
      return { style: cs.outlineStyle, w: parseFloat(cs.outlineWidth) };
    });
    ok(ring.style !== 'none' && ring.w >= 1, `odak halkası görünmüyor: ${JSON.stringify(ring)}`);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // sol ayak
    ok((await page.locator(MAP).getAttribute('data-left')) === 'true', 'klavye ile sol ayak seçilemedi');
    // renk dışı ipuçları: etkin bölgede tarama deseni, etkin etiket kalın ve metin listesi
    ok((await page.locator(`${MAIN} .boot-z__hatch`).count()) >= 1, 'etkin bölgede tarama deseni olmalı');
    const w = await page.locator(`${MAIN} .bootlab--on .bootlab__t`).first().evaluate((e) => getComputedStyle(e).fontWeight);
    ok(Number(w) >= 600, `etkin etiket kalın olmalı: ${w}`);
    ok((await page.locator('.bootzones li').count()) >= 1, 'bölgeler metin listesi olarak da verilmeli');
    // yedek metin: temas yazısı ve bölge açıklaması aynı kartta
    const t = await page.locator('.bootcard__info').innerText();
    ok(/Üst dış — trivela yüzeyi/.test(t) && /dış kenar/i.test(t), `bilgi sütunu: ${t.slice(0, 120)}`);
    await ctx.close();
  });
};
