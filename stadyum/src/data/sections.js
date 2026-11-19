// Tribün (bölüm) tanımları ve stadyum yerleşim sabitleri.
// Dünya ekseni: saha uzunluğu Z, genişliği X. Kuzey = -Z, Güney = +Z, Doğu = +X, Batı = -X. Y yukarı.

export const LAYOUT = {
  pitch: { length: 105, width: 68 },
  // Kase iç hattı: saha kenarından d kadar dışarıda yuvarlatılmış dikdörtgen.
  bowl: { a: 34, b: 52.5, r: 12 },
  rowRise: 0.5, // basamak yüksekliği
  tiers: {
    alt: { d0: 5, d1: 20, y0: 1.2, y1: 10.2 },
    koridor: { d0: 20, d1: 25, y0: 10.2, y1: 14.2 }, // concourse / loca bandı
    ust: { d0: 25, d1: 44, y0: 14.2, y1: 30.2 },
  },
  facade: { d: 46, h: 36 },
  roof: { dIn: 10, yIn: 26, dOut: 47, yOut: 36 },
};

// Hangi tribün hangi kase parçalarından oluşur (köşeler Kuzey/Güney'e aittir).
export const STAND_PIECES = {
  kuzey: ['NW', 'N', 'NE'],
  dogu: ['E'],
  guney: ['SE', 'S', 'SW'],
  bati: ['W'],
};

// ---- Yüzey / bakış hesapları ----
export const EYE_HEIGHT = 1.2; // basamak yüzeyinden göz yüksekliği
const bowlLine = (stand) => (stand === 'kuzey' || stand === 'guney' ? LAYOUT.bowl.b : LAYOUT.bowl.a);
const OUT = { kuzey: [0, -1], guney: [0, 1], dogu: [1, 0], bati: [-1, 0] };

// Tribün yerel koordinatı (kase hattından d kadar dışarı, y yükseklik) -> dünya [x,y,z] (tribün ortası).
export function standPoint(stand, d, y) {
  const [nx, nz] = OUT[stand];
  const L = bowlLine(stand) + d;
  return [nx * L, y, nz * L];
}

// Basamaklı yüzeyin gerçek yüksekliği (geometry.stairs ile aynı sıra/basamak düzeni).
function tierRows(tier) {
  const t = LAYOUT.tiers[tier];
  const rows = Math.max(1, Math.round((t.y1 - t.y0) / LAYOUT.rowRise));
  return { t, rows, dd: (t.d1 - t.d0) / rows, dy: (t.y1 - t.y0) / rows };
}
export function treadHeight(tier, d) {
  const { t, rows, dd, dy } = tierRows(tier);
  const k = Math.min(rows - 1, Math.max(0, Math.floor((d - t.d0) / dd)));
  return t.y0 + dy * (k + 1);
}

// Bir kademenin ortasındaki koltuk: { d, y (yüzey), eye (göz) }.
function seatAt(tier, frac) {
  const { t, rows, dd, dy } = tierRows(tier);
  const k = Math.min(rows - 1, Math.floor(rows * frac));
  const d = t.d0 + dd * (k + 0.5);
  const y = t.y0 + dy * (k + 1);
  return { d, y, eye: y + EYE_HEIGHT };
}

const LOOK_AT = [0, 0.5, 0];
function viewFor(stand, tier, frac = 0.5) {
  const s = seatAt(tier, frac);
  return { position: standPoint(stand, s.d, s.eye), lookAt: LOOK_AT, local: { d: s.d, y: s.eye } };
}
// Loca: cam cephenin hemen önünde, alt kademenin üstünde yükseltilmiş balkon gözü.
function locaView(stand) {
  const t = LAYOUT.tiers.koridor;
  const d = t.d0 - 0.4, y = t.y0 + 2.0;
  return { position: standPoint(stand, d, y), lookAt: LOOK_AT, local: { d, y } };
}

export const STANDS = [
  { id: 'kuzey', label: 'Kuzey', full: 'Kuzey Tribünü' },
  { id: 'guney', label: 'Güney', full: 'Güney Tribünü' },
  { id: 'dogu', label: 'Doğu', full: 'Doğu Tribünü' },
  { id: 'bati', label: 'Batı', full: 'Batı Tribünü' },
];

const nf = new Intl.NumberFormat('tr-TR');
export const formatNumber = (n) => nf.format(n);
export const formatTL = (n) => '₺' + nf.format(n);

