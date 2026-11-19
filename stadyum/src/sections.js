import { app } from './app.js';
import { state, onModeChange } from './state.js';
import { createSectionBar } from './ui/sectionBar.js';
import { createInfoPanel } from './ui/infoPanel.js';
import { initPicking } from './picking.js';
import { ensureLook, goBack } from './sectionView.js';

// Adım 3 girişi: main.js, app doldurulduktan sonra çağırır.
export function initSections() {
  const root = document.getElementById('ui');
  createSectionBar(app.ui.elements.sectionBar);
  const { modal } = createInfoPanel(root);
  initPicking(root);
  ensureLook();

  // kamera yakın düzlemi: yalnız tribün görünümünde küçük (koltuk sıraları kesilmesin)
  onModeChange((mode) => {
    if (mode === 'exterior' || mode === 'entering') {
      app.camera.near = 8; app.camera.updateProjectionMatrix();
    }
    if (mode === 'section') app.ui.showHint('Etrafa bakmak için sürükleyin · Yakınlaştırmak için kaydırın / iki parmak', 6000);
  });

  // Escape: önce modal, sonra bir seviye geri
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (modal.close()) { e.preventDefault(); return; }
    if (state.mode === 'section' || state.mode === 'interior') { e.preventDefault(); goBack(); }
  });
}
