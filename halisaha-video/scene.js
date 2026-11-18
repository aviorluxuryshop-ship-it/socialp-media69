import * as THREE from 'three';

// ---------------------------------------------------------------- setup
const W = 1280, H = 720;
const TL = await (await fetch('./timeline_env.json')).json();
const FPS = TL.fps;
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const ov = document.getElementById('ov').getContext('2d');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1430);
scene.fog = new THREE.Fog(0x0b1430, 45, 120);
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 400);

// ---------------------------------------------------------------- helpers
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const seg = (t, a, b) => clamp((t - a) / (b - a));
function kf(t, keys) { // keys: [[t, v|[...]]], linear with smoothstep
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (t <= t1) {
      const u = ease((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], u)) : lerp(v0, v1, u);
    }
  }
  return keys[keys.length - 1][1];
}
function kfLin(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (t <= t1) { const u = (t - t0) / (t1 - t0); return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], u)) : lerp(v0, v1, u); }
  }
  return keys[keys.length - 1][1];
}
// deterministic noise
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise1 = x => { const i = Math.floor(x), f = x - i; return lerp(hash(i), hash(i + 1), ease(f)) * 2 - 1; };
// ballistic arc
function arc(t, t0, t1, p0, p1, h) {
  const u = clamp((t - t0) / (t1 - t0));
  return [lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u) + 4 * h * u * (1 - u), lerp(p0[2], p1[2], u)];
}
function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...opts.repeat); }
  return t;
}
const M = (c, r = 0.6, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });

// ---------------------------------------------------------------- lights
scene.add(new THREE.HemisphereLight(0x9fb8ff, 0x1d3a12, 0.9));
const sun = new THREE.DirectionalLight(0xfff3dd, 2.4);
sun.position.set(-12, 30, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 16, bottom: -16, near: 1, far: 80 });
sun.shadow.bias = -0.0005;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xbcd0ff, 0.9); fill.position.set(15, 18, -12); scene.add(fill);

// ---------------------------------------------------------------- pitch
const turfTex = canvasTex(2200, 1200, (g, w, h) => {
  const sx = w / 44, sz = h / 24; // meters -> px
  for (let i = 0; i < 22; i++) { g.fillStyle = i % 2 ? '#2f8f3a' : '#2a8434'; g.fillRect(i * w / 22, 0, w / 22 + 1, h); }
  // turf grain
  for (let i = 0; i < 60000; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '0,0,0'},${Math.random() * 0.05})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.strokeStyle = 'rgba(255,255,255,0.92)'; g.lineWidth = 0.12 * sx;
  const X = x => (x + 22) * sx, Z = z => (z + 12) * sz;
  g.strokeRect(X(-20), Z(-10), 40 * sx, 20 * sz);
  g.beginPath(); g.moveTo(X(0), Z(-10)); g.lineTo(X(0), Z(10)); g.stroke();
  g.beginPath(); g.ellipse(X(0), Z(0), 3 * sx, 3 * sz, 0, 0, Math.PI * 2); g.stroke();
  for (const s of [-1, 1]) {
    g.beginPath(); g.ellipse(X(20 * s), Z(0), 6 * sx, 6 * sz, 0, s > 0 ? Math.PI / 2 : -Math.PI / 2, s > 0 ? Math.PI * 1.5 : Math.PI / 2); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(X(14 * s), Z(0), .15 * sx, .15 * sz, 0, 0, 7); g.fill();
  }
  g.beginPath(); g.ellipse(X(0), Z(0), .18 * sx, .18 * sz, 0, 0, 7); g.fillStyle = '#fff'; g.fill();
});
const turf = new THREE.Mesh(new THREE.PlaneGeometry(44, 24), M(0xffffff, 0.95, { map: turfTex }));
turf.rotation.x = -Math.PI / 2; turf.receiveShadow = true; scene.add(turf);
const outer = new THREE.Mesh(new THREE.PlaneGeometry(160, 120), M(0x1a2a1a, 1));
outer.rotation.x = -Math.PI / 2; outer.position.y = -0.02; scene.add(outer);

// boards
const boardTex = canvasTex(1024, 64, (g, w, h) => {
  const ads = ['HALI SAHA ARENA', 'KAPTAN DÖNER', 'GOL KRAL SPOR', 'ÇAY OCAĞI 7/24', 'MAHALLE LİGİ'];
  for (let i = 0; i < 5; i++) {
    g.fillStyle = ['#c0392b', '#1f5fbf', '#f1c40f', '#16a085', '#8e44ad'][i]; g.fillRect(i * w / 5, 0, w / 5, h);
    g.fillStyle = i == 2 ? '#111' : '#fff'; g.font = 'bold 26px DejaVu Sans'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(ads[i], i * w / 5 + w / 10, h / 2);
  }
}, { repeat: [3, 1] });
const boardMat = M(0xffffff, 0.5, { map: boardTex, emissive: 0x222222 });
function board(w, x, z, ry) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.9, 0.12), boardMat);
  b.position.set(x, 0.45, z); b.rotation.y = ry; b.castShadow = b.receiveShadow = true; scene.add(b);
}
board(44, 0, -11.2, 0); board(44, 0, 11.2, Math.PI); board(22.4, -22.1, 0, Math.PI / 2); board(22.4, 22.1, 0, -Math.PI / 2);
// fence net
const fenceTex = canvasTex(256, 256, (g, w, h) => {
  g.strokeStyle = 'rgba(30,30,30,0.9)'; g.lineWidth = 3;
  for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); }
}, { repeat: [40, 6] });
const fenceMat = new THREE.MeshBasicMaterial({ map: fenceTex, transparent: true, side: THREE.DoubleSide, depthWrite: false });
function fence(w, x, z, ry) {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, 6), fenceMat); f.position.set(x, 3.9, z); f.rotation.y = ry; scene.add(f);
}
fence(44.5, 0, -11.3, 0); fence(44.5, 0, 11.3, 0); fence(22.6, -22.2, 0, Math.PI / 2); fence(22.6, 22.2, 0, Math.PI / 2);
// floodlights
for (const [x, z] of [[-22, -11.5], [22, -11.5], [-22, 11.5], [22, 11.5], [0, -11.5], [0, 11.5]]) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 11, 8), M(0x777777, 0.4, { metalness: 0.6 }));
  pole.position.set(x, 5.5, z); scene.add(pole);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.4), new THREE.MeshBasicMaterial({ color: 0xfffbe8 }));
  lamp.position.set(x, 11, z); lamp.lookAt(0, 0, 0); scene.add(lamp);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,250,220,1)'); r.addColorStop(.25, 'rgba(255,240,200,.5)'); r.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.scale.set(7, 7, 1); glow.position.set(x, 11, z); scene.add(glow);
}
// city skyline
const winTex = canvasTex(128, 256, (g, w, h) => {
  g.fillStyle = '#121a2c'; g.fillRect(0, 0, w, h);
  for (let y = 8; y < h; y += 16) for (let x = 6; x < w; x += 14) if (Math.random() < .45) { g.fillStyle = Math.random() < .7 ? '#ffd27a' : '#9fd0ff'; g.fillRect(x, y, 7, 9); }
});
const bMat = new THREE.MeshBasicMaterial({ map: winTex });
for (let i = 0; i < 70; i++) {
  const a = (i / 70) * Math.PI * 2, r = 70 + hash(i) * 20, hgt = 8 + hash(i + 9) * 22;
  const b = new THREE.Mesh(new THREE.BoxGeometry(6 + hash(i + 3) * 6, hgt, 6), bMat);
  b.position.set(Math.cos(a) * r, hgt / 2, Math.sin(a) * r); b.lookAt(0, hgt / 2, 0); scene.add(b);
}
// stars in sky
{
  const g = new THREE.BufferGeometry(); const p = [];
  for (let i = 0; i < 400; i++) { const a = hash(i * 3) * 6.28, e = 0.2 + hash(i * 7) * 1.2; p.push(Math.cos(a) * 150 * Math.cos(e), 150 * Math.sin(e), Math.sin(a) * 150 * Math.cos(e)); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, fog: false })));
}
// benches & bags for atmosphere
for (const x of [-6, 6]) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(4, 0.45, 0.6), M(0x4a3b2a)); b.position.set(x, 0.23, -12.4); scene.add(b);
}

// goals with nets
const netTex = canvasTex(256, 256, (g, w, h) => {
  g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 3;
  for (let i = 0; i <= 10; i++) { g.beginPath(); g.moveTo(i * w / 10, 0); g.lineTo(i * w / 10, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 10); g.lineTo(w, i * h / 10); g.stroke(); }
}, { repeat: [3, 2] });
const netMat = new THREE.MeshBasicMaterial({ map: netTex, transparent: true, side: THREE.DoubleSide, depthWrite: false });
const goals = {};
for (const s of [-1, 1]) {
  const grp = new THREE.Group(); grp.position.x = 20 * s; scene.add(grp);
  const postM = M(0xffffff, 0.3);
  const mk = (geo, x, y, z, rx = 0, rz = 0) => { const m = new THREE.Mesh(geo, postM); m.position.set(x, y, z); m.rotation.x = rx; m.rotation.z = rz; m.castShadow = true; grp.add(m); };
  mk(new THREE.CylinderGeometry(.06, .06, 2.05, 10), 0, 1.02, -1.5);
  mk(new THREE.CylinderGeometry(.06, .06, 2.05, 10), 0, 1.02, 1.5);
  mk(new THREE.CylinderGeometry(.06, .06, 3.1, 10), 0, 2.03, 0, Math.PI / 2);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(3, 2, 24, 16), netMat);
  back.rotation.y = Math.PI / 2; back.position.set(1.1 * s, 1, 0); grp.add(back);
  back.userData.base = back.geometry.attributes.position.array.slice();
  const top = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 3), netMat); top.rotation.x = -Math.PI / 2; top.position.set(0.55 * s, 2, 0); grp.add(top);
  for (const z of [-1.5, 1.5]) { const sd = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2), netMat); sd.position.set(0.55 * s, 1, z); grp.add(sd); }
  goals[s] = { grp, back, s };
}
function bulgeNet(s, amount, cy = 1.4, cz = 0) { // amount 0..1
  const back = goals[s].back, pos = back.geometry.attributes.position, base = back.userData.base;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3], y = base[i * 3 + 1];
    // local: plane x -> world -z (because rotated), plane y -> world y-1
    const d2 = (x + cz * (s > 0 ? 1 : -1)) ** 2 + (y - (cy - 1)) ** 2;
    pos.array[i * 3 + 2] = base[i * 3 + 2] + amount * 0.8 * Math.exp(-d2 / 0.35) * (s > 0 ? -1 : 1) * -1;
  }
  pos.needsUpdate = true;
}

