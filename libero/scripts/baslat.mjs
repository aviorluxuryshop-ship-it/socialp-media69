// Libero — tek komutla kur, derle, başlat, tarayıcıyı aç.
//
//   node scripts/baslat.mjs [port] [--yeniden] [--no-open]
//
//   (varsayılan)  derlenmiş site (out/) varsa doğrudan sunar;
//                 yoksa önce bağımlılıkları kurar ve siteyi derler.
//   --yeniden     bağımlılıkları denetler ve siteyi yeniden derler (güncelleme çektikten sonra)
//   --no-open     tarayıcıyı otomatik açmaz
//
// Windows'ta bu dosyayı çift tıklanabilir hâle getiren sarmalayıcı: baslat-windows.cmd
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const args = process.argv.slice(2);
const force = args.includes('--yeniden');
const noOpen = args.includes('--no-open');
const port = args.find((a) => /^\d+$/.test(a)) ?? process.env.PORT ?? '3100';

const exists = (p) => fs.existsSync(path.join(root, p));
const say = (m = '') => console.log(m);

function fail(msg) {
  console.error(`\nHata: ${msg}\n`);
  process.exit(1);
}

const major = Number(process.versions.node.split('.')[0]);
if (major < 20) {
  fail(
    `Node.js ${process.versions.node} kurulu; Libero için Node.js 20 veya üzeri gerekli.\n` +
      '  İndirin: https://nodejs.org  (LTS sürümü)  ya da  winget install OpenJS.NodeJS.LTS\n' +
      '  Kurduktan sonra yeni bir terminal/pencere açıp tekrar deneyin.',
  );
}

function run(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    // shell: true → Windows'ta npm.cmd doğru bulunur. Argümanlar sabittir (kullanıcı girdisi yok).
    const child = spawn(cmd, cmdArgs, { stdio: 'inherit', shell: true, cwd: root });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`"${cmd} ${cmdArgs.join(' ')}" komutu ${code} koduyla bitti`))));
  });
}

say('\n  Libero Futbol Akademisi — yerel başlatıcı');
say(`  Klasör : ${root}`);
say(`  Node.js: ${process.versions.node}\n`);

try {
  const hasSource = exists('package.json');
  const hasBuild = exists('out/index.html');

  if (!hasBuild && !hasSource) {
    fail('Ne derlenmiş site (out/) ne de package.json bulundu. Bu dosya Libero klasörünün içinden çalıştırılmalı.');
  }

  if (hasSource && (!hasBuild || force)) {
    if (!exists('node_modules/next') || force) {
      say('[1/3] Bağımlılıklar kuruluyor (ilk seferde 1-3 dakika sürebilir)…');
      await run('npm', ['install', '--no-audit', '--no-fund']);
    } else {
      say('[1/3] Bağımlılıklar zaten kurulu.');
    }
    say('[2/3] Site derleniyor (yaklaşık 30-90 saniye)…');
    await run('npm', ['run', 'build']);
    if (!exists('out/index.html')) fail('Derleme bitti ama out/index.html oluşmadı.');
  } else {
    say('[1/3] Bağımlılık kurulumu gerekmiyor.');
    say('[2/3] Derlenmiş site bulundu (yeniden derlemek için: --yeniden).');
  }

  say('[3/3] Sunucu başlatılıyor…');
  process.argv = [process.argv[0], path.join(root, 'scripts', 'serve-out.mjs'), String(port), ...(noOpen ? [] : ['--open'])];
  await import('./serve-out.mjs');
} catch (e) {
  fail(`${e.message}\n  Yukarıdaki çıktıda asıl nedeni bulabilirsiniz. Sorun sürerse klasörü kısa bir yola (ör. C:\\libero) taşıyıp tekrar deneyin.`);
}
