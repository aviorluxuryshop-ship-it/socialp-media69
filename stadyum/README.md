# Arena Bilet (adım 1: 3D stadyum dış görünüm)

Vite + vanilla JS + three.js ile hazırlanmış, prosedürel stadyum ve gün ışığı sahnesi.

## Çalıştırma

```bash
cd stadyum
npm install
npm run dev       # geliştirme sunucusu
npm run build     # üretim derlemesi (dist/)
npm run preview   # derlemeyi yerelde önizle
```

## Test parametreleri

- `?saat=21` veya `?saat=17.5` / `?saat=6:30`: gün ışığı saatini zorlar (varsayılan: kullanıcının yerel saati, dakikada bir güncellenir).
- `?kalite=low` veya `?kalite=high`: kalite profilini zorlar (varsayılan cihaza göre otomatik).

## Yapı

- `src/main.js` başlatma, render döngüsü, OrbitControls
- `src/scene/stadium.js` tribün, çatı, cephe, saha, ışık kuleleri
- `src/scene/environment.js` gökyüzü, zemin, su, şehir
- `src/scene/lighting.js` gün saatine göre ışık/renk
- `src/data/sections.js` 9 bölüm tanımı (id, ad, kapasite, fiyat, kamera noktası)
- `src/state.js`, `src/app.js`, `src/flow.js` durum, ortak erişim, `onBuyTicket` kancası
- `src/ui/overlay.js`, `src/style.css` arayüz
