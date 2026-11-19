// Adım 2 ve sonrası için ortak erişim noktası. main.js doldurur.
// app.renderer, app.scene, app.camera, app.controls, app.stadium, app.sections (Map),
// app.lighting, app.env, app.state, app.frameCallbacks (Set<(dt, t) => void>)
export const app = {
  frameCallbacks: new Set(),
};
