# Arena Bilet

Vite + vanilla JS + three.js ile hazırlanmış 3D stadyum bilet sitesi. Dışarıdan stadyumu gezin, "Bilet Al" ile içeri
girin, bir tribüne dokunun ve o koltuk bölgesinden sahayı görün; bilgi panelinden bilet adedini seçip satın alma
akışına geçin.

## Özellikler

- **Gerçek çevre**: stadyum Tüpraş Stadyumu'nun gerçek konumunda; Dolmabahçe Sarayı, Boğaz (Güney yönünde), sokaklar, binalar, camiler, Asya yakası ve Boğaz Köprüsü OSM verisiyle çizilir; stadyum içindeyken hiçbiri çizilmez.
- **Dış görünüm**: Blender ile üretilmiş stadyum modeli (`public/models/tupras.glb`: cephe, çatı, saha, güney binası) +
  prosedürel bölümler ve çatı altı projektörleri; gün saatine göre güneş/gökyüzü/gece aydınlatması. Dışarıda hiç
  koltuk çizilmez; yalnızca kabuk görünür.
- **Giriş uçuşu**: "Bilet Al" ile sinematik kamera uçuşu, kaseye geçiş.
- **İç görünüm**: OrbitControls ile saha çevresinde gezinti, 9 bölge (Kuzey/Güney/Doğu alt-üst, Batı alt, Batı Loca,
  Batı üst) için hover vurgusu, tooltip ve seçim.
- **Bölüm görünümü**: koltuk gözünden "etrafa bakma" (sürükle, tekerlek/iki parmakla yakınlaştır, ok tuşları),
  bilgi paneli (fiyat, kapasite, mini harita, adet seçici) ve satın alma penceresi.
- **3D koltuklar**: yalnızca içeride görünür. Tek bir düşük poligonlu koltuk (20 üçgen) `THREE.InstancedMesh` ile
  basamaklara dizilir; tribün başına parçalara bölündüğü için kamera arkasındaki parçalar çizilmez. İlk girişte
  üretilir, çıkışta gizlenir, tekrar girişte yeniden üretilmez. Siyah/beyaz koltuklar, bölge rengi şeritleri;
  seçili bölge altın tonda vurgulanır.
- **Performans**: kalite profili (`quality.js`), mesafeye göre koltuk yoğunluğu (yakın tam, orta seyrek, uzak boyalı
  doku), iç girişte ilk ~2 sn FPS ölçümü (30 fps altında otomatik düşük kalite: piksel oranı 1, gölge kapalı, seyrek
  koltuk), sekme gizliyken çizim durur.
- **Mobil**: dar ekranda tribün görünümünde bölge çubuğu tek "Bölge değiştir" hapına iner, alt panel kompakt kalır.
  `prefers-reduced-motion` desteklenir.

## Çalıştırma

```bash
cd stadyum
npm install
npm run dev       # geliştirme sunucusu
npm run build     # üretim derlemesi (dist/)
npm run preview   # derlemeyi yerelde önizle
```

## Test parametreleri

- `?saat=21` veya `?saat=17.5` / `?saat=6:30`: gün ışığı saatini zorlar (varsayılan: yerel saat, dakikada bir güncellenir).
- `?kalite=low` veya `?kalite=high`: kalite profilini zorlar (varsayılan cihaza göre otomatik; zorlanınca otomatik
  FPS düşürmesi devre dışı kalır).
- Örnek: `/?saat=12&kalite=high`, `/?saat=21&kalite=low`.
- Hata ayıklama: tarayıcı konsolunda `__arena.renderer.info.render` (çizim çağrısı / üçgen sayısı),
  `__arena.seats.stats` (koltuk örnekleri), `__arena.perf.fps` (ölçülen FPS).

## Yapı

- `src/main.js` başlatma (GLB yüklenirken yükleme çubuğu), render döngüsü, OrbitControls, sekme görünürlüğü
- `src/scene/shell.js` GLB kabuğu: yükleme (önbellekli), malzeme ayarı, çatı dokusu küçültme, gece, düğümler
- `src/scene/stadium.js` prosedürel bölümler (seçim/vurgu), reklam panosu, loca camı, çatı projektörleri, goller; kabuğu sahneye ekler
- `public/models/tupras.glb` + `blender/` stadyum modeli ve onu üreten Blender betikleri (aşağıya bakın)
- `src/scene/seats.js` 3D koltuklar (InstancedMesh, tembel üretim, mesafe LOD)
- `src/scene/environment.js` gökyüzü, yıldızlar; gerçek çevreyi `world.js`'ten ekler
- `src/scene/world.js` OpenStreetMap verisinden Dolmabahçe/Beşiktaş çevresi: binalar (karo başına tek mesh), yollar, parklar, ağaçlar, Boğaz (animasyonlu su), Asya yakası, 15 Temmuz Şehitler Köprüsü; mesafe/kalite bazlı karo gizleme
- `src/data/osm-dolmabahce.json` sadeleştirilmiş OSM verisi (yerel metre, saha merkezi orijin, saha uzun ekseni Z). `node scripts/fetch-osm.mjs` ile yeniden üretilir (`--convert`: yalnız önbellekten). Harita verisi © OpenStreetMap katkıda bulunanlar (ODbL).
- `src/scene/lighting.js` gün saatine göre ışık/renk, iç görünüm dolgu ışığı
- `src/perf.js` otomatik performans düşürme
- `src/data/sections.js` 9 bölüm tanımı (id, ad, kapasite, fiyat, kamera noktası) ve yerleşim yardımcıları
- `src/flow.js`, `src/sectionView.js`, `src/camera/` giriş uçuşu, bölüm görünümü, etrafa bakma
- `src/picking.js` bölge seçimi ve vurgu
- `src/ui/` arayüz (genel bakış, bölge çubuğu, bilgi paneli, satın alma penceresi)

