// Arena Bilet: Tüpraş Stadyumu (Dolmabahçe/Beşiktaş) çevresini OpenStreetMap API'sinden indirir ve
// src/data/osm-dolmabahce.json olarak sadeleştirir.
//   node scripts/fetch-osm.mjs            -> eksik karoları indirir (önbellek: .qa/osm-raw/), sonra dönüştürür
//   node scripts/fetch-osm.mjs --convert  -> yalnızca önbellekten dönüştürür
// Veri © OpenStreetMap katkıda bulunanlar (ODbL). Overpass yerine ana API (0.6/map) kullanılır.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { convert } from './osm-convert.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, '.qa', 'osm-raw');
const UA = 'arena-bilet-demo/1.0';
fs.mkdirSync(RAW, { recursive: true });

// Kök karolar 0.008° (≈ 670 m x 890 m); çok yoğunsa (50.000 düğüm sınırı) 4'e bölünür.
const LON0 = 28.978, LON1 = 29.05, LAT0 = 41.024, LAT1 = 41.056, STEP = 0.008;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const key = (b) => b.map((v) => v.toFixed(5)).join('_');

async function fetchTile(b, depth = 0) {
  const f = path.join(RAW, key(b) + '.xml');
  const split = path.join(RAW, key(b) + '.split');
  if (fs.existsSync(f)) return [f];
  if (fs.existsSync(split)) return subTiles(b, depth);
  const url = `https://api.openstreetmap.org/api/0.6/map?bbox=${b.map((v) => v.toFixed(5)).join(',')}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    await sleep(1000);
    let res;
    try { res = await fetch(url, { headers: { 'User-Agent': UA } }); } catch (e) { console.log('ağ hatası', e.message); await sleep(4000); continue; }
    if (res.status === 200) {
      const txt = await res.text();
      fs.writeFileSync(f, txt);
      console.log('indirildi', key(b), (txt.length / 1e6).toFixed(2) + ' MB');
      return [f];
    }
    if (res.status === 400 && depth < 4) { fs.writeFileSync(split, ''); console.log('bölünüyor', key(b)); return subTiles(b, depth); }
    console.log('durum', res.status, key(b)); await sleep(5000 * (attempt + 1));
  }
  throw new Error('indirilemedi ' + key(b));
}
async function subTiles(b, depth) {
  const [a0, o0, a1, o1] = b, ma = (a0 + a1) / 2, mo = (o0 + o1) / 2;
  const out = [];
  for (const sb of [[a0, o0, ma, mo], [ma, o0, a1, mo], [a0, mo, ma, o1], [ma, mo, a1, o1]]) out.push(...await fetchTile(sb, depth + 1));
  return out;
}

if (!process.argv.includes('--convert')) {
  // bbox sırası: minLon,minLat,maxLon,maxLat
  const roots = [];
  for (let lo = LON0; lo < LON1 - 1e-9; lo += STEP) for (let la = LAT0; la < LAT1 - 1e-9; la += STEP) roots.push([lo, la, lo + STEP, la + STEP]);
  for (const r of roots) await fetchTile(r);
}
const files = fs.readdirSync(RAW).filter((n) => n.endsWith('.xml')).map((n) => path.join(RAW, n));
const out = convert(files, path.join(ROOT, 'src', 'data', 'osm-dolmabahce.json'));
console.log('JSON', out.bytes, 'bayt');