// ---------------------------------------------------------------- ball
const ballTex = canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = '#f7f7f7'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#151515';
  for (let i = 0; i < 12; i++) {
    const cx = (i % 6) * w / 6 + (i < 6 ? 0 : w / 12), cy = i < 6 ? h * .3 : h * .72;
    g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283 - 1.57; g.lineTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 30); } g.fill();
  }
  g.fillStyle = '#d32'; g.fillRect(0, h * .5 - 3, w, 6);
});
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), M(0xffffff, 0.35, { map: ballTex }));
ball.castShadow = true; scene.add(ball);
let ballPrev = new THREE.Vector3();
// trail
const trailN = 14; const trail = [];
for (let i = 0; i < trailN; i++) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(0.11 * (1 - i / trailN), 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.55 * (1 - i / trailN), depthWrite: false }));
  scene.add(s); trail.push(s);
}

// ---------------------------------------------------------------- characters
function numberTex(num, fg, outline) {
  return canvasTex(128, 128, (g, w, h) => {
    g.font = 'bold 96px DejaVu Sans'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 8; g.strokeStyle = outline; g.strokeText(num, w / 2, h / 2 + 4); g.fillStyle = fg; g.fillText(num, w / 2, h / 2 + 4);
  });
}
function nameTex(name, fg) {
  return canvasTex(256, 64, (g, w, h) => { g.font = 'bold 40px DejaVu Sans'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg; g.fillText(name, w / 2, h / 2); });
}
function capsule(r, l, mat) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 14), mat); m.castShadow = true; return m; }
function sphere(r, mat, ws = 20, hs = 14) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), mat); m.castShadow = true; return m; }

function makeChar(o) {
  const c = { o };
  const root = new THREE.Group(); scene.add(root); c.root = root;
  const hips = new THREE.Group(); hips.position.y = 1.02; root.add(hips); c.hips = hips;
  const skin = M(o.skin, 0.55), jersey = M(o.jersey, 0.75), shortsM = M(o.shorts, 0.7), sockM = M(o.socks, 0.8), bootM = M(o.boots || 0x111111, 0.35), hairM = M(o.hair, 0.85);
  c.skinMat = skin; c.jerseyMat = jersey;
  const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.235, 0.27, 18), shortsM); shorts.position.y = -0.06; shorts.castShadow = true; hips.add(shorts); c.shorts = shorts;
  const spine = new THREE.Group(); spine.position.y = 0.06; hips.add(spine); c.spine = spine;
  const torso = capsule(0.2, 0.32, jersey); torso.scale.set(1.12, 1, 0.72); torso.position.y = 0.3; spine.add(torso); c.torso = torso;
  // trims / collar
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.02, 8, 16), M(o.trim, 0.6)); collar.rotation.x = Math.PI / 2; collar.position.y = 0.66; spine.add(collar);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.228, 0.228, 0.05, 18, 1, true), M(o.trim, 0.6)); stripe.scale.set(1, 1, 0.72); stripe.position.y = 0.1; spine.add(stripe);
  // numbers
  const back = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), new THREE.MeshStandardMaterial({ map: numberTex(o.num, '#fff', o.trimCss), transparent: true, roughness: .7 }));
  back.position.set(0, 0.33, -0.152); back.rotation.y = Math.PI; spine.add(back);
  const nm = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.075), new THREE.MeshStandardMaterial({ map: nameTex(o.name, '#fff'), transparent: true, roughness: .7 }));
  nm.position.set(0, 0.52, -0.148); nm.rotation.y = Math.PI; spine.add(nm);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.11), new THREE.MeshStandardMaterial({ map: numberTex(o.num, '#fff', o.trimCss), transparent: true, roughness: .7 }));
  front.position.set(0.08, 0.45, 0.149); spine.add(front);
  // neck + head
  const neck = capsule(0.06, 0.06, skin); neck.position.y = 0.7; spine.add(neck);
  const head = new THREE.Group(); head.position.y = 0.86; spine.add(head); c.head = head;
  const skull = sphere(0.15, skin, 28, 20); skull.scale.set(0.95, 1.1, 1); head.add(skull);
  const jaw = sphere(0.12, skin); jaw.scale.set(1.05, 0.7, 1); jaw.position.set(0, -0.07, 0.03); head.add(jaw);
  const nose = sphere(0.03, skin); nose.scale.set(0.9, 1.1, 1.2); nose.position.set(0, -0.01, 0.155); head.add(nose);
  for (const s of [-1, 1]) { const e = sphere(0.035, skin); e.scale.set(0.5, 1, 0.8); e.position.set(0.145 * s, 0, 0); head.add(e); }
  c.eyes = []; c.pupils = []; c.brows = [];
  const white = M(0xffffff, 0.2), black = M(0x111111, 0.2), browM = M(o.brow || o.hair, 0.9);
  for (const s of [-1, 1]) {
    const eye = sphere(0.032, white, 16, 12); eye.scale.set(1, 1.15, 0.6); eye.position.set(0.055 * s, 0.025, 0.128); head.add(eye); c.eyes.push(eye);
    const p = sphere(0.016, black, 10, 8); p.position.set(0.055 * s, 0.025, 0.148); head.add(p); c.pupils.push(p);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.016, 0.02), browM); b.position.set(0.058 * s, 0.075, 0.14); head.add(b); b.userData.s = s; c.brows.push(b);
  }
  const mouth = new THREE.Group(); mouth.position.set(0, -0.075, 0.135); head.add(mouth); c.mouth = mouth;
  const mIn = sphere(0.035, M(0x4a0d12, 0.6), 16, 10); mIn.scale.set(1.4, 1, 0.45); mouth.add(mIn); c.mouthIn = mIn;
  const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.01), white); teeth.position.set(0, 0.018, 0.012); mouth.add(teeth); c.teeth = teeth;
  // hair
  const hair = new THREE.Group(); head.add(hair); c.hair = hair;
  if (o.hairStyle === 'curly') {
    for (let i = 0; i < 26; i++) {
      const a = hash(i * 5.1) * Math.PI * 2, e = 0.25 + hash(i * 2.7) * 0.95;
      const h = sphere(0.05, hairM, 10, 8);
      h.position.set(Math.cos(a) * Math.cos(e) * 0.15, 0.05 + Math.sin(e) * 0.14, Math.sin(a) * Math.cos(e) * 0.15 - 0.02);
      if (h.position.z > 0.08 && h.position.y < 0.12) continue;
      hair.add(h);
    }
  } else if (o.hairStyle === 'buzz') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.157, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), hairM); cap.scale.set(0.95, 1.1, 1); cap.rotation.x = -0.25; hair.add(cap);
  } else if (o.hairStyle === 'bald') {
    for (const s of [-1, 1]) { const h = sphere(0.06, hairM, 10, 8); h.scale.set(0.6, 1, 1.2); h.position.set(0.13 * s, 0.02, -0.04); hair.add(h); }
  }
  if (o.moustache) { const m = capsule(0.018, 0.07, hairM); m.rotation.z = Math.PI / 2; m.position.set(0, -0.045, 0.148); head.add(m); }
  if (o.stubble) { const st = sphere(0.122, M(o.stubble, 0.95)); st.scale.set(1.06, 0.62, 1.0); st.position.set(0, -0.085, 0.032); head.add(st); jaw.visible = true; }
  if (o.whistle) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.006, 6, 20), M(0xdddddd, .3)); w.rotation.x = Math.PI / 2.4; w.position.set(0, 0.62, 0.04); spine.add(w); }
  // arms
  c.sh = []; c.el = [];
  for (const s of [-1, 1]) {
    const shG = new THREE.Group(); shG.position.set(0.27 * s, 0.56, 0); spine.add(shG);
    const sleeve = capsule(0.068, 0.1, jersey); sleeve.position.y = -0.08; shG.add(sleeve);
    const up = capsule(0.055, 0.16, skin); up.position.y = -0.18; shG.add(up);
    const el = new THREE.Group(); el.position.y = -0.3; shG.add(el);
    const fa = capsule(0.05, 0.18, skin); fa.position.y = -0.13; el.add(fa);
    const hand = sphere(0.058, skin); hand.scale.set(0.9, 1.1, 0.8); hand.position.y = -0.29; el.add(hand);
    shG.userData.s = s; c.sh.push(shG); c.el.push(el);
  }
  // legs
  c.hp = []; c.kn = []; c.sockMesh = [];
  for (const s of [-1, 1]) {
    const hp = new THREE.Group(); hp.position.set(0.1 * s, -0.12, 0); hips.add(hp);
    const th = capsule(0.078, 0.22, skin); th.position.y = -0.2; hp.add(th);
    const kn = new THREE.Group(); kn.position.y = -0.42; hp.add(kn);
    const shin = capsule(0.066, 0.24, sockM); shin.position.y = -0.2; kn.add(shin); c.sockMesh.push(shin);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.26), bootM); boot.position.set(0, -0.44, 0.05); boot.castShadow = true; kn.add(boot);
    c.hp.push(hp); c.kn.push(kn);
  }
  // effects attached to head: stars, steam
  c.stars = new THREE.Group(); head.add(c.stars); c.stars.position.y = 0.26;
  for (let i = 0; i < 5; i++) {
    const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.045), new THREE.MeshBasicMaterial({ color: 0xffe14d })); c.stars.add(st);
  }
  c.steam = [];
  for (let i = 0; i < 8; i++) { const p = sphere(0.04, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8 })); p.castShadow = false; head.add(p); c.steam.push(p); }
  c.sweat = [];
  for (let i = 0; i < 3; i++) { const d = sphere(0.025, new THREE.MeshStandardMaterial({ color: 0x9fd8ff, roughness: .1, transparent: true, opacity: .85 })); head.add(d); c.sweat.push(d); }
  c.baseSkin = new THREE.Color(o.skin);
  return c;
}

const RED = makeChar({ name: 'DORUK', num: '10', jersey: 0xd7262e, trim: 0xffffff, trimCss: '#7a0d12', shorts: 0xffffff, socks: 0xd7262e, skin: 0xd9a27a, hair: 0x1a1210, hairStyle: 'curly', stubble: 0x8a6a55, boots: 0xffd400 });
const BLUE = makeChar({ name: 'SEYDU', num: '7', jersey: 0x1f5fd1, trim: 0xffffff, trimCss: '#0a2a6a', shorts: 0x10224a, socks: 0x1f5fd1, skin: 0xc98f66, hair: 0x2a1c14, hairStyle: 'buzz', moustache: true, boots: 0xff3b8d });
const REF = makeChar({ name: 'HAKEM', num: '', jersey: 0x151515, trim: 0xf5d000, trimCss: '#000', shorts: 0x111111, socks: 0x111111, skin: 0xe0b08a, hair: 0x555555, hairStyle: 'bald', moustache: true, whistle: true, brow: 0x333333 });
const CHARS = [RED, BLUE, REF];

