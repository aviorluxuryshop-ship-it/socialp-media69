// Video kütüphanesi (tarayıcı): kategori/konu süzgeçleri, derin bağlantı, kapak görseli anahtarı,
// oynatıcı penceresi (odak, Esc, dürüstlük rozetleri, çevrimdışı mesajı), kişisel zaman notları, mobil.
// YouTube e2e içinde engellidir: oynatıcı API'si yüklenemez, bu yüzden not arayüzü oynatıcıya
// dayanmadan (elle süre) sınanır ve "oynatıcı yüklenemedi" yolu gerçekten çalışır.
import fs from 'node:fs';
import path from 'node:path';

export default async (h) => {
  const { ok, test, go, newPage, txt, tmp } = h;
  const num = (s) => Number((s.match(/(\d+)/) ?? [])[1]);
  const total = async (page) => num(await txt(page.locator('.vl__count').first()));
  const noOverflow = async (page, what) => {
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(over <= 1, `${what}: yatay taşma ${over}px`);
  };
  const idOf = async (page) => {
    const src = await page.locator('.vmodal iframe').getAttribute('src');
    return (src.match(/embed\/([\w-]{11})/) ?? [])[1];
  };

  await test('Video kütüphanesi: kategori sekmeleri ve konu çipleri sayılarla çalışır, konu başlıkları görünür', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/videolar/');
    const all = await total(page);
    ok(all >= 50, `video sayısı az: ${all}`);
    const tabs = await page.locator('.vl__tab').allTextContents();
    ok(tabs.length === 5 && /^Tümü/.test(tabs[0]), `sekmeler: ${tabs.join('|')}`);
    ok(num(tabs[0]) === all, 'Tümü sekmesi toplam sayıyı göstermeli');
    const sum = tabs.slice(1).reduce((a, t) => a + num(t), 0);
    ok(sum === all, `grup sayıları toplamı ${sum} ≠ ${all}`);
    ok((await page.locator('.vl__topics .chip').count()) === 14, 'tüm konu çipleri görünmeli');
    ok(/^Pas/.test(await txt(page.locator('.vl__divider-h').first())), 'konu başlığı (Pas) yok');
    await page.locator('.vl__tab', { hasText: 'Kaleci' }).click();
    await page.waitForTimeout(200);
    ok((await total(page)) === num(tabs[3]), 'Kaleci sekmesi sayısı ≠ liste');
    ok((await page.locator('.vl__topics .chip').count()) === 1, 'Kaleci grubunda tek konu çipi olmalı');
    ok((await page.locator('.vl__tab[aria-pressed="true"]').textContent()).includes('Kaleci'), 'etkin sekme işaretli değil');
    await page.locator('.vl__tab', { hasText: 'Oyun ve taktik' }).click();
    await page.locator('.vl__topics .chip', { hasText: 'Taktik' }).click();
    await page.waitForTimeout(200);
    ok((await page.locator('.vl__divider-h').count()) === 1, 'tek konuda tek başlık beklenir');
    ok(page.url().includes('konu=taktik'), `adres güncellenmedi: ${page.url()}`);
    await page.locator('.vl__tab', { hasText: 'Tümü' }).click();
    await page.waitForTimeout(200);
    ok((await total(page)) === all, 'Tümü sekmesi listeyi geri getirmeli');
    await noOverflow(page, '/videolar/ 1280');
    await ctx.close();
  });

  await test('Video kütüphanesi: derin bağlantı (?konu=pas&dil=tr) süzgeci kurar, adres güncellenir ve yenilemede kalır', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/videolar/?konu=pas&dil=tr');
    await page.waitForSelector('.vl__topics .chip[aria-pressed="true"]');
    ok((await txt(page.locator('.vl__topics .chip[aria-pressed="true"]'))).startsWith('Pas'), 'Pas çipi seçili değil');
    ok((await page.locator('.vl__tab[aria-pressed="true"]').textContent()).includes('Teknik'), 'Teknik sekmesi seçili olmalı');
    const langs = await page.locator('.vcard__meta span:first-child').allTextContents();
    ok(langs.length > 0 && langs.every((l) => l === 'TR'), 'yalnızca Türkçe videolar bekleniyordu');
    ok((await total(page)) === langs.length, 'sayı ile kart sayısı uyuşmuyor');
    ok((await page.locator('.vl__active').textContent()).includes('Dil: Türkçe'), 'etkin süzgeç etiketi yok');
    await page.locator('.vl__topics .chip', { hasText: 'Şut ve vuruşlar' }).click();
    await page.waitForTimeout(250);
    ok(/konu=sut/.test(page.url()) && /dil=tr/.test(page.url()), `adres: ${page.url()}`);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.vl__topics .chip[aria-pressed="true"]');
    ok((await txt(page.locator('.vl__topics .chip[aria-pressed="true"]'))).startsWith('Şut'), 'yenilemede konu korunmadı');
    // etkin süzgeci tek tek kaldırma
    await page.getByRole('button', { name: /Süzgeci kaldır: Dil/ }).click();
    await page.waitForTimeout(200);
    ok(!/dil=/.test(page.url()), 'dil süzgeci adresten kalkmalı');
    await go(page, '/videolar/?grup=kaleci');
    await page.waitForSelector('.vl__tab[aria-pressed="true"]');
    ok((await page.locator('.vl__tab[aria-pressed="true"]').textContent()).includes('Kaleci'), 'grup bağlantısı çalışmıyor');
    await ctx.close();
  });

  await test('Video kütüphanesi: arama, seviye, sıralama; boş durum ve gevşetme önerileri', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/videolar/');
    const all = await total(page);
    await page.getByLabel('Videolarda ara').fill('zzzxqq');
    await page.waitForTimeout(250);
    ok((await page.locator('.empty').textContent()).includes('Bu filtrelerle video bulunamadı'), 'boş durum yok');
    ok((await page.locator('.vcard').count()) === 0, 'boş durumda kart olmamalı');
    await page.getByRole('button', { name: 'Tüm süzgeçleri temizle' }).click();
    await page.waitForTimeout(200);
    ok((await total(page)) === all, 'temizleyince tüm videolar dönmeli');
    await page.getByLabel('Videolarda ara').fill('kaleci');
    await page.waitForTimeout(250);
    const kal = await total(page);
    ok(kal > 0 && kal < all, `arama sonucu beklenmedik: ${kal}`);
    await page.getByRole('button', { name: 'Aramayı temizle' }).click();
    await page.locator('select[aria-label="Seviye"]').selectOption('5');
    await page.waitForTimeout(250);
    const l5 = await total(page);
    ok(l5 > 0 && l5 < all && /seviye=5/.test(page.url()), 'seviye süzgeci');
    // boş sonuç + öneri: ileri seviye + kalecilik + İngilizce olmayabilir; öneriler her zaman sonuç doğurur
    await page.locator('select[aria-label="Seviye"]').selectOption('all');
    await page.locator('select[aria-label="Sıralama"]').selectOption('dil');
    await page.waitForTimeout(250);
    const first = await page.locator('.vcard__meta span:first-child').allTextContents();
    ok(first[0] === 'TR', 'dile göre sıralamada Türkçeler önce gelmeli');
    ok(/sirala=dil/.test(page.url()), 'sıralama adreste olmalı');
    await ctx.close();
  });

  await test('Video kütüphanesi: "daha fazla" sayfalama 18 kart ekler', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/videolar/');
    ok((await page.locator('.vcard').count()) === 18, 'ilk sayfa 18 kart olmalı');
    await page.getByRole('button', { name: /Daha fazla göster/ }).click();
    ok((await page.locator('.vcard').count()) === 36, 'ikinci sayfa 36 kart olmalı');
    await ctx.close();
  });

  await test('Kapak görselleri: anahtar kalıcı; kapalıyken YouTube’a görsel isteği gitmez, çizim kapak kalır', async () => {
    const { ctx, page } = await newPage();
    let reqs = 0;
    const count = (r) => { if (/i\.ytimg\.com/.test(r.url())) reqs++; };
    page.on('request', count);
    await go(page, '/videolar/');
    await page.locator('.vcard').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    ok(reqs > 0, 'açıkken küçük resim istenmeli (kullanıcı izniyle)');
    ok((await page.locator('.vcov').count()) >= 18, 'çizim kapaklar her zaman var olmalı');
    const box = page.getByLabel(/Kapak görselleri YouTube’dan yüklensin/);
    ok(await box.isChecked(), 'varsayılan açık');
    await box.uncheck();
    ok((await page.evaluate(() => localStorage.getItem('libero:ui'))).includes('"ytThumbs":false'), 'tercih libero:ui içinde saklanmalı');
    ok(!(await page.evaluate(() => localStorage.getItem('libero:v1') ?? '')).includes('ytThumbs'), 'tercih kritik depoya (yedeğe) yazılmamalı');
    ok((await page.locator('.vcard__img').count()) === 0, 'kapalıyken <img> kalmamalı');
    reqs = 0;
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.vcard').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    ok(reqs === 0, `kapalıyken ${reqs} YouTube görsel isteği gitti`);
    ok(!(await page.getByLabel(/Kapak görselleri YouTube’dan yüklensin/).isChecked()), 'tercih yenilemeden sonra korunmalı');
    ok((await page.locator('.vcov').count()) >= 18, 'kapalıyken çizim kapaklar görünmeli');
    await ctx.close();
  });

  await test('Oynatıcı penceresi: odak tuzağı, Esc, odağı geri verme, rozetler, çevrimdışı mesajı', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/videolar/?dil=tr');
    await page.waitForSelector('.vcard');
    await page.locator('.vcard').first().evaluate((e) => e.setAttribute('data-opener', '1'));
    await page.locator('.vcard').first().click();
    await page.waitForSelector('.vmodal[role="dialog"] iframe');
    const src = await page.locator('.vmodal iframe').getAttribute('src');
    ok(/^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}\?/.test(src) && /enablejsapi=1/.test(src), `iframe src: ${src}`);
    ok((await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))) === 'Videoyu kapat', 'odak kapat düğmesine gitmeli');
    ok((await txt(page.locator('.vmodal'))).includes('Türkçe özet'), 'Türkçe özet yok');
    const trBadges = await txt(page.locator('.vbadges'));
    ok(/Türkçe anlatım/.test(trBadges) && !/altyazı/i.test(trBadges), `Türkçe videoda altyazı iddiası olmamalı: ${trBadges}`);
    ok(/Gömülebilirlik doğrulandı/.test(trBadges), 'doğrulama rozeti yok');
    const yt = await page.locator('.vmodal a[href^="https://www.youtube.com/watch?v="]').count();
    ok(yt >= 1, 'YouTube’da aç bağlantısı yok');
    // YouTube e2e'de engelli → API yüklenemez → dürüst mesaj + YouTube bağlantısı
    await page.waitForSelector('.vmodal__fail', { timeout: 15000 });
    ok((await txt(page.locator('.vmodal__fail'))).includes('Oynatıcıya bağlanılamadı'), 'bağlantı hatası mesajı yok');
    ok((await page.locator('.vmodal__fail a[href^="https://www.youtube.com/watch?v="]').count()) === 1, 'hata ekranında YouTube bağlantısı olmalı');
    await page.getByRole('button', { name: 'Oynatıcıyı yine de göster' }).click();
    ok((await page.locator('.vmodal__fail').count()) === 0, 'yine de göster düğmesi ekranı kaldırmalı');
    ok((await txt(page.locator('.vmodal__banner'))).includes('Oynatıcı bağlantısı kurulamadı'), 'bilgi şeridi görünmeli');
    // odak pencere içinde kalır (ileri ve geri)
    for (let i = 0; i < 45; i++) {
      await page.keyboard.press('Tab');
      ok(await page.evaluate(() => !!document.activeElement?.closest('.vmodal')), `Tab ${i + 1}: odak pencere dışına çıktı`);
    }
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Shift+Tab');
      ok(await page.evaluate(() => !!document.activeElement?.closest('.vmodal')), `Shift+Tab ${i + 1}: odak pencere dışına çıktı`);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    ok((await page.locator('.vmodal').count()) === 0, 'Esc ile kapanmadı');
    ok(await page.evaluate(() => document.activeElement?.getAttribute('data-opener') === '1'), 'odak açan karta dönmeli');
    // dışarı tıklama
    await page.locator('.vcard').first().click();
    await page.waitForSelector('.vmodal');
    await page.mouse.click(4, 450);
    await page.waitForTimeout(250);
    ok((await page.locator('.vmodal').count()) === 0, 'dışarı tıklayınca kapanmalı');
    await ctx.close();
  });

  await test('Oynatıcı penceresi: İngilizce videoda altyazı durumu yalnızca veri destekliyorsa söylenir; ilgili teknik bağlantıları', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/videolar/?dil=en');
    await page.waitForSelector('.vcard');
    let sawTech = false;
    for (let i = 0; i < 6; i++) {
      await page.locator('.vcard').nth(i).click();
      await page.waitForSelector('.vmodal .vbadges');
      const b = await txt(page.locator('.vbadges'));
      ok(/İngilizce anlatım/.test(b), `İngilizce rozet: ${b}`);
      const auto = /otomatik çeviriyle açılabilir/.test(b);
      const unv = /Türkçe özet var; Türkçe altyazı doğrulanamadı/.test(b);
      ok(auto !== unv, `altyazı durumu tam bir tane olmalı: ${b}`);
      const links = await page.locator('.vmodal__rel a[href^="/teknikler/"]').count();
      if (links > 0) {
        sawTech = true;
        ok((await page.locator('.vmodal__rel a').first().getAttribute('href')).endsWith('/'), 'teknik bağlantısı eğik çizgiyle bitmeli');
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
    }
    ok(sawTech, 'ilk altı videodan hiçbirinde ilgili teknik bağlantısı yok');
    await ctx.close();
  });

  await test('Kişisel notlar: ekle, doğrula, yenile → kalır, yedekte geri gelir, chip ile ana dön, sil', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/videolar/?konu=pas&dil=tr');
    await page.waitForSelector('.vcard');
    await page.locator('.vcard').first().click();
    await page.waitForSelector('.vmodal iframe');
    const id = await idOf(page);
    ok(id, 'video kimliği okunamadı');
    // doğrulama iletileri
    await page.getByRole('button', { name: 'Bu ana not ekle' }).click();
    ok((await txt(page.locator('.vmoments__msg'))).includes('Önce notunu yaz'), 'boş not uyarısı');
    await page.getByLabel('Not', { exact: true }).fill('Ayak yerleşimi');
    await page.getByRole('button', { name: 'Bu ana not ekle' }).click();
    ok((await txt(page.locator('.vmoments__msg'))).includes('Oynatıcıdan süre alınamadı'), 'oynatıcı yokken süre isteği');
    await page.getByLabel('Süre (dk:sn)').fill('abc');
    await page.getByRole('button', { name: 'Bu ana not ekle' }).click();
    ok((await txt(page.locator('.vmoments__msg'))).includes('Süreyi 1:25'), 'geçersiz süre uyarısı');
    // geçerli not
    await page.getByLabel('Süre (dk:sn)').fill('1:25');
    await page.getByRole('button', { name: 'Bu ana not ekle' }).click();
    ok((await txt(page.locator('.vmoments__msg'))).includes('Not eklendi: 1:25'), 'ekleme iletisi');
    ok((await page.locator('.vmoment__go').count()) === 1 && (await txt(page.locator('.vmoment__go'))).includes('1:25'), 'not chip’i görünmeli');
    await page.getByLabel('Süre (dk:sn)').fill('0:10');
    await page.getByLabel('Not', { exact: true }).fill('İlk dokunuş');
    await page.keyboard.press('Enter');
    const order = await page.locator('.vmoment__t').allTextContents();
    ok(order.join() === '0:10,1:25', `notlar zamana göre sıralı olmalı: ${order}`);
    await page.waitForTimeout(350); // depo yazımı 120 ms geciktirilir
    const store = JSON.parse(await page.evaluate(() => localStorage.getItem('libero:v1')));
    ok(store.videoMoments?.[id]?.length === 2 && store.videoMoments[id][1].t === 85 && store.videoMoments[id][1].text === 'Ayak yerleşimi', 'not depoda yok');
    ok(store.v === 2, 'şema sürümü değişmemeli');
    // chip → oynatıcı API'si yok → videoyu o saniyeden yeniden başlat
    await page.locator('.vmoment__go', { hasText: '1:25' }).click();
    await page.waitForFunction(() => /[?&]start=85\b/.test(document.querySelector('.vmodal iframe')?.getAttribute('src') ?? ''));
    // yenile → kalır
    await page.keyboard.press('Escape');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.vcard');
    await page.locator('.vcard').first().click();
    await page.waitForSelector('.vmoment__go');
    ok((await page.locator('.vmoment__go').count()) === 2, 'notlar yenilemeden sonra kalmalı');
    await page.keyboard.press('Escape');
    // yedek: indir → sıfırla → geri yükle
    await go(page, '/profil/');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Yedek indir/ }).click()]);
    const file = path.join(tmp, 'video-notlari-yedek.json');
    await dl.saveAs(file);
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    ok(j.data.videoMoments?.[id]?.length === 2, 'yedek video notlarını içermeli');
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: /Tüm verilerimi sil/ }).click();
    await page.waitForTimeout(300);
    ok(!(await page.evaluate(() => localStorage.getItem('libero:v1') ?? '')).includes(id) , 'sıfırlama notları silmeli');
    page.once('dialog', (d) => d.accept());
    await page.setInputFiles('input[type=file][aria-label="Yedek dosyası seç"]', file);
    await page.waitForTimeout(500);
    await go(page, '/videolar/?konu=pas&dil=tr');
    await page.locator('.vcard').first().click();
    await page.waitForSelector('.vmoment__go');
    ok((await page.locator('.vmoment__go').count()) === 2, 'yedekten geri yükleme notları getirmeli');
    // sil
    await page.getByRole('button', { name: /Notu sil: İlk dokunuş/ }).click();
    ok((await page.locator('.vmoment__go').count()) === 1, 'not silinmedi');
    await page.getByRole('button', { name: /Notu sil: Ayak yerleşimi/ }).click();
    ok((await page.locator('.vmoment__go').count()) === 0, 'son not silinmedi');
    await page.waitForTimeout(350);
    const after = JSON.parse(await page.evaluate(() => localStorage.getItem('libero:v1')));
    ok(!after.videoMoments?.[id], 'son not silinince video anahtarı kalkmalı');
    await ctx.close();
  });

  await test('Eski yedek (videoMoments alanı yok) hâlâ yüklenir', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/profil/');
    const old = { app: 'libero', exportedAt: '2026-01-01T00:00:00.000Z', data: { v: 2, profile: { name: 'Eski', age: 14, level: 3, positions: ['stoper'] }, levels: {}, levelLog: [], practiced: {}, fav: [], program: null, logs: [], quiz: {}, tests: [], board: [], videoNotes: {}, lastVisit: null, createdAt: '2026-01-01T00:00:00.000Z' } };
    const file = path.join(tmp, 'eski-yedek.json');
    fs.writeFileSync(file, JSON.stringify(old));
    page.once('dialog', (d) => d.accept());
    await page.setInputFiles('input[type=file][aria-label="Yedek dosyası seç"]', file);
    await page.waitForTimeout(500);
    ok((await page.locator('#p-name').inputValue()) === 'Eski', 'eski yedek yüklenmedi');
    await go(page, '/videolar/');
    ok((await page.locator('.vcard').count()) === 18, 'eski yedekle kütüphane açılmalı');
    await ctx.close();
  });

  await test('Teknik/pozisyon sayfalarındaki video kartı yeni pencereyi açar ve Esc ile kapanır', async () => {
    const { ctx, page } = await newPage();
    await go(page, '/pozisyonlar/kaleci/');
    const n = await page.locator('.vcard').count();
    ok(n > 0, 'kaleci sayfasında video kartı yok');
    await page.locator('.vcard').first().click();
    await page.waitForSelector('.vmodal iframe');
    ok((await page.locator('.vmodal .vmoments').count()) === 1, 'not bölümü olmalı');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    ok((await page.locator('.vmodal').count()) === 0, 'kapanmadı');
    await ctx.close();
  });

  await test('Video kütüphanesi mobil (390): taşma yok, süzgeçler ve pencere kullanılabilir', async () => {
    const { ctx, page } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await go(page, '/videolar/');
    await noOverflow(page, '/videolar/ 390');
    await page.locator('.vcard').first().scrollIntoViewIfNeeded();
    const cardW = await page.locator('.vcard').first().evaluate((e) => e.getBoundingClientRect().width);
    ok(cardW > 300 && cardW <= 390, `kart genişliği: ${cardW}`);
    await page.locator('.vl__tab', { hasText: 'Teknik' }).tap();
    await page.waitForTimeout(200);
    await noOverflow(page, 'sekme seçimi');
    await page.locator('.vcard').first().tap();
    await page.waitForSelector('.vmodal iframe');
    await page.waitForTimeout(400);
    await noOverflow(page, 'oynatıcı penceresi 390');
    const fit = await page.evaluate(() => {
      const p = document.querySelector('.vmodal__panel');
      const c = document.querySelector('.vmodal [aria-label="Videoyu kapat"]').getBoundingClientRect();
      return { sw: p.scrollWidth - p.clientWidth, closeIn: c.top >= 0 && c.right <= window.innerWidth };
    });
    ok(fit.sw <= 1 && fit.closeIn, `pencere mobilde taşıyor: ${JSON.stringify(fit)}`);
    await page.getByLabel('Not', { exact: true }).fill('Mobil not');
    await page.getByLabel('Süre (dk:sn)').fill('2:00');
    await page.getByRole('button', { name: 'Bu ana not ekle' }).tap();
    ok((await page.locator('.vmoment__go').count()) === 1, 'mobilde not eklenemedi');
    await noOverflow(page, 'not eklendikten sonra');
    await page.getByRole('button', { name: 'Videoyu kapat' }).tap();
    await page.waitForTimeout(200);
    ok((await page.locator('.vmodal').count()) === 0, 'mobilde kapanmadı');
    await ctx.close();
  });

  await test('Video kütüphanesi: hareket azaltma tercihinde kart girişi ve pencere animasyonu kapalı', async () => {
    const { ctx, page } = await newPage({ reducedMotion: 'reduce' });
    await go(page, '/videolar/');
    const anim = await page.locator('.vl__grid > li:not(.vl__divider)').first().evaluate((e) => getComputedStyle(e).animationName);
    ok(anim === 'none', `animasyon kapalı olmalı: ${anim}`);
    await page.locator('.vcard').first().click();
    await page.waitForSelector('.vmodal__panel');
    ok((await page.locator('.vmodal__panel').evaluate((e) => getComputedStyle(e).animationName)) === 'none', 'pencere animasyonu kapalı olmalı');
    await ctx.close();
  });
};
