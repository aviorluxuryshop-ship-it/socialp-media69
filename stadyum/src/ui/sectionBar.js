import { state, onModeChange } from '../state.js';
import { SECTIONS, STANDS, formatTL } from '../data/sections.js';
import { selectSection } from '../sectionView.js';

// Gruplu bölge seçici: üstte tribün sekmeleri, altında kademe çipleri (ad + başlangıç fiyatı).
// Dar ekranda iki seviyeli: önce tribün, sonra yalnız seçili tribünün kademeleri.
export function createSectionBar(bar) {
  const mq = window.matchMedia('(max-width: 700px)');
  bar.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'sb';
  grid.setAttribute('role', 'group');
  grid.setAttribute('aria-label', 'Bölge seçimi');
  // dar ekranda tribün görünümünde çubuk tek bir hap düğmeye iner ("Bölge değiştir")
  const pill = document.createElement('button');
  pill.type = 'button'; pill.className = 'sb__pill';
  pill.setAttribute('aria-expanded', 'false');
  pill.innerHTML = '<span>Bölge değiştir</span><i aria-hidden="true">▾</i>';
  const setOpen = (o) => { bar.classList.toggle('is-expanded', o); pill.setAttribute('aria-expanded', String(o)); };
  pill.addEventListener('click', () => setOpen(!bar.classList.contains('is-expanded')));
  bar.appendChild(pill);
  bar.appendChild(grid);

  const tabs = new Map(), sets = new Map(), chips = new Map();
  let activeStand = 'kuzey';

  STANDS.forEach((st, i) => {
    const tab = document.createElement('button');
    tab.type = 'button'; tab.className = 'sb__tab'; tab.textContent = st.label;
    tab.dataset.stand = st.id;
    tab.style.gridColumn = String(i + 1);
    tab.addEventListener('click', () => {
      setStand(st.id);
      // geniş ekranda sekme tıklaması ilk kademeyi seçer; dar ekranda yalnız kademeleri açar
      if (!mq.matches) selectSection(SECTIONS.find((s) => s.stand === st.id).id);
    });
    tabs.set(st.id, tab);
    grid.appendChild(tab);
  });
  STANDS.forEach((st, i) => {
    const set = document.createElement('div');
    set.className = 'sb__tiers'; set.dataset.stand = st.id;
    set.style.gridColumn = String(i + 1);
    for (const def of SECTIONS.filter((s) => s.stand === st.id)) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip' + (def.tier === 'koridor' ? ' chip--vip' : '');
      b.dataset.id = def.id;
      b.setAttribute('aria-label', `${def.name}, ${formatTL(def.price)}'den`);
      b.innerHTML = `<span class="chip__t">${def.tierLabel}</span><span class="chip__p">${formatTL(def.price)}'den</span>`;
      b.addEventListener('click', () => selectSection(def.id));
      chips.set(def.id, b);
      set.appendChild(b);
    }
    sets.set(st.id, set);
    grid.appendChild(set);
  });

  function setStand(id) {
    activeStand = id;
    for (const [k, t] of tabs) t.classList.toggle('is-active', k === id);
    for (const [k, s] of sets) s.classList.toggle('is-active', k === id);
  }
  function sync() {
    setOpen(false); // mod / bölge değişince hap kapalı başlar
    const id = state.selectedSection;
    for (const [k, c] of chips) {
      const on = k === id && state.mode === 'section';
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-pressed', String(on));
    }
    if (id && state.mode === 'section') setStand(SECTIONS.find((s) => s.id === id).stand);
    for (const [k, t] of tabs) t.classList.toggle('is-current', state.mode === 'section' && SECTIONS.find((s) => s.id === id)?.stand === k);
  }
  setStand(activeStand);
  onModeChange(sync);
  sync();
}
