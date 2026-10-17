// Tasarım belirteçleri: eski adlar yaşıyor mu, tüm var(--x) tanımlı mı, metin kontrastı WCAG AA mı.
import fs from 'node:fs';
import path from 'node:path';

export const include = [];

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

export default async ({ ok, test, root }) => {
  const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
  const tokens = read('styles/tokens.css');
  const def = (name) => {
    const m = tokens.match(new RegExp(`${name}:\\s*([^;]+);`));
    return m ? m[1].trim() : null;
  };
  const hex = (name) => {
    const v = def(name);
    ok(v && /^#[0-9a-f]{6}$/i.test(v), `${name} onaltılık renk değil: ${v}`);
    return v;
  };

  await test('Belirteçler: eski tüm adlar (brass, terra, ink, ivory, line, pitch, ölçek, boşluk, hareket) hâlâ tanımlı', async () => {
    const legacy = [
      'ink-950', 'ink-900', 'ink-850', 'ink-800', 'ink-750', 'ink-700', 'ink-600',
      'ivory', 'ivory-2', 'ivory-3', 'ivory-4',
      'brass', 'brass-hi', 'brass-lo', 'brass-wash',
      'pitch-1', 'pitch-2', 'pitch-line', 'grass', 'grass-wash', 'terra', 'terra-wash', 'mint',
      'line', 'line-2', 'line-3',
      'font-display', 'font-sans', 'font-mono',
      'fs-display', 'fs-h1', 'fs-h2', 'fs-h3', 'fs-lead', 'fs-body', 'fs-small', 'fs-label',
      'gutter', 'maxw', 'section', 'r-1', 'r-2', 'ease', 'ease-in-out', 'dur',
      'z-header', 'z-overlay', 'z-modal', 'z-toast',
    ];
    const missing = legacy.filter((n) => def(`--${n}`) === null);
    ok(missing.length === 0, 'eksik eski belirteç: ' + missing.join(', '));
    ok(/var\(--accent\)/.test(def('--brass')) && /var\(--accent-hi\)/.test(def('--brass-hi')), '--brass* → --accent* takma adı');
    ok(/var\(--flare\)/.test(def('--terra')), '--terra → --flare takma adı');
    for (const n of ['accent', 'accent-hi', 'accent-lo', 'accent-ink', 'accent-wash', 'gold', 'flare', 'sky', 'surface-1', 'surface-2', 'surface-3', 'glow-accent', 'floodlight', 'fs-hero', 'sh-1', 'sh-2', 'sh-3']) {
      ok(def(`--${n}`) !== null, `yeni belirteç yok: --${n}`);
    }
  });

  await test('Belirteçler: kodda kullanılan her var(--x) bir yerde tanımlı (bileşen içi değişkenler dâhil)', async () => {
    const files = [];
    const walk = (d) => {
      for (const f of fs.readdirSync(path.join(root, d), { withFileTypes: true })) {
        const rel = path.join(d, f.name);
        if (f.isDirectory()) {
          if (!['node_modules', '.next', 'out'].includes(f.name)) walk(rel);
        } else if (/\.(css|tsx|ts)$/.test(f.name)) files.push(rel);
      }
    };
    for (const d of ['styles', 'app', 'components', 'lib']) walk(d);
    const defined = new Set();
    const used = new Map();
    for (const f of files) {
      const src = read(f);
      for (const m of src.matchAll(/(--[a-z][a-z0-9-]*)\s*:/g)) defined.add(m[1]);
      for (const m of src.matchAll(/['"](--[a-z][a-z0-9-]*)['"]\s*:/g)) defined.add(m[1]);
      for (const m of src.matchAll(/@property\s+(--[a-z][a-z0-9-]*)/g)) defined.add(m[1]);
      for (const m of src.matchAll(/var\((--[a-z][a-z0-9-]*)\s*([,)])/g)) {
        if (m[2] === ',') continue; // yedek değeri var
        if (!used.has(m[1])) used.set(m[1], f);
      }
    }
    const undef = [...used].filter(([n]) => !defined.has(n)).map(([n, f]) => `${n} (${f})`);
    ok(undef.length === 0, 'tanımsız değişken: ' + undef.join(', '));
  });

  await test('Kontrast (WCAG AA): metin belirteçleri zeminlerinde ≥ 4.5:1; volt ve volt üstü metin ≥ 7:1', async () => {
    const bg = ['ink-950', 'ink-900', 'ink-850', 'ink-800'].map((n) => [n, hex(`--${n}`)]);
    const text = ['ivory', 'ivory-2', 'ivory-3', 'ivory-4', 'accent', 'accent-hi', 'gold', 'gold-hi', 'flare', 'flare-hi', 'sky', 'sky-hi', 'grass', 'mint'];
    const bad = [];
    for (const t of text) {
      for (const [bn, b] of bg) {
        const c = contrast(hex(`--${t}`), b);
        if (c < 4.5) bad.push(`${t} / ${bn}: ${c.toFixed(2)}`);
      }
    }
    ok(bad.length === 0, 'AA altı: ' + bad.join('; '));
    ok(contrast(hex('--accent-ink'), hex('--accent')) >= 7, 'accent-ink / accent < 7:1: ' + contrast(hex('--accent-ink'), hex('--accent')).toFixed(2));
    ok(contrast(hex('--accent'), hex('--ink-900')) >= 7, 'accent / ink-900 < 7:1');
    ok(contrast(hex('--ivory'), hex('--ink-900')) >= 12, 'ivory / ink-900 < 12:1');
    // dolgu üstü koyu metin: rozet / birincil düğme
    ok(contrast('#241a05', hex('--gold')) >= 7 && contrast('#2a0a03', hex('--flare')) >= 5 && contrast('#03202f', hex('--sky')) >= 7, 'rozet metinleri');
  });
};
