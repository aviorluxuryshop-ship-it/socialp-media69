// Beslenme denetimi: bozuk kayıt, gece yarısı, klavye ve veri kaybı korumaları (tarayıcı).
export default async ({ newPage, go, ok, test, txt }) => {
  const store = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);

  await test('Beslenme denetimi: bozuk ya da yanlış biçimli libero:su / libero:beslenme kayıtları sayfayı çökertmez, araçlar yeniden çalışır', async () => {
    const bad = [
      ['{bozuk json', '[1,2'],
      ['"çöp"', 'null'],
      ['[]', '{"days":5,"band":7,"diet":{},"avoid":"süt","ticked":"x"}'],
      ['{"goal":"abc","days":{"2026-03-10":"çok"},"reminder":5,"lastAt":{}}', '{"band":"u11","days":{"pzt":{"type":"mac","slots":{"kahvalti":"yok","sonra":42}}},"avoid":["süt",3,"sut"]}'],
    ];
    for (const [su, plan] of bad) {
      const { ctx, page } = await newPage();
      await page.addInitScript(([a, b]) => {
        localStorage.setItem('libero:su', a);
        localStorage.setItem('libero:beslenme', b);
      }, [su, plan]);
      await go(page, '/beslenme/');
      ok((await txt(page.locator('[data-water-count]'))).trim() === '0', `bozuk su kaydı (${su}) sayacı bozdu`);
      ok(/^\d+$/.test((await txt(page.locator('[data-water-goal]'))).trim()), 'hedef sayı değil');
      // araçlar çalışmaya devam eder ve temiz kayıt yazar
      await page.locator('[data-water-add]').scrollIntoViewIfNeeded();
      await page.locator('[data-water-add]').click();
      ok((await txt(page.locator('[data-water-count]'))).trim() === '1', 'bozuk kayıttan sonra bardak eklenemedi');
      JSON.parse((await store(page, 'libero:su')) ?? 'x');
      await page.locator('[data-age-select] [data-band="u17"]').click();
      JSON.parse((await store(page, 'libero:beslenme')) ?? 'x');
      await page.locator('[data-wp-fill]').scrollIntoViewIfNeeded();
      await page.locator('[data-wp-fill]').click();
      ok((await page.locator('[data-shop-item]').count()) > 5, 'bozuk plan kaydından sonra planlayıcı çalışmıyor');
      await page.locator('[data-urine-step="3"]').scrollIntoViewIfNeeded();
      await page.locator('[data-urine-step="3"]').click();
      ok(/Sarı/.test(await txt(page.locator('[data-urine-out]'))), 'idrar kartı bozuldu');
      await ctx.close();
    }
  });

  await test('Beslenme denetimi: su takibi gece yarısını geçince bardak yeni güne yazılır (İstanbul ve Los Angeles, yaz saati geçişi dâhil)', async () => {
    const cases = [
      ['Europe/Istanbul', '2026-03-10T23:59:50+03:00', '2026-03-11T00:00:03+03:00', '2026-03-10', '2026-03-11'],
      ['America/Los_Angeles', '2026-03-07T23:59:50-08:00', '2026-03-08T00:00:03-08:00', '2026-03-07', '2026-03-08'],
      ['America/Los_Angeles', '2026-03-08T23:59:50-07:00', '2026-03-09T00:00:03-07:00', '2026-03-08', '2026-03-09'],
    ];
    for (const [tz, before, after, d1, d2] of cases) {
      const { ctx, page } = await newPage({ timezoneId: tz });
      await page.clock.install({ time: new Date(before) });
      await go(page, '/beslenme/');
      const add = page.locator('[data-water-add]');
      await add.scrollIntoViewIfNeeded();
      await add.click();
      ok((await txt(page.locator('[data-water-count]'))).trim() === '1', `${tz}: ilk bardak sayılmadı`);
      // saat zamanlayıcısı henüz tetiklenmeden (15 sn'lik yenileme) yerel saat gece yarısını geçer
      await page.clock.setSystemTime(new Date(after));
      await add.click();
      const raw = JSON.parse((await store(page, 'libero:su')) ?? 'null');
      ok(raw && raw.days[d1] === 1 && raw.days[d2] === 1, `${tz}: gece yarısından sonraki bardak yanlış güne yazıldı: ${JSON.stringify(raw && raw.days)}`);
      ok((await txt(page.locator('[data-water-count]'))).trim() === '1', `${tz}: yeni gün sayacı 1 değil`);
      await ctx.close();
    }
  });

  await test('Beslenme denetimi: su sayacı hedefi aşınca aşırı içme uyarısı çıkar, hedefi zorlamaz', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/beslenme/');
    ok(/zorla içme/.test(await txt(page.locator('[data-water]'))), 'zorla içme uyarısı yok');
    const add = page.locator('[data-water-add]');
    await add.scrollIntoViewIfNeeded();
    for (let i = 0; i < 7; i++) await page.getByRole('button', { name: 'Hedefi azalt' }).click();
    ok((await txt(page.locator('[data-water-goal]'))).trim() === '1', 'hedef 1e inmedi');
    await page.getByRole('button', { name: 'Hedefi azalt' }).click();
    ok((await txt(page.locator('[data-water-goal]'))).trim() === '1', 'hedef 1in altına indi');
    await add.click();
    ok((await page.locator('[data-water-over]').count()) === 0, 'hedefe tam ulaşınca uyarı çıktı');
    await add.click();
    ok(/aşırı içmek de risklidir/.test(await txt(page.locator('[data-water-over]'))), 'hedef aşımı uyarısı yok');
    await page.getByRole('button', { name: 'Bir bardağı geri al' }).click();
    ok((await page.locator('[data-water-over]').count()) === 0, 'uyarı geri almadan sonra kalmış');
    await ctx.close();
  });

  await test('Beslenme denetimi: maç günü çizelgesi 00:30 gece maçı ve hatalı ikinci maç için doğru çalışır (390 px dâhil)', async () => {
    const { ctx, page } = await newPage({ viewport: { width: 390, height: 844 } });
    await go(page, '/beslenme/');
    const list = page.locator('[data-mt-list]');
    await list.scrollIntoViewIfNeeded();
    await page.fill('#mt-kick', '00:30');
    const t = await list.locator('.mt__time').evaluateAll((els) => els.map((e) => e.textContent));
    ok(t.includes('21:30') && t.includes('00:30') && t.includes('01:40'), `00:30 maçı için 21:30/00:30/01:40 yok: ${t}`);
    const body = await txt(list);
    ok(!/Hafif kahvaltı|Erken yat/.test(body), 'gece maçında kahvaltı ya da erken yat adımı var');
    ok(/Gün boyu/.test(body) && /Geç saat/.test(body) && /Sakin ol ve uyu/.test(body), 'gece maçı adımları eksik');
    ok(/uyku süreni korumaya/.test(body), 'varsayılan 12–14 yaş için uyku uyarısı yok');
    ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= 391, '390 px yatay taşma');
    // ikinci maç ilk maçtan önce: uyarı çıkar, çizelgede yok
    await page.fill('#mt-kick', '15:00');
    await page.locator('[data-mt-two]').check();
    await page.fill('#mt-second', '10:00');
    ok(/eklenmedi/.test(await txt(page.locator('[data-mt-second-note]'))), 'uzak ikinci maç için uyarı yok');
    ok(!/İkinci maç başlar/.test(await txt(list)), 'uzak ikinci maç çizelgeye girdi');
    await page.fill('#mt-second', '15:30');
    ok(/en az 20 dakika/.test(await txt(page.locator('[data-mt-second-note]'))), 'çakışan ikinci maç için uyarı yok');
    await page.fill('#mt-second', '');
    ok(/geçerli bir saat/i.test(await txt(page.locator('[data-mt-second-note]'))), 'boş ikinci saat için uyarı yok');
    await page.fill('#mt-second', '17:30');
    ok((await page.locator('[data-mt-second-note]').count()) === 0, 'geçerli ikinci maçta uyarı kalmış');
    ok(/İkinci maç başlar/.test(await txt(list)), 'geçerli ikinci maç çizelgede yok');
    // geç biten ikinci maç: gece ana öğünü yerine sakin kapanış
    await page.fill('#mt-kick', '19:00');
    await page.fill('#mt-second', '21:00');
    ok(/Geç saat/.test(await txt(list)), 'geç biten maçta sakin kapanış yok');
    await ctx.close();
  });

  await test('Beslenme denetimi: idrar kartı ve yaş seçici ok tuşlarıyla gezilir, tek Tab durağı vardır', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/beslenme/');
    const tabs = (sel) => page.locator(sel).evaluateAll((els) => els.map((e) => e.tabIndex));
    ok((await tabs('[data-age-select] [role=radio]')).join() === '-1,0,-1,-1', `yaş seçici tab durakları: ${await tabs('[data-age-select] [role=radio]')}`);
    await page.locator('[data-band="u14"]').focus();
    await page.keyboard.press('ArrowRight');
    ok((await page.locator('[data-band="u17"]').getAttribute('aria-checked')) === 'true' && (await page.evaluate(() => document.activeElement?.getAttribute('data-band'))) === 'u17', 'ok sağ yaş grubunu seçmedi');
    await page.keyboard.press('End');
    ok((await page.locator('[data-band="a18"]').getAttribute('aria-checked')) === 'true', 'End son yaş grubunu seçmedi');
    await page.keyboard.press('ArrowRight');
    ok((await page.locator('[data-band="u11"]').getAttribute('aria-checked')) === 'true', 'son seçenekten sonra başa dönmedi');
    await page.keyboard.press('ArrowLeft');
    ok((await page.locator('[data-band="a18"]').getAttribute('aria-checked')) === 'true', 'ok sol geri gitmedi');
    // idrar kartı: seçim yokken ilk kutu tab durağı
    const u = '[data-urine] [role=radio]';
    await page.locator(u).first().scrollIntoViewIfNeeded();
    ok((await tabs(u)).join() === '0,-1,-1,-1,-1,-1', `idrar kartı tab durakları: ${await tabs(u)}`);
    await page.locator('[data-urine-step="1"]').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    ok((await page.locator('[data-urine-step="3"]').getAttribute('aria-checked')) === 'true', 'ok tuşları idrar rengini seçmedi');
    ok(/Sarı/.test(await txt(page.locator('[data-urine-out]'))) && (await tabs(u)).join() === '-1,-1,0,-1,-1,-1', 'seçim ve tab durağı uyumsuz');
    await page.keyboard.press('End');
    ok(/hekime/.test(await txt(page.locator('[data-urine-out]'))) && /Pancar/.test(await txt(page.locator('[data-urine-out]'))), 'son renk için hekim yönlendirmesi/besin notu yok');
    await ctx.close();
  });

  await test('Beslenme denetimi: haftalık plan temizleme ve doldurma geri alınabilir, elle düzenleme geri almayı kapatır', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/beslenme/');
    const fill = page.locator('[data-wp-fill]');
    await fill.scrollIntoViewIfNeeded();
    ok((await page.locator('[data-wp-undo]').count()) === 0, 'başlangıçta geri alma çubuğu var');
    await fill.click();
    ok((await page.locator('[data-wp-undo]').count()) === 0, 'boş plan doldurulurken geri alma önerildi');
    const filled = await page.locator('[data-shop-item]').count();
    ok(filled > 5, 'plan dolmadı');
    await page.locator('[data-shop-item]').first().check();
    await page.locator('[data-wp-clear]').click();
    ok((await page.locator('[data-shop-item]').count()) === 0, 'plan temizlenmedi');
    ok(/temizlendi/.test(await txt(page.locator('[data-wp-undo]'))), 'geri alma çubuğu yok');
    await page.locator('[data-wp-undo-btn]').click();
    ok((await page.locator('[data-shop-item]').count()) === filled, 'geri alma planı geri getirmedi');
    ok((await page.locator('[data-shop-item]:checked').count()) === 1, 'alışveriş işareti geri gelmedi');
    ok((await page.locator('[data-wp-undo]').count()) === 0, 'geri alınca çubuk kapanmadı');
    const saved = JSON.parse((await store(page, 'libero:beslenme')) ?? 'null');
    ok(saved && saved.ticked.length === 1 && Object.keys(saved.days.pzt.slots).length > 0, 'geri alınan plan kaydedilmedi');
    // doldurma mevcut planın üzerine yazar: geri alınabilir
    await page.locator('[data-wp-slot="pzt-kahvalti"]').selectOption({ index: 1 });
    const chosen = await page.locator('[data-wp-slot="pzt-kahvalti"]').inputValue();
    await fill.click();
    ok(/dolduruldu/.test(await txt(page.locator('[data-wp-undo]'))), 'üzerine yazarken geri alma önerilmedi');
    await page.locator('[data-wp-undo-btn]').click();
    ok((await page.locator('[data-wp-slot="pzt-kahvalti"]').inputValue()) === chosen, 'elle seçilen öğün geri gelmedi');
    // elle düzenleme geri almayı kapatır (eski kaydın sonradan yazılmaması için)
    await page.locator('[data-wp-clear]').click();
    await page.locator('[data-wp-slot="sal-kahvalti"]').selectOption({ index: 1 });
    ok((await page.locator('[data-wp-undo]').count()) === 0, 'elle düzenlemeden sonra geri alma açık kaldı');
    await ctx.close();
  });
};
