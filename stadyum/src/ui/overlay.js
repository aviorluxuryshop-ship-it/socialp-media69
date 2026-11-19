import { onBuyTicket } from '../flow.js';
import { onModeChange } from '../state.js';
import { periodName } from '../scene/lighting.js';

const fmt = (h) => {
  const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
};

export function createOverlay(root) {
  root.innerHTML = `
    <div class="loader" id="loader" role="status" aria-live="polite">
      <div class="loader__brand">Arena <span>Bilet</span></div>
      <div class="loader__bar"><i></i></div>
      <div class="loader__txt">Stadyum hazırlanıyor…</div>
    </div>
    <header class="brand" aria-label="Arena Bilet">
      <span class="brand__mark" aria-hidden="true"></span>
      <span class="brand__name">Arena <b>Bilet</b></span>
    </header>
    <div class="clock" id="clock" aria-live="off"></div>
    <div class="hint" id="hint">Döndürmek için sürükleyin</div>
    <div class="cta" id="cta">
      <button class="buy" id="buy" type="button">
        <span class="buy__label">Bilet Al</span>
        <span class="buy__sub">Tribününü seç, sahayı gör</span>
      </button>
    </div>
    <div class="toast" id="toast" role="status"></div>
  `;
  const $ = (id) => root.querySelector('#' + id);
  const buy = $('buy'), cta = $('cta'), hint = $('hint'), toast = $('toast');
  buy.addEventListener('click', () => onBuyTicket());

  onModeChange((mode) => {
    const ext = mode === 'exterior';
    cta.classList.toggle('is-hidden', !ext);
    hint.classList.toggle('is-hidden', !ext);
    if (mode === 'entering') {
      toast.textContent = 'Stadyuma giriliyor…';
      toast.classList.add('is-on');
    } else toast.classList.remove('is-on');
  });

  return {
    hideLoader() {
      const l = $('loader');
      l.classList.add('is-done');
      setTimeout(() => l.remove(), 900);
    },
    setProgress(p) { $('loader')?.style.setProperty('--p', String(p)); },
    setClock(hour, forced) {
      $('clock').textContent = `${periodName(hour)} · ${fmt(hour)}${forced ? ' (test)' : ''}`;
    },
    elements: { buy, cta, toast, hint },
  };
}
