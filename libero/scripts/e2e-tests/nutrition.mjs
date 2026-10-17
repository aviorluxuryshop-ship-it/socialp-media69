// Futbolcu beslenmesi ve toparlanma rehberi: bölümler, yapışkan menü, araçlar, kalıcılık, yazdırma, mobil.
export default async ({ newPage, go, ok, test, txt }) => {
  const SEC = 'section.gsec';
  const first = (page, sel) => page.locator(sel).first();
  const store = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);

  await test('Beslenme rehberi: bölümler, uyarı şeridi, kaynak atıfları ve uzman listesi tutarlı', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/beslenme/');
    ok((await page.locator(SEC).count()) >= 15, 'bölüm sayısı az');
    for (const id of ['temel-ilkeler', 'oncesi', 'sirasinda', 'sonrasi', 'sivi', 'uyku', 'dinlenme', 'uyari', 'mac-gunu', 'turnuva', 'takviye', 'ramazan', 'alerji', 'menuler', 'planlayici', 'uzman', 'kaynaklar']) {
      ok((await page.locator(`section#${id}`).count()) === 1, `${id} bölümü yok`);
    }
    const banner = await txt(page.locator('.gbanner'));
    ok(/Genel bilgilendirme; kişisel diyetisyen değerlendirmesi değildir/.test(banner), 'uyarı şeridi metni yok');
    ok(/diyetisyen hizmeti yoktur/i.test(banner), 'diyetisyen hizmeti yoktur uyarısı yok');
    // her içerik bölümünün kaynak atfı var ve hedefi sayfada
    const cites = await page.locator(`${SEC} .cite`).evaluateAll((els) => els.map((e) => [...e.querySelectorAll('a')].map((a) => a.getAttribute('href'))));
    ok(cites.length >= 15 && cites.every((c) => c.length >= 1), 'bir bölümde kaynak atfı yok');
    for (const href of new Set(cites.flat())) ok((await page.locator(href.replace('#', '#')).count()) === 1, `${href} kaynak listesinde yok`);
    const srcLinks = await page.locator('#kaynaklar .srcs__i > a').evaluateAll((els) => els.map((a) => [a.getAttribute('href'), a.getAttribute('rel')]));
    ok(srcLinks.length >= 17 && srcLinks.every(([h, r]) => /^https:\/\//.test(h) && /noopener/.test(r)), 'kaynak bağlantıları geçersiz');
    // her rozet listedeki bir maddeye bağlı; her madde listede
    const badges = await page.locator('[data-review]').evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('data-review')))]);
    ok(badges.length >= 10, 'rozet sayısı az');
    for (const id of badges) ok((await page.locator(`#uzman-${id}`).count()) === 1, `rozet ${id} uzman listesinde yok`);
    const listed = await page.locator('#uzman .rvlist__i').evaluateAll((els) => els.map((e) => e.id.replace('uzman-', '')));
    for (const id of listed) ok(badges.includes(id), `${id} listede ama sayfada rozeti yok`);
    ok(/Henüz uzman incelemesinden geçmedi/.test(await txt(page.locator('#uzman'))), 'uzman bölümü uyarısı yok');
    // çocuk/ergen içeriğinde kalori ya da gram hedefi yok (sayfa metni)
    const main = await txt(page.locator('.nutri__main'));
    ok(!/\b\d+\s*(kcal|kalori)\b/i.test(main), 'sayfada kalori hedefi var');
    ok(/Çocuk ve ergenler için sayısal hedef verilmez/.test(main), 'çocuk için sayısal hedef verilmez notu yok');
    await ctx.close();
  });

  await test('Beslenme rehberi: yapışkan bölüm menüsü bağlantıları gider ve okuma konumunu izler', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/beslenme/');
    const nav = page.locator('nav.gnav');
    ok((await nav.locator('li a').count()) >= 15, 'menü bağlantıları az');
    ok((await nav.evaluate((e) => getComputedStyle(e).position)) === 'sticky', 'menü yapışkan değil');
    await nav.getByRole('link', { name: /Sıvı/ }).click();
    await page.waitForTimeout(900);
    ok(page.url().endsWith('#sivi'), `adres #sivi değil: ${page.url()}`);
    const top = await page.locator('section#sivi').evaluate((e) => e.getBoundingClientRect().top);
    ok(top > -40 && top < 260, `sıvı bölümü görünür alanda değil (top=${top})`);
    ok((await nav.locator('[aria-current="true"]').innerText()).includes('Sıvı'), 'etkin menü öğesi Sıvı değil');
    // aşağı kaydırınca menü ekranda kalır ve etkin öğe değişir
    await page.evaluate(() => document.getElementById('takviye').scrollIntoView());
    await page.waitForTimeout(700);
    const t2 = await nav.evaluate((e) => e.getBoundingClientRect().top);
    ok(t2 >= 0 && t2 < 220, `menü kaydırınca ekranda kalmadı (top=${t2})`);
    ok((await nav.locator('[aria-current="true"]').innerText()).includes('Takviye'), 'etkin menü öğesi Takviyeler değil');
    // klavye ile menüye ulaşılır ve odak görünür
    await page.evaluate(() => window.scrollTo(0, 0));
    let hit = false;
    for (let i = 0; i < 220 && !hit; i++) {
      await page.keyboard.press('Tab');
      hit = await page.evaluate(() => !!document.activeElement?.closest('.gnav'));
    }
    ok(hit, 'Tab ile menüye ulaşılamadı');
    const ring = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement);
      return `${s.outlineStyle}|${s.outlineWidth}|${s.boxShadow}`;
    });
    ok(!/^none\|/.test(ring) || !/none$/.test(ring), `odak halkası yok: ${ring}`);
    await ctx.close();
  });

  await test('Beslenme rehberi: yaş grubu seçimi içeriği değiştirir ve kalıcıdır (libero:beslenme)', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/beslenme/');
    const sel = '[data-age-select]';
    await page.locator(`${sel} [data-band="u11"]`).click();
    ok(/zorlanmaz/.test(await txt(page.locator('[data-agenote="temel"]'))), 'yaş notu 11 yaş ve altına göre değişmedi');
    ok((await page.locator('[data-sleep] tr[data-me="true"] th').first().innerText()).includes('6–12'), 'uyku tablosunda 6–12 yaş vurgulanmadı');
    await page.locator(`${sel} [data-band="a18"]`).click();
    ok(/ACSM\/AND\/DC/.test(await txt(page.locator('[data-agenote="temel"]'))), 'yetişkin notu görünmüyor');
    await page.locator(`${sel} [data-band="u17"]`).click();
    const raw = await store(page, 'libero:beslenme');
    ok(raw && JSON.parse(raw).band === 'u17', `yaş grubu kaydedilmedi: ${raw}`);
    await page.reload({ waitUntil: 'networkidle' });
    ok((await page.locator(`${sel} [data-band="u17"]`).getAttribute('aria-checked')) === 'true', 'yaş grubu yenilemeden sonra kayboldu');
    ok((await page.locator('[data-sleep] tr[data-me="true"] th').first().innerText()).includes('13–18'), 'uyku tablosu 13–18 yaşı vurgulamadı');
    // yetişkin notunda mL değerleri vardır, çocuk notunda sayısal hedef yoktur
    ok(!/\d+\s*mL/.test(await txt(page.locator('[data-agenote="sivi"]'))), '15–17 yaş sıvı notunda mL hedefi var');
    ok((await store(page, 'libero:v1')) === null || !/"days"|libero:su/.test((await store(page, 'libero:v1')) ?? ''), 'libero:v1 içine beslenme verisi yazılmış');
    await ctx.close();
  });

  await test('Beslenme: su takibi (ayrı anahtarda kalıcı), hedef ve hatırlatıcı', async () => {
    const { ctx, page } = await newPage();
    await page.clock.install({ time: new Date('2026-03-10T10:00:00') });
    await go(page, '/beslenme/');
    const add = page.locator('[data-water-add]');
    await add.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    for (let i = 0; i < 3; i++) await add.click();
    ok((await txt(page.locator('[data-water-count]'))).trim() === '3', 'bardak sayacı 3 değil');
    const raw = JSON.parse((await store(page, 'libero:su')) ?? 'null');
    ok(raw && raw.days['2026-03-10'] === 3, `libero:su kaydı hatalı: ${JSON.stringify(raw)}`);
    await page.getByRole('button', { name: 'Hedefi artır' }).click();
    ok((await txt(page.locator('[data-water-goal]'))).trim() === '9', 'hedef 9 olmadı');
    ok((await page.locator('.water__ring').getAttribute('aria-valuenow')) === '3', 'ilerleme çubuğu aria-valuenow hatalı');
    // yenileme: sayaç kalır
    await page.reload({ waitUntil: 'networkidle' });
    ok((await txt(page.locator('[data-water-count]'))).trim() === '3', 'su sayacı yenilemeden sonra kayboldu');
    ok((await txt(page.locator('[data-water-goal]'))).trim() === '9', 'hedef yenilemeden sonra kayboldu');
    ok(!/"2026-03-10"/.test((await store(page, 'libero:v1')) ?? ''), 'su verisi libero:v1 içine yazılmış');
    // geri al
    await page.getByRole('button', { name: 'Bir bardağı geri al' }).click();
    ok((await txt(page.locator('[data-water-count]'))).trim() === '2', 'geri al çalışmadı');
    // hatırlatıcı: 30 dk sonra uyarı çıkar, "İçtim" sayacı artırır
    await page.locator('#water-every').selectOption('30');
    await page.locator('[data-water-rem]').check();
    ok((await page.locator('[data-water-due]').count()) === 0, 'hatırlatıcı hemen tetiklendi');
    await page.clock.fastForward('31:00');
    await page.waitForSelector('[data-water-due]', { timeout: 4000 });
    ok(/Su içme zamanı/.test(await txt(page.locator('[data-water-due]'))), 'hatırlatma metni yok');
    await page.locator('[data-water-due]').getByRole('button', { name: /İçtim/ }).click();
    ok((await page.locator('[data-water-due]').count()) === 0, 'uyarı kapanmadı');
    ok((await txt(page.locator('[data-water-count]'))).trim() === '3', 'uyarıdan eklenen bardak sayılmadı');
    const saved = JSON.parse((await store(page, 'libero:su')) ?? 'null');
    ok(saved.reminder.on === true && saved.reminder.everyMin === 30, 'hatırlatıcı ayarı kaydedilmedi');
    await ctx.close();
  });

  await test('Beslenme: idrar rengi kartı seçime göre öneri verir', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/beslenme/');
    ok(/Bir renk seçtiğinde/.test(await txt(page.locator('[data-urine-out]'))), 'başlangıç ipucu yok');
    await page.locator('[data-urine-step="2"]').click();
    ok((await page.locator('[data-urine-step="2"]').getAttribute('aria-checked')) === 'true', 'seçim işaretlenmedi');
    ok(/Hedef aralık/.test(await txt(page.locator('[data-urine-out]'))), 'iyi renk önerisi yok');
    await page.locator('[data-urine-step="4"]').click();
    ok(/artır/.test(await txt(page.locator('[data-urine-out]'))), 'koyu sarı için sıvı önerisi yok');
    await page.locator('[data-urine-step="6"]').click();
    ok(/hekime/.test(await txt(page.locator('[data-urine-out]'))), 'kırmızı-kahverengi için hekim yönlendirmesi yok');
    ok((await page.locator('[data-urine-step="4"]').getAttribute('aria-checked')) === 'false', 'eski seçim kalmış');
    await ctx.close();
  });

  await test('Beslenme: maç günü zaman çizelgesi oluşturucu (saat, erken maç, iki maç, yaş, geçersiz giriş)', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/beslenme/');
    const list = page.locator('[data-mt-list]');
    const times = () => list.locator('.mt__time').evaluateAll((els) => els.map((e) => e.textContent));
    let t = await times();
    ok(t.includes('12:00') && t.includes('15:00'), `15:00 maçı için 12:00 ana öğün ve 15:00 maç yok: ${t}`);
    ok(/Ana öğün/.test(await txt(list.locator('.mt__s', { hasText: '12:00' }).first())), '12:00 adımı ana öğün değil');
    await page.fill('#mt-kick', '08:30');
    t = await times();
    ok(t.includes('06:30') && !t.includes('05:30'), `08:30 maçında kahvaltı 06:30 değil: ${t}`);
    ok(/Hafif kahvaltı/.test(await txt(list)), 'erken maçta hafif kahvaltı yok');
    await page.fill('#mt-kick', '10:00');
    await page.locator('[data-mt-two]').check();
    await page.fill('#mt-second', '13:00');
    const body = await txt(list);
    ok(/İkinci maç başlar/.test(body) && /Maçlar arası/.test(body), 'ikinci maç adımları yok');
    ok((await times()).includes('13:00'), '13:00 ikinci maç saati yok');
    const sorted = (await times()).slice(2);
    ok(sorted.join() === [...sorted].sort().join(), `adımlar saat sırasında değil: ${sorted}`);
    await page.locator('[data-mt-two]').uncheck();
    // yaş: çocuk için mL hedefi yok, yetişkin için TÜBER değeri var
    await page.fill('#mt-kick', '15:00');
    await page.locator('[data-age-select] [data-band="u11"]').click();
    ok(!/\d+\s*mL/.test(await txt(list)), 'çocuk çizelgesinde mL hedefi var');
    ok(!/(Enerji içeceği|kafein)/i.test((await txt(list)).replace(/Enerji içeceği ve kafein çocuk ve ergenler için uygun değildir\./, '')), 'çocuk çizelgesinde uyarısız kafein/enerji içeceği');
    await page.locator('[data-age-select] [data-band="a18"]').click();
    ok(/500 mL/.test(await txt(list)), 'yetişkin çizelgesinde TÜBER sıvı değeri yok');
    // geçersiz giriş
    await page.fill('#mt-kick', '');
    ok(/Geçerli bir saat/.test(await txt(page.locator('[data-mt]'))), 'geçersiz saat uyarısı yok');
    await ctx.close();
  });

  await test('Beslenme: alerji/tercih örnek menüleri yeniden düzenler (süt, gluten, vegan)', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/beslenme/');
    const cards = page.locator('[data-dayplans] .mc');
    ok((await cards.count()) >= 4, 'örnek menü kartları az');
    const foots = async () => (await page.locator('[data-dayplans] .mc__foot').evaluateAll((els) => els.map((e) => e.textContent))).join(' | ');
    ok(/Alerjen:/.test(await foots()), 'alerjen etiketi yok');
    await page.locator('[data-dayplans] [data-avoid="sut"]').click();
    await page.locator('[data-dayplans] [data-avoid="gluten"]').click();
    const f = await foots();
    ok(!/süt ve süt ürünleri/.test(f) && !/gluten/.test(f), `süt/gluten filtrelenmedi: ${f}`);
    ok(/değiştirildi/.test(await txt(page.locator('[data-dayplans]'))), 'değiştirme bilgisi yok');
    await page.locator('[data-dayplans] [data-diet="vegan"]').click();
    const v = await page.locator('[data-dayplans] .mc__foot').evaluateAll((els) => els.map((e) => e.textContent.split('·')[0].trim()));
    ok(v.length >= 3 && v.every((x) => x === 'vegan'), `vegan olmayan öğün var: ${v}`);
    // bant ve gün tipi sekmeleri
    await page.locator('[data-dayplans] [data-dp-band="u11"]').click();
    await page.locator('[data-dayplans] [data-dp-day="dinlenme"]').click();
    ok((await page.locator('[data-dayplans] [data-dp-day="dinlenme"]').getAttribute('aria-pressed')) === 'true', 'gün tipi seçilmedi');
    ok(/Dinlenme günü açlık günü değildir/.test(await txt(page.locator('[data-dayplans]'))), '11 yaş dinlenme ipucu yok');
    ok(!/\b\d+\s*(kcal|kalori|g|gr|gram)\b/i.test(await txt(page.locator('[data-dayplans]'))), 'çocuk planında kalori/gram hedefi');
    await ctx.close();
  });

  await test('Beslenme: haftalık planlayıcı, alışveriş listesi (alerji uyumlu) ve kalıcılık', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/beslenme/');
    const wp = page.locator('[data-planner]');
    ok(/Liste boş/.test(await txt(wp)), 'başlangıçta liste boş değil');
    await wp.locator('[data-avoid="gluten"]').click();
    await wp.locator('[data-wp-fill]').click();
    const filled = await wp.locator('select[data-wp-slot]').evaluateAll((els) => els.filter((e) => e.value).length);
    ok(filled >= 15, `plan dolmadı (${filled})`);
    const items = await wp.locator('.shop__g li').evaluateAll((els) => els.map((e) => e.textContent));
    ok(items.length >= 6, `alışveriş listesi kısa (${items.length})`);
    ok(!items.some((t) => /Ekmek|Makarna|Bulgur|Yulaf|Simit|Lavaş/i.test(t)), `gluten kaçınılırken glutenli ürün listede: ${items.filter((t) => /Ekmek|Makarna|Bulgur|Yulaf|Simit|Lavaş/i.test(t))}`);
    ok(/\d+ öğün/.test(items.join(' ')), 'öğün sayısı gösterilmiyor');
    // bir günün tipini ve bir öğünü değiştir, işaretle, yenile
    await wp.locator('[data-day="pzt"] select.wp__type').selectOption('dinlenme');
    const firstItem = wp.locator('[data-shop-item]').first();
    const id = await firstItem.getAttribute('data-shop-item');
    await firstItem.check();
    await page.reload({ waitUntil: 'networkidle' });
    const wp2 = page.locator('[data-planner]');
    ok((await wp2.locator(`[data-shop-item="${id}"]`).isChecked()) === true, 'işaret yenilemeden sonra kayboldu');
    ok((await wp2.locator('[data-day="pzt"] select.wp__type').inputValue()) === 'dinlenme', 'gün tipi kaydedilmedi');
    const raw = JSON.parse((await store(page, 'libero:beslenme')) ?? 'null');
    ok(raw && raw.avoid.includes('gluten') && raw.ticked.includes(id), 'plan libero:beslenme içine yazılmadı');
    ok(!/ticked|"avoid"|gluten/.test((await store(page, 'libero:v1')) ?? ''), 'plan verisi libero:v1 içine yazılmış');
    await wp2.locator('[data-wp-clear]').click();
    ok(/Liste boş/.test(await txt(wp2)), 'temizle listeyi boşaltmadı');
    await ctx.close();
  });

  await test('Beslenme: yazdırma görünümü yalnızca seçilen aracı basar (print CSS)', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/beslenme/');
    await page.evaluate(() => {
      window.__print = [];
      window.print = () => window.__print.push(document.documentElement.dataset.print);
    });
    await page.locator('[data-planner] [data-wp-fill]').click();
    await page.locator('[data-print-btn="plan"]').click();
    ok((await page.evaluate(() => window.__print.join())) === 'plan', 'plan yazdırma işareti konmadı');
    await page.emulateMedia({ media: 'print' });
    const vis = (sel) => page.evaluate((s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0; }, sel);
    ok(!(await vis('.site-header')), 'yazdırmada üst çubuk görünüyor');
    ok(!(await vis('nav.gnav')), 'yazdırmada menü görünüyor');
    ok(!(await vis('#sivi')), 'plan yazdırılırken sıvı bölümü görünüyor');
    ok(await vis('[data-print-area="plan"]'), 'plan alanı yazdırmada yok');
    ok(await vis('.wp__sum'), 'yazdırma özet tablosu yok');
    ok(!(await vis('.wp__screen')), 'ekran seçicileri yazdırmada görünüyor');
    const sum = await txt(page.locator('.wp__sum'));
    ok(/Pazartesi/.test(sum) && /Kahvaltı:/.test(sum), 'yazdırma tablosu boş');
    ok(/Genel bilgilendirme; kişisel diyetisyen değerlendirmesi değildir/.test(await txt(page.locator('[data-print-area="plan"] .print-only').first())), 'yazdırmada uyarı satırı yok');
    ok(await vis('.shop'), 'alışveriş listesi yazdırmada yok');
    // çizelge yazdırma
    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => { document.documentElement.dataset.print = 'timeline'; });
    await page.emulateMedia({ media: 'print' });
    ok(await vis('[data-print-area="timeline"]'), 'çizelge alanı yazdırmada yok');
    ok(!(await vis('#planlayici')), 'çizelge yazdırılırken plan bölümü görünüyor');
    ok(!(await vis('[data-mt] .mt__form')), 'çizelge formu yazdırmada görünüyor');
    // tüm sayfa yazdırma: reveal'lar açık, menü yok
    await page.evaluate(() => { delete document.documentElement.dataset.print; });
    const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter((e) => Number(getComputedStyle(e).opacity) < 0.99).length);
    ok(hidden === 0, `yazdırmada ${hidden} öğe saydam`);
    ok(!(await vis('nav.gnav')), 'tüm sayfa yazdırmada menü görünüyor');
    await ctx.close();
  });

  await test('Beslenme: 390 ve 820 px — yatay taşma yok, menü şeridi kaydırılır, araçlar kullanılabilir', async () => {
    for (const [w, h] of [[390, 844], [820, 1100]]) {
      const { ctx, page } = await newPage({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
      await go(page, '/beslenme/');
      const over = () => page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      let o = await over();
      ok(o.sw <= o.cw + 1, `${w}px: yatay taşma ${o.sw}>${o.cw}`);
      const nav = page.locator('nav.gnav');
      ok((await nav.evaluate((e) => getComputedStyle(e).position)) === 'sticky', `${w}px: menü yapışkan değil`);
      const sc = await page.locator('.gnav__list').evaluate((e) => ({ sw: e.scrollWidth, cw: e.clientWidth, ox: getComputedStyle(e).overflowX }));
      ok(sc.sw > sc.cw && sc.ox === 'auto', `${w}px: menü şeridi yatay kaydırılmıyor (${JSON.stringify(sc)})`);
      ok((await page.locator('.gnav__age').evaluate((e) => getComputedStyle(e).display)) === 'none', `${w}px: yaş rozeti menüde görünüyor`);
      // araçlar: bardak ekle, sekme, çizelge
      await page.locator('[data-water-add]').scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      await page.locator('[data-water-add]').click();
      ok((await txt(page.locator('[data-water-count]'))).trim() === '1', `${w}px: su sayacı çalışmıyor`);
      await page.locator('[data-urine-step="3"]').click();
      await page.locator('[data-dayplans] [data-dp-day="mac"]').click();
      await page.locator('[data-planner] [data-wp-fill]').click();
      await page.locator('[data-mt-two]').check();
      o = await over();
      ok(o.sw <= o.cw + 1, `${w}px: araçlar açıkken yatay taşma ${o.sw}>${o.cw}`);
      // her bölüm ekran genişliğini aşmıyor
      const wide = await page.evaluate((cw) => [...document.querySelectorAll('.gsec, .gsec *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > cw + 2 && !e.closest('.tablewrap, .gnav__list, .seg'); }).slice(0, 3).map((e) => `${e.tagName}.${e.className}`), o.cw);
      ok(wide.length === 0, `${w}px: ekran dışına taşan öğeler: ${wide.join(', ')}`);
      // dokunma hedefleri: ana düğmeler en az 40 px
      const small = await page.evaluate(() => [...document.querySelectorAll('[data-water-add], [data-wp-fill], .gnav a')].filter((e) => e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().height < 38).length);
      ok(small === 0, `${w}px: ${small} dokunma hedefi 38 px altında`);
      await ctx.close();
    }
  });

  await test('Beslenme: hareketi azalt tercihinde içerik hemen görünür ve tabak dilimleri açıktır', async () => {
    const { ctx, page } = await newPage({ reducedMotion: 'reduce' });
    await go(page, '/beslenme/');
    await page.waitForTimeout(300);
    const dim = await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter((e) => Number(getComputedStyle(e).opacity) < 0.99).length);
    ok(dim === 0, `${dim} öğe saydam kaldı`);
    const op = await page.evaluate(() => [...document.querySelectorAll('.plate__s')].map((e) => Number(getComputedStyle(e).opacity)));
    ok(op.length === 15 && op.every((v) => v >= 0.8), `tabak dilimleri görünmüyor: ${op}`);
    const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.water__alert') ?? document.body).animationName);
    ok(typeof anim === 'string', 'animasyon okunamadı');
    await ctx.close();
  });
};
