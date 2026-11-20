# PROGRESS — Tüpraş Stadyumu 3D Deneyimi

> Bu dosya her önemli adımdan sonra güncellenir. Çalışma kesilirse buradan devam edilir.
> Projeyi baştan başlatma, mevcut kodu silme.

## Durum özeti

| Aşama | Durum |
| --- | --- |
| 0. Araştırma (mimari, çevre, kimlik) | ✅ Tamamlandı — `docs/RESEARCH.md` |
| Veri hattı (OSM + SRTM → `public/data`) | ✅ Tamamlandı — `scripts/build_world.py` |
| Koltuk yerleşim motoru (saf veri) | ✅ Tamamlandı, testler geçiyor — `src/stadium/layout.ts` |
| STEP 01 – Stadium in code | ✅ Tamamlandı ve görsel olarak doğrulandı |
| STEP 02 – Every view camera locked | 🟡 Sıradaki |
| STEP 03 – Clips start and end | ⏳ Bekliyor |
| STEP 04 – Choice in post (maske/vurgu) | ⏳ Bekliyor |
| STEP 05 – Pick your seat, get the ticket | ⏳ Bekliyor |
| Gece–gündüz / güneş sistemi | 🟡 Temel hazır (güneş hesabı, gece ışıkları); ince ayar STEP 02 ile |
| Dinamik yükleme / performans | 🟡 Parça akışı + havuz + LOD çalışıyor; ölçüm/ayar bekliyor |

## Devam eden aşama

**STEP 02** — sabit kamera görünümleri (üstten, dış geniş açı, uzun tribün, kale arkası,
VIP loca, çatı, Boğaz) ve aynı geometri üzerinde malzeme/ışık/gölge gerçekçiliği.

## STEP 01 doğrulaması (2026-11-20)

Referans fotoğraflarla karşılaştırma (`docs/screens/`):
- `step01-interior-east-upper.jpg` ↔ *Vodafone Park Panorama.jpg*: alt kat beyaz ağırlıklı,
  üst kat siyah ağırlıklı, kusma tünelleri, loca bandı + LED şerit, saha panoları, köşe ekranları ✓
- `step01-street-eski-acik.jpg` ↔ *Vodafone Park (from outside).jpg*: krem taş pilonlar, açık bant,
  ince çelik kolonlar, koyu basınç halkası, Eski Açık kulesi, arkada Süzer Plaza ✓
- `step01-aerial-nw.jpg`, `step01-dusk-bosphorus.jpg`: Boğaz, Dolmabahçe Sarayı, Saat Kulesi,
  Dolmabahçe Camii (kubbe + 2 minare), 15 Temmuz Şehitler Köprüsü gerçek konumlarında ✓
- `step01-night-aerial.jpg`: gece projektörleri, cephe aydınlatması, şehir ışıkları ✓

Sahne bileşenleri: 41.206 koltuk (InstancedMesh, blok başına 2 LOD), 147 loca, 10 giriş kapısı,
82 pilon/kolon, 82 radyal çatı kirişi + 328 projektör, 5.479 OSM binası (200 m parçalar),
OSM yolları/parkları zemin dokusunda, SRTM arazi (yakın 40 m, uzak 100 m), Boğaz suyu.

## Tamamlanan dosyalar

- `docs/RESEARCH.md` — kaynaklı mimari notlar, blok numaralandırma gerekçesi
- `scripts/build_world.py` — OSM karoları + SRTM ızgaraları → `public/data/{world.json,terrain.bin,coast.bin}`
- `src/stadium/shape.ts` — süperelips (kutupsal parametre), yay uzunluğu tablosu
- `src/stadium/config.ts` — tüm ölçüler, kesit profilleri, blok/sektör tanımları, kategoriler
- `src/stadium/layout.ts` — blok/sıra/koltuk üretimi (41.154 koltuk, 147 loca)
- `scripts/test-logic.ts` — yerleşim testleri (`npm test`)
- `src/core/quality.ts` — cihaz kalite kademeleri
- `src/core/engine.ts` — renderer (ters derinlik tamponu destekleniyorsa), kamera, yakın düzlem
- `src/core/geo.ts`, `src/core/textures.ts` — geometri oluşturucu, prosedürel dokular
- `src/stadium/{bowl,seats,roof,facade,pitch,eskiAcik,materials,index}.ts` — stadyum
- `src/world/{data,ground,terrain,buildings,trees,streaming,water,landmarks,farCity}.ts` — çevre
- `src/lighting/{sun,atmosphere}.ts` — gerçek güneş konumu, gökyüzü, ışıklar, sis, yansıma
- `scripts/shot.mjs` — Playwright ile ekran görüntüsü (`node scripts/shot.mjs out.png "t=13:30&cam=x,y,z&look=x,y,z"`)
- `public/brand/bjk-logo.svg` — resmî arma (Wikimedia Commons, PD-Turkey)

