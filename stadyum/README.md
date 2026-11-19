# Arena Bilet

Vite + vanilla JS + three.js ile hazırlanmış 3D stadyum bilet sitesi. Dışarıdan stadyumu gezin, "Bilet Al" ile içeri
girin, bir tribüne dokunun ve o koltuk bölgesinden sahayı görün; bilgi panelinden bilet adedini seçip satın alma
akışına geçin.

## Özellikler

- **Gerçek çevre**: stadyum Tüpraş Stadyumu'nun gerçek konumunda; Dolmabahçe Sarayı, Boğaz (Güney yönünde), sokaklar, binalar, camiler, Asya yakası ve Boğaz Köprüsü OSM verisiyle çizilir; stadyum içindeyken hiçbiri çizilmez.
- **Dış görünüm**: prosedürel stadyum (kase, çatı, cephe, kemerli tarihi yüzey, çatı projektörleri), gün saatine göre
  güneş/gökyüzü/gece aydınlatması. Dışarıda hiç koltuk çizilmez; yalnızca kabuk görünür.
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

- `src/main.js` başlatma, render döngüsü, OrbitControls, sekme görünürlüğü
- `src/scene/stadium.js` tribün, çatı, cephe, saha, çatı projektörleri
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
