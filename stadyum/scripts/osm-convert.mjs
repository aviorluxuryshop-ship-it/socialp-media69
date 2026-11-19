// OSM XML (api 0.6/map) -> sadeleştirilmiş yerel-metre JSON. Bkz. fetch-osm.mjs.
import fs from 'node:fs';

const R = 6378137, RAD = Math.PI / 180;
const R_DETAIL = 1250;               // bu yarıçap içindeki yapılar tam çokgen, dışındakiler kutu
const STADIUM_RECT = [88, 106];      // kendi modellediğimiz stadyum çatısı (±X, ±Z) + pay
const PITCH_WAY = '440559216', STADIUM_WAY = '1328815936';

// ---- XML (satır tabanlı) ----
function parseFile(file, nodes, ways, rels) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let cur = null;
  const attr = (s, k) => { const m = s.match(new RegExp(' ' + k + '="([^"]*)"')); return m ? m[1] : null; };
  const dec = (s) => s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  for (const ln of lines) {
    const t = ln.trimStart();
    if (t.startsWith('<node')) {
      const id = attr(t, 'id');
      cur = { id, lat: +attr(t, 'lat'), lon: +attr(t, 'lon'), tags: null };
      nodes.set(id, cur);
      if (t.endsWith('/>')) cur = null;
    } else if (t.startsWith('<way')) {
      const id = attr(t, 'id');
      cur = ways.has(id) ? { id, skip: true, nds: [], tags: {} } : { id, nds: [], tags: {} };
      if (!cur.skip) ways.set(id, cur);
    } else if (t.startsWith('<relation')) {
      const id = attr(t, 'id');
      cur = rels.has(id) ? { id, skip: true, mem: [], tags: {} } : { id, mem: [], tags: {} };
      if (!cur.skip) rels.set(id, cur);
    } else if (t.startsWith('<nd ') && cur?.nds) cur.nds.push(attr(t, 'ref'));
    else if (t.startsWith('<member') && cur?.mem) cur.mem.push({ type: attr(t, 'type'), ref: attr(t, 'ref'), role: attr(t, 'role') });
    else if (t.startsWith('<tag') && cur) {
      if (cur.tags === null) cur.tags = {};
      cur.tags[attr(t, 'k')] = dec(attr(t, 'v'));
    } else if (t.startsWith('</node') || t.startsWith('</way') || t.startsWith('</relation')) cur = null;
  }
}

// ---- geometri yardımcıları ----
const area = (p) => { let a = 0; for (let i = 0, n = p.length; i < n; i++) { const q = p[(i + 1) % n]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return a / 2; };
const centroid = (p) => { let x = 0, z = 0; for (const q of p) { x += q[0]; z += q[1]; } return [x / p.length, z / p.length]; };
function inPoly(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > pt[1]) !== (zj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}
function dp(pts, tol) { // Douglas-Peucker (açık çizgi)
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1;
    const [ax, az] = pts[a], [bx, bz] = pts[b], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1e-9;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i][0] - ax) * dz - (pts[i][1] - az) * dx) / L;
      if (d > md) { md = d; mi = i; }
    }
    if (md > tol && mi > 0) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const simplifyRing = (p, tol) => { // kapalı halka (son nokta = ilk nokta çıkarılmış)
  if (p.length < 5) return p;
  let far = 0, fd = 0; for (let i = 1; i < p.length; i++) { const d = Math.hypot(p[i][0] - p[0][0], p[i][1] - p[0][1]); if (d > fd) { fd = d; far = i; } }
  const a = dp([...p.slice(0, far + 1)], tol), b = dp([...p.slice(far), p[0]], tol);
  const out = [...a.slice(0, -1), ...b.slice(0, -1)];
  return out.length >= 3 ? out : p;
};
const dm = (v) => Math.round(v * 10);
function joinWays(list) { // uç noktalardan zincirle -> [[nodeId,...]]
  const segs = list.map((w) => w.slice()), out = [];
  const byEnd = new Map();
  const add = (id, s) => { if (!byEnd.has(id)) byEnd.set(id, new Set()); byEnd.get(id).add(s); };
  for (const s of segs) { add(s[0], s); add(s[s.length - 1], s); }
  const used = new Set();
  for (const s of segs) {
    if (used.has(s)) continue; used.add(s);
    let chain = s.slice();
    for (let grow = true; grow;) {
      grow = false;
      for (const end of [chain[chain.length - 1], chain[0]]) {
        const front = end === chain[0] && end !== chain[chain.length - 1];
        const cand = [...(byEnd.get(end) || [])].find((c) => !used.has(c));
        if (!cand) continue;
        used.add(cand);
        let c = cand.slice();
        if (!front) { if (c[0] !== end) c.reverse(); chain = chain.concat(c.slice(1)); }
        else { if (c[c.length - 1] !== end) c.reverse(); chain = c.slice(0, -1).concat(chain); }
        grow = true; break;
      }
    }
    out.push(chain);
  }
  return out;
}