## Yapılan önemli kararlar

- Koordinat çerçevesi: orijin = santra noktası, +X → GD kale (Eski Açık), +Z → GB ana tribün.
- Tribün ön çizgisi resmî mesafelerden (7.95 m / 6.15 m), dış cephe OSM dış halkasından.
- Üst kat "dalga": köşelerde 18 sıra, kale arkası ortasında 25, yanlarda cephe sınırı (~20), Doğu −3.
- Blok numaraları temsili; resmî plan gelince yalnızca `src/stadium/config.ts` değişir.
- Fiyatlar örnek fiyattır (sunum amaçlı).
- Kurumsal font bulunamadı → Barlow Condensed + Inter, CSS değişkeniyle değiştirilebilir.

## Bulunan hatalar ve çözümleri

- Süperelipsin açı parametrizasyonu eksen uçlarında tekil → eksen geçen bloklarda koltuklar
  üst üste biniyordu. Kutupsal parametreye geçildi, yan örnekleme yay uzunluğuna göre yapılıyor.
- `node --experimental-strip-types` parametre özelliklerini (constructor `readonly x`) desteklemiyor
  → açık alan tanımına çevrildi.
- three `Sky` gölgelendiricisi `z = w` ile uzak düzleme sabitleniyor; ters derinlikte en yakın değer
  olduğundan gökyüzü her şeyi örtüyordu → gölgelendirici yamalandı (depthTest kapalı, renderOrder −10),
  gece gökyüzü aynı gölgelendiriciye karıştırıldı.
- 100 m'lik uzak arazi ağı stadyum çukurunun üstünden geçip sahayı örtüyordu → stadyum çevresindeki
  parçalar sabitlendi (asla boşaltılmaz), uzak arazi orada 60 m aşağıda.
- Su düzleminde (60 km) UV türevleri teğet uzayı için çok küçük → çizgili parlama; normal dünya
  uzayında hesaplanıyor.
- Vertex-color'lu taş malzemesi renk özniteliği olmayan kutulara uygulanınca siyah görünüyordu
  (Eski Açık kuleleri) → `stonePlain`.
- Vite 8 (rolldown) `manualChunks` için fonksiyon istiyor.

## Düzeltilmesi gerekenler / açık konular

- Kapasite modeli 41.154 (resmî 42.684, −%3.6). Resmî plan gelirse sıra sayıları ayarlanmalı.
- Overpass API bu ortamda çalışmıyor; OSM verisi doğrudan `api.openstreetmap.org/api/0.6/map` ile alındı.
- Wikimedia API'si oran sınırlı (429); fotoğraflar tek tek indirildi.

## Sıradaki işlem

STEP 02: `src/camera/views.ts` — adlandırılmış sabit görünümler (konum/hedef/FOV), görünüm seçici,
malzeme ve ışık iyileştirmeleri (zemin rengi soğuk/mavimsi, binalar soluk, cam yansımaları,
su tonu, gölge yumuşaklığı), görüntülerin aynı geometriden geldiğinin testi.

Bilinen görsel eksikler (STEP 02'de ele alınacak):
- Zemin dokusu gündüz mavimsi-gri görünüyor (gökyüzü ışığı); daha sıcak/koyu ve dokulu olmalı.
- Ağaçlar hâlâ düşük poligon; uzaktan iyi, yakında oyuncak gibi.
- Bina cepheleri çok açık; pencere ızgarası uzakta gürültü yapıyor (filtrelenmeli).
- Batı tarafı gerçekte istinat duvarlarıyla ~30 m yüksek; modelde 60 m'lik eğimli geçiş var.

## Nasıl çalıştırılır

```bash
cd tupras-stadyumu
npm install
npm run dev        # http://localhost:5173
npm test           # koltuk yerleşim testleri
npm run build      # üretim derlemesi (dist/)
```

Dünya verisini yeniden üretmek (gerekirse):

```bash
bash scripts/fetch_osm.sh .raw          # OSM karoları
python3 -I scripts/fetch_dem.py .raw    # SRTM ızgaraları (opentopodata, ~5 dk)
python3 -I scripts/build_world.py .raw public/data
```
