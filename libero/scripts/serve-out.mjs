// Statik "out/" klasörünü yerel olarak sunar (hiçbir bağımlılık gerektirmez; Windows, macOS, Linux).
//
//   node scripts/serve-out.mjs [port] [--open]
//
//   port     varsayılan 3100 (PORT ortam değişkeniyle de verilebilir)
//   --open   sunucu açılınca varsayılan tarayıcıyı otomatik açar
//
// Yalnızca bu bilgisayardan erişilir (127.0.0.1); ağdaki başka cihazlara açılmaz,
// Windows güvenlik duvarı uyarısı da çıkmaz. Port doluysa sonraki boş portu dener.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'out');
const args = process.argv.slice(2);
const startPort = Number(args.find((a) => /^\d+$/.test(a)) ?? process.env.PORT ?? 3100);
const shouldOpen = args.includes('--open');
const HOST = '127.0.0.1';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  // otomatik video analizi: WebAssembly doğru MIME türüyle sunulmalı (akışlı derleme); .task modeli ikili dosyadır
  '.wasm': 'application/wasm',
  '.task': 'application/octet-stream',
};

if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error(`\nHata: "${root}" içinde derlenmiş site (index.html) yok.`);
  console.error('Önce siteyi derleyin:  npm run build   (ya da baslat-windows.cmd dosyasını çalıştırın)\n');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  let p;
  try {
    p = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  let file = path.join(root, p);
  if (file !== root && !file.startsWith(root + path.sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
  if (!fs.existsSync(file)) {
    const nf = path.join(root, '404.html');
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : 'not found');
    return;
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

function openBrowser(url) {
  try {
    let child;
    if (process.platform === 'win32') {
      // `start "" <url>` — boş tırnak, pencere başlığıdır (adres olarak yorumlanmasın diye gerekli)
      child = spawn('cmd', ['/c', 'start', '""', url], { windowsVerbatimArguments: true, stdio: 'ignore', detached: true });
    } else if (process.platform === 'darwin') {
      child = spawn('open', [url], { stdio: 'ignore', detached: true });
    } else {
      child = spawn('xdg-open', [url], { stdio: 'ignore', detached: true });
    }
    child.on('error', () => console.log('(Tarayıcı otomatik açılamadı; adresi elle açın.)'));
    child.unref();
  } catch {
    console.log('(Tarayıcı otomatik açılamadı; adresi elle açın.)');
  }
}

let port = startPort;
const MAX_TRIES = 15;
let tries = 0;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && tries < MAX_TRIES) {
    tries++;
    console.log(`Port ${port} meşgul (başka bir Libero penceresi açık olabilir); ${port + 1} deneniyor…`);
    port++;
    server.listen(port, HOST);
    return;
  }
  console.error(`Sunucu başlatılamadı: ${err.message}`);
  process.exit(1);
});

server.on('listening', () => {
  const url = `http://localhost:${port}/`;
  const lines = ['Libero Futbol Akademisi çalışıyor', `Adres:  ${url}`, 'Durdurmak için bu pencerede Ctrl + C'];
  const w = Math.max(...lines.map((l) => l.length)) + 4;
  console.log(`\n  ┌${'─'.repeat(w)}┐`);
  for (const l of lines) console.log(`  │  ${l.padEnd(w - 2)}│`);
  console.log(`  └${'─'.repeat(w)}┘\n`);
  if (shouldOpen) openBrowser(url);
});

server.listen(port, HOST);

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