// pose system ------------------------------------------------------------
function P(extra = {}) {
  return Object.assign({
    lean: 0, side: 0, twist: 0, headX: 0, headY: 0, headZ: 0, bob: 0,
    sh: [[0, 0.12, 0], [0, 0.12, 0]], el: [-0.2, -0.2], hp: [0, 0], hpz: [0, 0], kn: [0.05, 0.05],
    brow: 0, mouth: 0.05, eye: 1, smile: 0, stars: 0, steam: 0, sweat: 0, red: 0, look: [0, 0]
  }, extra);
}
// sh: [x(forward-/back+), out, twist]
function applyPose(c, p) {
  c.spine.rotation.set(p.lean, p.twist, p.side);
  c.hips.position.y = 1.02 + p.bob;
  c.head.rotation.set(p.headX, p.headY, p.headZ);
  for (let i = 0; i < 2; i++) {
    const s = c.sh[i].userData.s;
    c.sh[i].rotation.set(p.sh[i][0], p.sh[i][2] * s, p.sh[i][1] * s);
    c.el[i].rotation.set(p.el[i], 0, 0);
    c.hp[i].rotation.set(p.hp[i], 0, p.hpz[i] * (i ? 1 : -1));
    c.kn[i].rotation.set(p.kn[i], 0, 0);
  }
  const m = clamp(p.mouth, 0, 1.3);
  c.mouthIn.scale.set(1.3 + m * 0.35 + p.smile * 0.6, 0.25 + m * 1.9, 0.45);
  c.teeth.visible = m > 0.25;
  for (const b of c.brows) { b.rotation.z = -p.brow * 0.5 * b.userData.s; b.position.y = 0.075 - Math.abs(p.brow) * 0.012 + (p.brow < 0 ? 0.02 * -p.brow : 0); }
  for (const e of c.eyes) e.scale.set(p.eye, 1.15 * p.eye, 0.6);
  for (let i = 0; i < 2; i++) { c.pupils[i].position.x = 0.055 * (i ? 1 : -1) + p.look[0] * 0.012; c.pupils[i].position.y = 0.025 + p.look[1] * 0.01; c.pupils[i].scale.setScalar(p.eye > 1.3 ? 0.8 : 1); }
  c.skinMat.color.copy(c.baseSkin).lerp(new THREE.Color(0xe0302a), p.red);
  c.stars.visible = p.stars > 0;
  if (p.stars > 0) c.stars.children.forEach((s, i) => { const a = T * 6 + i * 1.2566; s.position.set(Math.cos(a) * 0.22, Math.sin(T * 9 + i) * 0.03, Math.sin(a) * 0.22); s.rotation.y = T * 8; });
  c.steam.forEach((s, i) => {
    s.visible = p.steam > 0;
    if (!s.visible) return;
    const ph = ((T * 1.8 + i / 8) % 1), side = i % 2 ? 1 : -1;
    s.position.set(side * (0.17 + ph * 0.12), 0.0 + ph * 0.35, -0.02); s.scale.setScalar(0.5 + ph * 1.6); s.material.opacity = 0.85 * (1 - ph) * p.steam;
  });
  c.sweat.forEach((d, i) => {
    d.visible = p.sweat > 0;
    const ph = ((T * 1.3 + i / 3) % 1);
    d.position.set((i - 1) * 0.12, 0.12 - ph * 0.25, 0.1); d.scale.set(1, 1.4, 1);
  });
}
function runPose(ph, amp = 1, extra = {}) {
  const s = Math.sin(ph), c2 = Math.cos(ph);
  return P(Object.assign({
    lean: 0.22 * amp, bob: Math.abs(c2) * 0.06 * amp - 0.03 * amp,
    hp: [-s * 0.85 * amp, s * 0.85 * amp], kn: [0.25 + Math.max(0, Math.sin(ph + 1.2)) * 1.2 * amp, 0.25 + Math.max(0, Math.sin(ph + 1.2 + Math.PI)) * 1.2 * amp],
    sh: [[s * 0.8 * amp, 0.15, 0], [-s * 0.8 * amp, 0.15, 0]], el: [-1.3, -1.3], headX: -0.1 * amp
  }, extra));
}
function walkPose(ph, amp = 0.6, extra = {}) {
  const s = Math.sin(ph);
  return P(Object.assign({ lean: 0.05, bob: Math.abs(Math.cos(ph)) * 0.025, hp: [-s * 0.5 * amp, s * 0.5 * amp], kn: [0.1 + Math.max(0, Math.sin(ph + 1.4)) * 0.6 * amp, 0.1 + Math.max(0, Math.sin(ph + 1.4 + Math.PI)) * 0.6 * amp], sh: [[s * 0.45 * amp, 0.25, 0], [-s * 0.45 * amp, 0.25, 0]], el: [-0.5, -0.5] }, extra));
}
function blend(a, b, u) {
  const o = {};
  for (const k in a) {
    const va = a[k], vb = b[k];
    if (Array.isArray(va)) o[k] = va.map((x, i) => Array.isArray(x) ? x.map((y, j) => lerp(y, vb[i][j], u)) : lerp(x, vb[i], u));
    else o[k] = lerp(va, vb, u);
  }
  return o;
}
function place(c, x, z, heading, y = 0) { c.root.position.set(x, y, z); c.root.rotation.set(0, heading, 0); c.root.visible = true; }
const face = (dx, dz) => Math.atan2(dx, dz);

// lip sync
function speakAmt(speaker) {
  let v = 0;
  for (const d of TL.dialog) {
    if (d.speaker !== speaker) continue;
    const i = Math.floor((T - d.start) * FPS);
    if (i >= 0 && i < d.env.length) v = Math.max(v, d.env[i] * (0.75 + 0.25 * Math.abs(Math.sin(T * 31))));
  }
  return v;
}

// dishevel state
function dishevel(c, on) {
  c.hair.rotation.set(on ? 0.35 : 0, on ? 0.6 : 0, on ? -0.3 : 0);
  c.hair.position.set(on ? 0.03 : 0, on ? 0.02 : 0, 0);
  c.hair.scale.setScalar(on ? 1.18 : 1);
  c.torso.rotation.y = on ? 0.35 : 0;
  c.torso.rotation.z = on ? 0.12 : 0;
  c.sockMesh[0].scale.y = on ? 0.55 : 1; c.sockMesh[0].position.y = on ? -0.3 : -0.2;
  c.shorts.rotation.z = on ? 0.12 : 0;
}

// ---------------------------------------------------------------- dust cloud
const cloud = new THREE.Group(); scene.add(cloud);
const puffMat = new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 1, flatShading: true });
const puffMat2 = new THREE.MeshStandardMaterial({ color: 0xcdb994, roughness: 1, flatShading: true });
const puffs = [];
for (let i = 0; i < 60; i++) {
  const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), i % 3 ? puffMat : puffMat2);
  p.castShadow = true; cloud.add(p);
  p.userData = { a: hash(i) * 6.283, e: (hash(i + 50) - 0.3) * 1.4, r: 0.7 + hash(i + 99) * 0.7, s: 0.6 + hash(i + 7) * 0.8, sp: 1 + hash(i + 3) * 2 };
  puffs.push(p);
}
const silMat = new THREE.MeshBasicMaterial({ color: 0x1b1408, transparent: true, opacity: 0.38, depthTest: false });
const sil = [];
for (let i = 0; i < 2; i++) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.7, 4, 10), silMat); body.position.y = 1.0; g.add(body);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), silMat); hd.position.y = 1.75; g.add(hd);
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.6, 4, 8), silMat); arm.position.set(0.35, 1.3, 0); arm.rotation.z = 1.2; g.add(arm); g.userData.arm = arm;
  const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.7, 4, 8), silMat); leg.position.set(0.15, 0.45, 0); g.add(leg); g.userData.leg = leg;
  g.renderOrder = 10; g.children.forEach(m => m.renderOrder = 10);
  cloud.add(g); sil.push(g);
}
const debris = [];
const debrisMats = [new THREE.MeshBasicMaterial({ color: 0xffe14d }), new THREE.MeshBasicMaterial({ color: 0xffffff }), M(0x111111)];
for (let i = 0; i < 18; i++) {
  const geo = i % 3 == 0 ? new THREE.OctahedronGeometry(0.09) : i % 3 == 1 ? new THREE.TetrahedronGeometry(0.06) : new THREE.BoxGeometry(0.1, 0.06, 0.22);
  const d = new THREE.Mesh(geo, debrisMats[i % 3]); cloud.add(d); debris.push(d);
}
function updateCloud(t, size, intensity, cx = 0, cz = 0) {
  cloud.visible = size > 0.01;
  if (!cloud.visible) return;
  cloud.position.set(cx, 0, cz);
  puffs.forEach((p, i) => {
    const u = p.userData;
    const a = u.a + t * 0.6 * u.sp * (i % 2 ? 1 : -1);
    const r = (u.r + 0.25 * noise1(t * 3 * u.sp + i)) * size * 1.25;
    p.position.set(Math.cos(a) * Math.cos(u.e) * r * 1.3, 1.0 * size + Math.sin(u.e) * r * 0.9 + 0.1, Math.sin(a) * Math.cos(u.e) * r);
    const sc = u.s * size * (1 + 0.25 * Math.sin(t * 10 * intensity + i));
    p.scale.setScalar(Math.max(0.01, sc));
    p.rotation.set(t * u.sp, t * 0.7, 0);
  });
  sil.forEach((g, i) => {
    const ph = t * (6 + i * 2.3) * intensity;
    g.visible = size > 0.6;
    g.position.set(Math.sin(ph * 0.7 + i * 3) * 0.6 * size, -0.1 + Math.abs(Math.sin(ph)) * 0.25, 1.05 * size);
    g.rotation.z = Math.sin(ph * 1.3) * 0.5; g.rotation.y = i ? Math.PI : 0;
    g.userData.arm.rotation.z = 0.5 + Math.abs(Math.sin(ph * 2.1 + i)) * 1.8;
    g.userData.leg.rotation.z = Math.sin(ph * 1.7 + i) * 1.0;
    g.scale.setScalar(size * 0.85);
  });
  debris.forEach((d, i) => {
    const per = 0.9 + hash(i) * 0.6, ph = ((t + hash(i + 4) * per) % per) / per;
    const a = hash(i + 11) * 6.283 + Math.floor((t + hash(i + 4) * per) / per) * 2.1;
    d.visible = intensity > 0.3;
    d.position.set(Math.cos(a) * (0.8 + ph * 3) * size, 1.2 * size + ph * 3 - ph * ph * 3.5, Math.sin(a) * (0.8 + ph * 2.5) * size);
    d.rotation.set(t * 9 + i, t * 7, 0);
  });
}