export function convert(files, outFile) {
  const nodes = new Map(), ways = new Map(), rels = new Map();
  for (const f of files) parseFile(f, nodes, ways, rels);
  console.log('düğüm', nodes.size, 'yol', ways.size, 'ilişki', rels.size);

  // ---- projeksiyon: saha merkezi orijin, saha uzun ekseni = Z ----
  const pw = ways.get(PITCH_WAY);
  const pp = pw.nds.slice(0, -1).map((id) => nodes.get(id));
  const lat0 = pp.reduce((s, n) => s + n.lat, 0) / 4, lon0 = pp.reduce((s, n) => s + n.lon, 0) / 4;
  // (a,b) = (doğu, -kuzey): kuş bakışı harita, harita yönü korunur
  const ab = (n) => [(n.lon - lon0) * RAD * R * Math.cos(lat0 * RAD), -(n.lat - lat0) * RAD * R];
  const P4 = pp.map(ab);
  let best = null;
  for (let i = 0; i < 4; i++) { const q = P4[(i + 1) % 4], l = Math.hypot(q[0] - P4[i][0], q[1] - P4[i][1]); if (!best || l > best.l) best = { l, d: [(q[0] - P4[i][0]) / l, (q[1] - P4[i][1]) / l] }; }
  let u = best.d;                       // uzun eksen
  if (u[1] < 0) u = [-u[0], -u[1]];     // +Z "güneye" bakan uç
  const v = [u[1], -u[0]];              // X ekseni: u'nun -90° döndürülmüşü (el yönü korunur)
  const proj = (n) => { const [a, b] = ab(n); return [a * v[0] + b * v[1], a * u[0] + b * u[1]]; };
  const projId = (id) => { const n = nodes.get(id); return n ? proj(n) : null; };
  const ring = (w) => w.nds.map(projId).filter(Boolean);
  console.log('saha uzunluğu', best.l.toFixed(1), 'm; u(a,b)=', u.map((x) => x.toFixed(3)), 'v=', v.map((x) => x.toFixed(3)));
  const stadiumPoly = ring(ways.get(STADIUM_WAY)).slice(0, -1);
  const stadC = centroid(stadiumPoly);
  console.log('stadyum çokgeni merkezi (yerel)', stadC.map((x) => x.toFixed(1)));

  const inStadium = (pts) => {
    const c = centroid(pts);
    const inRect = (p) => Math.abs(p[0]) < STADIUM_RECT[0] && Math.abs(p[1]) < STADIUM_RECT[1];
    if (inRect(c) || inPoly(c, stadiumPoly)) return true;
    let hit = 0; for (const p of pts) if (inRect(p) || inPoly(p, stadiumPoly)) hit++;
    return hit >= Math.max(1, pts.length / 3);
  };

  // ---- ilişkilerden çok-çokgenli halkalar ----
  const relRings = (rel) => {
    const outer = rel.mem.filter((m) => m.type === 'way' && m.role !== 'inner').map((m) => ways.get(m.ref)?.nds).filter(Boolean);
    return joinWays(outer).filter((c) => c.length > 3 && c[0] === c[c.length - 1]);
  };

  // ---- sınıflandırma ----
  const BH = { apartments: 20, residential: 15, house: 9, detached: 9, terrace: 10, commercial: 16, retail: 11, office: 20, industrial: 10, warehouse: 8,
    hotel: 20, church: 14, mosque: 14, cathedral: 18, chapel: 8, school: 14, university: 16, hospital: 22, public: 14, civic: 14, government: 16,
    garage: 3, garages: 3, roof: 5, shed: 3, kiosk: 3, hut: 3, service: 5, transportation: 8, train_station: 10, stadium: 20, museum: 16, dormitory: 18, yes: 14 };
  const buildings = [], farRaw = [], greens = [], trees = [], roads = [];
  const specials = { palace: 0, mosque: 0, clock: 0 };
  const numH = (s) => { const m = String(s ?? '').replace(',', '.').match(/[\d.]+/); return m ? parseFloat(m[0]) : null; };
  function addBuilding(tags, pts) {
    if (pts.length < 3) return;
    if (tags.leisure === 'stadium' || tags.building === 'stadium') return;
    if (inStadium(pts)) return;
    let h = numH(tags.height);
    const lev = numH(tags['building:levels']);
    if (h == null && lev != null) h = lev * 3.2 + 1.2;
    if (h == null) h = BH[tags.building] ?? 14;
    const name = tags.name || '', nl = name.toLowerCase();
    let c = 0;
    if (/dolmabah[cç]e saray/i.test(name) || tags.historic === 'palace' || /muayede|selaml|harem|hareket k|baltac|k[ıi]zlar|mabeyn|yeni daire|saray/i.test(name) && /dolmabah|saray/i.test(nl)) { c = 1; h = Math.max(h, 18); specials.palace++; }
    else if (tags.building === 'mosque' || (tags.amenity === 'place_of_worship' && tags.religion === 'muslim' && /cami|mescit|mosque/i.test(name + tags.building))) { c = 2; specials.mosque++; }
    else if (/saat kule/i.test(name) || tags['tower:type'] === 'clock') { c = 3; h = Math.max(h, 27); specials.clock++; }
    const a = Math.abs(area(pts));
    if (a < 6) return;
    const ctr = centroid(pts);
    if (Math.hypot(ctr[0], ctr[1]) > R_DETAIL && c === 0) {
      // uzak: yönlü kutu (en uzun kenar yönünde)
      farRaw.push({ pts, h, a });
      return;
    }
    const sp = simplifyRing(pts, 0.5);
    buildings.push([Math.round(h * 10), c, ...sp.flatMap((p) => [dm(p[0]), dm(p[1])])]);
  }
  const roadW = { motorway: [0, 14], motorway_link: [0, 8], trunk: [0, 14], trunk_link: [0, 8], primary: [0, 13], primary_link: [0, 8], secondary: [1, 10], secondary_link: [1, 7],
    tertiary: [1, 8.5], tertiary_link: [1, 6], unclassified: [2, 6.5], residential: [2, 6.5], living_street: [2, 5.5], service: [2, 4.5], pedestrian: [3, 5], footway: [3, 2.4],
    path: [3, 1.8], steps: [3, 2], cycleway: [3, 2.2], track: [3, 3] };

  const seenWay = new Set();
  for (const [id, w] of ways) {
    const t = w.tags; if (!t) continue;
    if (t.building && t.building !== 'no') { addBuilding(t, ring(w).slice(0, -1)); seenWay.add(id); continue; }
    if (t.highway && roadW[t.highway] && t.tunnel !== 'yes' && !(Number(t.layer) < 0)) {
      if (t.area === 'yes') continue;
      const pts = ring(w);
      if (pts.length >= 2) roads.push({ cls: roadW[t.highway][0], w: roadW[t.highway][1], pts, bridge: t.bridge === 'yes', name: t.name });
      continue;
    }
    const closed = w.nds.length > 3 && w.nds[0] === w.nds[w.nds.length - 1];
    if (closed && (t.leisure === 'park' || t.leisure === 'garden' || t.leisure === 'playground' || t.landuse === 'grass' || t.landuse === 'forest' || t.landuse === 'recreation_ground' || t.natural === 'wood' || t.natural === 'scrub' || t.landuse === 'cemetery' || t.leisure === 'pitch' && false)) {
      const pts = ring(w).slice(0, -1);
      if (pts.length >= 3 && !inStadium(pts)) greens.push(pts);
    }
  }
  for (const [id, r] of rels) {
    const t = r.tags; if (!t || t.type !== 'multipolygon') continue;
    if (t.building && t.building !== 'no') {
      for (const rg of relRings(r)) addBuilding(t, rg.map(projId).filter(Boolean).slice(0, -1));
    } else if (t.leisure === 'park' || t.leisure === 'garden' || t.landuse === 'grass' || t.natural === 'wood' || t.landuse === 'forest') {
      for (const rg of relRings(r)) { const pts = rg.map(projId).filter(Boolean).slice(0, -1); if (pts.length >= 3 && !inStadium(pts)) greens.push(pts); }
    }
  }
  for (const n of nodes.values()) if (n.tags?.natural === 'tree') { const p = proj(n); if (Math.hypot(p[0], p[1]) < R_DETAIL) trees.push(p); }

  // ---- kıyı çizgisi ----
  const coastWays = [...ways.values()].filter((w) => w.tags?.natural === 'coastline').map((w) => w.nds);
  const chains = joinWays(coastWays).map((c) => c.map(projId).filter(Boolean));
  console.log('kıyı zincirleri', chains.map((c) => c.length + ' nokta ' + (c[0][0] | 0) + ',' + (c[0][1] | 0) + ' -> ' + (c[c.length - 1][0] | 0) + ',' + (c[c.length - 1][1] | 0)));

  // ---- köprü ----
  const bridgeWays = roads.filter((r) => /Şehitler K|Boğaziçi K|Bosphorus/i.test(r.name || ''));
  console.log('köprü yolları', bridgeWays.length);

  const result = { buildings, roads, greens, trees, chains, bridgeWays, farRaw, proj: { lat0, lon0, u, v }, stadiumPoly, specials };
  if (process.env.DEBUG_RAW) return result;
  return finalize(result, outFile);
}

