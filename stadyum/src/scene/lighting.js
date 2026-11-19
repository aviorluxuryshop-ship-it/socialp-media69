import * as THREE from 'three';
import { FOG_NEAR, FOG_FAR } from './world.js';

// Güneş yüksekliğine (derece) göre renk durakları.
const C = (h) => new THREE.Color(h);
const STOPS = [
  { e: -14, zenith: C(0x040712), horizon: C(0x0f1a36), sun: C(0x7f98e0), sunI: 0.0, hemiSky: C(0x1b2b5a), hemiGround: C(0x090c16), hemiI: 0.5, fog: C(0x0c1630) },
  { e: -6, zenith: C(0x141b45), horizon: C(0x4b3d6b), sun: C(0xff7a4a), sunI: 0.0, hemiSky: C(0x3a3f78), hemiGround: C(0x14111c), hemiI: 0.5, fog: C(0x3a3360) },
  { e: 0, zenith: C(0x35467f), horizon: C(0xff8a55), sun: C(0xff7b3d), sunI: 0.9, hemiSky: C(0x8a7aa8), hemiGround: C(0x4a3a3a), hemiI: 0.6, fog: C(0xe58c68) },
  { e: 8, zenith: C(0x4f7fc4), horizon: C(0xffc18c), sun: C(0xffb274), sunI: 1.4, hemiSky: C(0xa9bddc), hemiGround: C(0x6a5d50), hemiI: 0.8, fog: C(0xf2c9a6) },
  { e: 25, zenith: C(0x3f88de), horizon: C(0xbfdcf5), sun: C(0xfff0d9), sunI: 1.9, hemiSky: C(0xbcd8f5), hemiGround: C(0x6f6a5e), hemiI: 0.95, fog: C(0xcfe1f2) },
  { e: 62, zenith: C(0x2a78dc), horizon: C(0xd2e7fb), sun: C(0xffffff), sunI: 2.2, hemiSky: C(0xc6defa), hemiGround: C(0x75705f), hemiI: 1.0, fog: C(0xd6e7f8) },
];

function sampleStops(e) {
  if (e <= STOPS[0].e) return cloneStop(STOPS[0]);
  if (e >= STOPS[STOPS.length - 1].e) return cloneStop(STOPS[STOPS.length - 1]);
  let i = 0;
  while (e > STOPS[i + 1].e) i++;
  const a = STOPS[i], b = STOPS[i + 1];
  const t = (e - a.e) / (b.e - a.e);
  const out = {};
  for (const k of Object.keys(a)) {
    if (k === 'e') continue;
    out[k] = a[k].isColor ? a[k].clone().lerp(b[k], t) : a[k] + (b[k] - a[k]) * t;
  }
  return out;
}
function cloneStop(s) {
  const o = {};
  for (const k of Object.keys(s)) o[k] = s[k].isColor ? s[k].clone() : s[k];
  return o;
}

const SUNRISE = 6.5, SUNSET = 18.5;
const smooth = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// Saat (ondalıklı) -> güneş yüksekliği (derece) ve yön vektörü (sahneden güneşe).
export function sunFromHour(h) {
  const t = (h - SUNRISE) / (SUNSET - SUNRISE);
  let elev, phi;
  if (t >= 0 && t <= 1) { elev = 62 * Math.sin(Math.PI * t); phi = Math.PI * t; }
  else {
    const hn = h >= SUNSET ? h - SUNSET : h + 24 - SUNSET; // gece başından itibaren
    const tn = hn / (24 - (SUNSET - SUNRISE));
    elev = -26 * Math.sin(Math.PI * THREE.MathUtils.clamp(tn, 0, 1));
    phi = h >= SUNSET ? Math.PI : 0;
  }
  const r = THREE.MathUtils.degToRad(elev);
  // doğu (+x) -> güney (+z) -> batı (-x)
  const dir = new THREE.Vector3(Math.cos(phi) * Math.cos(r), Math.sin(r), Math.sin(phi) * Math.cos(r) * 0.8);
  return { elev, dir: dir.normalize() };
}

export function readHour() {
  const p = new URLSearchParams(location.search).get('saat');
  if (p !== null && p !== '') {
    const [hh, mm] = p.replace(',', '.').split(':');
    const v = mm !== undefined ? parseFloat(hh) + parseFloat(mm) / 60 : parseFloat(hh);
    if (!Number.isNaN(v)) return { hour: ((v % 24) + 24) % 24, forced: true };
  }
  const d = new Date();
  return { hour: d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600, forced: false };
}

export function periodName(h) {
  if (h >= 5 && h < 11) return 'Sabah';
  if (h >= 11 && h < 16) return 'Gündüz';
  if (h >= 16 && h < 19.5) return 'Akşam';
  return 'Gece';
}

const FLOOD_WARM = new THREE.Color(0xffe7bd);

export function createLighting({ scene, renderer, quality, env, stadium }) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0x555555, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.name = 'sun';
  const flood = new THREE.DirectionalLight(0xfff0d8, 0); // gece: stadyum ışıkları / ay
  flood.name = 'flood'; flood.position.set(-30, 160, 60);
  // iç görünüm dolgu ışığı: kasenin güneşe sırtı dönük tarafları siyaha düşmesin
  const ambient = new THREE.AmbientLight(0xffffff, 0);
  ambient.name = 'interior-fill';
  scene.add(hemi, sun, sun.target, flood, ambient);

  if (quality.shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
    const c = sun.shadow.camera;
    c.left = -150; c.right = 150; c.top = 150; c.bottom = -150; c.near = 10; c.far = 700;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.6;
  }
  scene.fog = new THREE.Fog(0xcfe1f2, FOG_NEAR, FOG_FAR);
  scene.background = new THREE.Color(0xcfe1f2);

  const state = { hour: 12, elevation: 0, night: 0, forced: false, interior: false };

  function applyFill() {
    // gündüz beyaz, gece sıcak (saha ışıkları); iç modda açık
    ambient.color.setRGB(1, 1, 1).lerp(FLOOD_WARM, state.night);
    ambient.intensity = state.interior ? 0.6 + 0.8 * state.night : 0.12 * state.night;
  }
  function setInterior(on) { state.interior = on; applyFill(); }

  function setHour(h, forced = state.forced) {
    state.hour = h; state.forced = forced;
    const { elev, dir } = sunFromHour(h);
    state.elevation = elev;
    const st = sampleStops(elev);
    const night = 1 - smooth(-9, 3, elev);
    state.night = night;

    sun.position.copy(dir).multiplyScalar(300);
    sun.color.copy(st.sun);
    sun.intensity = elev > -2 ? st.sunI : 0;
    hemi.color.copy(st.hemiSky); hemi.groundColor.copy(st.hemiGround); hemi.intensity = st.hemiI;
    flood.intensity = night * 1.5;
    scene.fog.color.copy(st.fog);
    scene.background.copy(st.fog);

    env.setSunDirection(dir);
    env.apply(st, night);
    stadium.setNight(night);
    applyFill();
    return state;
  }

  return { hemi, sun, flood, ambient, state, setHour, setInterior };
}
