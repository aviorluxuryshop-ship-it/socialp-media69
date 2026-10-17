// 3B futbol topu: kesik ikosahedron geometrisi, panel sorgusu, doku üretimi ve SVG yedeği.
export const include = ['lib/motion-ball-geometry.ts', 'lib/motion-ball-maps.ts'];

export default async ({ ok, test, load }) => {
  const g = await load('lib/motion-ball-geometry.js');
  const m = await load('lib/motion-ball-maps.js');

  await test('Top: 60 köşe, 90 kenar, 12 beşgen + 20 altıgen (Euler = 2)', async () => {
    const b = g.buildBall();
    const pent = b.panels.filter((p) => p.kind === 'pent').length;
    const hex = b.panels.filter((p) => p.kind === 'hex').length;
    ok(b.vertices.length === 60, `köşe ${b.vertices.length}`);
    ok(b.edges.length === 90, `kenar ${b.edges.length}`);
    ok(pent === 12 && hex === 20, `beşgen ${pent}, altıgen ${hex}`);
    ok(b.vertices.length - b.edges.length + b.panels.length === 2, 'Euler karakteristiği 2 değil');
  });

  await test('Top: tüm köşeler birim kürede, her panel düzlemsel ve eş kenarlı', async () => {
    const b = g.buildBall();
    for (const v of b.vertices) ok(Math.abs(Math.hypot(...v) - 1) < 1e-9, 'köşe birim küre üzerinde değil');
    for (const p of b.panels) {
      for (const i of p.verts) {
        const d = b.vertices[i][0] * p.normal[0] + b.vertices[i][1] * p.normal[1] + b.vertices[i][2] * p.normal[2];
        ok(Math.abs(d - p.apothem) < 1e-9, 'panel düzlemsel değil');
      }
      ok(p.verts.length === (p.kind === 'pent' ? 5 : 6), 'panel köşe sayısı yanlış');
    }
    const len = (a, c) => Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]);
    const ls = b.edges.map(([a, c]) => len(b.vertices[a], b.vertices[c]));
    ok(Math.max(...ls) - Math.min(...ls) < 1e-9, 'kenar uzunlukları eşit değil');
  });

  await test('Top: her kenar tam iki panelin ortak kenarı; her köşede üç panel buluşur', async () => {
    const b = g.buildBall();
    const cnt = new Map();
    for (const p of b.panels) for (let i = 0; i < p.verts.length; i++) {
      const a = p.verts[i];
      const c = p.verts[(i + 1) % p.verts.length];
      const k = a < c ? `${a}-${c}` : `${c}-${a}`;
      cnt.set(k, (cnt.get(k) ?? 0) + 1);
    }
    ok([...cnt.values()].every((n) => n === 2), 'bir kenar iki panelden farklı sayıda panelde');
    const per = new Array(60).fill(0);
    for (const p of b.panels) for (const i of p.verts) per[i]++;
    ok(per.every((n) => n === 3), 'köşede üç panel buluşmuyor');
    // her beşgenin komşuları altıgendir (klasik top)
    const pents = b.panels.filter((p) => p.kind === 'pent');
    const edgeOwner = new Map();
    b.panels.forEach((p, idx) => {
      for (let i = 0; i < p.verts.length; i++) {
        const a = p.verts[i];
        const c = p.verts[(i + 1) % p.verts.length];
        const k = a < c ? `${a}-${c}` : `${c}-${a}`;
        edgeOwner.set(k, [...(edgeOwner.get(k) ?? []), idx]);
      }
    });
    for (const [, [x, y]] of edgeOwner) ok(!(b.panels[x].kind === 'pent' && b.panels[y].kind === 'pent'), 'iki beşgen komşu');
    ok(pents.length === 12, 'beşgen sayısı');
  });

  await test('panelAt: kutup yönü beşgendir, panel merkezi kendi panelini bulur, dikişte uzaklık ~0', async () => {
    const b = g.buildBall();
    const t = g.panelTable();
    ok(g.panelAt([0, 1, 0], t).pent, 'üst kutup beşgen değil');
    ok(g.panelAt([0, -1, 0], t).pent, 'alt kutup beşgen değil');
    b.panels.forEach((p, i) => {
      const hit = g.panelAt(p.normal, t);
      ok(hit.i === i, `panel merkezi yanlış panele düştü (${i} → ${hit.i})`);
      ok(hit.dist > 0.2, 'panel merkezi dikişe çok yakın');
    });
    const [a, c] = b.edges[0];
    const mid = g.norm3([b.vertices[a][0] + b.vertices[c][0], b.vertices[a][1] + b.vertices[c][1], b.vertices[a][2] + b.vertices[c][2]]);
    ok(g.panelAt(mid, t).dist < 1e-6, 'kenar ortası dikişte değil');
  });

  await test('Doku üretimi: boyutlar, opak alfa, beşgen koyu / altıgen açık, ilerleme 0→1', async () => {
    const job = m.createBallMapJob(128, 64);
    ok(!job.done && job.progress() === 0, 'başlangıç durumu');
    let steps = 0;
    while (!job.step(8)) steps++;
    ok(steps > 3 && job.done && job.progress() === 1, 'iş adım adım ilerlemedi');
    const r = job.result();
    ok(r.color.length === 128 * 64 * 4 && r.normal.length === r.color.length, 'doku boyutu');
    ok(r.rough.length === 64 * 32 * 4, 'pürüzlülük boyutu');
    let dark = 0;
    let light = 0;
    for (let i = 0; i < r.color.length; i += 4) {
      ok(r.color[i + 3] === 255 && r.normal[i + 3] === 255, 'alfa opak değil');
      const l = (r.color[i] + r.color[i + 1] + r.color[i + 2]) / 3;
      if (l < 60) dark++;
      else if (l > 170) light++;
    }
    const tot = 128 * 64;
    ok(dark / tot > 0.08 && dark / tot < 0.4, `koyu panel oranı ${(dark / tot).toFixed(2)}`);
    ok(light / tot > 0.35, `açık panel oranı ${(light / tot).toFixed(2)}`);
    // normal haritası: düz yerde (0.5, 0.5, 1) civarı
    let flat = 0;
    for (let i = 0; i < r.normal.length; i += 4) if (Math.abs(r.normal[i] - 128) < 8 && Math.abs(r.normal[i + 1] - 128) < 8 && r.normal[i + 2] > 240) flat++;
    ok(flat / tot > 0.4, 'normal haritasında düz alan çok az');
  });

  await test('SVG yedeği: görünür paneller, geçerli yol verisi, ön yüz beşgeni ve altıgeni var', async () => {
    const q = g.quatFromEuler(...g.BALL_START_EULER);
    const svg = g.projectBallSvg(q);
    ok(svg.length >= 12 && svg.length <= 32, `görünür panel ${svg.length}`);
    ok(svg.some((p) => p.kind === 'pent') && svg.some((p) => p.kind === 'hex'), 'tür eksik');
    for (const p of svg) {
      ok(/^M[-\d.]+ [-\d.]+(L[-\d.]+ [-\d.]+)+Z$/.test(p.d), 'yol biçimi bozuk');
      for (const n of p.d.match(/-?\d+\.?\d*/g)) ok(Math.abs(Number(n)) <= 1.0001, 'koordinat birim daire dışında');
    }
    ok(svg.some((p) => p.facing > 0.5), 'öne bakan panel yok');
    const q0 = g.quatFromEuler(0, 0, 0);
    ok(Math.abs(g.rotateByQuat([0, 0, 1], q0)[2] - 1) < 1e-12, 'kimlik dönüşümü bozuk');
  });
};