// ---------------------------------------------------------------- censor sprite
const censorTex = canvasTex(512, 512, (g, w, h) => {
  const cols = ['#e9b28c', '#d7262e', '#ffffff', '#c98f66', '#a11a20', '#f4d0b5', '#1f5fd1'];
  const n = 8;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = cols[Math.floor(hash(x * 13 + y * 7) * cols.length)]; g.fillRect(x * w / n, y * h / n, w / n + 1, h / n + 1); }
  g.fillStyle = 'rgba(0,0,0,0.88)'; g.beginPath(); g.roundRect(20, h / 2 - 70, w - 40, 140, 30); g.fill();
  g.font = 'bold 104px DejaVu Sans'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#ffde00'; g.fillText('SANSÜR', w / 2, h / 2 + 6);
  g.lineWidth = 18; g.strokeStyle = '#111'; g.strokeRect(9, 9, w - 18, h - 18);
  g.fillStyle = '#ffde00'; g.font = 'bold 44px DejaVu Sans';
  g.fillText('★ ★ ★', w / 2, 60); g.fillText('★ ★ ★', w / 2, h - 52);
});
const censor = new THREE.Sprite(new THREE.SpriteMaterial({ map: censorTex, depthTest: false, depthWrite: false }));
censor.renderOrder = 999; censor.visible = false; scene.add(censor);

// ---------------------------------------------------------------- overlay helpers
const OV = { items: [] };
function txt(s, x, y, size, fill = '#fff', opts = {}) {
  ov.save();
  ov.font = `${opts.weight || 'bold'} ${size}px ${opts.font || 'DejaVu Sans'}`;
  ov.textAlign = opts.align || 'center'; ov.textBaseline = 'middle';
  if (opts.rot) { ov.translate(x, y); ov.rotate(opts.rot); x = 0; y = 0; }
  if (opts.scale) { ov.translate(x, y); ov.scale(opts.scale, opts.scale); x = 0; y = 0; }
  ov.globalAlpha = opts.alpha ?? 1;
  if (opts.stroke !== false) { ov.lineJoin = 'round'; ov.lineWidth = opts.lw || size * 0.16; ov.strokeStyle = opts.strokeColor || '#000'; ov.strokeText(s, x, y); }
  ov.fillStyle = fill; ov.fillText(s, x, y);
  ov.restore();
}
function project(v3) { const v = v3.clone().project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H, v.z]; }
function scoreBug(r, b, minute) {
  ov.save();
  ov.globalAlpha = 0.93;
  const x = 40, y = 30;
  ov.fillStyle = '#0d1424'; ov.beginPath(); ov.roundRect(x, y, 420, 46, 8); ov.fill();
  ov.fillStyle = '#d7262e'; ov.fillRect(x + 8, y + 8, 10, 30);
  ov.fillStyle = '#1f5fd1'; ov.fillRect(x + 262, y + 8, 10, 30);
  ov.fillStyle = '#f2f2f2'; ov.fillRect(x + 140, y + 4, 92, 38);
  ov.globalAlpha = 1;
  txt('DORUK', x + 78, y + 24, 20, '#fff', { stroke: false });
  txt(`${r} - ${b}`, x + 186, y + 24, 26, '#0d1424', { stroke: false });
  txt('SEYDU', x + 335, y + 24, 20, '#fff', { stroke: false });
  ov.fillStyle = '#2bd46a'; ov.beginPath(); ov.roundRect(x + 425, y, 96, 46, 8); ov.fill();
  txt(minute, x + 473, y + 24, 22, '#06210f', { stroke: false });
  ov.restore();
}
function subtitles() {
  for (const d of TL.dialog) {
    if (T >= d.start && T <= d.start + d.dur + 0.4) {
      const who = { red: ['DORUK', '#ff5a5f'], blue: ['SEYDU', '#5aa2ff'], ref: ['HAKEM', '#ffd400'], comm: ['SPİKER', '#9be89b'] }[d.speaker];
      const a = clamp((T - d.start) * 6) * clamp((d.start + d.dur + 0.4 - T) * 6);
      ov.save(); ov.globalAlpha = a * 0.7; ov.fillStyle = '#000';
      ov.font = 'bold 30px DejaVu Sans';
      const line = `${who[0]}: ${d.text}`;
      let wdt = Math.min(ov.measureText(line).width + 50, 1220);
      ov.beginPath(); ov.roundRect(W / 2 - wdt / 2, H - 92, wdt, 56, 12); ov.fill(); ov.restore();
      ov.save(); ov.globalAlpha = a; ov.font = 'bold 30px DejaVu Sans'; ov.textBaseline = 'middle'; ov.textAlign = 'left';
      let fs = 30; while (ov.measureText(line).width > 1180 && fs > 18) { fs -= 1; ov.font = `bold ${fs}px DejaVu Sans`; }
      const tw = ov.measureText(line).width, x0 = W / 2 - tw / 2;
      ov.fillStyle = who[1]; ov.fillText(who[0] + ':', x0, H - 64);
      ov.fillStyle = '#fff'; ov.fillText(' ' + d.text, x0 + ov.measureText(who[0] + ':').width, H - 64);
      ov.restore();
    }
  }
}
function bubble(text, x, y, color = '#fff', tail = -1, scale = 1) {
  ov.save(); ov.translate(x, y); ov.scale(scale, scale);
  ov.font = 'bold 30px DejaVu Sans'; const w = ov.measureText(text).width + 40;
  ov.fillStyle = color; ov.strokeStyle = '#111'; ov.lineWidth = 4;
  ov.beginPath(); ov.roundRect(-w / 2, -32, w, 64, 26); ov.fill(); ov.stroke();
  ov.beginPath(); ov.moveTo(-14 * tail, 30); ov.lineTo(-30 * tail, 62); ov.lineTo(8 * tail, 30); ov.fillStyle = color; ov.fill(); ov.stroke();
  ov.fillRect(-16, 26, 30, 8);
  ov.fillStyle = '#111'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.fillText(text, 0, 2);
  ov.restore();
}
function burst(text, x, y, size, rot, fill, alpha = 1) {
  ov.save(); ov.translate(x, y); ov.rotate(rot); ov.globalAlpha = alpha;
  ov.beginPath();
  for (let i = 0; i < 24; i++) { const r = (i % 2 ? 0.62 : 1) * size; const a = i / 24 * Math.PI * 2; ov.lineTo(Math.cos(a) * r * 1.35, Math.sin(a) * r); }
  ov.closePath(); ov.fillStyle = '#fff'; ov.fill(); ov.lineWidth = 5; ov.strokeStyle = '#111'; ov.stroke();
  ov.restore();
  txt(text, x, y, size * 0.55, fill, { rot, alpha, lw: 7 });
}
function vignette(a = 0.45) {
  const g = ov.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); ov.fillStyle = g; ov.fillRect(0, 0, W, H);
}
function flash(a) { if (a <= 0) return; ov.fillStyle = `rgba(255,255,255,${a})`; ov.fillRect(0, 0, W, H); }
function letterbox(a) { if (a <= 0) return; ov.fillStyle = '#000'; ov.fillRect(0, 0, W, 60 * a); ov.fillRect(0, H - 60 * a, W, 60 * a); }

// ---------------------------------------------------------------- camera helper
let shake = 0;
function cam(pos, look, fov = 40) {
  const sx = shake ? noise1(T * 23) * shake : 0, sy = shake ? noise1(T * 19 + 9) * shake : 0;
  camera.position.set(pos[0] + sx, pos[1] + sy, pos[2]);
  camera.fov = fov; camera.updateProjectionMatrix();
  camera.lookAt(look[0] + sx * 0.5, look[1] + sy * 0.5, look[2]);
}

// ---------------------------------------------------------------- shots
let T = 0;
let score = [0, 0], minute = "1'";
let showBug = false;
const overlayFns = [];
function ballAt(p) { ball.position.set(p[0], Math.max(0.11, p[1]), p[2]); }
function hideTrail() { trail.forEach(s => s.visible = false); }
const trailHist = [];

// standard attacking play helper: shooter runs, then shoots ball along arc into goal side s
function goalShot(lt, shooter, other, s, opts) {
  // opts: start [x,z], shootT, inT, target [y,z], keeperDive
  const { sx, sz, shootT, inT, ty, tz } = opts;
  const shootPos = [sx + s * 5.5, sz * 0.5];
  const rp = kfLin(lt, [[0, [sx, sz]], [shootT, shootPos]]);
  const runPh = lt * 11;
  if (lt < shootT) {
    place(shooter, rp[0], rp[1], face(s, -sz * 0.08));
    applyPose(shooter, runPose(runPh, 1, { brow: 0.6 }));
    ballAt([rp[0] + s * 0.45, 0.11, rp[1] + 0.1]);
  } else {
    const k = seg(lt, shootT, shootT + 0.25);
    place(shooter, shootPos[0] + s * 0.4 * k, shootPos[1], face(s, 0));
    applyPose(shooter, P({ lean: -0.15, hp: [0.3, -1.4 * Math.sin(k * Math.PI * 0.9)], kn: [0.3, 0.2], sh: [[-0.5, 0.9, 0], [0.6, 0.9, 0]], el: [-0.4, -0.4], brow: 0.8, mouth: 0.4 }));
    ballAt(arc(lt, shootT, inT, [shootPos[0] + s * 0.5, 0.11, shootPos[1]], [s * 20.6, ty, tz], 0.7));
    if (lt > inT) { const k2 = seg(lt, inT, inT + 0.3); ballAt([s * (20.6 + 0.3 * k2), Math.max(0.11, ty - 2.5 * k2 * k2), tz]); }
  }
  bulgeNet(s, lt > inT ? Math.exp(-(lt - inT) * 3) * Math.sin(Math.min(1, (lt - inT) * 8) * Math.PI / 2) : 0, ty, tz);
  // defender chasing
  const dp = [rp[0] - s * 1.6, rp[1] + 1.2];
  place(other, dp[0], dp[1], face(s, -0.2));
  applyPose(other, runPose(runPh + 1.7, 0.9, { brow: 0.7 }));
  return shootPos;
}

