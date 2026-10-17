// Krampon temas yüzeyi haritası: bölge → görünüm eşlemesi ve veri tutarlılığı (tarayıcısız).
export const include = ['lib/boot.ts', 'lib/boot-shapes.ts', 'data/index.ts'];

const ALL_ZONES = ['ic', 'dis', 'ustTam', 'ustDis', 'ustIc', 'uc', 'topuk', 'taban'];

export default async ({ ok, test, load }) => {
  const boot = await load('lib/boot.js');
  const shapes = await load('lib/boot-shapes.js');
  const data = await load('data/index.js');
  const { TECHNIQUES, TECH_BY_ID } = data;
  const { VIEW_ZONES, VIEW_ORDER, ZONES, VIEWS, viewsFor, viewsOfZone, zonesVisibleIn, primaryView, ballZone, bootAriaLabel, orderZones } = boot;
  const { GEO } = shapes;
  const withFoot = TECHNIQUES.filter((t) => t.foot && t.foot.length > 0);

  await test('Krampon: her bölgenin etiketi ve en az bir görünümü var, çizim geometrisi eşleşir', async () => {
    for (const z of ALL_ZONES) {
      ok(ZONES[z] && ZONES[z].label && ZONES[z].note && ZONES[z].short, `${z}: bölge bilgisi eksik`);
      ok(viewsOfZone(z).length >= 1, `${z}: hiçbir görünümde görünmüyor`);
    }
    for (const v of VIEW_ORDER) {
      ok(VIEWS[v] && VIEWS[v].label, `${v}: görünüm bilgisi eksik`);
      const geoZones = Object.keys(GEO[v].zones).sort().join(',');
      ok(geoZones === [...VIEW_ZONES[v]].sort().join(','), `${v}: çizim geometrisi (${geoZones}) ile VIEW_ZONES (${VIEW_ZONES[v].join(',')}) uyuşmuyor`);
      for (const z of VIEW_ZONES[v]) {
        const s = GEO[v].zones[z];
        ok(s.d && s.d.length > 20, `${v}/${z}: yol boş`);
        ok(s.ball && s.ball.r > 10, `${v}/${z}: top geometrisi yok`);
        ok(Number.isFinite(s.px + s.py + s.lx + s.ly), `${v}/${z}: etiket konumu geçersiz`);
      }
    }
  });

  await test(`Krampon: ${withFoot.length} tekniğin her bölgesi en az bir görünümde çizilir`, async () => {
    ok(withFoot.length >= 40, `foot[] olan teknik sayısı beklenenden az: ${withFoot.length}`);
    for (const t of withFoot) {
      const views = viewsFor(t.foot);
      ok(views.length >= 1, `${t.id}: görünüm yok`);
      const seen = new Set();
      for (const v of views) for (const z of zonesVisibleIn(v, t.foot)) seen.add(z);
      for (const z of t.foot) ok(seen.has(z), `${t.id}: ${z} hiçbir görünümde görünmüyor`);
      ok(seen.size === new Set(t.foot).size, `${t.id}: görünen bölge sayısı ${seen.size} ≠ ${new Set(t.foot).size}`);
    }
  });

  await test('Krampon: ilk açılan görünüm vurgulu bölge içerir; top o görünümde bir bölgeye değer', async () => {
    for (const t of withFoot) {
      const pv = primaryView(t.foot);
      ok(viewsFor(t.foot).includes(pv), `${t.id}: ilk görünüm (${pv}) geçerli değil`);
      ok(zonesVisibleIn(pv, t.foot).length >= 1, `${t.id}: ilk görünümde vurgulu bölge yok`);
      const bz = ballZone(pv, t.foot);
      ok(bz && GEO[pv].zones[bz]?.ball, `${t.id}: ${pv} görünümünde top bölgesi yok`);
      ok(t.foot.includes(bz), `${t.id}: top yanlış bölgede (${bz})`);
    }
  });

  await test('Krampon: bölge sırası kanonik, tekrarlar atılır, görünüm sırası sabit', async () => {
    ok(orderZones(['uc', 'ustDis', 'ic', 'ic']).join(',') === 'ic,ustDis,uc', 'kanonik sıra bozuk');
    ok(viewsFor(['ustDis']).join(',') === 'ust,dis', `ustDis görünümleri: ${viewsFor(['ustDis'])}`);
    ok(viewsFor(['taban']).join(',') === 'taban', `taban görünümleri: ${viewsFor(['taban'])}`);
    ok(viewsFor(['uc', 'ustTam']).join(',') === 'ust', `uç+ayak üstü görünümleri: ${viewsFor(['uc', 'ustTam'])}`);
    ok(primaryView(['taban', 'ic']) === 'taban', 'yazarın ilk bölgesi (taban) ilk görünümü belirlemeli');
    ok(primaryView(['ic', 'ustIc']) === 'ic', 'iç yüz + iç ayak üstü iç yüz görünümüyle açılmalı');
    ok(primaryView([]) === 'ust', 'boş bölge listesi için güvenli varsayılan');
  });

  await test('Krampon: trivela = dış ayak üstü; dış kenar ve iç yüzle karıştırılmaz', async () => {
    ok(ZONES.ustDis.label.includes('trivela'), 'üst dış etiketi trivela yüzeyini adlandırmalı');
    ok(/dış kenar değildir/i.test(ZONES.ustDis.note), 'üst dış açıklaması dış kenardan ayırmalı');
    ok(ZONES.dis.label === 'Dış kenar', `dış kenar etiketi: ${ZONES.dis.label}`);
    ok(ZONES.ic.label.includes('ayak içi'), 'iç yüz etiketi ayak içini adlandırmalı');
    const get = (id) => {
      const t = TECH_BY_ID[id];
      ok(t, `${id}: teknik yok`);
      return [...(t.foot ?? [])].sort().join(',');
    };
    ok(get('trivela-pasi') === 'ustDis', `trivela-pasi: ${get('trivela-pasi')}`);
    ok(get('ust-dis-vurus') === 'ustDis', `ust-dis-vurus: ${get('ust-dis-vurus')}`);
    ok(get('dis-ayak-pasi') === 'dis', `dis-ayak-pasi: ${get('dis-ayak-pasi')}`);
    ok(get('dis-kenar-sutu') === 'dis', `dis-kenar-sutu: ${get('dis-kenar-sutu')}`);
    ok(get('kavisli-pas') === 'ic,ustIc', `kavisli-pas: ${get('kavisli-pas')}`);
    ok(get('falsolu-sut') === 'ic,ustIc', `falsolu-sut: ${get('falsolu-sut')}`);
    ok(get('topukla-pas') === 'topuk', `topukla-pas: ${get('topukla-pas')}`);
    ok(get('sert-sut') === 'ustTam', `sert-sut: ${get('sert-sut')}`);
    ok(get('taban-kontrol') === 'taban', `taban-kontrol: ${get('taban-kontrol')}`);
    // üç komşu teknik birbirinden ayrı bölge kümeleri kullanır
    const sets = ['trivela-pasi', 'kavisli-pas', 'dis-ayak-pasi'].map(get);
    ok(new Set(sets).size === 3, `trivela / kavisli / dış ayak aynı bölgeleri kullanıyor: ${sets.join(' | ')}`);
    // trivela dış kenarı, dış ayak pası dış ayak üstünü vurgulamaz
    ok(!TECH_BY_ID['trivela-pasi'].foot.includes('dis') && !TECH_BY_ID['trivela-pasi'].foot.includes('ic'), 'trivela pası dış kenar/iç yüz içermemeli');
    ok(!TECH_BY_ID['dis-ayak-pasi'].foot.includes('ustDis'), 'dış ayak pası üst dışı içermemeli');
    // yüzeyler farklı görünümlerde: trivela üstten ve dıştan görünür, iç yüz içeriden
    ok(viewsOfZone('ustDis').join(',') === 'ust,dis', `ustDis görünümleri: ${viewsOfZone('ustDis')}`);
    ok(viewsOfZone('ic').join(',') === 'ic', `ic görünümleri: ${viewsOfZone('ic')}`);
    ok(viewsOfZone('dis').join(',') === 'dis', `dis görünümleri: ${viewsOfZone('dis')}`);
  });

  await test('Krampon: temas metni ile foot[] bölgeleri çelişmez', async () => {
    const rules = {
      topuk: /topuk/,
      taban: /taban/,
      uc: /uç|ucu|burun/,
      dis: /dış/,
      ustDis: /dış/,
      ic: /iç/,
      ustIc: /iç/,
      ustTam: /ayak üstü|bağcık/,
    };
    const bad = [];
    for (const t of withFoot) {
      const text = t.contact.toLocaleLowerCase('tr');
      for (const z of t.foot) if (!rules[z].test(text)) bad.push(`${t.id}: foot[] içinde ${z} var ama temas metni bunu anmıyor (“${t.contact}”)`);
      if (/topuk/.test(text) && !t.foot.includes('topuk')) bad.push(`${t.id}: temas metni topuğu anıyor ama foot[] içermiyor`);
      if (/taban/.test(text) && !t.foot.includes('taban')) bad.push(`${t.id}: temas metni tabanı anıyor ama foot[] içermiyor`);
    }
    ok(bad.length === 0, bad.join(' | '));
  });

  await test('Krampon: erişilebilir açıklama Türkçe, ayakları ve bölgeleri adlandırır', async () => {
    const a = bootAriaLabel('ust', ['ustDis'], false);
    ok(/^Sağ krampon, üstten görünüm\./.test(a), `sağ ayak başlığı: ${a}`);
    ok(/üst dış — trivela yüzeyi/.test(a), `üst dış adı eksik: ${a}`);
    const b = bootAriaLabel('ic', ['ic', 'ustIc'], true);
    ok(/^Sol krampon, iç yüz görünümü\./.test(b), `sol ayak başlığı: ${b}`);
    ok(/iç yüz — ayak içi ve üst iç — iç ayak üstü/.test(b), `iki bölge listesi: ${b}`);
    const c = bootAriaLabel('dis', ['ic'], false);
    ok(/vurgulanan bölge yok/.test(c), `bu görünümde bölge yoksa belirtilmeli: ${c}`);
    for (const v of VIEW_ORDER) {
      for (const z of VIEW_ZONES[v]) ok(bootAriaLabel(v, [z], false).includes(ZONES[z].label.toLocaleLowerCase('tr')), `${v}/${z}: aria etiketi bölge adını içermiyor`);
    }
  });

  await test('Krampon: geometri iki ayak için de sınırlar içinde ve sağ/sol yön doğru', async () => {
    for (const v of VIEW_ORDER) {
      const g = GEO[v];
      ok(g.W > 0 && g.H > 0, `${v}: boyut`);
      for (const [z, s] of Object.entries(g.zones)) {
        for (const [name, x, y] of [['ibre', s.px + g.ox, s.py + g.oy], ['etiket', s.lx + g.ox, s.ly + g.oy]]) {
          ok(x >= 0 && x <= g.W && y >= 0 && y <= g.H, `${v}/${z}: ${name} (${Math.round(x)},${Math.round(y)}) çizim alanı dışında`);
        }
        const bx = s.ball.x + g.ox;
        const by = s.ball.y + g.oy;
        ok(bx - s.ball.r >= 0 && bx + s.ball.r <= g.W && by - s.ball.r >= 0 && by + s.ball.r <= g.H, `${v}/${z}: top çizim alanı dışında (${Math.round(bx)},${Math.round(by)})`);
      }
    }
    // üst görünüm ve iç yüz doğrudan sağ ayaktır; dış yüz ve taban sağ ayak için aynalanır
    ok(!GEO.ust.flipsRight && !GEO.ic.flipsRight && GEO.dis.flipsRight && GEO.taban.flipsRight, 'aynalama bayrakları: sağ ayak yönü bozuk');
  });
};
