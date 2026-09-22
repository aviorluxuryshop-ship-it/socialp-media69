# GAZA — sinematik 3D ürün deneyimi

Vite + React + TypeScript + React Three Fiber + drei + GSAP/ScrollTrigger + Lenis + Tailwind.

## Çalıştırma

```bash
npm install
npm run dev
```

## Yapı

- `src/lib/canGeometry.ts` — kutunun gerçek 3D geometrisi (lathe profili: gövde, omuz, kapak; bead'ler; açma halkası).
- `src/lib/canLabelTexture.ts` — etiket dokusu. `public/textures/` altına `onden.jpg`, `arkadan.jpg`, `sagdan.jpg`, `soldan.jpg` eklenirse gerçek ambalaj görselini kullanır; yoksa markanın kendi metniyle (GAZA / Portakallı ve Çay Aromalı İçecek / 330 ml) yer tutucu bir etiket çizer — uydurma logo yok.
- `src/lib/timeline.ts` — scroll ilerlemesine göre kamera/ışık/kutu dönüşü keyframe'leri. Tüm sahne koreografisi burada, tek yerde.
- `src/components/canvas/` — Three.js/R3F sahnesi (ProductScene, ProductModel).
- `src/components/sections/` — sayfadaki metin blokları (Hero, Discover, 360, Macro, Aroma, Final).
- `src/hooks/useLenisScroll.ts` — Lenis + GSAP ScrollTrigger kurulumu; tek bir scroll ilerleme değeri üretir.

## Notlar

- WebGL desteklenmeyen tarayıcılarda `StaticFallback` devreye girer.
- Mobilde DPR ve gölge kalitesi otomatik düşürülür (`ExperienceCanvas`).
- Kargo/lojistik/sipariş bölümleri yok — sadece ürün, 3D kutu, aroma ve marka deneyimi.
