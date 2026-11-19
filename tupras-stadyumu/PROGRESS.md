# PROGRESS — Tüpraş Stadyumu 3D Deneyimi

> Bu dosya her önemli adımdan sonra güncellenir. Çalışma kesilirse buradan devam edilir.
> Projeyi baştan başlatma, mevcut kodu silme.

## Durum özeti

| Aşama | Durum |
| --- | --- |
| 0. Araştırma (mimari, çevre, kimlik) | ✅ Tamamlandı — `docs/RESEARCH.md` |
| Veri hattı (OSM + SRTM → `public/data`) | ✅ Tamamlandı — `scripts/build_world.py` |
| Koltuk yerleşim motoru (saf veri) | ✅ Tamamlandı, testler geçiyor — `src/stadium/layout.ts` |
| STEP 01 – Stadium in code | 🟡 Devam ediyor |
| STEP 02 – Every view camera locked | ⏳ Bekliyor |
| STEP 03 – Clips start and end | ⏳ Bekliyor |
| STEP 04 – Choice in post (maske/vurgu) | ⏳ Bekliyor |
| STEP 05 – Pick your seat, get the ticket | ⏳ Bekliyor |
| Gece–gündüz / güneş sistemi | ⏳ Bekliyor |
| Dinamik yükleme / performans | ⏳ Bekliyor |

## Devam eden aşama

**STEP 01** — Three.js sahnesi: tribün betonu (blok blok), InstancedMesh koltuklar,
çatı, cephe, saha, Eski Açık, arazi, şehir, Boğaz.

## Tamamlanan dosyalar

- `docs/RESEARCH.md` — kaynaklı mimari notlar, blok numaralandırma gerekçesi
- `scripts/build_world.py` — OSM karoları + SRTM ızgaraları → `public/data/{world.json,terrain.bin,coast.bin}`
- `src/stadium/shape.ts` — süperelips (kutupsal parametre), yay uzunluğu tablosu
- `src/stadium/config.ts` — tüm ölçüler, kesit profilleri, blok/sektör tanımları, kategoriler
- `src/stadium/layout.ts` — blok/sıra/koltuk üretimi (41.154 koltuk, 147 loca)
- `scripts/test-logic.ts` — yerleşim testleri (`npm test`)
- `src/core/quality.ts` — cihaz kalite kademeleri
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

## Düzeltilmesi gerekenler / açık konular

- Kapasite modeli 41.154 (resmî 42.684, −%3.6). Resmî plan gelirse sıra sayıları ayarlanmalı.
- Overpass API bu ortamda çalışmıyor; OSM verisi doğrudan `api.openstreetmap.org/api/0.6/map` ile alındı.
- Wikimedia API'si oran sınırlı (429); fotoğraflar tek tek indirildi.

## Sıradaki işlem

STEP 01: `src/core/renderer.ts`, `src/stadium/bowl.ts` (beton basamaklar, kusmalar, localar),
`src/stadium/seats.ts` (InstancedMesh, LOD), çatı, cephe, saha; ardından arazi + şehir.

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
