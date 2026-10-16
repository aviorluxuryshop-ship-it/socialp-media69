// Libero — uçtan uca tarayıcı testi (Playwright)
//
// Çalıştırma:
//   npm run build && npm start        # başka bir terminalde (http://localhost:3100)
//   npm run test:e2e                  # BASE=http://localhost:3100 varsayılan
//
// Dış ağ isteklerini engeller (YouTube vb.); yalnızca site davranışı test edilir.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:3100';
const CHROME = [process.env.CHROME_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'].filter(Boolean).find((p) => fs.existsSync(p));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'libero-e2e-'));

const results = [];
const consoleErrors = [];
let browser;

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, ...opts });
  await ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (r) => r.abort());
  const page = await ctx.newPage();
  page.on('pageerror', (e) => consoleErrors.push(`[${page.url()}] pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/ERR_FAILED|net::|Failed to load resource: net::/.test(t)) return; // engellenen dış istekler
    if (page.url().includes('/olmayan-sayfa/')) return; // bilerek açılan 404 sayfası
    consoleErrors.push(`[${page.url()}] ${t}`);
  });
  return { ctx, page };
}

function ok(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function test(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, pass: true, ms: Date.now() - t0 });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    results.push({ name, pass: false, ms: Date.now() - t0, err: e.message.split('\n')[0] });
    console.log(`  ✗ ${name}\n      ${e.message.split('\n')[0]}`);
  }
}

const go = async (page, p) => {
  const r = await page.goto(BASE + p, { waitUntil: 'networkidle' });
  ok(r && r.status() === 200, `${p} → HTTP ${r?.status()}`);
};

// ── yardımcı: test videosu üret (ffmpeg varsa) ─────────────
let testVideo = null;
try {
  testVideo = path.join(tmp, 'test.webm');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30', '-t', '3', '-c:v', 'libvpx', '-b:v', '300k', testVideo]);
} catch {
  testVideo = null;
}

const STATIC_ROUTES = [
  '/', '/teknikler/', '/top-kontrolu/', '/taktik/', '/taktik/test/', '/taktik-tahtasi/', '/pozisyonlar/', '/fiziksel/', '/program/',
  '/beslenme/', '/analiz/performans/', '/analiz/video/', '/analiz/oyuncular/', '/videolar/', '/profil/',
  '/teknikler/ust-dis-vurus/', '/teknikler/ilk-temas/', '/taktik/pres/', '/pozisyonlar/kaleci/', '/fiziksel/goblet-squat/', '/analiz/oyuncular/lionel-messi/',
];

browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
console.log(`Libero e2e → ${BASE}\n`);

await test('Tüm sayfalar 200 döner, başlık (h1) var, konsol hatası yok', async () => {
  const { ctx, page } = await newPage();
  for (const r of STATIC_ROUTES) {
    await go(page, r);
    ok((await page.locator('h1').count()) >= 1, `${r}: h1 yok`);
    ok((await page.locator('html').getAttribute('lang')) === 'tr', `${r}: lang=tr değil`);
  }
  const nf = await page.goto(BASE + '/olmayan-sayfa/');
  ok(nf && nf.status() === 404, '404 sayfası dönmüyor');
  ok((await page.locator('text=sahanın dışında').count()) > 0, '404 sayfasının içeriği yok');
  await ctx.close();
});

await test('Menüler açılıyor ve bağlantılar çalışıyor', async () => {
  const { ctx, page } = await newPage();
  await go(page, '/');
  for (const g of ['Öğren', 'Gelişim', 'Analiz']) {
    await page.locator('.site-nav__btn', { hasText: g }).first().click();
    await page.waitForTimeout(250);
    const links = await page.locator('.mega a, [role="menu"] a, .site-header a[href^="/"]').count();
    ok(links > 3, `${g} menüsünde bağlantı yok`);
  }
  await page.locator('.site-nav__btn', { hasText: 'Gelişim' }).first().click();
  await page.getByRole('link', { name: /Beslenme ve toparlanma/ }).first().click();
  await page.waitForURL('**/beslenme/');
  await ctx.close();
});

await test('Genel arama (Ctrl K): trivela bulunur, makas teknik olarak yok', async () => {
  const { ctx, page } = await newPage();
  await go(page, '/');
  await page.keyboard.press('Control+k');
  const input = page.locator('[role="dialog"] input, input[type="search"]').first();
  await input.fill('trivela');
  await page.waitForTimeout(700);
  const txt = await page.locator('[role="dialog"]').innerText();
  ok(/Üst dış vuruş/i.test(txt), 'trivela → "Üst dış vuruş" bulunamadı');
  ok(/Trivela pası/i.test(txt), 'trivela → "Trivela pası" bulunamadı');
  await input.fill('makas');
  await page.waitForTimeout(700);
  const t2 = (await page.locator('[role="dialog"]').innerText()).toLowerCase();
  ok(!/\bmakas (atış|vuruş|şut)/.test(t2) && !/bisiklet/.test(t2), 'makas teknik olarak listeleniyor');
  await ctx.close();
});

await test('Kütüphane: 100+ teknik, arama, kategori filtresi, makas yok', async () => {
  const { ctx, page } = await newPage();
  await go(page, '/teknikler/');
  const total = await page.locator('.tech-card').count();
  ok(total >= 100, `teknik sayısı az: ${total}`);
  const names = await page.locator('.tech-card__name').allInnerTexts();
  ok(!names.some((n) => /makas/i.test(n)), 'teknik listesinde makas var');
  ok(names.some((n) => /Üst dış vuruş/i.test(n)), '"Üst dış vuruş" listede yok');
  await page.locator('.lib__input').fill('ara pas');
  await page.waitForTimeout(500);
  const hits = await page.locator('.tech-card__name').allInnerTexts();
  ok(hits.length > 0 && hits.some((n) => /ara pas/i.test(n)), `"ara pas" sonucu yok: ${hits.slice(0, 3)}`);
  await page.locator('.lib__input').fill('trivela');
  await page.waitForTimeout(500);
  const tv = await page.locator('.tech-card__name').allInnerTexts();
  ok(tv.some((n) => /Üst dış vuruş/i.test(n)) && tv.some((n) => /Trivela pası/i.test(n)), `trivela sonuçları: ${tv.slice(0, 4)}`);
  const top2 = tv.slice(0, 2).join(' | ');
  ok(/Üst dış vuruş/i.test(top2) && /Trivela pası/i.test(top2), `trivela aramasında ilk iki sonuç trivela teknikleri olmalı: ${top2}`);
  await page.locator('.lib__input').fill('');
  await page.getByRole('button', { name: /^Kalecilik/ }).first().click();
  await page.waitForTimeout(300);
  const gk = await page.locator('.tech-card').count();
  ok(gk > 0 && gk < total, 'kategori filtresi çalışmıyor');
  await ctx.close();
});

await test('Üst dış vuruş sayfası: temas yüzeyi açık, adım adım, hatalar, alıştırma', async () => {
  const { ctx, page } = await newPage();
  await go(page, '/teknikler/ust-dis-vurus/');
  const body = await page.locator('main, body').first().innerText();
  ok(/trivela/i.test(body), 'trivela anılmıyor');
  ok(/dış yüz|ayağın dış|parmak/i.test(body), 'temas yüzeyi açıklanmıyor');
  ok(/Sık yapılan hatalar|Hatalar/i.test(body), 'hatalar bölümü yok');
  ok(/Alıştırmalar/i.test(body), 'alıştırmalar bölümü yok');
  await ctx.close();
});

await test('İç yüzle kavisli pas ile trivela ayrı teknik: temas bölgesi, bağlantı, karıştırma notu', async () => {
  const { ctx, page } = await newPage();
  await go(page, '/teknikler/kavisli-pas/');
  const h1 = await page.locator('h1').first().innerText();
  ok(/İç yüzle kavisli pas/i.test(h1), `kavisli-pas başlığı: ${h1}`);
  const lbl = (await page.locator('svg[aria-label^="Temas yüzeyi"]').first().getAttribute('aria-label')) ?? '';
  ok(/İç yüz/.test(lbl) && !/Üst dış/.test(lbl), `kavisli-pas temas bölgesi yanlış: ${lbl}`);
  const body1 = await page.locator('body').innerText();
  ok(/Karıştırılmasın/.test(body1) && /Trivela pası/.test(body1), 'kavisli-pas sayfasında trivela ayrımı yok');
  await page.locator('a[href="/teknikler/trivela-pasi/"]').first().click();
  await page.waitForURL('**/teknikler/trivela-pasi/');
  const lbl2 = (await page.locator('svg[aria-label^="Temas yüzeyi"]').first().getAttribute('aria-label')) ?? '';
  ok(/Üst dış/.test(lbl2) && !/İç yüz/.test(lbl2), `trivela pası temas bölgesi yanlış: ${lbl2}`);
  const body2 = await page.locator('body').innerText();
  ok(/Ayak üstünün dış bölümü/.test(body2), 'trivela pasında temas yüzeyi açıklanmıyor');
  ok(/Karıştırılmasın/.test(body2) && /İç yüzle kavisli pas/.test(body2) && /Dış ayak ile pas/.test(body2), 'trivela pasında karıştırma notu eksik');
  await ctx.close();
});

await test('Yıldız seviyesi değişir, yenilemeden sonra korunur ve panelde görünür', async () => {
  const { ctx, page } = await newPage();
  await go(page, '/teknikler/ilk-temas/');
  const star4 = page.getByRole('radio', { name: /^4 yıldız/ }).first();
  await star4.click();
  await page.waitForTimeout(400);
  await page.reload({ waitUntil: 'networkidle' });
  ok((await page.getByRole('radio', { name: /^4 yıldız/ }).first().getAttribute('aria-checked')) === 'true', '4 yıldız yenilemeden sonra kayboldu');
  await page.getByRole('radio', { name: /^2 yıldız/ }).first().click();
  await page.reload({ waitUntil: 'networkidle' });
  ok((await page.getByRole('radio', { name: /^2 yıldız/ }).first().getAttribute('aria-checked')) === 'true', 'seviye tekrar değiştirilemedi');
  await go(page, '/profil/');
  ok(/Seviye verilen teknik/i.test(await page.locator('body').innerText()), 'profil özeti yok');
  const n = await page.locator('.summary__item').first().locator('.summary__n').innerText();
  ok(n.trim() === '1', `profilde seviye verilen teknik sayısı ${n} (1 bekleniyordu)`);
  await ctx.close();
});

await test('Program: oluştur → set işaretle → yarım bırak → devam et → bitir → geçmiş', async () => {
  const { ctx, page } = await newPage();
  await go(page, '/program/');
  await page.locator('#w-age').fill('14');
  await page.getByRole('button', { name: /Programımı oluştur/ }).click();
  await page.waitForSelector('.prog__weekbar', { timeout: 8000 });
  await page.getByRole('button', { name: /^Başla/ }).first().click();
  await page.waitForSelector('.setbtn');
  await page.locator('.setbtn').first().click();
  await page.getByRole('button', { name: /Sonra devam et/ }).click();
  await page.reload({ waitUntil: 'networkidle' });
  ok((await page.locator('text=Yarım kalan çalışma').count()) > 0, 'yarım kalan çalışma kartı yok');
  await page.getByRole('button', { name: /Kaldığın yerden devam et/ }).click();
  await page.waitForSelector('.setbtn');
  ok((await page.locator('.setbtn[aria-pressed="true"]').count()) >= 1, 'işaretli set korunmadı');
  await page.getByRole('button', { name: /Antrenmanı bitir/ }).click();
  await page.getByRole('button', { name: /Yarım olarak kaydet/ }).click();
  await page.getByRole('tab', { name: 'Geçmiş' }).click();
  ok((await page.locator('text=/Yarım \\d+\\/\\d+/').count()) > 0, 'geçmişte yarım kayıt yok');
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Geçmiş' }).click();
  ok((await page.locator('text=/Yarım \\d+\\/\\d+/').count()) > 0, 'geçmiş yenilemeden sonra kayboldu');
  await ctx.close();
});

await test('Program: 12 yaş altı için güvenlik uyarısı ve kafa/ağır yük yok', async () => {
  const { ctx, page } = await newPage();
  await go(page, '/program/');
  await page.locator('#w-age').fill('10');
  ok((await page.locator('text=/12 yaş altı|Çocuk/i').count()) > 0, 'yaş bandı uyarısı yok');
  await page.getByRole('button', { name: /Programımı oluştur/ }).click();
  await page.waitForSelector('.prog__weekbar', { timeout: 8000 });
  await page.getByRole('tab', { name: 'Oturumlar' }).click();
  const t = (await page.locator('.prog').innerText()).toLowerCase();
  ok(!/kafa vuruşu|1rm|maksimum tekrar/.test(t), '12 yaş altı programda yasak içerik var');
  await ctx.close();
});

await test('Futbol IQ testi: soru, seçenek, açıklama', async () => {
  const { ctx, page } = await newPage();
  await go(page, '/taktik/test/');
  await page.getByRole('button', { name: /Testi başlat/ }).click();
  await page.waitForSelector('.quiz__opt');
  await page.locator('.quiz__opt').first().click();
  await page.waitForSelector('.quiz__why');
  ok((await page.locator('.quiz__why').count()) > 0, 'açıklama görünmüyor');
  await ctx.close();
});

await test('Taktik tahtası: adım ekle, oyuncu ve top sürüklenir, ok çizilir, kaydet, oynat', async () => {
  const { ctx, page } = await newPage({ viewport: { width: 1360, height: 900 } });
  await go(page, '/taktik-tahtasi/');
  await page.getByRole('button', { name: /Adım ekle/ }).click();
  const a1 = page.locator('.sc-actor[data-id="A1"]');
  ok((await a1.count()) === 1, 'tahtada A1 oyuncusu yok');
  const b = await a1.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 120, b.y + b.height / 2 - 60, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  ok((await page.locator('.sc-arrow').count()) >= 1, 'koşu oku çizilmedi');
  const ball = await page.locator('.sc-ball').boundingBox();
  const a2 = await page.locator('.sc-actor[data-id="A2"]').boundingBox();
  await page.mouse.move(ball.x + ball.width / 2, ball.y + ball.height / 2);
  await page.mouse.down();
  await page.mouse.move(a2.x + a2.width / 2, a2.y + a2.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  await page.getByLabel('Tahta adı').fill('Test planı');
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await page.waitForTimeout(300);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('libero:v1')).board.length);
  ok(saved === 1, 'tahta kaydedilmedi');
  await page.getByRole('button', { name: 'Oynat' }).click();
  await page.waitForTimeout(800);
  await ctx.close();
});

await test('Beslenme: alerji filtresi ve alternatif bulucu', async () => {
  const { ctx, page } = await newPage();
  await go(page, '/beslenme/');
  ok((await page.locator('text=/diyetisyen hizmeti yoktur/i').count()) > 0, 'diyetisyen uyarısı yok');
  const before = await page.locator('.meal').count().catch(() => 0);
  await page.getByRole('button', { name: /^Süt ve süt ürünleri/ }).first().click();
  await page.waitForTimeout(300);
  const mealsText = (await page.locator('main').innerText()).toLowerCase();
  ok(!/içerir:[^\n]*süt ve süt ürünleri/.test(mealsText), 'süt alerjisi filtrelenmedi');
  await page.getByRole('button', { name: /Tavuk göğsü/ }).first().click();
  await page.waitForTimeout(300);
  ok((await page.locator('.alts__t').count()) >= 3, 'alternatif listesi boş');
  void before;
  await ctx.close();
});

await test('Performans: test ölçümü kaydedilir, yenilemeden sonra durur, değişim gösterilir', async () => {
  const { ctx, page } = await newPage();
  await go(page, '/analiz/performans/');
  await page.locator('#t-val').fill('2,10');
  await page.getByRole('button', { name: /^Kaydet/ }).click();
  await page.locator('#t-date').fill('2026-01-01').catch(() => {});
  await page.locator('#t-val').fill('2,05');
  await page.getByRole('button', { name: /^Kaydet/ }).click();
  await page.waitForTimeout(300);
  const txt = await page.locator('.testcard').first().innerText();
  ok(/2,05/.test(txt) && /iyileşme|Değişmedi|geriledi/.test(txt), `test kartı beklenen içerikte değil: ${txt.slice(0, 120)}`);
  await page.reload({ waitUntil: 'networkidle' });
  ok((await page.locator('.testcard').count()) >= 1, 'test kaydı yenilemeden sonra kayboldu');
  await page.locator('#t-val').fill('99');
  await page.getByRole('button', { name: /^Kaydet/ }).click();
  ok((await page.locator('text=/aralığında bir değer/').count()) > 0, 'aralık dışı değer reddedilmedi');
  await ctx.close();
});

await test('Video analizi: yükle, kare adımı, çiz, işaret ekle, yenile → notlar geri gelir', async () => {
  ok(testVideo, 'ffmpeg yok, test videosu üretilemedi');
  const { ctx, page } = await newPage();
  await go(page, '/analiz/video/');
  await page.setInputFiles('input[type=file]', testVideo);
  await page.waitForSelector('video');
  await page.waitForFunction(() => document.querySelector('video').readyState >= 2);
  await page.getByRole('button', { name: 'Bir kare ileri' }).click();
  await page.getByRole('button', { name: 'Bir kare ileri' }).click();
  const t = await page.evaluate(() => document.querySelector('video').currentTime);
  ok(t > 0.04 && t < 0.12, `kare adımı beklenmeyen: ${t}`);
  await page.getByRole('button', { name: 'Çizgi', exact: true }).click();
  const box = await page.locator('canvas').boundingBox();
  await page.mouse.move(box.x + 60, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + 220, box.y + 140, { steps: 5 });
  await page.mouse.up();
  await page.locator('#vl-label').fill('Deneme');
  await page.getByRole('button', { name: /İşaret ekle/ }).click();
  ok((await page.locator('.vlab__markers li').count()) === 1, 'işaret eklenmedi');
  await page.reload({ waitUntil: 'networkidle' });
  await page.setInputFiles('input[type=file]', testVideo);
  await page.waitForSelector('video');
  await page.waitForTimeout(400);
  ok((await page.locator('.vlab__markers li').count()) === 1, 'notlar yenilemeden sonra geri gelmedi');
  await ctx.close();
});

await test('Profil: kaydet, yedek indir, sıfırla, yedekten geri yükle', async () => {
  const { ctx, page } = await newPage();
  await go(page, '/profil/');
  await page.locator('#p-name').fill('Efe');
  await page.locator('#p-age').fill('15');
  await page.getByRole('button', { name: 'Stoper', exact: true }).click();
  await page.waitForTimeout(400);
  await page.reload({ waitUntil: 'networkidle' });
  ok((await page.locator('#p-name').inputValue()) === 'Efe', 'ad kalıcı değil');
  ok((await page.locator('#p-age').inputValue()) === '15', 'yaş kalıcı değil');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Yedek indir/ }).click()]);
  const file = path.join(tmp, 'yedek.json');
  await dl.saveAs(file);
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  ok(j.app === 'libero' && j.data.profile.name === 'Efe', 'yedek içeriği hatalı');
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /Tüm verilerimi sil/ }).click();
  await page.waitForTimeout(300);
  ok((await page.locator('#p-name').inputValue()) === '', 'sıfırlama çalışmadı');
  page.once('dialog', (d) => d.accept());
  await page.setInputFiles('input[type=file][aria-label="Yedek dosyası seç"]', file);
  await page.waitForTimeout(500);
  ok((await page.locator('#p-name').inputValue()) === 'Efe', 'yedekten geri yükleme çalışmadı');
  await ctx.close();
});

await test('Videolar: filtre, kart, oynatıcı penceresi (youtube-nocookie), Esc ile kapanır', async () => {
  const { ctx, page } = await newPage();
  await go(page, '/videolar/');
  const countText = await page.locator('[role="status"]').first().innerText();
  const total = Number((countText.match(/(\d+)/) ?? [])[1]);
  ok(total >= 50, `video sayısı az: ${countText}`);
  ok((await page.locator('.vcard').count()) === 18, 'ilk sayfada 18 kart bekleniyordu');
  await page.getByRole('button', { name: /Daha fazla göster/ }).click();
  ok((await page.locator('.vcard').count()) === 36, '"Daha fazla göster" çalışmıyor');
  await page.getByRole('button', { name: 'Türkçe', exact: true }).click();
  await page.waitForTimeout(300);
  const meta = await page.locator('.vcard__meta span:first-child').allInnerTexts();
  ok(meta.length > 0 && meta.every((m) => m === 'TR'), 'Türkçe filtresi İngilizce video bırakıyor');
  await page.locator('.vcard').first().click();
  await page.waitForSelector('.vmodal iframe');
  const src = await page.locator('.vmodal iframe').getAttribute('src');
  ok(/^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}\?/.test(src), `iframe src beklenen değil: ${src}`);
  ok(/cc_lang_pref=tr/.test(src), 'Türkçe altyazı tercihi yok');
  ok((await page.locator('.vmodal >> text=Türkçe özet').count()) > 0, 'Türkçe özet yok');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  ok((await page.locator('.vmodal').count()) === 0, 'Esc ile kapanmadı');
  await page.locator('#v-pos, select[aria-label="Pozisyon"]').first().selectOption('kaleci');
  await page.waitForTimeout(300);
  ok((await page.locator('.vcard').count()) > 0, 'kaleci filtresi boş');
  await ctx.close();
});

await test('Teknik sayfasında doğrulanmış video(lar) ya da dürüst boş durum', async () => {
  const { ctx, page } = await newPage();
  await go(page, '/teknikler/ust-dis-vurus/');
  const n = await page.locator('#video .vcard').count();
  const empty = await page.locator('#video >> text=henüz doğrulanmış bir video eklenmedi').count();
  ok(n > 0 || empty > 0, 'video bölümü ne video ne açıklama gösteriyor');
  await ctx.close();
});

await test('Mobil (390px): yatay taşma yok, menü açılır', async () => {
  const { ctx, page } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  for (const r of STATIC_ROUTES) {
    await go(page, r);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(over <= 1, `${r}: yatay taşma ${over}px`);
  }
  await go(page, '/');
  await page.getByRole('button', { name: 'Menüyü aç' }).click();
  await page.waitForTimeout(300);
  ok((await page.locator('a[href="/videolar/"]:visible').count()) > 0, 'mobil menüde Videolar bağlantısı görünmüyor');
  await ctx.close();
});

await test('Konsol hatası yok', async () => {
  ok(consoleErrors.length === 0, `${consoleErrors.length} konsol hatası: ${consoleErrors.slice(0, 3).join(' | ')}`);
});

await browser.close();
fs.rmSync(tmp, { recursive: true, force: true });

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} test geçti.`);
if (failed.length) {
  console.log('Başarısız: ' + failed.map((f) => f.name).join('; '));
  process.exit(1);
}
