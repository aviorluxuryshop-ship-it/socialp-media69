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

// Tribün merkezindeki bir koltuk için kamera noktası.
function seatView(stand, d, y) {
  const { a, b } = LAYOUT.bowl;
  const eye = 1.4;
  let pos;
  if (stand === 'kuzey') pos = [0, y + eye, -(b + d)];
  else if (stand === 'guney') pos = [0, y + eye, b + d];
  else if (stand === 'dogu') pos = [a + d, y + eye, 0];
  else pos = [-(a + d), y + eye, 0];
  return { position: pos, lookAt: [0, 0, 0] };
}

function tierView(stand, tier, frac = 0.55) {
  const t = LAYOUT.tiers[tier];
  const d = t.d0 + (t.d1 - t.d0) * frac;
  const y = t.y0 + (t.y1 - t.y0) * frac;
  return seatView(stand, d, y);
}

// capacity toplamı: 42.000
export const SECTIONS = [
  {
    id: 'kuzey-alt', stand: 'kuzey', tier: 'alt', name: 'Kuzey Alt Tribün',
    capacity: 4500, price: 850, currency: 'TL',
    description: 'Kale arkası, sahaya en yakın bölüm. Atmosferin kalbi.',
    viewpoint: tierView('kuzey', 'alt', 0.5),
  },
  {
    id: 'kuzey-ust', stand: 'kuzey', tier: 'ust', name: 'Kuzey Üst Tribün',
    capacity: 4200, price: 650, currency: 'TL',
    description: 'Kale arkası yüksek açı; oyunun tamamını görürsünüz.',
    viewpoint: tierView('kuzey', 'ust', 0.5),
  },
  {
    id: 'guney-alt', stand: 'guney', tier: 'alt', name: 'Güney Alt Tribün',
    capacity: 4500, price: 850, currency: 'TL',
    description: 'Karşı kale arkası, sahaya yakın ve coşkulu bölüm.',
    viewpoint: tierView('guney', 'alt', 0.5),
  },
  {
    id: 'guney-ust', stand: 'guney', tier: 'ust', name: 'Güney Üst Tribün',
    capacity: 4200, price: 650, currency: 'TL',
    description: 'Karşı kale arkası yüksek açı, uygun fiyatlı.',
    viewpoint: tierView('guney', 'ust', 0.5),
  },
  {
    id: 'dogu-alt', stand: 'dogu', tier: 'alt', name: 'Doğu Alt Tribün',
    capacity: 5600, price: 1100, currency: 'TL',
    description: 'Uzun kenar, yan kamera açısı; oyuncuları yakından görürsünüz.',
    viewpoint: tierView('dogu', 'alt', 0.5),
  },
  {
    id: 'dogu-ust', stand: 'dogu', tier: 'ust', name: 'Doğu Üst Tribün',
    capacity: 6600, price: 900, currency: 'TL',
    description: 'Uzun kenar yüksek açı; taktik görünüm.',
    viewpoint: tierView('dogu', 'ust', 0.5),
  },
  {
    id: 'bati-alt', stand: 'bati', tier: 'alt', name: 'Batı Alt Tribün',
    capacity: 5200, price: 1250, currency: 'TL',
    description: 'Ana tribün, yan çizgiye yakın. Boğaz tarafı.',
    viewpoint: tierView('bati', 'alt', 0.5),
  },
  {
    id: 'bati-loca', stand: 'bati', tier: 'koridor', name: 'Batı Loca',
    capacity: 2000, price: 6500, currency: 'TL',
    description: 'Özel localar: kapalı, ikramlı, en prestijli görüş.',
    viewpoint: { position: [-(LAYOUT.bowl.a + 19.2), 12.4, 0], lookAt: [0, 0, 0] },
  },
  {
    id: 'bati-ust', stand: 'bati', tier: 'ust', name: 'Batı Üst Tribün',
    capacity: 5200, price: 1000, currency: 'TL',
    description: 'Ana tribün üst kat; geniş panoramik saha manzarası.',
    viewpoint: tierView('bati', 'ust', 0.5),
  },
];

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
export const TOTAL_CAPACITY = SECTIONS.reduce((n, s) => n + s.capacity, 0);