const SHOTS = [
  // ---------------- 0: TITLE
  [0, 4, lt => {
    showBug = false;
    const a = lt / 4;
    cam([lerp(-30, -8, ease(a)), lerp(22, 9, ease(a)), lerp(-30, -20, ease(a))], [0, 0, 0], 42);
    place(RED, -1.2, 0, face(1, 0)); place(BLUE, 1.2, 0, face(-1, 0)); place(REF, 0, -6, 0);
    applyPose(RED, P({ sh: [[0, 0.2, 0], [0, 0.2, 0]], bob: Math.sin(lt * 6) * 0.02 }));
    applyPose(BLUE, P({ sh: [[0, 0.2, 0], [0, 0.2, 0]], bob: Math.sin(lt * 6 + 1) * 0.02 }));
    applyPose(REF, P());
    ballAt([0, 0.11, 0]);
    overlayFns.push(() => {
      vignette(0.6);
      const k = easeOut(seg(lt, 0.3, 1.1));
      txt('HALI SAHA', W / 2, 260, 96, '#ffde00', { scale: 0.6 + 0.4 * k, alpha: k, lw: 14 });
      txt('DERBİSİ', W / 2, 360, 120, '#fff', { scale: 0.6 + 0.4 * easeOut(seg(lt, 0.6, 1.4)), alpha: seg(lt, 0.6, 1.4), lw: 16 });
      txt('DORUK  vs  SEYDU', W / 2, 460, 36, '#fff', { alpha: seg(lt, 1.4, 2.0) });
      txt('Tamamen kurgusal 3D animasyon', W / 2, 660, 20, '#cfd8ff', { alpha: seg(lt, 1.6, 2.2) * 0.8, lw: 4 });
      ov.fillStyle = `rgba(0,0,0,${Math.max(0, 1 - lt * 1.5)})`; ov.fillRect(0, 0, W, H);
    });
  }],
  // ---------------- 1: OPENING GOAL with wall pass (4-13)
  [4, 13, lt => {
    showBug = true; minute = "12'"; score = lt < 4.8 ? [0, 0] : [1, 0];
    REF.root.visible = false;
    // red path: dribble, pass to wall at 1.6, receive at 2.6, shoot 4.2, in 4.8
    const rp = kfLin(lt, [[0, [-6, 2]], [1.6, [-0.5, 3.2]], [2.6, [5, 4.6]], [4.2, [12.5, 2.5]]]);
    const bp = kfLin(lt, [[0, [6, 0]], [1.4, [1.5, 2.4]], [1.9, [0.5, 3.5]], [3.0, [2.2, 3.8]], [4.4, [8, 2.6]]]);
    if (lt < 4.2) {
      place(RED, rp[0], rp[1], face(1, lt < 1.6 ? 0.2 : lt < 2.6 ? 0.25 : -0.25));
      applyPose(RED, runPose(lt * 11, 1, { brow: 0.3, smile: 0.4 }));
    } else if (lt < 5.0) {
      const k = seg(lt, 4.2, 4.45);
      place(RED, 12.5 + k * 0.4, 2.5, face(1, -0.15));
      applyPose(RED, P({ lean: -0.2, hp: [0.3, -1.5 * Math.sin(k * Math.PI * 0.9)], kn: [0.3, 0.2], sh: [[-0.5, 1.0, 0], [0.6, 1.0, 0]], el: [-0.4, -0.4], mouth: 0.4 }));
    } else {
      // celebration: run to corner + knee slide
      const k = seg(lt, 5.0, 6.4);
      const p = kfLin(lt, [[5.0, [12.9, 2.5]], [6.0, [15.5, 6.2]], [7.0, [17.3, 8.4]]]);
      if (lt < 6.0) { place(RED, p[0], p[1], face(0.6, 1)); applyPose(RED, runPose(lt * 12, 1.1, { sh: [[-2.6, 0.5, 0], [-2.6, 0.5, 0]], el: [0, 0], mouth: 0.9, smile: 0.5, headX: -0.3 })); }
      else {
        const sl = seg(lt, 6.0, 7.0);
        place(RED, p[0], p[1], face(-0.3, -1), 0);
        applyPose(RED, P({ bob: -0.48, lean: -0.5 - 0.2 * sl, hp: [-1.25, -1.25], kn: [1.75, 1.75], sh: [[-0.4, 1.4, 0], [-0.4, 1.4, 0]], el: [-0.2, -0.2], headX: -0.5, mouth: 1.0 + Math.sin(lt * 20) * 0.1, smile: 0.6, eye: 1.2 }));
      }
    }
    // ball
    let b;
    if (lt < 1.6) b = [rp[0] + 0.5, 0.11, rp[1] + 0.1];
    else if (lt < 2.1) b = kfLin(lt, [[1.6, [-0.0, 0.11, 3.3]], [2.1, [2.4, 0.11, 10.9]]]);
    else if (lt < 2.6) b = kfLin(lt, [[2.1, [2.4, 0.11, 10.9]], [2.6, [5.5, 0.11, 4.8]]]);
    else if (lt < 4.2) b = [rp[0] + 0.5, 0.11, rp[1]];
    else if (lt < 4.8) b = arc(lt, 4.2, 4.8, [13.1, 0.11, 2.5], [20.6, 1.4, -0.9], 0.6);
    else { const k2 = seg(lt, 4.8, 5.2); b = [20.6 + 0.35 * k2, Math.max(0.11, 1.4 - 2.4 * k2 * k2), -0.9]; }
    ballAt(b);
    bulgeNet(1, lt > 4.8 ? Math.exp(-(lt - 4.8) * 3) * Math.sin(Math.min(1, (lt - 4.8) * 8) * Math.PI / 2) : 0, 1.4, -0.9);
    // blue
    if (lt < 4.6) {
      place(BLUE, bp[0], bp[1], face(lt < 1.9 ? -1 : 1, lt < 1.9 ? 0.5 : -0.2));
      if (lt > 1.7 && lt < 2.4) applyPose(BLUE, P({ lean: 0.1, twist: Math.sin(lt * 20) * 0.6, sh: [[-1, 1.2, 0], [-1, 1.2, 0]], el: [-0.3, -0.3], eye: 1.4, mouth: 0.5 }));
      else applyPose(BLUE, runPose(lt * 10.5 + 1, 0.9, { brow: 0.6 }));
    } else {
      place(BLUE, 8.2, 2.6, face(1, 0.2));
      applyPose(BLUE, P({ lean: 0.25, sh: [[-2.5, 0.6, 0], [-2.5, 0.6, 0]], el: [-2.1, -2.1], headX: 0.3, brow: -0.4, mouth: 0.3 }));
    }
    // camera
    if (lt < 4.9) {
      const bx = ball.position.x;
      cam([bx * 0.85 - 2, 10, -21], [bx * 0.92 + 1.5, 0, 0.6], 34);
    } else if (lt < 6.0) {
      cam([20.5, 1.2, -3.5], [ball.position.x, 0.8, -0.3], 38);
    } else {
      const k = seg(lt, 6.0, 9);
      cam([lerp(13.5, 14.2, k), lerp(1.0, 1.4, k), lerp(5.0, 5.5, k)], [RED.root.position.x, 0.9, RED.root.position.z], 34);
    }
    overlayFns.push(() => {
      if (lt > 1.55 && lt < 2.8) txt('DUVARDAN VER-KAÇ!', W / 2, 140, 40, '#ffde00', { alpha: seg(lt, 1.55, 1.75) * (1 - seg(lt, 2.6, 2.8)) });
      if (lt > 4.8 && lt < 6.2) txt('GOOOL!', W / 2, H / 2 - 30, 150, '#ffde00', { scale: 0.7 + 0.3 * easeOut(seg(lt, 4.8, 5.1)), lw: 18, alpha: 1 - seg(lt, 5.9, 6.2) });
      flash(lt > 4.8 ? Math.max(0, 0.6 - (lt - 4.8) * 3) : 0);
    });
  }],
  // ---------------- 2: MONTAGE (13-23)
  [13, 23, lt => {
    showBug = true; REF.root.visible = false;
    const i = Math.min(4, Math.floor(lt / 2)), l = lt - i * 2;
    const scorers = [[1, 1], [2, 1], [2, 2], [3, 2], [3, 3]];
    const mins = ["34'", "51'", "67'", "78'", "88'"];
    minute = mins[i];
    const blueScores = i % 2 == 0;
    const s = blueScores ? -1 : 1;
    const shooter = blueScores ? BLUE : RED, other = blueScores ? RED : BLUE;
    const inT = 1.15;
    score = l > inT ? scorers[i] : (i ? scorers[i - 1] : [1, 0]);
    const variants = [{ sx: -4, sz: -3, shootT: 0.6, inT, ty: 0.5, tz: 1.1 }, { sx: 5, sz: 3, shootT: 0.6, inT, ty: 1.7, tz: -1.0 }, { sx: -3, sz: 4, shootT: 0.6, inT, ty: 1.2, tz: -1.1 }, { sx: 4, sz: -4, shootT: 0.6, inT, ty: 0.4, tz: 0.9 }, { sx: -5, sz: 1, shootT: 0.6, inT, ty: 1.8, tz: 1.0 }];
    const v = variants[i];
    goalShot(l, shooter, other, s, { ...v, sx: s * Math.abs(v.sx) + s * 4 });
    // angle
    const gx = s * 20;
    const angles = [
      [[gx + s * 1.8, 1.4, 2.2], [gx - s * 6, 0.8, 0], 46],
      [[gx - s * 6, 7, -12], [gx - s * 3, 0.5, 0], 36],
      [[gx + s * 1.8, 1.6, -2.2], [gx - s * 6, 0.8, 0], 46],
      [[gx - s * 9, 3, 8], [gx - s * 1, 0.8, 0], 40],
      [[gx + s * 1.9, 2.2, 0.4], [gx - s * 8, 0.9, 0], 50]
    ];
    const a = angles[i];
    cam(a[0], a[1], a[2]);
    overlayFns.push(() => {
      const n = scorers[i];
      if (l > inT && l < 1.9) txt(`${n[0]} - ${n[1]}`, W / 2, H / 2 - 40, 120, blueScores ? '#5aa2ff' : '#ff5a5f', { scale: 0.7 + 0.3 * easeOut(seg(l, inT, inT + 0.25)), lw: 16 });
      // trash talk bubbles in the montage
      if (i >= 2 && l > 1.25) {
        const lines = { 2: ['Şans golü!', '#ffd'], 3: ['Ağlama!', '#fdd'], 4: ['Sıra sende mi?', '#ddf'] }[i];
        if (lines) bubble(lines[0], W * 0.72, 200, lines[1], 1, 0.9);
      }
      flash(l > inT ? Math.max(0, 0.4 - (l - inT) * 2.5) : 0);
      // whip transitions
      if (l < 0.12) { ov.fillStyle = `rgba(255,255,255,${0.7 - l * 5})`; ov.fillRect(0, 0, W, H); }
    });
  }],
  // ---------------- 3: FACE-OFF (23-25.5)
  [23, 25.5, lt => {
    showBug = true; minute = "89'"; score = [3, 3]; REF.root.visible = false;
    place(RED, -0.42, 0, face(1, 0)); place(BLUE, 0.42, 0, face(-1, 0));
    const pulse = Math.sin(lt * 14) * 0.03;
    applyPose(RED, P({ lean: 0.22 + pulse, headX: -0.15, sh: [[0.3, 0.35, 0], [0.3, 0.35, 0]], el: [-1.6, -1.6], brow: 1, red: 0.25, steam: 0.4 }));
    applyPose(BLUE, P({ lean: 0.22 - pulse, headX: -0.15, sh: [[0.3, 0.35, 0], [0.3, 0.35, 0]], el: [-1.6, -1.6], brow: 1, red: 0.3, steam: 0.5 }));
    ballAt([0, 0.11, -1.5]);
    cam([0, 1.85 + lt * 0.02, lerp(2.4, 1.9, lt / 2.5)], [0, 1.82, 0], 40);
    overlayFns.push(() => {
      letterbox(1);
      if (lt > 0.3) bubble('Bu maçı ben alırım!', 330, 170, '#ffe1e1', -1, 0.95);
      if (lt > 1.2) bubble('Rüyanda görürsün!', 950, 240, '#e1ecff', 1, 0.95);
      // sparks between eyes
      ov.save(); ov.strokeStyle = '#ffe14d'; ov.lineWidth = 5; ov.beginPath();
      let x = 560, y = 260; ov.moveTo(x, y);
      for (let k = 0; k < 8; k++) { x += 20; y = 260 + (hash(k + Math.floor(lt * 12)) - 0.5) * 50; ov.lineTo(x, y); } ov.stroke(); ov.restore();
    });
  }],
  // ---------------- 4: 90+5 CARD (25.5-28)
  [25.5, 28, lt => {
    showBug = false; minute = "90+5'"; score = [3, 3]; REF.root.visible = false;
    place(RED, -2, 1, face(1, 0)); place(BLUE, 4, -1, face(-1, 0));
    applyPose(RED, P({ lean: 0.2, hp: [-0.3, -0.3], kn: [0.5, 0.5], bob: -0.08, sh: [[0, 0.3, 0], [0, 0.3, 0]], brow: 0.8 }));
    applyPose(BLUE, P({ lean: 0.2, hp: [-0.3, -0.3], kn: [0.5, 0.5], bob: -0.08, sh: [[0, 0.3, 0], [0, 0.3, 0]], brow: 0.8 }));
    ballAt([-1.4, 0.11, 1]);
    cam([lerp(-6, -4.5, lt / 2.5), 1.0, 4], [0, 1.1, 0], 38);
    overlayFns.push(() => {
      ov.fillStyle = 'rgba(0,0,0,0.55)'; ov.fillRect(0, 0, W, H);
      const beat = 1 + 0.08 * Math.max(0, Math.sin(lt * Math.PI * 2 * 1.3)) ** 8;
      txt("90+5'", W / 2, H / 2 - 30, 190, '#ffde00', { scale: beat * (0.6 + 0.4 * easeOut(seg(lt, 0, 0.4))), lw: 20 });
      txt('SON HÜCUM', W / 2, H / 2 + 110, 56, '#fff', { alpha: seg(lt, 0.6, 1.0) });
      txt('3 - 3', W / 2, H / 2 + 180, 40, '#cfd8ff', { alpha: seg(lt, 0.9, 1.3) });
      letterbox(1);
    });
  }],
  // ---------------- 5: FINAL GOAL (28-35) GOOOL at lt 4.3
  [28, 35, lt => {
    showBug = true; minute = "90+5'"; REF.root.visible = false;
    const inT = 4.25, shootT = 3.45;
    score = lt > inT ? [4, 3] : [3, 3];
    const rp = kfLin(lt, [[0, [-3, 1]], [shootT - 0.35, [8.6, -2.2]]]);
    if (lt < shootT - 0.35) { place(RED, rp[0], rp[1], face(1, -0.28)); applyPose(RED, runPose(lt * 11, 1, { brow: 0.9 })); }
    else if (lt < inT + 0.4) {
      const k = seg(lt, shootT - 0.35, shootT), k2 = seg(lt, shootT, shootT + 0.3);
      place(RED, 8.6 + k2 * 0.6, -2.2, face(1, 0.08));
      const windup = lt < shootT ? 1.1 * ease(k) : 1.1 - 2.9 * easeOut(k2);
      applyPose(RED, P({ lean: lt < shootT ? 0.1 : -0.35, hp: [0.2, windup], kn: [0.35, lt < shootT ? 1.3 * k : 0.2], sh: [[-0.7, 1.1, 0], [0.8, 1.1, 0]], el: [-0.4, -0.4], brow: 1, mouth: 0.6 }));
    } else {
      const p = kfLin(lt, [[inT + 0.4, [9.2, -2.2]], [7, [5, 0]]]);
      place(RED, p[0], p[1], face(-1, 0.4));
      applyPose(RED, runPose(lt * 12, 1.1, { sh: [[-2.8, 0.3, 0], [-2.8, 0.3, 0]], el: [-0.2, -0.2], mouth: 1.0, smile: 0.6, headX: -0.2 }));
    }
    // ball
    let b;
    if (lt < shootT) b = [Math.min(rp[0], 8.6) + 0.55, 0.11, rp[1] + 0.05];
    else if (lt < inT) { const u = seg(lt, shootT, inT); b = [lerp(9.3, 20.5, u), 0.11 + 1.75 * Math.sin(u * Math.PI * 0.62) / Math.sin(Math.PI * 0.62) * (u < 1 ? 1 : 1), lerp(-2.2, 1.32, u) + Math.sin(u * Math.PI) * -0.9]; b[1] = lerp(0.11, 1.86, easeOut(u)); }
    else { const k = seg(lt, inT, inT + 0.5); b = [20.5 + 0.55 * easeOut(k), Math.max(0.11, 1.86 - 2.2 * k * k), 1.32]; }
    ballAt(b);
    bulgeNet(1, lt > inT ? Math.exp(-(lt - inT) * 2.5) * Math.sin(Math.min(1, (lt - inT) * 8) * Math.PI / 2) * 1.2 : 0, 1.8, 1.25);
    // trail
    const showTrail = lt > shootT && lt < inT + 0.3;
    trailHist.unshift(ball.position.clone()); if (trailHist.length > trailN * 2) trailHist.pop();
    trail.forEach((s, i) => { s.visible = showTrail && trailHist[i * 1] !== undefined; if (s.visible) s.position.copy(trailHist[i]); });
    // blue chasing, then dives hopelessly
    if (lt < shootT) { const bp = [rp[0] - 1.8, rp[1] + 1.6]; place(BLUE, bp[0], bp[1], face(1, -0.3)); applyPose(BLUE, runPose(lt * 10.5 + 1.5, 1, { brow: 0.9 })); }
    else {
      const k = seg(lt, shootT, shootT + 0.6);
      place(BLUE, 7.0 + k * 1.2, -0.4, face(1, -0.3), 0);
      if (lt < inT + 0.8) applyPose(BLUE, P({ lean: 0.3 + k * 0.6, bob: -0.25 * k, sh: [[-1.6, 0.8, 0], [-1.6, 0.8, 0]], el: [0, 0], hp: [-0.6, 0.6], kn: [0.6, 0.3], eye: 1.4, mouth: 0.8 }));
      else applyPose(BLUE, P({ lean: 0.5, bob: -0.42, hp: [-1.3, -1.3], kn: [1.7, 1.7], sh: [[-2.6, 0.5, 0], [-2.6, 0.5, 0]], el: [-2.2, -2.2], headX: 0.4, brow: -0.5 }));
    }
    // camera: broadcast -> low cam at shot -> behind goal
    if (lt < shootT - 0.4) cam([ball.position.x * 0.85 - 3, 9, -20], [ball.position.x + 2, 0, 0], 32);
    else if (lt < inT - 0.15) {
      const k = seg(lt, shootT - 0.4, inT - 0.15);
      cam([lerp(6.8, 9.5, k), 0.6, lerp(-4.2, -3.8, k)], [lerp(9.2, 16, k), lerp(0.4, 1.4, k), lerp(-2.0, 0.0, k)], 40);
    }
    else if (lt < inT + 1.4) cam([21.9, 1.3, 3.0], [20.4, 1.6, 1.1], 50);
    else { const k = seg(lt, inT + 1.4, 7); cam([lerp(9, 6, k), 1.5, lerp(5, 5.5, k)], [RED.root.position.x, 1.0, RED.root.position.z], 38); }
    overlayFns.push(() => {
      if (lt > shootT && lt < inT) { ov.fillStyle = 'rgba(255,255,255,0.0)'; }
      if (lt > inT && lt < 6.5) {
        const k = easeOut(seg(lt, inT, inT + 0.3));
        txt('GOOOOOL!', W / 2 + Math.sin(lt * 40) * 4 * (1 - seg(lt, inT, inT + 1)), H / 2 - 50, 170, '#ffde00', { scale: 0.6 + 0.4 * k, lw: 20, alpha: 1 - seg(lt, 6.1, 6.5) });
        txt('DOKSANA!  4 - 3', W / 2, H / 2 + 80, 60, '#fff', { alpha: seg(lt, inT + 0.4, inT + 0.7) * (1 - seg(lt, 6.1, 6.5)) });
      }
      flash(lt > inT ? Math.max(0, 0.8 - (lt - inT) * 3) : 0);
    });
  }],
  // ---------------- 6: "DAYINA ÇAKAYIM" (35-39.5)
  [35, 39.5, lt => {
    showBug = true; minute = "90+5'"; score = [4, 3]; REF.root.visible = false; hideTrail();
    const rp = kfLin(lt, [[0, [-5.5, 2.5]], [0.8, [-0.95, 0.15]]]);
    ballAt([3, 0.11, -4]);
    place(BLUE, 0.9, 0, face(-1, 0));
    applyPose(BLUE, P({ lean: 0.05, sh: [[0, 0.45, 0], [0, 0.45, 0]], el: [-1.2, -1.2], brow: 1, red: 0.2, mouth: 0.08 }));
    if (lt < 0.8) { place(RED, rp[0], rp[1], face(1, -0.5)); applyPose(RED, runPose(lt * 12, 1.1, { mouth: 0.5, smile: 0.5 })); }
    else {
      const m = speakAmt('red');
      const jump = Math.abs(Math.sin(lt * 7)) * 0.08;
      place(RED, -0.95, 0.15, face(1, -0.05), jump);
      const wide = 0.5 + 0.5 * Math.sin(lt * 3);
      applyPose(RED, P({ lean: -0.25 + Math.sin(lt * 9) * 0.06, twist: Math.sin(lt * 4.5) * 0.25, headX: -0.15, headZ: Math.sin(lt * 6) * 0.2, sh: [[-1.2 - wide * 0.8, 1.4, 0], [-1.0 - wide, 1.4, 0]], el: [-0.6, -0.9], hp: [-0.1, 0.1], hpz: [0.25, 0.25], kn: [0.35, 0.35], bob: -0.06, mouth: 0.15 + m * 1.1, smile: 0.7, brow: -0.6, eye: 1.25 }));
    }
    cam([2.8, 1.65, 1.9], [lerp(-3, -0.95, ease(clamp(lt / 0.8))), 1.5, 0.15], 34);
  }],
  // ---------------- 7: "NE DİYOR LAN" (39.5-43)
  [39.5, 43, lt => {
    showBug = false; REF.root.visible = false;
    place(RED, -0.95, 0.15, face(1, -0.05));
    applyPose(RED, P({ lean: -0.1, sh: [[0, 0.2, 0], [0, 0.2, 0]], el: [-0.3, -0.3], smile: 0.7, mouth: 0.3 }));
    const m = speakAmt('blue');
    place(BLUE, 0.9, 0, face(-1, 0));
    const shakeF = Math.sin(lt * 26) * 0.12;
    applyPose(BLUE, P({ lean: 0.22, headX: -0.1, headZ: shakeF * 0.3, sh: [[-0.9 + shakeF, 0.5, 0], [-0.9 - shakeF, 0.5, 0]], el: [-1.8, -1.8], mouth: 0.1 + m * 1.1, brow: 1.3, red: 0.25 + 0.5 * seg(lt, 0, 2.5), steam: seg(lt, 0.8, 1.4), eye: 1.1 }));
    shake = 0.02 + m * 0.03;
    cam([-0.25, 1.72, 2.35], [0.85, 1.66, 0.0], 30);
    shake = 0;
  }],
  // ---------------- 8: WALK TOWARD EACH OTHER (43-45.5)
  [43, 45.5, lt => {
    showBug = false; REF.root.visible = false;
    const k = lt / 2.5;
    place(RED, lerp(-4, -1.3, k), 0, face(1, 0)); place(BLUE, lerp(4, 1.3, k), 0, face(-1, 0));
    applyPose(RED, walkPose(lt * 5, 0.7, { brow: 1, sh: [[0, 0.5, 0], [0, 0.5, 0]], el: [-1.0, -1.0], lean: 0.12 }));
    applyPose(BLUE, walkPose(lt * 5 + 1, 0.7, { brow: 1.2, red: 0.5, steam: 0.6, sh: [[0, 0.5, 0], [0, 0.5, 0]], el: [-1.0, -1.0], lean: 0.12 }));
    ballAt([0, 0.11, -3]);
    cam([0, 0.45, 7.5 - k * 1.5], [0, 1.0, 0], 36);
    overlayFns.push(() => letterbox(1));
  }],
  // ---------------- 9: CENSOR (45.5-51)
  [45.5, 51, lt => {
    showBug = false; REF.root.visible = false;
    // red turns his back to blue, reaches for waistband; censor appears BEFORE anything moves
    const turn = ease(seg(lt, 0, 0.35));
    place(RED, -1.3, 0, lerp(face(1, 0), face(-0.6, 1), turn));
    const m = speakAmt('red');
    const wig = Math.sin(lt * 12) * 0.25 * seg(lt, 0.7, 1.0);
    applyPose(RED, P({ lean: 0.35 * seg(lt, 0.3, 0.8), twist: -0.5 * turn, headY: 1.0 * turn, headX: -0.1, side: wig * 0.4, sh: [[0.25, 0.25, 0], [0.25, 0.25, 0]], el: [-0.9, -0.9], hpz: [wig, -wig], mouth: 0.1 + m * 1.1, smile: 0.8, brow: -0.6, eye: 1.2 }));
    place(BLUE, 1.3, 0, face(-1, 0));
    const shock = seg(lt, 0.5, 0.8), angry = seg(lt, 3.2, 3.8);
    applyPose(BLUE, P({ lean: -0.15 * shock + 0.25 * angry, sh: [[-0.4 * shock, 0.5, 0], [-0.4 * shock, 0.5, 0]], el: [-1.2, -1.2], eye: 1 + 0.6 * shock * (1 - angry), mouth: 0.9 * shock * (1 - angry) + 0.1, brow: -0.8 * shock * (1 - angry) + 1.3 * angry, red: 0.4 + 0.5 * angry, steam: angry }));
    // censor block: visible for the whole shot from frame 1
    censor.visible = true;
    const hipW = new THREE.Vector3(); RED.hips.getWorldPosition(hipW);
    const toCam = camera.position.clone().sub(hipW).normalize();
    censor.position.copy(hipW).add(new THREE.Vector3(0, -0.18, 0)).add(toCam.multiplyScalar(0.45));
    const pop = easeOut(seg(lt, 0, 0.18));
    censor.scale.set((1.15 + Math.sin(lt * 9) * 0.04) * pop, (1.05 + Math.sin(lt * 9) * 0.04) * pop, 1);
    ballAt([0, 0.11, -3]);
    cam([0, 1.25, 5.4], [0, 1.05, 0], 36);
    overlayFns.push(() => {
      if (lt > 1.0 && lt < 4.8) {
        const p = project(new THREE.Vector3(1.3, 2.25, 0));
        txt('?!', p[0] + 30, p[1] - 10, 70, '#ffde00', { rot: Math.sin(lt * 8) * 0.1 });
      }
    });
  }],
  // ---------------- 10: RUN & COLLIDE (51-53.5) collide at lt 2.0
  [51, 53.5, lt => {
    showBug = false; REF.root.visible = false; censor.visible = false;
    const cT = 2.0;
    const k = ease(seg(lt, 0.3, cT));
    place(RED, lerp(-3.2, -0.35, k), 0, face(1, 0)); place(BLUE, lerp(3.2, 0.35, k), 0, face(-1, 0));
    applyPose(RED, lt < 0.3 ? P({ brow: 1, lean: 0.2 }) : runPose(lt * 13, 1.2, { brow: 1.3, mouth: 0.8, red: 0.4 }));
    applyPose(BLUE, lt < 0.3 ? P({ brow: 1, lean: 0.2 }) : runPose(lt * 13 + 2, 1.2, { brow: 1.3, mouth: 0.8, red: 0.6 }));
    if (lt > cT) { RED.root.visible = BLUE.root.visible = false; }
    updateCloud(lt, lt > cT ? easeOut(seg(lt, cT, cT + 0.25)) * 1.0 : 0, 1.5);
    ballAt([0, 0.11, -3]);
    shake = lt > cT ? 0.12 * (1 - seg(lt, cT, cT + 0.5)) : 0;
    cam([0, 1.6, lerp(9, 7.5, lt / 2.5)], [0, 1.0, 0], 38);
    shake = 0;
    overlayFns.push(() => {
      if (lt > cT && lt < cT + 0.5) burst('ÇAAAT!', W / 2, H / 2 - 40, 140, -0.1, '#ff3b30');
      flash(lt > cT ? Math.max(0, 0.9 - (lt - cT) * 4) : 0);
    });
  }],
  // ---------------- 11: FIGHT CLOUD 1 (53.5-58)
  [53.5, 58, lt => {
    showBug = false; REF.root.visible = false;
    RED.root.visible = BLUE.root.visible = false;
    updateCloud(lt + 0.5, 1.0 + Math.sin(lt * 7) * 0.06, 1.2);
    ballAt([0.4, 0.11, -3]);
    shake = 0.05;
    const a = lt * 0.12;
    cam([Math.sin(a) * 7, 1.8, Math.cos(a) * 7], [0, 1.1, 0], 38);
    shake = 0;
    overlayFns.push(() => {
      const words = ['PAT!', 'KÜT!', 'BAM!', 'ÇAT!', 'POW!', 'TAK!'];
      for (let j = 0; j < 3; j++) {
        const slot = Math.floor(lt * 2.2 + j * 0.33), lo = (lt * 2.2 + j * 0.33) - slot;
        if (lo < 0.6) {
          const ang = hash(slot * 3 + j) * 6.283;
          burst(words[(slot + j) % 6], W / 2 + Math.cos(ang) * 260, H / 2 - 60 + Math.sin(ang) * 150, 60 + 30 * easeOut(lo / 0.15 > 1 ? 1 : lo / 0.15), (hash(slot) - 0.5) * 0.6, ['#ff3b30', '#ffde00', '#3bb2ff'][(slot + j) % 3], 1 - seg(lo, 0.45, 0.6));
        }
      }
    });
  }],
  // ---------------- 12: BLUE POPS OUT (58-62.5)
  [58, 62.5, lt => {
    showBug = false; REF.root.visible = false; RED.root.visible = false;
    updateCloud(lt + 5, 1.0 + Math.sin(lt * 7) * 0.06, 1.2);
    dishevel(BLUE, true);
    const m = speakAmt('blue');
    if (lt < 0.45) {
      const p = kfLin(lt, [[0, [0, 0.8]], [0.45, [0.6, 3.3]]]);
      place(BLUE, p[0], p[1], face(0.3, 1), Math.sin(lt / 0.45 * Math.PI) * 0.3);
      applyPose(BLUE, P({ lean: -0.3, sh: [[-1.5, 1.2, 0], [-1.5, 1.2, 0]], el: [0, 0], eye: 1.4, mouth: 0.6, stars: 1, red: 0.5 }));
    } else if (lt < 4.0) {
      place(BLUE, 0.6, 3.3, face(0.15, 1) + Math.sin(lt * 3) * 0.1);
      const pointBack = seg(lt, 0.5, 0.9);
      applyPose(BLUE, P({ lean: 0.15 + Math.sin(lt * 11) * 0.04, twist: -0.3 * pointBack, headX: -0.1, headZ: Math.sin(lt * 5) * 0.15, sh: [[-1.4 * pointBack, 1.3, 0.3], [-0.6 + Math.sin(lt * 14) * 0.4, 0.6, 0]], el: [-0.1, -1.6], mouth: 0.1 + m * 1.15, brow: 1.4, red: 0.6, stars: 1, sweat: 1, eye: 1.1 }));
    } else {
      const k = seg(lt, 4.0, 4.5);
      place(BLUE, lerp(0.6, 0.1, k), lerp(3.3, 0.8, k), face(-0.2, -1));
      applyPose(BLUE, runPose(lt * 14, 1.2, { brow: 1.4, red: 0.6, mouth: 0.9 }));
      if (k > 0.85) BLUE.root.visible = false;
    }
    ballAt([0.4, 0.11, -3]);
    cam([0.9, 1.6, 6.4], [0.5, 1.35, 2.2], 34);
  }],
  // ---------------- 13: FIGHT CLOUD 2 bigger (62.5-67.5)
  [62.5, 67.5, lt => {
    showBug = false; REF.root.visible = false; RED.root.visible = BLUE.root.visible = false;
    const sz = 1.0 + 0.4 * easeOut(seg(lt, 0, 0.4)) + Math.sin(lt * 9) * 0.08;
    updateCloud(lt + 9, sz, 1.8);
    ballAt([0.4, 0.11, -3]);
    shake = 0.09;
    cam([lerp(-3, 3, lt / 5), 2.2, 9], [0, 1.3, 0], 40);
    shake = 0;
    overlayFns.push(() => {
      const words = ['PAT!', 'KÜT!', 'BAM!', 'ÇAT!', 'POW!', 'ZONK!', 'ŞLAK!'];
      for (let j = 0; j < 4; j++) {
        const slot = Math.floor(lt * 3 + j * 0.25), lo = (lt * 3 + j * 0.25) - slot;
        if (lo < 0.55) {
          const ang = hash(slot * 5 + j + 40) * 6.283;
          burst(words[(slot + j) % 7], W / 2 + Math.cos(ang) * 330, H / 2 - 40 + Math.sin(ang) * 190, 66 + 30 * Math.min(1, lo / 0.12), (hash(slot + 7) - 0.5) * 0.7, ['#ff3b30', '#ffde00', '#3bb2ff', '#34c759'][(slot + j) % 4], 1 - seg(lo, 0.4, 0.55));
        }
      }
      if (lt > 2.2 && lt < 3.3) txt('* bir terlik uçtu *', W / 2, 120, 30, '#fff', { lw: 6 });
    });
  }],
  // ---------------- 14: RED STAGGERS OUT (67.5-72)
  [67.5, 999, lt => {
    showBug = false; REF.root.visible = false;
    const fade = 1 - seg(lt, 2.0, 3.8);
    updateCloud(lt + 14, 1.2 * fade + 0.0001, 0.8 * fade);
    dishevel(RED, true); dishevel(BLUE, true);
    const m = speakAmt('red');
    const p = kfLin(lt, [[0, [0, 0.6]], [1.0, [-0.4, 3.0]], [4.5, [-0.6, 3.4]]]);
    place(RED, p[0] + Math.sin(lt * 5) * 0.12, p[1], face(Math.sin(lt * 3) * 0.3, 1));
    applyPose(RED, P({ lean: 0.1 + Math.sin(lt * 4) * 0.15, side: Math.sin(lt * 3.3) * 0.18, headZ: Math.sin(lt * 4) * 0.25, sh: [[-1.6 + Math.sin(lt * 13) * 0.6, 1.4, 0], [-1.6 - Math.sin(lt * 13) * 0.6, 1.4, 0]], el: [-0.4, -0.4], hp: [Math.sin(lt * 7) * 0.4, -Math.sin(lt * 7) * 0.4], kn: [0.3, 0.3], mouth: 0.15 + m * 1.2, eye: 1.5, brow: -1, stars: 1, sweat: 1 }));
    // blue lying on ground, revealed as cloud fades
    BLUE.root.visible = fade < 0.9;
    BLUE.root.position.set(1.4, 0.16, 0.3); BLUE.root.rotation.set(-Math.PI / 2, 0, 0.6);
    applyPose(BLUE, P({ hp: [-0.9 + Math.sin(lt * 10) * 0.5, -0.9 - Math.sin(lt * 10) * 0.5], kn: [1.0, 1.0], sh: [[-0.3, 1.4 + Math.sin(lt * 9) * 0.3, 0], [-0.3, 1.4, 0]], el: [-0.4, -0.4], eye: 0.4, stars: 1, mouth: 0.3 }));
    ballAt([0.4, 0.11, -3]);
    cam([-0.3, 1.6, 6.8], [-0.3, 1.15, 1.2], 36);
  }],
  // ---------------- 15: REFEREE (72-78.5)
  [1000, 1001, lt => {
    showBug = false; updateCloud(0, 0, 0);
    dishevel(RED, true); dishevel(BLUE, true);
    // red still panicking, pointing at blue
    place(RED, -1.4, 2.4, face(0.8, -0.4));
    applyPose(RED, P({ lean: 0.1, sh: [[-1.4, 0.5, 0], [-2.6 + Math.sin(lt * 10) * 0.3, 0.7, 0]], el: [0, -0.3], mouth: 0.2 + Math.abs(Math.sin(lt * 9)) * 0.3 * (lt < 1.5 ? 1 : 0), eye: 1.4, stars: lt < 2 ? 1 : 0, sweat: 1 }));
    // blue on ground wiggling like a beetle
    BLUE.root.visible = true;
    BLUE.root.position.set(0.3, 0.16, -0.2); BLUE.root.rotation.set(-Math.PI / 2, 0, 0.6 + Math.sin(lt * 2) * 0.15);
    applyPose(BLUE, P({ hp: [-1.2 + Math.sin(lt * 13) * 0.6, -1.2 - Math.sin(lt * 13) * 0.6], kn: [1.0 + Math.sin(lt * 9) * 0.4, 1.0], sh: [[-1.4 + Math.sin(lt * 11) * 0.5, 0.6, 0], [-1.4 - Math.sin(lt * 11) * 0.5, 0.6, 0]], el: [-0.4, -0.4], eye: 0.7, mouth: 0.25 + Math.abs(Math.sin(lt * 5)) * 0.2, stars: 1 }));
    // referee runs in from the right
    const m = speakAmt('ref');
    const rp = kfLin(lt, [[0, [9, 3.2]], [1.6, [1.9, 2.0]]]);
    if (lt < 1.6) { place(REF, rp[0], rp[1], face(-1, -0.15)); applyPose(REF, runPose(lt * 12, 1.0, { sh: [[-2.2, 0.3, 0], [0.5, 0.2, 0]], el: [-1.6, -1.2], mouth: 0.4, brow: 0.3 })); }
    else {
      place(REF, 1.9, 2.0, face(-0.9, 0.2));
      const blow = lt > 1.0 && lt < 2.2;
      const look = Math.sin((lt - 1.6) * 2.4);
      const scratch = seg(lt, 4.8, 5.1);
      applyPose(REF, P({ lean: 0.05, headY: lt > 2.2 ? look * 0.9 : 0, headX: blow ? -0.25 : 0, sh: [[blow ? -2.4 : -0.3 * (1 - scratch) - 2.6 * scratch, 0.35, 0], [lt > 2.6 && lt < 4.8 ? -1.2 : 0.1, lt > 2.6 && lt < 4.8 ? 0.6 : 0.2, 0]], el: [blow ? -1.6 : -0.3 - 1.4 * scratch, lt > 2.6 && lt < 4.8 ? -1.2 : -0.2], mouth: blow ? 0.3 : 0.1 + m * 1.1, eye: 1.35, brow: -0.9, look: [look, 0], red: blow ? 0.4 : 0 }));
    }
    ballAt([0.4, 0.11, -3]);
    cam([0.2, 2.0, 9.5], [0.2, 0.9, 1.2], 38);
    overlayFns.push(() => {
      const p = project(new THREE.Vector3(1.9, 2.4, 2.0));
      if (lt > 2.4) txt('?', p[0] + 10, p[1] - 10, 90 + Math.sin(lt * 6) * 6, '#ffde00', { lw: 10 });
      if (lt > 2.9) txt('?', p[0] + 60, p[1] + 10, 60, '#ffde00', { lw: 8 });
      if (lt > 1.0 && lt < 2.2) txt('FIIIRT!', p[0] - 40, p[1] - 70, 50, '#fff', { rot: -0.15 });
      letterbox(seg(lt, 5.5, 6.5));
    });
  }],
  // ---------------- 16: END CARD (78.5-83)
  [1001, 1002, lt => {
    showBug = false;
    // freeze on referee shot
    const fr = 6.4;
    SHOTS[15][2](fr); overlayFns.length = 0;
    const k = seg(lt, 0, 0.5);
    cam([lerp(0.2, 0.6, k), lerp(2.0, 1.9, k), lerp(9.5, 8.5, k)], [0.2, 0.9, 1.2], 38);
    overlayFns.push(() => {
      ov.fillStyle = `rgba(0,0,0,${0.55 * k})`; ov.fillRect(0, 0, W, H);
      txt('MAÇ SONUCU', W / 2, 170, 44, '#cfd8ff', { alpha: k });
      txt('DORUK 4 - 3 SEYDU', W / 2, 250, 70, '#fff', { alpha: seg(lt, 0.3, 0.8), lw: 10 });
      txt('Kazanan: Doktor', W / 2, 350, 64, '#ffde00', { alpha: seg(lt, 1.0, 1.5), rot: -0.04, lw: 10 });
      txt('Rövanş: Gelecek Salı, aynı saha', W / 2, 440, 32, '#fff', { alpha: seg(lt, 1.8, 2.3) });
      txt('SON', W / 2, 560, 90, '#ff5a5f', { alpha: seg(lt, 2.6, 3.0), scale: 0.8 + 0.2 * easeOut(seg(lt, 2.6, 3.0)), lw: 12 });
      txt('Tüm karakterler ve olaylar kurgusaldır.', W / 2, 680, 18, '#aab', { alpha: seg(lt, 2.8, 3.2), lw: 3 });
      ov.fillStyle = `rgba(0,0,0,${seg(lt, 4.1, 4.5)})`; ov.fillRect(0, 0, W, H);
    });
  }],
];

