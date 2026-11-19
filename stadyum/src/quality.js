// Cihaz gücüne göre kalite profili. ?kalite=low|high ile zorlanabilir.
export function getQuality() {
  const params = new URLSearchParams(location.search);
  const forced = params.get('kalite');
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const smallScreen = Math.min(screen.width, screen.height) <= 600;
  let name = cores <= 4 || mem <= 2 || smallScreen ? 'low' : 'high';
  if (forced === 'low' || forced === 'high') name = forced;

  const dpr = window.devicePixelRatio || 1;
  const high = name === 'high';
  return {
    name,
    pixelRatio: Math.min(dpr, high ? 2 : 1.5),
    antialias: dpr < 2,
    shadows: high,
    shadowMapSize: 1024,
    arcSegments: high ? 12 : 7,
    treeCount: high ? 2200 : 600,
    detailRadius: high ? 1400 : 800,   // bu mesafeden uzak bina karoları kutu olarak çizilir
    cullDist: high ? 2600 : 1600,       // kameraya bu mesafeden uzak bina/yol karoları gizlenir
    farCull: high ? 4200 : 2600,        // uzak (kutu) karolar; Asya kıyısı her zaman görünür
    farKeep: high ? 1 : 0.4,            // uzak küçük yapıların tutulma oranı
    stars: high ? 500 : 200,
  };
}