function finalize(r, outFile) {
  const RECT = [92, 110]; // stadyum çevresinde yol çizilmez
  const inRect = (p) => Math.abs(p[0]) < RECT[0] && Math.abs(p[1]) < RECT[1];
  const roads = [];
  for (const rd of r.roads) {
    const pts0 = rd.pts;
    if (pts0.every((p) => Math.hypot(p[0], p[1]) > R_DETAIL + 100)) continue;
    let run = [];
    const flush = () => { if (run.length >= 2) { const s = dp(run, 0.6); roads.push([rd.cls, Math.round(rd.w * 10), ...s.flatMap((p) => [dm(p[0]), dm(p[1])])]); } run = []; };
    for (const p of pts0) { if (inRect(p) || Math.hypot(p[0], p[1]) > R_DETAIL + 100) flush(); else run.push(p); }
    flush();
  }
  // yeşil alanlar
  const greens = r.greens.map((g) => simplifyRing(g, 0.8)).filter((g) => g.length >= 3 && Math.abs(area(g)) > 30)
    .map((g) => g.flatMap((p) => [dm(p[0]), dm(p[1])]));
  const trees = r.trees.flatMap((p) => [dm(p[0]), dm(p[1])]);
  // uzak yapılar: yönlü kutular [cx, cz, w, d, açı(°), h] (tam metre)
  let far = r.farRaw.filter((f) => f.a >= 70 || f.h >= 30).sort((a, b) => b.a - a.a).slice(0, 14000);
  const farOut = [];
  for (const f of far) {
    const p = f.pts; let L = 0, ang = 0;
    for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length], l = Math.hypot(q[0] - p[i][0], q[1] - p[i][1]); if (l > L) { L = l; ang = Math.atan2(q[1] - p[i][1], q[0] - p[i][0]); } }
    const c = Math.cos(ang), s = Math.sin(ang);
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const q of p) { const a = q[0] * c + q[1] * s, b = -q[0] * s + q[1] * c; u0 = Math.min(u0, a); u1 = Math.max(u1, a); v0 = Math.min(v0, b); v1 = Math.max(v1, b); }
    const ua = (u0 + u1) / 2, va = (v0 + v1) / 2;
    farOut.push(Math.round(ua * c - va * s), Math.round(ua * s + va * c), Math.max(4, Math.round(u1 - u0)), Math.max(4, Math.round(v1 - v0)), Math.round(ang * 180 / Math.PI), Math.round(f.h));
  }
  // kıyı: Avrupa (güneydeki zincir z küçük) ve Asya zincirleri
  const ch = r.chains.filter((c) => c.length > 20).sort((a, b) => centroid(a)[1] - centroid(b)[1]);
  const coast = ch.map((c) => dp(c, 2.5).flatMap((p) => [dm(p[0]), dm(p[1])]));
  // köprü ekseni
  const bp = r.bridgeWays.filter((w) => /Şehitler/.test(w.name)).flatMap((w) => w.pts);
  const n = bp.length, mz = bp.reduce((s, p) => s + p[1], 0) / n, mx = bp.reduce((s, p) => s + p[0], 0) / n;
  let sxz = 0, szz = 0; for (const p of bp) { sxz += (p[0] - mx) * (p[1] - mz); szz += (p[1] - mz) ** 2; }
  const k = sxz / szz, zmin = Math.min(...bp.map((p) => p[1])), zmax = Math.max(...bp.map((p) => p[1]));
  const A = [mx + k * (zmin - mz), zmin], B = [mx + k * (zmax - mz), zmax];
  const bridge = { a: A.map((x) => +x.toFixed(1)), b: B.map((x) => +x.toFixed(1)) };
  const sp = simplifyRing(r.stadiumPoly, 0.8).flatMap((p) => [dm(p[0]), dm(p[1])]);
  const out = {
    v: 1, attribution: 'Harita verisi © OpenStreetMap katkıda bulunanlar (ODbL)',
    origin: { lat: r.proj.lat0, lon: r.proj.lon0, u: r.proj.u, v: r.proj.v, note: 'X = v·(doğu,-kuzey), Z = u·(doğu,-kuzey); koordinatlar 0.1 m tamsayı (b,r,g,t,coast,sp) veya metre (f)' },
    b: r.buildings, f: farOut, r: roads, g: greens, t: trees, coast, bridge, sp,
    stats: r.specials,
  };
  const json = JSON.stringify(out);
  fs.writeFileSync(outFile, json);
  console.log('binalar', r.buildings.length, 'uzak', farOut.length / 6, 'yol', roads.length, 'yeşil', greens.length, 'ağaç', trees.length / 2, 'köprü', bridge);
  return { bytes: json.length };
}
