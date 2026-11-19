import { app } from '../app.js';
import { state, onModeChange } from '../state.js';
import { SECTION_BY_ID, STANDS, formatTL, formatNumber } from '../data/sections.js';
import { selectSection, leaveSection } from '../sectionView.js';
import { createMinimap } from './minimap.js';

const MAX_QTY = 10;
const standName = (id) => STANDS.find((s) => s.id === id).full;

export function createInfoPanel(root) {
  const mq = window.matchMedia('(max-width: 700px)');
  let qty = 1;
  const panel = document.createElement('aside');
  panel.className = 'panel is-off';
  panel.setAttribute('aria-label', 'Bölge bilgisi');
  panel.innerHTML = `
    <button class="panel__handle" type="button" id="panel-toggle" aria-expanded="false" aria-controls="panel-body" aria-label="Ayrıntıları aç / kapat"><i></i></button>
    <div class="panel__head">
      <button class="panel__back" type="button" id="panel-back">← Tüm stadyum</button>
      <div class="panel__stand" id="p-stand"></div>
      <h2 class="panel__name" id="p-name"></h2>
      <div class="panel__price"><b id="p-price"></b><span> / bilet</span><em class="panel__tag" id="p-tag"></em></div>
    </div>
    <div class="panel__body" id="panel-body">
      <h3>Saha görüşü</h3>
      <p class="panel__desc" id="p-desc"></p>
      <dl class="facts">
        <div><dt>Kapasite</dt><dd id="p-cap"></dd></div>
        <div><dt>Tribün</dt><dd id="p-standfull"></dd></div>
      </dl>
      <div class="panel__map" id="p-map"></div>
      <div class="buyrow">
        <div class="stepper" role="group" aria-label="Bilet adedi">
          <button type="button" id="q-minus" aria-label="Bir eksilt">−</button>
          <output id="q-val" aria-live="polite">1</output>
          <button type="button" id="q-plus" aria-label="Bir artır">+</button>
        </div>
        <div class="total"><span>Toplam</span><b id="p-total"></b></div>
      </div>
    </div>
    <div class="panel__foot">
      <button class="cta-buy" type="button" id="p-buy">Bu bölgeden bilet al</button>
    </div>`;
  root.appendChild(panel);
  const $ = (id) => panel.querySelector('#' + id);

  const map = createMinimap((id) => selectSection(id));
  $('p-map').appendChild(map.svg);

  const modal = createModal(root);

  function render() {
    const def = SECTION_BY_ID[state.selectedSection];
    if (!def) return;
    $('p-stand').textContent = `${standName(def.stand)} · ${def.tierLabel} kat`.replace('Loca kat', 'Loca katı');
    $('p-name').textContent = def.name;
    $('p-price').textContent = formatTL(def.price);
    const tag = $('p-tag');
    tag.textContent = def.tag || ''; tag.hidden = !def.tag;
    $('p-desc').textContent = def.description;
    $('p-cap').textContent = `${formatNumber(def.capacity)} koltuk`;
    $('p-standfull').textContent = standName(def.stand);
    $('q-val').textContent = String(qty);
    $('p-total').textContent = formatTL(def.price * qty);
    $('q-minus').disabled = qty <= 1;
    $('q-plus').disabled = qty >= MAX_QTY;
    map.setActive(def.id);
  }

  const setQty = (n) => { qty = Math.min(MAX_QTY, Math.max(1, n)); render(); };
  $('q-minus').addEventListener('click', () => setQty(qty - 1));
  $('q-plus').addEventListener('click', () => setQty(qty + 1));
  $('panel-back').addEventListener('click', () => leaveSection());
  $('p-buy').addEventListener('click', () => {
    const def = SECTION_BY_ID[state.selectedSection];
    if (def) modal.open(def, qty);
  });
  const toggle = $('panel-toggle');
  const setCollapsed = (c) => { panel.classList.toggle('is-collapsed', c); toggle.setAttribute('aria-expanded', String(!c)); };
  toggle.addEventListener('click', () => setCollapsed(!panel.classList.contains('is-collapsed')));
  setCollapsed(true);

  const uiRoot = root;
  onModeChange((mode, prev) => {
    const on = mode === 'section';
    panel.classList.toggle('is-off', !on);
    uiRoot.classList.toggle('has-panel', on);
    map.setTracking(on);
    if (on) { render(); if (prev !== 'section') setCollapsed(true); }
    if (!on) modal.close();
  });
  map.setTracking(false);
  return { modal };
}

function createModal(root) {
  const wrap = document.createElement('div');
  wrap.className = 'modal is-off';
  wrap.innerHTML = `
    <div class="modal__card" role="dialog" aria-modal="true" aria-labelledby="m-title">
      <div class="modal__mark" aria-hidden="true"></div>
      <h2 id="m-title">Ödeme altyapısı yakında eklenecek</h2>
      <p>Biletleme şu an demo aşamasında; seçiminiz aşağıdaki gibi kaydedildi.</p>
      <dl class="sum">
        <div><dt>Bölge</dt><dd id="m-sec"></dd></div>
        <div><dt>Adet</dt><dd id="m-qty"></dd></div>
        <div class="sum__total"><dt>Toplam</dt><dd id="m-tot"></dd></div>
      </dl>
      <button class="cta-buy" type="button" id="m-ok">Tamam</button>
    </div>`;
  root.appendChild(wrap);
  const $ = (id) => wrap.querySelector('#' + id);
  let lastFocus = null;
  const api = {
    get isOpen() { return !wrap.classList.contains('is-off'); },
    open(def, qty) {
      $('m-sec').textContent = def.name;
      $('m-qty').textContent = `${qty} bilet`;
      $('m-tot').textContent = formatTL(def.price * qty);
      lastFocus = document.activeElement;
      wrap.classList.remove('is-off');
      $('m-ok').focus();
    },
    close() {
      if (!api.isOpen) return false;
      wrap.classList.add('is-off');
      lastFocus?.focus?.();
      return true;
    },
  };
  $('m-ok').addEventListener('click', () => api.close());
  wrap.addEventListener('pointerdown', (e) => { if (e.target === wrap) api.close(); });
  // odak tuzağı (tek odaklanabilir öğe)
  wrap.addEventListener('keydown', (e) => { if (e.key === 'Tab') { e.preventDefault(); $('m-ok').focus(); } });
  return api;
}
