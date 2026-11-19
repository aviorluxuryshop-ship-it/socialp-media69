import * as THREE from 'three';
import { app } from '../app.js';

// Tribün görünümü: kamera sabit, kullanıcı "başını çevirir".
// Sürükleme = yaw/pitch (dünyayı tut-çek yönü), tekerlek / iki parmak = FOV (40-75), ok tuşları = yaw/pitch.
// OrbitControls devre dışıdır; ana döngü section modunda controls.update çağırmaz.

export const FOV_MIN = 40, FOV_MAX = 75;
const YAW_LIMIT = (70 * Math.PI) / 180;
const PITCH_MIN = -0.85, PITCH_MAX = 0.5;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const dir = new THREE.Vector3();

export function createLookAround() {
  const canvas = app.renderer.domElement;
  const cam = app.camera;
  let active = false;
  let baseYaw = 0;
  let yaw = 0, pitch = 0;          // hedef (baseYaw'a göre yaw ofseti)
  let curYaw = 0, curPitch = 0;    // yumuşatılmış
  const pointers = new Map();
  let pinch = 0, pinchFov = 0;

  const radPerPx = () => (cam.fov * Math.PI / 180) / Math.max(320, window.innerHeight);

  function apply() {
    euler.set(curPitch, baseYaw + curYaw, 0, 'YXZ');
    cam.quaternion.setFromEuler(euler);
    // OrbitControls hedefi bakış yönünde tut: uçuş başlangıç bakışı ve çıkış için
    cam.getWorldDirection(dir);
    app.controls.target.copy(cam.position).addScaledVector(dir, 40);
  }

  function setFov(f) {
    cam.fov = clamp(f, FOV_MIN, FOV_MAX);
    cam.updateProjectionMatrix();
  }

  function onDown(e) {
    if (!active) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { canvas.setPointerCapture(e.pointerId); } catch { /* yoksay */ }
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = Math.hypot(a.x - b.x, a.y - b.y); pinchFov = cam.fov;
    }
  }
  function onMove(e) {
    if (!active) return;
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch > 0) setFov(pinchFov * (pinch / Math.max(1, d)));
      return;
    }
    const k = radPerPx();
    yaw = clamp(yaw + dx * k, -YAW_LIMIT, YAW_LIMIT);
    pitch = clamp(pitch + dy * k, PITCH_MIN, PITCH_MAX);
  }
  function onUp(e) {
    pointers.delete(e.pointerId);
    try { canvas.releasePointerCapture(e.pointerId); } catch { /* yoksay */ }
    pinch = 0;
  }
  function onWheel(e) {
    if (!active) return;
    e.preventDefault();
    setFov(cam.fov + clamp(e.deltaY, -120, 120) * 0.03);
  }
  function onKey(e) {
    if (!active || e.target?.closest?.('input,textarea,[role="dialog"]')) return;
    const step = 0.09;
    if (e.key === 'ArrowLeft') yaw = clamp(yaw + step, -YAW_LIMIT, YAW_LIMIT);
    else if (e.key === 'ArrowRight') yaw = clamp(yaw - step, -YAW_LIMIT, YAW_LIMIT);
    else if (e.key === 'ArrowUp') pitch = clamp(pitch + step, PITCH_MIN, PITCH_MAX);
    else if (e.key === 'ArrowDown') pitch = clamp(pitch - step, PITCH_MIN, PITCH_MAX);
  }
  function tick(dt) {
    if (!active) return;
    const k = 1 - Math.exp(-dt * 14);
    curYaw += (yaw - curYaw) * k;
    curPitch += (pitch - curPitch) * k;
    apply();
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKey);
  app.frameCallbacks.add(tick);

  return {
    // Kameranın şu anki yönünü taban (yaw=0) kabul ederek başlar.
    start() {
      cam.getWorldDirection(dir);
      baseYaw = Math.atan2(-dir.x, -dir.z);
      curPitch = pitch = Math.asin(clamp(dir.y, -1, 1));
      curYaw = yaw = 0;
      pointers.clear();
      active = true;
    },
    stop() { active = false; pointers.clear(); },
    get active() { return active; },
    // Mini haritadaki bakış açısı: dünya yaw'ı (radyan, Z- yönü = 0)
    get worldYaw() { return baseYaw + curYaw; },
  };
}
