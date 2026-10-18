// "Hareketi izle" — sert şut, alından kafa vuruşu ve uzun pas sayfaları: oynatıcı var, vurgulanan bölge ve temas etiketi
// tekniğin sayfasındaki (BootMap, "Temas:" etiketi) ile aynı, evre açıklamaları teknikle uyumlu, hareketi azalt şeridi, 390 px.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// temas anı (tc) hareket verisinden okunur: veri değişince test de uyum sağlar
const tcOf = (slug) => {
  const src = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/technique-motion', `${slug}.ts`), 'utf8');
  return Number(/^\s*tc:\s*([0-9.]+)/m.exec(src)[1]);
};

export default async ({ newPage, go, ok, test, txt, txts }) => {
  const ROOT = '[data-tm]';
  const attr = (page, a) => page.locator(ROOT).getAttribute(a);
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

  // her teknik için: sayfadaki "Temas:" etiketinde geçmesi gereken ifade, temas çipi, vurgulanan bölgeler, lens etiketi, evre açıklaması anahtarları, temas anı
  const CASES = [
    {
      slug: 'sert-sut',
      contactText: /Ayak üstü/i,
      foot: ['ustTam'],
      contact: 'ustTam',
      chip: 'Ayak üstü (bağcık)',
      lens: 'AYAK ÜSTÜ',
      tc: tcOf('sert-sut'),
      keys: [/basma ayağınızı topun yanına/i, /bağcık/i, /vuruş ayağınızın üstüne/i],
    },
    {
      slug: 'uzun-pas',
      contactText: /iç bölüm.*iç yüz|iç yüz/i,
      foot: ['ic', 'ustIc'],
      contact: 'ustIc',
      chip: 'Üst iç — iç ayak üstü',
      lens: 'ÜST İÇ',
      tc: tcOf('uzun-pas'),
      keys: [/son adımı en uzun/i, /iç ayak üstü/i, /yukarı ve hedefe/i],
    },
    {
      slug: 'alin-kafa',
      contactText: /Alın/,
      foot: [],
      contact: 'alin',
      chip: 'Alın',
      lens: 'ALIN',
      tc: tcOf('alin-kafa'),
      keys: [/gövdenizi geriye gerin/i, /alnınızın ortasıyla/i, /dengenizi koruyun/i],
    },
  ];

  for (const c of CASES) {
    await test(`Hareketi izle (${c.slug}): oynatıcı var, dürüst etiket görünür, temas etiketi ve bölge adları tekniğin sayfasıyla aynı`, async () => {
      const { page, ctx } = await newPage();
      await go(page, `/teknikler/${c.slug}/`);
      ok((await page.locator(ROOT).count()) === 1 && (await attr(page, 'data-tm-id')) === c.slug, 'oynatıcı yok');
      ok(/Hareketi izle/.test(await txt(page.locator('#hareketi-izle h2'))), 'bölüm başlığı');
      ok(/Şematik hareket gösterimi; gerçek oyuncu videosu ya da hareket yakalama değildir\./.test(await txt(page.locator(`${ROOT} [data-tm-honest]`))), 'dürüst etiket');
      await toSection(page);
      ok(await page.locator(`${ROOT} [data-tm-honest]`).isVisible(), 'dürüst etiket görünmüyor');
      // tekniğin sayfasındaki "Temas:" etiketi
      const tag = await txt(page.locator('.tech-meta .tag', { hasText: 'Temas:' }));
      ok(c.contactText.test(tag), `Temas etiketi: ${tag}`);
      // bölge çipleri: foot[] ile aynı küme (BootMap'teki ad); kafada Alın
      const chips = await page.locator(`${ROOT} .tm__live [data-zone-chip]`).evaluateAll((els) => els.map((e) => ({ z: e.getAttribute('data-zone-chip'), t: e.textContent.trim(), c: e.getAttribute('data-contact') })));
      const wantZones = c.foot.length ? c.foot : ['alin'];
      ok(chips.map((x) => x.z).sort().join() === [...wantZones].sort().join(), `çipler ${chips.map((x) => x.z)} ≠ ${wantZones}`);
      ok(chips.find((x) => x.c === 'true')?.z === c.contact, `temas çipi ${JSON.stringify(chips)}`);
      ok(chips.find((x) => x.z === c.contact).t === c.chip, `temas çipi adı: ${chips.find((x) => x.z === c.contact).t}`);
      if (c.foot.length) {
        const bootFoot = ((await page.locator('[data-bootmap]').getAttribute('data-foot')) ?? '').split(',').filter(Boolean).sort();
        ok(bootFoot.join() === [...c.foot].sort().join(), `BootMap foot ${bootFoot}`);
        const bootNames = await txts(page.locator('[data-zone-item] b'));
        for (const x of chips) ok(bootNames.includes(x.t), `çip adı BootMap'te yok: ${x.t} (${bootNames})`);
      } else {
        ok((await page.locator('[data-bootmap]').count()) === 0, 'kafa tekniğinde krampon haritası olmamalı');
        ok(/Çocuk ve ergen/.test(await txt(page.locator('.note--warn'))), 'sayfadaki çocuk güvenliği notu');
        ok(/Güvenlik/.test(await txt(page.locator(`${ROOT} .tm__note`).first())), 'hareket notu güvenlik notuna yönlendirmeli');
      }
      // temas anında: yalnızca foot[] bölgeleri (ya da alın) vurgulanır, asıl bölge parlar, yakın çekim etiketi doğru
      await scrub(page, c.tc);
      ok(Number(await attr(page, 'data-glow')) > 0.9, `vurgu ${await attr(page, 'data-glow')}`);
      ok((await attr(page, 'data-phase')) === 'temas', 'temas evresi');
      const zonesOn = await page.locator(`${ROOT} .tm__live svg.tm-svg [data-zone]`).evaluateAll((els) => els.map((e) => ({ z: e.getAttribute('data-zone'), on: e.getAttribute('data-active') })));
      if (c.foot.length) {
        ok(zonesOn.map((z) => z.z).sort().join() === [...c.foot].sort().join(), `vurgulanan bölgeler ${zonesOn.map((z) => z.z)}`);
        ok(zonesOn.filter((z) => z.on === 'true').map((z) => z.z).join() === c.contact, `parlayan bölge ${JSON.stringify(zonesOn)}`);
      } else ok(zonesOn.length === 0, 'kafa vuruşunda ayak bölgesi yanmamalı');
      ok((await page.locator(`${ROOT} [data-zone-chip="${c.contact}"]`).getAttribute('data-hot')) === 'true', 'temas çipi parlamıyor');
      ok((await page.locator(`${ROOT} .tm__live svg.tm-svg [data-lens]`).count()) === 1, 'yakın çekim yok');
      ok((await txt(page.locator(`${ROOT} .tm__live svg.tm-svg [data-lens] text`))).trim() === c.lens, `yakın çekim etiketi: ${await txt(page.locator(`${ROOT} .tm__live svg.tm-svg [data-lens] text`))}`);
      for (const z of c.foot) if (z !== c.contact) ok((await page.locator(`${ROOT} [data-zone-chip="${z}"]`).getAttribute('data-hot')) === 'false', `${z} çipi parlamamalı`);
      // temas dışında vurgu yok
      await scrub(page, 0.2);
      ok((await page.locator(`${ROOT} .tm__live svg.tm-svg [data-lens]`).count()) === 0 && (await page.locator(`${ROOT} .tm__live svg.tm-svg [data-zone][data-active="true"]`).count()) === 0, 'temas dışında vurgu görünüyor');
      await ctx.close();
    });

    await test(`Hareketi izle (${c.slug}): evre adı ve açıklaması teknikle uyumlu, svg adı evreyi söyler, kaydırma çubuğu evreyi değiştirir`, async () => {
      const { page, ctx } = await newPage();
      await go(page, `/teknikler/${c.slug}/`);
      await toSection(page);
      const range = page.locator('[data-tm-range]');
      const stages = [
        [0.05, /Hazırlık/, c.keys[0]],
        [c.tc, /Temas/, c.keys[1]],
        [2.65, /Takip/, c.keys[2]],
      ];
      for (const [t, pill, cap] of stages) {
        await scrub(page, t);
        const p = await txt(page.locator(`${ROOT} [data-tm-phase]`));
        const caption = await txt(page.locator(`${ROOT} [data-tm-caption]`));
        const aria = await page.locator(`${ROOT} .tm__live svg.tm-svg`).getAttribute('aria-label');
        ok(pill.test(p) && new RegExp(`Şu anki evre: ${p.trim()}`).test(aria), `evre ${p} / ${aria}`);
        ok(cap.test(caption), `açıklama ${t} sn: ${caption}`);
      }
      ok(/saniye, Takip evresi/.test((await range.getAttribute('aria-valuetext')) ?? ''), 'aria-valuetext');
      ok((await range.getAttribute('aria-label')) === 'Hareket zamanı', 'kaydırma çubuğu etiketi');
      // gruplar adlı
      ok(/hareket gösterimi/.test((await page.locator(`${ROOT} .tm__live`).getAttribute('aria-label')) ?? ''), 'grup etiketi');
      ok((await page.locator(`${ROOT} .tm__live svg.tm-svg`).getAttribute('aria-label')).includes('sağ ayaklı oyuncu'), 'svg etiketi');
      await ctx.close();
    });

    await test(`Hareketi izle (${c.slug}): görünür olunca kendiliğinden oynar, duraklat/oynat çalışır, bitince başa sarar`, async () => {
      const { page, ctx } = await newPage();
      await go(page, `/teknikler/${c.slug}/`);
      ok((await attr(page, 'data-playing')) === 'false' && (await attr(page, 'data-raf')) === 'off', 'görünmezken oynamamalı');
      await toSection(page);
      await page.waitForFunction(() => document.querySelector('[data-tm]').dataset.playing === 'true', null, { timeout: 5000 });
      const t0 = Number(await attr(page, 'data-t'));
      await page.waitForTimeout(500);
      ok(Number(await attr(page, 'data-t')) > t0 + 0.2 || Number(await attr(page, 'data-t')) < t0, 'zaman ilerlemiyor');
      await page.locator('[data-tm-play]').click();
      ok((await attr(page, 'data-playing')) === 'false' && (await attr(page, 'data-raf')) === 'off', 'duraklatılmadı');
      await ctx.close();
    });

    await test(`Hareketi izle (${c.slug}): hareketi azalt tercihinde üç karelik şerit — Hazırlık, Temas, Takip — açıklamalarla görünür, canlı oynatıcı yok`, async () => {
      const { page, ctx } = await newPage({ reducedMotion: 'reduce' });
      await go(page, `/teknikler/${c.slug}/`);
      await toSection(page);
      await page.waitForTimeout(500);
      ok(await page.locator(`${ROOT} [data-tm-strip]`).isVisible(), 'sabit şerit görünmüyor');
      ok(!(await page.locator(`${ROOT} .tm__live`).isVisible()), 'canlı oynatıcı gizli olmalı');
      const frames = page.locator(`${ROOT} [data-tm-strip] figure[data-frame]`);
      ok((await frames.count()) === 3, 'üç kare');
      ok((await frames.evaluateAll((els) => els.map((e) => e.getAttribute('data-frame')))).join() === 'hazirlik,temas,takip', 'kare evreleri');
      const caps = [];
      for (let i = 0; i < 3; i++) {
        const f = frames.nth(i);
        ok(await f.isVisible(), `kare ${i} görünmüyor`);
        const cap = await txt(f.locator('figcaption .tm__cap'));
        caps.push(cap);
        ok(cap.trim().length > 40 && c.keys[i].test(cap), `kare ${i} açıklaması: ${cap}`);
        ok(/evresi sabit kare/.test(await f.locator('svg.tm-svg').getAttribute('aria-label')), `kare ${i} etiketi`);
      }
      const act = await frames.evaluateAll((els) => els.map((e) => e.querySelectorAll('[data-zone][data-active="true"]').length));
      const lens = await frames.evaluateAll((els) => els.map((e) => e.querySelectorAll('[data-lens]').length));
      ok(lens.join() === '0,1,0', `yakın çekim yalnızca Temas karesinde: ${lens}`);
      ok(act.join() === (c.foot.length ? '0,1,0' : '0,0,0'), `parlayan bölge sayıları ${act}`);
      const lensTxt = await txt(frames.nth(1).locator('[data-lens] text'));
      ok(lensTxt.trim() === c.lens, `Temas karesinde etiket: ${lensTxt}`);
      ok((await attr(page, 'data-playing')) === 'false' && (await attr(page, 'data-raf')) === 'off', 'hareketi azaltta oynamamalı');
      ok(/Şematik hareket gösterimi/.test(await txt(page.locator(`${ROOT} [data-tm-honest]`))), 'dürüst etiket');
      await ctx.close();
    });

    await test(`Hareketi izle (${c.slug}): 390 px genişlikte yatay taşma yok, sahne ve denetimler sığar`, async () => {
      const { page, ctx } = await newPage({ viewport: { width: 390, height: 844 } });
      await go(page, `/teknikler/${c.slug}/`);
      await toSection(page);
      await page.waitForTimeout(300);
      const m = await page.evaluate(() => {
        const r = (s) => document.querySelector(s)?.getBoundingClientRect();
        const st = r('[data-tm] .tm__stage');
        const ctl = r('[data-tm] .tm__ctl');
        const chips = r('[data-tm] .tm__zones');
        return { sw: document.documentElement.scrollWidth, iw: innerWidth, stage: st && [st.left, st.right], ctl: ctl && [ctl.left, ctl.right], chips: chips && [chips.left, chips.right] };
      });
      ok(m.sw <= m.iw + 1, `yatay taşma ${m.sw} > ${m.iw}`);
      ok(m.stage[0] >= 0 && m.stage[1] <= m.iw + 1 && m.ctl[1] <= m.iw + 1 && m.chips[1] <= m.iw + 1, `bileşen taşıyor ${JSON.stringify(m)}`);
      await ctx.close();
    });
  }

  await test('Hareketi izle (sert şut ↔ uzun pas ↔ kafa): her sayfada yalnızca kendi tekniğinin yüzeyi ve açıklamaları vardır', async () => {
    const { page, ctx } = await newPage();
    const seen = {};
    for (const c of CASES) {
      await go(page, `/teknikler/${c.slug}/`);
      await toSection(page);
      seen[c.slug] = {
        chips: (await txts(page.locator(`${ROOT} .tm__live [data-zone-chip]`))).join('|'),
        caps: (await txts(page.locator(`${ROOT} [data-tm-strip] .tm__cap`))).join(' '),
      };
    }
    ok(seen['sert-sut'].chips === 'Ayak üstü (bağcık)', seen['sert-sut'].chips);
    ok(/İç yüz/.test(seen['uzun-pas'].chips) && /Üst iç/.test(seen['uzun-pas'].chips) && !/Üst dış|Dış kenar/.test(seen['uzun-pas'].chips), seen['uzun-pas'].chips);
    ok(seen['alin-kafa'].chips === 'Alın', seen['alin-kafa'].chips);
    ok(!/iç yüz|trivela|dış/i.test(seen['sert-sut'].caps) && !/dış|trivela|bağcık/i.test(seen['uzun-pas'].caps), 'açıklamalarda başka tekniğin yüzeyi geçiyor');
    await ctx.close();
  });
};
