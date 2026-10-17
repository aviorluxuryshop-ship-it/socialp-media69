// Oyuncu analizi (tarayıcı): dizin süzgeçleri, oyuncu sayfası bölümleri ve kaynak bağlantıları,
// video rayı + yan panelli oynatıcı penceresi, tüm oyuncu sayfaları, mobil.
export default async (h) => {
  const { ok, test, go, newPage, txt } = h;
  const noOverflow = async (page, what) => {
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(over <= 1, `${what}: yatay taşma ${over}px`);
  };
  const cards = (page) => page.locator('.pcard');
  const count = async (page) => Number(((await txt(page.locator('.pidx__count').first())).match(/(\d+)/) ?? [])[1]);

  await test('Oyuncu dizini: Messi öne çıkar, konum ve rol süzgeçleri, arama, boş durum, derin bağlantı', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/analiz/oyuncular/');
    const all = await count(page);
    ok(all >= 22, `oyuncu sayısı az: ${all}`);
    ok((await cards(page).count()) === all, 'kart sayısı ≠ sayaç');
    ok((await txt(cards(page).first())).includes('MESSİ') || /Messi/.test(await txt(cards(page).first())), 'ilk kart Messi olmalı');
    ok((await txt(page.locator('.pcard--feat'))).includes('En kapsamlı analiz'), 'Messi kartı vurgulanmalı');
    ok((await page.locator('.pcard img, .pidx img').count()) === 0, 'oyuncu fotoğrafı kullanılmamalı');
    await page.getByRole('button', { name: /^Kaleci \d/ }).first().click();
    await page.waitForTimeout(200);
    ok((await count(page)) === 1 && (await txt(cards(page).first())).includes('Neuer'), 'Kaleci süzgeci Neuer’i getirmeli');
    ok(/poz=kaleci/.test(page.url()), `adres güncellenmeli: ${page.url()}`);
    await page.getByRole('button', { name: /^Tüm pozisyonlar/ }).click();
    await page.getByRole('button', { name: /^Denge ve top kazanma/ }).click();
    await page.waitForTimeout(200);
    const names = await cards(page).allTextContents();
    ok(names.some((t) => /Kant/.test(t)) && names.some((t) => /Rodri|RODRİ/i.test(t)), 'Denge ve top kazanma: Kanté ve Rodri bekleniyordu');
    await page.getByRole('button', { name: /^Tüm roller/ }).click();
    await page.getByLabel('Oyuncularda ara').fill('ÇALHANOĞLU');
    await page.waitForTimeout(200);
    ok((await count(page)) === 1, 'Türkçe büyük harfle arama bir sonuç vermeli');
    await page.getByLabel('Oyuncularda ara').fill('zzzxq');
    await page.waitForTimeout(200);
    ok((await page.locator('.empty').textContent()).includes('oyuncu bulunamadı'), 'boş durum');
    await page.getByRole('button', { name: 'Tüm oyuncuları göster' }).click();
    ok((await count(page)) === all, 'temizleyince tümü dönmeli');
    await go(page, '/analiz/oyuncular/?poz=kaleci');
    await page.waitForFunction(() => document.querySelectorAll('.pcard').length === 1);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelectorAll('.pcard').length === 1);
    await noOverflow(page, 'oyuncu dizini 1280');
    await ctx.close();
  });

  await test('Oyuncu sayfası (Messi): tüm bölümler, içindekiler, kaynaklar dış bağlantı, benzer oyuncular', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/analiz/oyuncular/lionel-messi/');
    const want = ['Oyun tarzı özeti', 'Pozisyon alma', 'Topsuz hareket', 'Pas tercihleri', 'Top kontrolü ve ilk dokunuş', 'Hücum ve topla oyun', 'Savunma ve top kazanma', 'Karar verme', 'Güçlü yanlar ve sınırlılıklar', 'Kendi oyununa taşı', 'İzlerken bak', 'Videolar', 'Benzer oyuncular', 'Kaynaklar'];
    const heads = await page.locator('.psec h2').allTextContents();
    for (const w of want) ok(heads.some((x) => x.includes(w)), `bölüm yok: ${w}`);
    ok(heads.length >= 17, `Messi için ek bloklar da bekleniyordu: ${heads.length}`);
    const toc = await page.locator('.pa__toc a').count();
    ok(toc === heads.length, `içindekiler ${toc} ≠ bölümler ${heads.length}`);
    await page.locator('.pa__toc a', { hasText: 'Kaynaklar' }).click();
    await page.waitForTimeout(400);
    ok(/#kaynaklar$/.test(page.url()), 'içindekiler bağlantısı çalışmıyor');
    const src = page.locator('.psrc a');
    ok((await src.count()) >= 2, 'Messi için en az 2 kaynak');
    for (const a of await src.all()) {
      const href = await a.getAttribute('href');
      ok(/^https:\/\//.test(href), `kaynak https değil: ${href}`);
      ok((await a.getAttribute('target')) === '_blank' && /noopener/.test((await a.getAttribute('rel')) ?? ''), 'kaynak bağlantısı güvenli açılmalı');
    }
    ok((await txt(page.locator('.psrc'))).includes('Okundu:'), 'okunma tarihi yazmalı');
    ok((await page.locator('.psrc a[href^="https://en.wikipedia.org/wiki/Lionel_Messi"]').count()) === 1, 'Vikipedi kaynağı');
    ok((await txt(page.locator('.pfacts'))).includes('En kapsamlı analiz'), 'Messi en kapsamlı analiz etiketi');
    ok((await page.locator('.ptechs a[href^="/teknikler/"]').count()) >= 6, 'teknik bağlantıları');
    const sim = page.locator('.psim a').first();
    const href = await sim.getAttribute('href');
    await sim.click();
    await page.waitForURL(`**${href}`);
    ok((await page.locator('h1').count()) === 1, 'benzer oyuncu sayfası açılmalı');
    await ctx.close();
  });

  await test('Oyuncu sayfası: video rayı yeni kapaklı kartlar; pencere yan panelde “Bu videoda bak”, dürüst açıklama, zaman kodu yok', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/analiz/oyuncular/lionel-messi/');
    const n = await page.locator('.vrail .vcard').count();
    ok(n >= 3 && n <= 6, `rayda 3–6 video bekleniyordu: ${n}`);
    ok((await page.locator('.vrail .vcov').count()) === n, 'her kartta çizim kapak');
    for (let i = 0; i < Math.min(n, 3); i++) {
      await page.locator('.vrail .vcard').nth(i).scrollIntoViewIfNeeded();
      await page.locator('.vrail .vcard').nth(i).click();
      await page.waitForSelector('.vmodal__side');
      const side = await txt(page.locator('.vmodal__side'));
      ok(/Bu videoda bak/.test(side), 'yan panel başlığı');
      ok(/hakkında değil|doğrulamadı/.test(side), `dürüst açıklama yok: ${side.slice(0, 140)}`);
      ok(!/\b\d{1,2}:\d{2}\b/.test(side), 'yan panelde zaman kodu olmamalı');
      ok(/Videonun Türkçe özeti/.test(side) && /Kişisel notların/.test(side), 'özet ve not bölümüne yönlendirme');
      ok((await page.locator('.vmodal .vmoments').count()) === 1, 'not bölümü pencerede olmalı');
      ok((await page.locator('.vmodal iframe').getAttribute('src')).startsWith('https://www.youtube-nocookie.com/embed/'), 'resmî gömme oynatıcısı');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      ok((await page.locator('.vmodal').count()) === 0, 'Esc ile kapanmalı');
    }
    // kaleci oyuncuda kaleci videoları
    await go(page, '/analiz/oyuncular/manuel-neuer/');
    await page.locator('.vrail .vcard').first().click();
    await page.waitForSelector('.vmodal__side');
    ok(/Kaleci|kaleci/.test(await txt(page.locator('.vmodal__side'))), 'Neuer panelinde kalecilik konusu bekleniyordu');
    await ctx.close();
  });

  await test('Tüm oyuncu sayfaları açılır: tüm bölümler, ≥1 kaynak (https), 3–6 video, taşma yok', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/analiz/oyuncular/');
    const hrefs = await page.locator('.pcard').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    ok(hrefs.length >= 22, `bağlantı sayısı: ${hrefs.length}`);
    for (const href of hrefs) {
      await go(page, href);
      ok((await page.locator('h1').count()) === 1, `${href}: h1`);
      ok((await page.locator('.psec').count()) >= 14, `${href}: bölüm sayısı`);
      const links = await page.locator('.psrc a').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
      ok(links.length >= 1 && links.every((l) => /^https:\/\//.test(l)), `${href}: kaynaklar`);
      const v = await page.locator('.vrail .vcard').count();
      ok(v >= 3 && v <= 6, `${href}: video sayısı ${v}`);
      ok((await page.locator('.pa__toc a').count()) === (await page.locator('.psec').count()), `${href}: içindekiler`);
      await noOverflow(page, href);
    }
    await ctx.close();
  });

  await test('Oyuncu analizi mobil (390): dizin ve Messi sayfası taşmaz; pencere yan paneli aşağıda görünür', async () => {
    const { ctx, page } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await go(page, '/analiz/oyuncular/');
    await noOverflow(page, 'dizin 390');
    const w = await cards(page).first().evaluate((e) => e.getBoundingClientRect().width);
    ok(w > 300 && w <= 390, `kart genişliği ${w}`);
    await page.getByRole('button', { name: /^Defans ve bek/ }).tap();
    await page.waitForTimeout(200);
    ok((await count(page)) >= 3, 'rol süzgeci mobilde çalışmalı');
    await go(page, '/analiz/oyuncular/lionel-messi/');
    await noOverflow(page, 'Messi 390');
    ok((await page.locator('.pa__toc a').first().isVisible()), 'içindekiler mobilde görünmeli');
    await page.locator('.vrail .vcard').first().scrollIntoViewIfNeeded();
    await noOverflow(page, 'video rayı 390');
    await page.locator('.vrail .vcard').first().tap();
    await page.waitForSelector('.vmodal__side');
    await page.waitForTimeout(300);
    await noOverflow(page, 'pencere 390');
    const fit = await page.evaluate(() => {
      const p = document.querySelector('.vmodal__panel');
      return p.scrollWidth - p.clientWidth;
    });
    ok(fit <= 1, `pencere taşıyor: ${fit}`);
    await page.getByRole('button', { name: 'Videoyu kapat' }).tap();
    ok((await page.locator('.vmodal').count()) === 0, 'mobilde kapanmadı');
    await ctx.close();
  });
};
