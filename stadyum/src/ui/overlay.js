import { onBuyTicket, onExitStadium } from '../flow.js';
import { onModeChange, state } from '../state.js';
import { leaveSection } from '../sectionView.js';
import { periodName } from '../scene/lighting.js';

const fmt = (h) => {
  const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
};

export function createOverlay(root) {
  root.innerHTML = `
    <div class="loader" id="loader" role="status" aria-live="polite">
      <span class="loader__mark" aria-hidden="true"></span>
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
    <button class="back is-hidden" id="back" type="button" aria-label="Stadyumdan dışarı çık">← Dışarı çık</button>
    <div class="hint hint--in is-hidden" id="hint-in"></div>
    <!-- ADIM 3: tribün seçim butonları buraya eklenecek (#section-bar). Adım 2'de boş. -->
    <div class="section-bar is-hidden" id="section-bar" aria-label="Tribün seçimi"></div>
    <p class="disclaimer" id="disclaimer">Bu site Beşiktaş JK'nın resmi bilet sitesi değildir · Demo<span class="disclaimer__osm"> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">Harita verisi © OpenStreetMap katkıda bulunanlar</a></span></p>
    <div class="toast" id="toast" role="status"></div>
    <div class="fade" id="fade" aria-hidden="true"></div>
  `;
  const $ = (id) => root.querySelector('#' + id);
  const buy = $('buy'), cta = $('cta'), hint = $('hint'), toast = $('toast');
  const back = $('back'), hintIn = $('hint-in'), sectionBar = $('section-bar'), fade = $('fade');
  let hintTimer = 0;
  const showHint = (text, ms = 5500) => {
    hintIn.textContent = text;
    hintIn.classList.remove('is-hidden');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => hintIn.classList.add('is-hidden'), ms);
  };
  back.addEventListener('click', () => (state.mode === 'section' ? leaveSection() : onExitStadium()));
  buy.addEventListener('click', () => onBuyTicket());

  const chrome = [root.querySelector('.brand'), root.querySelector('#clock')];
  onModeChange((mode, prev) => {
    const ext = mode === 'exterior';
    const inside = mode === 'interior' || mode === 'section';
    cta.classList.toggle('is-hidden', !ext);
    root.querySelector('#disclaimer').classList.toggle('is-hidden', !ext);
    hint.classList.toggle('is-hidden', !ext);
    back.classList.toggle('is-hidden', !inside);
    back.textContent = mode === 'section' ? '← Tüm stadyum' : '← Dışarı çık';
    sectionBar.classList.toggle('is-hidden', !inside);
    chrome[0]?.classList.toggle('is-faded', !ext);
    chrome[1]?.classList.toggle('is-faded', mode === 'entering');
    if (mode !== 'interior' && mode !== 'section') hintIn.classList.add('is-hidden');
    if (mode === 'entering') {
      toast.textContent = prev === 'exterior' ? 'Stadyuma giriliyor…' : 'Dışarı çıkılıyor…';
      toast.classList.add('is-on');
    } else toast.classList.remove('is-on');
    if (mode === 'interior' && prev === 'entering') showHint('Döndürmek için sürükleyin · Bir tribüne dokunarak bölgeyi seçin');
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
    setFade(v) { fade.style.opacity = String(v); },
    showHint,
    elements: { buy, cta, toast, hint, back, sectionBar },
  };
}
