// Hareket sistemi için ortak derleyici: lib/motion, components/tech-motion ve data/technique-motion dosyalarını
// geçici bir klasöre derler (JSX dahil) ve "@/..." içe aktarmalarını çözen bir yükleyici döndürür.
// scripts/motion-sheet.mjs ve geliştirme sırasında kullanılan yoklama betikleri bunu kullanır.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { register } from 'node:module';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @param {string[]} include derlenecek giriş dosyaları (kök göreli) */
export async function buildMotion(include = ['components/tech-motion/Figure.tsx', 'components/tech-motion/PlanView.tsx', 'components/tech-motion/Stage.tsx', 'data/technique-motion/index.ts']) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'libero-motion-'));
  const out = path.join(tmp, 'out');
  fs.writeFileSync(
    path.join(tmp, 'tsconfig.json'),
    JSON.stringify({
      extends: path.join(root, 'tsconfig.json'),
      compilerOptions: { noEmit: false, outDir: out, rootDir: root, incremental: false, plugins: [], jsx: 'react-jsx', declaration: false, sourceMap: false, baseUrl: root, typeRoots: [path.join(root, 'node_modules/@types')], types: ['node'] },
      include: include.filter((p) => fs.existsSync(path.join(root, p))).map((p) => path.join(root, p)),
      exclude: [],
    }),
  );
  try {
    execFileSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '-p', path.join(tmp, 'tsconfig.json')], { stdio: 'pipe' });
  } catch (e) {
    throw new Error('TypeScript derlemesi başarısız:\n' + (e.stdout?.toString() ?? '') + (e.stderr?.toString() ?? ''));
  }
  const hook = `
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const OUT = ${JSON.stringify(out)};
function find(base) {
  for (const c of [base + '.js', path.join(base, 'index.js'), base]) {
    try { if (fs.statSync(c).isFile()) return c; } catch {}
  }
  return null;
}
export async function resolve(spec, ctx, next) {
  if (spec.startsWith('@/')) {
    const f = find(path.join(OUT, spec.slice(2)));
    if (f) return { url: pathToFileURL(f).href, shortCircuit: true };
  }
  if ((spec.startsWith('./') || spec.startsWith('../')) && ctx.parentURL && ctx.parentURL.startsWith('file:') && !path.extname(spec)) {
    const f = find(path.resolve(path.dirname(new URL(ctx.parentURL).pathname), spec));
    if (f) return { url: pathToFileURL(f).href, shortCircuit: true };
  }
  return next(spec, ctx);
}
`;
  register('data:text/javascript,' + encodeURIComponent(hook), pathToFileURL(root + '/'));
  fs.writeFileSync(path.join(out, 'package.json'), JSON.stringify({ type: 'module' }));
  try {
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(out, 'node_modules'), 'dir');
  } catch {}
  const load = (rel) => import(pathToFileURL(path.join(out, rel)).href);
  return { load, out, tmp, cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}
