// Libero — statik çıktı (out/) bağlantı denetimi.
//
//   npm run build && node scripts/check-links.mjs [--external]
//
// out/ içindeki tüm HTML dosyalarında iç bağlantıları (href, src, srcset, poster, content=...) ve
// sayfa-içi #bağlantıları denetler; eksik dosya/sayfa/çıpa bulursa çıkış kodu 1'dir.
// --external: dış bağlantıları yalnızca listeler (ağ isteği YAPMAZ).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'out');
const listExternal = process.argv.includes('--external');
if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error('out/index.html yok; önce "npm run build" çalıştırın.');
  process.exit(1);
}

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const files = walk(root);
const htmls = files.filter((f) => f.endsWith('.html'));
const fileSet = new Set(files.map((f) => path.relative(root, f).split(path.sep).join('/')));
const idCache = new Map();

function idsOf(rel) {
  if (idCache.has(rel)) return idCache.get(rel);
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  idCache.set(rel, ids);
  return ids;
}

/** URL yolunu out/ içindeki dosyaya çevirir (statik sunucu kuralları: dizin → index.html, .html eki isteğe bağlı) */
function resolveRel(urlPath) {
  let p = decodeURIComponent(urlPath);
  if (p.startsWith('/')) p = p.slice(1);
  if (p === '' || p.endsWith('/')) p += 'index.html';
  if (fileSet.has(p)) return p;
  if (fileSet.has(p + '.html')) return p + '.html';
  if (fileSet.has(p + '/index.html')) return p + '/index.html';
  return null;
}

const missing = [];
const missingAnchors = [];
const external = new Set();
let checked = 0;

for (const rel of htmls.map((f) => path.relative(root, f).split(path.sep).join('/'))) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  const refs = [];
  for (const m of html.matchAll(/\s(?:href|src|poster|action)="([^"]*)"/g)) refs.push(m[1]);
  for (const m of html.matchAll(/\ssrcset="([^"]*)"/g)) for (const part of m[1].split(',')) refs.push(part.trim().split(/\s+/)[0]);
  for (const m of html.matchAll(/<meta[^>]+(?:property|name)="(?:og:image|twitter:image)"[^>]+content="([^"]*)"/g)) refs.push(m[1]);

  for (let r of refs) {
    r = r.replace(/&amp;/g, '&').trim();
    if (!r || r.startsWith('mailto:') || r.startsWith('tel:') || r.startsWith('data:') || r.startsWith('javascript:') || r.startsWith('blob:')) continue;
    if (/^https?:\/\//i.test(r) || r.startsWith('//')) {
      external.add(r);
      continue;
    }
    // sayfa-içi çıpa
    if (r.startsWith('#')) {
      const id = decodeURIComponent(r.slice(1));
      if (id && !idsOf(rel).has(id) && id !== 'top') missingAnchors.push(`${rel}: ${r}`);
      continue;
    }
    // göreli yolları (./ ../) sayfanın dizinine göre çöz
    let urlPath = r.split('#')[0].split('?')[0];
    const hash = r.includes('#') ? r.split('#')[1] : '';
    if (!urlPath.startsWith('/')) {
      const base = path.posix.dirname('/' + rel);
      urlPath = path.posix.normalize(base + '/' + urlPath);
    }
    checked++;
    const target = resolveRel(urlPath);
    if (!target) {
      missing.push(`${rel}: ${r}`);
      continue;
    }
    if (hash && target.endsWith('.html')) {
      const id = decodeURIComponent(hash);
      if (id && !idsOf(target).has(id)) missingAnchors.push(`${rel}: ${r} (hedef sayfada #${id} yok)`);
    }
  }
}

const uniq = (a) => [...new Set(a)];
console.log(`${htmls.length} HTML dosyası, ${checked} iç bağlantı denetlendi, ${external.size} dış bağlantı bulundu.`);
if (listExternal) for (const e of [...external].sort()) console.log('  dış:', e);
if (missing.length) console.log(`\nEKSİK HEDEF (${uniq(missing).length}):\n  ` + uniq(missing).slice(0, 60).join('\n  '));
if (missingAnchors.length) console.log(`\nEKSİK ÇIPA (${uniq(missingAnchors).length}):\n  ` + uniq(missingAnchors).slice(0, 60).join('\n  '));
if (missing.length || missingAnchors.length) process.exit(1);
console.log('Tüm iç bağlantılar geçerli.');