// capacity toplamı: 42.000
export const SECTIONS = [
  {
    id: 'kuzey-alt', stand: 'kuzey', tier: 'alt', tierLabel: 'Alt', name: 'Kuzey Alt Tribün',
    capacity: 4500, price: 900, currency: 'TL',
    description: 'Kale arkası, sahaya en yakın bölüm. Ceza sahasındaki mücadeleyi metrelerce yakından, atmosferin kalbinde izlersiniz.',
    viewpoint: viewFor('kuzey', 'alt'),
  },
  {
    id: 'kuzey-ust', stand: 'kuzey', tier: 'ust', tierLabel: 'Üst', name: 'Kuzey Üst Tribün',
    capacity: 4200, price: 650, currency: 'TL',
    description: 'Kale arkası yüksek açı; alt kademenin üzerinden oyunun tamamını, takımların dizilişini görürsünüz.',
    viewpoint: viewFor('kuzey', 'ust'),
  },
  {
    id: 'guney-alt', stand: 'guney', tier: 'alt', tierLabel: 'Alt', name: 'Güney Alt Tribün',
    capacity: 4500, price: 900, currency: 'TL',
    description: 'Karşı kale arkası, sahaya yakın ve coşkulu bölüm. Hücum akınlarını tam karşıdan izlersiniz.',
    viewpoint: viewFor('guney', 'alt'),
  },
  {
    id: 'guney-ust', stand: 'guney', tier: 'ust', tierLabel: 'Üst', name: 'Güney Üst Tribün',
    capacity: 4200, price: 650, currency: 'TL',
    description: 'Karşı kale arkası yüksek açı; geniş görüş ve uygun fiyat bir arada.',
    viewpoint: viewFor('guney', 'ust'),
  },
  {
    id: 'dogu-alt', stand: 'dogu', tier: 'alt', tierLabel: 'Alt', name: 'Doğu Alt Tribün',
    capacity: 5600, price: 1100, currency: 'TL',
    tag: 'Taraftar tribünü',
    description: 'Ev sahibi taraftar grubunun tribünü; stadyumun en coşkulu bölgesi. Yan çizgiden oyuncuları yakından görürsünüz.',
    viewpoint: viewFor('dogu', 'alt'),
  },
  {
    id: 'dogu-ust', stand: 'dogu', tier: 'ust', tierLabel: 'Üst', name: 'Doğu Üst Tribün',
    capacity: 6600, price: 800, currency: 'TL',
    tag: 'Taraftar tribünü',
    description: 'Taraftar tribününün üst katı: tezahüratın içinde, yan çizgiden taktik bir görünüm.',
    viewpoint: viewFor('dogu', 'ust'),
  },
  {
    id: 'bati-alt', stand: 'bati', tier: 'alt', tierLabel: 'Alt', name: 'Batı Alt Tribün',
    capacity: 5200, price: 1800, currency: 'TL',
    tag: 'Ana tribün',
    description: 'Ana tribün, yan çizgiye çok yakın. Yedek kulübeleri ve teknik heyet hemen önünüzde.',
    viewpoint: viewFor('bati', 'alt'),
  },
  {
    id: 'bati-loca', stand: 'bati', tier: 'koridor', tierLabel: 'Loca', name: 'Batı Loca',
    capacity: 2000, price: 8500, currency: 'TL',
    tag: 'VIP',
    description: 'Özel localar: kapalı, ikramlı, en prestijli görüş. Alt kademenin üzerinden yükseltilmiş, kesintisiz saha manzarası.',
    viewpoint: locaView('bati'),
  },
  {
    id: 'bati-ust', stand: 'bati', tier: 'ust', tierLabel: 'Üst', name: 'Batı Üst Tribün',
    capacity: 5200, price: 1300, currency: 'TL',
    tag: 'Ana tribün',
    description: 'Ana tribün üst kat; geniş panoramik saha manzarası ve çatı altında korunaklı oturma.',
    viewpoint: viewFor('bati', 'ust'),
  },
];

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
export const TOTAL_CAPACITY = SECTIONS.reduce((n, s) => n + s.capacity, 0);

// Etiket çapası: tribün ortasında, yüzeyin biraz üstü.
export function sectionAnchor(def) {
  const tier = def.tier === 'koridor' ? 'koridor' : def.tier;
  const t = LAYOUT.tiers[tier];
  return standPoint(def.stand, (t.d0 + t.d1) / 2, (t.y0 + t.y1) / 2 + 3);
}
