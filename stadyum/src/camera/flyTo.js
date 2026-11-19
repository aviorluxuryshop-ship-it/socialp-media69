import * as THREE from 'three';
import { app } from '../app.js';

// Yeniden kullanılabilir sinematik kamera uçuşu (adım 3 bölüm görüş noktaları için de).
//
// flyTo({ position, lookAt, duration = 3, path = [], easing, onUpdate, enable = true })
//   position : [x,y,z] | Vector3    varış noktası
//   lookAt   : [x,y,z] | Vector3    varışta bakılan nokta
//   path     : ara geçiş noktaları (CatmullRom eğrisi) - isteğe bağlı
//   onUpdate : (p) => void          p = 0..1 (yumuşatılmamış ilerleme)
//   enable   : bitince OrbitControls yeniden açılsın mı (varsayılan true)
// Dönüş: Promise<boolean>  true = bitti, false = yeni bir uçuşla iptal edildi.
// Uçuş sırasında controls.enabled=false olur ve ana döngü controls.update çağırmaz (isFlying()).
// Bitince controls.target = lookAt olur; limitleri çağıran taraf ayarlar.

let current = null;

const V = (v) => (Array.isArray(v) ? new THREE.Vector3(v[0], v[1], v[2]) : v.clone());
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

export function isFlying() { return current !== null; }

export function cancelFlight() {
  if (current) { app.frameCallbacks.delete(current.tick); const c = current; current = null; c.resolve(false); }
}

export function flyTo({ position, lookAt, duration = 3, path = [], easing = easeInOut, onUpdate, enable = true }) {
  cancelFlight();
  const { camera, controls } = app;
  const startPos = camera.position.clone();
  const startLook = controls
    ? controls.target.clone()
    : camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(60).add(startPos);
  const endPos = V(position), endLook = V(lookAt);
  const curve = new THREE.CatmullRomCurve3([startPos, ...path.map(V), endPos], false, 'centripetal');
  const tmpL = new THREE.Vector3();
  if (controls) controls.enabled = false;

  return new Promise((resolve) => {
    let el = 0;
    const flight = { resolve };
    const tick = (dt) => {
      el += dt;
      const p = Math.min(el / duration, 1);
      const e = easing(p);
      curve.getPoint(e, camera.position);
      tmpL.lerpVectors(startLook, endLook, easeInOutSine(p));
      camera.lookAt(tmpL);
      onUpdate?.(p);
      if (p >= 1) {
        app.frameCallbacks.delete(tick);
        current = null;
        camera.position.copy(endPos);
        if (controls) { controls.target.copy(endLook); controls.enabled = enable; }
        resolve(true);
      }
    };
    flight.tick = tick;
    current = flight;
    app.frameCallbacks.add(tick);
  });
}