## Stadyum modeli (GLB)

Dış kabuk elle çizilmiş bir `.blend` değil, **kodla üretilen** bir GLB'dir: `blender/` klasöründeki betikler
(Blender 4.2 headless) `public/models/tupras.glb` dosyasını yazar (2,5 MB, ~37 bin üçgen, 11 malzeme, çatı üstü 4096² JPEG).
Birim metre; orijin saha merkezi; Y yukarı; saha uzun ekseni Z; Kuzey = −Z; saha yüzeyi y = 0,45. Sitenin koordinatlarıyla
birebir aynıdır, ölçek/ofset gerekmez.

### Yeniden üretmek

```bash
python3 stadyum/blender/make_textures.py            # dokular (numpy + Pillow) -> blender/build/tex/*.jpg
/opt/blender-dl/blender-4.2.3-linux-x64/blender -b --python stadyum/blender/build_tupras.py -- \
    --out stadyum/public/models/tupras.glb
python3 stadyum/blender/validate_glb.py stadyum/public/models/tupras.glb   # düğümler, üçgen, malzeme, doku boyutları
```

Ayrıntılar (seçenekler, önizleme, dosya listesi) için `blender/README.md`. GLB'yi değiştirirseniz düğüm adlarını
(`pitch`, `stands_lower`, `concourse`, `stands_upper`, `podium`, `roof_top`, `roof_under`, `roof_lights`, `facade`,
`south_building`) koruyun; `shell.js` onlara göre çalışır.

### Sitede nasıl kullanılır

- **Yükleme** (`src/scene/shell.js`): `GLTFLoader` ile tek sefer, modül düzeyinde önbellekli yüklenir; içeri/dışarı
  geçişte yeniden yüklenmez (nesneler sahnede kalır, yalnızca `visible` değişir). Yükleme ekranındaki altın çizgi indirmenin
  gerçek ilerlemesini gösterir; model gelmeden sahne çizilmez ve yükleme ekranı kapanmaz. Dosya gelmezse ekranda hata yazar.
  GLB indirilirken çevre (`world.js`) üretilir.
- **GLB'den gelenler** (artık prosedürel üretilmez): cephe, çatı üstü (yazılar + kartal dokuda) ve altı (halka, kirişler),
  saha yüzeyi + çevre çimi (çizgiler dokuda), kapalı kase kabuğu (`stands_*`, `concourse`), podyum, güney binası.
  `stadium.parts.roof / facade / pitch / southBuilding / podium` GLB gruplarını gösterir.
- **Prosedürel kalanlar**: 9 bölüm mesh'i (ışın izleme ve vurgu), instanced koltuklar, reklam panosu (`reklam-panosu`), Batı
  loca camı (+ yarı saydamlık mantığı), kaleler (GLB'de yok), çatı altı emissive `floodlight-units` + spot ışıklar (GLB'nin
  koyu `roof_lights` düğümü atılır), `world.js` çevresi, tüm arayüz/akışlar. Bölüm mesh'leri GLB tribün kabuğunun 0,30 m
  üstündedir (z-fighting yok).
- **Malzeme**: ortam haritası olmadığı için tüm malzemelerde `metalness = 0`; koyu çelik/podyum rengi çarpanla açılır;
  cam gündüz gökyüzünü, gece sıcak ışığı yansıtır (emissive). Dokular sRGB, anisotropi `min(8, maksimum)` (çatı/saha).
- **Gece** (`stadium.setNight(n)` → `shell.setNight(n)`): çatı üstü rengi `1 − 0,5·n` çarpanıyla kısılır (yazılar okunur kalır),
  saha/çim hafif parlar, cam ısınır; dışarıya ışık eklenmez.
- **İç mod** (`flow.js`): `facade`, `south_building`, `podium` gizlenir (`parts.exteriorOnly`) ve dış çevre gizlenir; çatı
  (üst + alt), tribün kabuğu ve saha içeriden görünür. Kamera sıkıştırması (`clampInterior`) çatı alt yüzüne ≥ 1 m boşluk
  bırakır (GLB köşe noktalarıyla ölçüldü); giriş uçuşu çatı açıklığından ≥ 2 m payla geçer.
- **Kalite**: `?kalite=low` (ve otomatik performans düşürme) aynı GLB'yi yükler, yalnızca çatı dokusunu 4096² → 2048²'ye
  indirir (GPU'da ~85 MiB → ~21 MiB, `shell.downscaleRoof()`); GPU 4096² desteklemiyorsa da kendiliğinden iner.
- Hata ayıklama: `__arena.stadium.shell.stats` (üçgen sayısı, çatı doku boyutu, yükleme/kurulum ms),
  `__arena.stadium.shell.nodes` (GLB düğümleri), `__arena.stadium.shell.materials`.
