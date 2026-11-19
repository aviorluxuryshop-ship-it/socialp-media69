import { app } from '../app.js';
import { LAYOUT, SECTIONS, STAND_PIECES } from '../data/sections.js';
import { pathSamples } from '../scene/geometry.js';

// Üstten bakış 2D mini harita (SVG). Kuzey yukarı, Doğu sağda.
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent?.appendChild(n);
  return n;
};

function sectionPath(def) {
  const t = LAYOUT.tiers[def.tier];
  const s = pathSamples(STAND_PIECES[def.stand], 6);
  const g = 0.35; // bölümler arası ince boşluk
  const inner = s.map((p) => [p.x + p.nx * (t.d0 + g), p.z + p.nz * (t.d0 + g)]);
  const outer = s.map((p) => [p.x + p.nx * (t.d1 - g), p.z + p.nz * (t.d1 - g)]).reverse();
  return 'M' + [...inner, ...outer].map(([x, z]) => `${x.toFixed(2)},${z.toFixed(2)}`).join('L') + 'Z';
}

export function createMinimap(onPick) {
  const svg = el('svg', { viewBox: '-84 -104 168 208', class: 'minimap', role: 'group', 'aria-label': 'Stadyum haritası' });
  const { width: pw, length: pl } = LAYOUT.pitch;
  el('rect', { x: -pw / 2, y: -pl / 2, width: pw, height: pl, rx: 2, class: 'mm-pitch' }, svg);
  const lines = el('g', { class: 'mm-lines' }, svg);
  el('line', { x1: -pw / 2, y1: 0, x2: pw / 2, y2: 0 }, lines);
  el('circle', { cx: 0, cy: 0, r: 9.15, fill: 'none' }, lines);
  el('rect', { x: -20.16, y: -pl / 2, width: 40.32, height: 16.5, fill: 'none' }, lines);
  el('rect', { x: -20.16, y: pl / 2 - 16.5, width: 40.32, height: 16.5, fill: 'none' }, lines);
  const paths = new Map();
  for (const def of SECTIONS) {
    const p = el('path', { d: sectionPath(def), class: 'mm-sec', tabindex: '0', role: 'button', 'aria-label': def.name, 'data-id': def.id }, svg);
    el('title', {}, p).textContent = def.name;
    p.addEventListener('click', () => onPick(def.id));
    p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(def.id); } });
    paths.set(def.id, p);
  }
  // tribün adları
  const lab = (t, x, y) => { el('text', { x, y, class: 'mm-lab', 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, svg).textContent = t; };
  lab('KUZEY', 0, -98); lab('GÜNEY', 0, 98);
  lab('BATI', -80, 0); lab('DOĞU', 80, 0);
  svg.querySelectorAll('.mm-lab').forEach((t, i) => { if (i > 1) t.setAttribute('transform', `rotate(${i === 2 ? -90 : 90} ${t.getAttribute('x')} 0)`); });
  // bakış konisi + konum
  const me = el('g', { class: 'mm-me' }, svg);
  const cone = el('path', { d: 'M0,0 L-10,-20 Q0,-24 10,-20 Z', class: 'mm-cone' }, me);
  el('circle', { r: 2.6, class: 'mm-dot' }, me);

  let on = false;
  const dir = { x: 0, y: 0, z: 0 };
  app.frameCallbacks.add(() => {
    if (!on) return;
    const c = app.camera, p = c.position;
    const e = c.matrixWorld.elements; // -Z ekseni = bakış yönü
    dir.x = -e[8]; dir.z = -e[10];
    const ang = (Math.atan2(dir.x, -dir.z) * 180) / Math.PI;
    me.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.z.toFixed(2)}) rotate(${ang.toFixed(1)})`);
  });

  return {
    svg,
    setActive(id) {
      for (const [k, p] of paths) p.classList.toggle('is-on', k === id);
    },
    setTracking(v) { on = v; me.style.display = v ? '' : 'none'; },
  };
}
