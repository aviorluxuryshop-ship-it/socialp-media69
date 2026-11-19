import * as THREE from 'three';
import { app } from './app.js';
import { state, onModeChange } from './state.js';
import { SECTIONS, SECTION_BY_ID, sectionAnchor, formatTL } from './data/sections.js';
import { selectSection } from './sectionView.js';

// İç modda bölge seçimi: ışın izleme (yalnızca 9 bölge mesh'i), hover vurgusu, tooltip, yüzen etiket.
const DRAG_PX = 6;
const GOLD = new THREE.Color(1.7, 1.3, 0.55);   // seçili renk çarpanı
const LIFT = new THREE.Color(1.35, 1.25, 1.05); // hover renk çarpanı
const EMI = new THREE.Color(0xc9a24a);

export function initPicking(root) {
  const canvas = app.renderer.domElement;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const meshes = [];
  const fx = new Map(); // id -> { mat, base, emiBase, glow, target, hasEmi }
  for (const def of SECTIONS) {
    const mesh = app.sections.get(def.id)?.getObjectByName(def.id + '-mesh');
    if (!mesh) continue;
    meshes.push(mesh);
    const mat = mesh.material;
    fx.set(def.id, { seatMat: app.seats.materials.get(def.id), mat, base: mat.color.clone(), glow: 0, target: 0, hasEmi: def.tier !== 'koridor' });
  }

  // DOM: tooltip + yüzen etiket
  const tip = document.createElement('div');
  tip.className = 'tip is-off'; tip.setAttribute('role', 'tooltip');
  const label = document.createElement('div');
  label.className = 'seclabel is-off';
  root.append(tip, label);

  let hover = null;
  let down = null;
  let pending = null;
  let lastEvt = { x: 0, y: 0 };

  const interiorOnly = () => state.mode === 'interior';

  function pick(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, app.camera);
    const hit = ray.intersectObjects(meshes, false)[0];
    return hit ? hit.object.userData.sectionId : null;
  }

  function setHover(id) {
    if (id === hover) return;
    hover = id;
    updateTargets();
    canvas.style.cursor = id ? 'pointer' : '';
    if (id) {
      const d = SECTION_BY_ID[id];
      tip.innerHTML = `<b>${d.name}</b><span>${formatTL(d.price)}'den</span>`;
      tip.classList.remove('is-off');
    } else tip.classList.add('is-off');
  }

  function updateTargets() {
    for (const [id, f] of fx) {
      let t = 0;
      if (state.selectedSection === id) t = state.mode === 'section' ? 0 : 1;
      if (hover === id && interiorOnly()) t = Math.max(t, 0.55);
      f.target = t;
    }
  }

  function flush() {
    pending = null;
    if (!interiorOnly() || !lastEvt.mouse) return;
    setHover(pick(lastEvt.x, lastEvt.y));
    if (hover) {
      const w = tip.offsetWidth || 160, h = tip.offsetHeight || 44;
      const tx = lastEvt.x + 14 + w > window.innerWidth - 8 ? lastEvt.x - 14 - w : lastEvt.x + 14;
      const ty = lastEvt.y + 16 + h > window.innerHeight - 8 ? lastEvt.y - 16 - h : lastEvt.y + 16;
      tip.style.transform = `translate(${Math.round(tx)}px, ${Math.round(ty)}px)`;
    }
  }

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !interiorOnly()) return;
    lastEvt = { x: e.clientX, y: e.clientY, mouse: true };
    if (e.buttons) { setHover(null); return; } // sürüklerken vurgu yok
    if (!pending) pending = requestAnimationFrame(flush);
  });
  canvas.addEventListener('pointerleave', () => setHover(null));

  // tıklama / dokunma: sürükleme eşiği 6px
  const downs = new Set();
  canvas.addEventListener('pointerdown', (e) => {
    downs.add(e.pointerId);
    down = downs.size === 1 ? { x: e.clientX, y: e.clientY, id: e.pointerId } : null; // çoklu dokunuş: iptal
  });
  const end = (e, cancelled) => {
    downs.delete(e.pointerId);
    const d = down;
    if (!d || d.id !== e.pointerId) return;
    down = null;
    if (cancelled || !interiorOnly()) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > DRAG_PX) return;
    const id = pick(e.clientX, e.clientY);
    if (id) { setHover(null); selectSection(id); }
  };
  canvas.addEventListener('pointerup', (e) => end(e, false));
  canvas.addEventListener('pointercancel', (e) => end(e, true));

  // etiket konumu + vurgu animasyonu (her karede, ucuz)
  const v = new THREE.Vector3();
  let labelId = null;
  const tmp = new THREE.Color(), tmp2 = new THREE.Color();
  app.frameCallbacks.add((dt) => {
    // renk animasyonu
    const k = 1 - Math.exp(-dt * 10);
    for (const f of fx.values()) {
      if (Math.abs(f.target - f.glow) < 0.002 && f.glow === f.target) continue;
      f.glow += (f.target - f.glow) * k;
      if (Math.abs(f.target - f.glow) < 0.002) f.glow = f.target;
      const g = f.glow;
      // renk: taban * (1 + g*(carpan-1)); hover için LIFT, seçili için GOLD karışımı
      const m = Math.min(1, g);
      f.mat.color.copy(f.base).multiply(tmp.setRGB(
        1 + m * (GOLD.r - 1), 1 + m * (GOLD.g - 1), 1 + m * (GOLD.b - 1)));
      if (f.hasEmi) { f.mat.emissive.copy(EMI).multiplyScalar(0.28 * m); }
      if (f.seatMat) { // 3D koltuklar aynı vurguyu alır
        f.seatMat.color.copy(f.mat.color).multiply(tmp2.setRGB(1 / f.base.r, 1 / f.base.g, 1 / f.base.b));
        f.seatMat.emissive.copy(EMI).multiplyScalar(0.28 * m);
      }
    }
    // etiket: hover > seçili (yalnızca iç görünüm)
    const id = interiorOnly() ? (hover || state.selectedSection) : null;
    if (id !== labelId) {
      labelId = id;
      if (id) label.textContent = SECTION_BY_ID[id].name;
      label.classList.toggle('is-off', !id);
      label.classList.toggle('is-sel', !!id && id === state.selectedSection);
    }
    if (id) {
      const a = sectionAnchor(SECTION_BY_ID[id]);
      v.set(a[0], a[1], a[2]).project(app.camera);
      if (v.z > 1 || v.z < -1) label.classList.add('is-off');
      else {
        label.classList.remove('is-off');
        const half = label.offsetWidth / 2 + 8;
        const x = Math.min(window.innerWidth - half, Math.max(half, (v.x * 0.5 + 0.5) * window.innerWidth)), y = (-v.y * 0.5 + 0.5) * window.innerHeight;
        label.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -100%)`;
      }
    }
  });

  onModeChange(() => { setHover(null); updateTargets(); });
  return { setHover };
}