// ---------------------------------------------------------------- frame
function resetFrame() {
  overlayFns.length = 0;
  censor.visible = false; cloud.visible = false; shake = 0;
  hideTrail();
  for (const c of CHARS) { c.root.visible = true; c.root.rotation.set(0, 0, 0); dishevel(c, false); }
  bulgeNet(1, 0); bulgeNet(-1, 0);
}
const SLOW_AT = TL.slowAt, SLOW_F = TL.slowFactor, BLACK_AT = TL.blackAt;
window.renderFrame = function (frame) {
  const RT = frame / FPS;
  T = RT < SLOW_AT ? RT : SLOW_AT + (RT - SLOW_AT) * SLOW_F;
  resetFrame();
  const sh = SHOTS.find(s => T >= s[0] && T < s[1]) || SHOTS[SHOTS.length - 1];
  sh[2](T - sh[0]);
  // ball rolling rotation
  const d = ball.position.clone().sub(ballPrev);
  if (d.length() < 2) { ball.rotation.z -= d.x / 0.11; ball.rotation.x += d.z / 0.11; }
  ballPrev.copy(ball.position);
  renderer.render(scene, camera);
  ov.clearRect(0, 0, W, H);
  for (const f of overlayFns) f();
  if (showBug) scoreBug(score[0], score[1], minute);
  if (RT > SLOW_AT) {
    const k = seg(RT, SLOW_AT, SLOW_AT + 0.4);
    ov.fillStyle = `rgba(20,10,0,${0.18 * k})`; ov.fillRect(0, 0, W, H);
    vignette(0.6 * k); letterbox(k);
  }
  subtitles();
  const blk = seg(RT, BLACK_AT, BLACK_AT + 1.2);
  if (blk > 0) { ov.fillStyle = `rgba(0,0,0,${blk})`; ov.fillRect(0, 0, W, H); }
  return true;
};
window.TOTAL_FRAMES = Math.round(TL.duration * FPS);
window.sceneReady = true;
