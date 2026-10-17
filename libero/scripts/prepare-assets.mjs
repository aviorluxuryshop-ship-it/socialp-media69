// Libero — derleme öncesi varlık hazırlığı (prebuild / predev tarafından çalıştırılır).
//
//   node scripts/prepare-assets.mjs
//
// @mediapipe/tasks-vision paketinin WebAssembly dosyalarını public/mediapipe/wasm/ klasörüne kopyalar.
// Böylece otomatik video analizi çalışırken HİÇBİR CDN kullanılmaz: motor, siteyle aynı kaynaktan
// (kendi sunucundan / out/ klasöründen) yüklenir ve çevrimdışı çalışabilir.
//
// • Tekrar çalıştırmak güvenlidir (idempotent): boyutu ve değişiklik zamanı aynı olan dosyalar atlanır.
// • public/mediapipe/ üretilmiş bir klasördür ve .gitignore'dadır; depoya eklenmez.
// • Modeller (public/models/*.task) depoya eklidir ve burada kopyalanmaz.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const dst = path.join(root, 'public', 'mediapipe', 'wasm');

if (!fs.existsSync(src)) {
  console.error('\n[prepare-assets] Hata: node_modules/@mediapipe/tasks-vision/wasm bulunamadı.');
  console.error('  Bağımlılıklar kurulmamış görünüyor. Önce şunu çalıştırın:  npm install\n');
  process.exit(1);
}

fs.mkdirSync(dst, { recursive: true });
let copied = 0;
let skipped = 0;
for (const name of fs.readdirSync(src)) {
  const from = path.join(src, name);
  const to = path.join(dst, name);
  const st = fs.statSync(from);
  if (!st.isFile()) continue;
  if (fs.existsSync(to)) {
    const cur = fs.statSync(to);
    if (cur.size === st.size && Math.abs(cur.mtimeMs - st.mtimeMs) < 2000) {
      skipped++;
      continue;
    }
  }
  fs.copyFileSync(from, to);
  fs.utimesSync(to, st.atime, st.mtime);
  copied++;
}
console.log(`[prepare-assets] MediaPipe wasm: ${copied} dosya kopyalandı, ${skipped} dosya güncel → public/mediapipe/wasm/`);
