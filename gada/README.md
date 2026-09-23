# GADA — ürün sitesi

Tek sayfalık, scroll'a bağlı bir ürün sitesi: gerçek 3D GADA kutusu (Limon ve
Şeftali), hamburger menü, ve aralarında canlı geçiş yapılan bir aroma seçici.
Vite + React + TypeScript + React Three Fiber + drei + GSAP ScrollTrigger + Lenis + Tailwind.

```bash
npm install
npm run dev        # geliştirme
npm run build      # üretim çıktısı: dist/
npm run preview    # üretim çıktısını yerelde aç
npm run textures   # media-source/ altındaki 4-görünüm fotoğraflarını yeniden işler
```

## Ürün görselleri, gerçek

Kutunun üzerindeki her şey — logo, meyve görseli, besin değerleri, barkod,
üretici bilgisi — istemcinin kendi ürün fotoğraflarından. Hiçbir metin veya
görsel uydurulmadı.

`media-source/limon-4-gorunum.jpg` ve `media-source/seftali-4-gorunum.jpg`:
her biri ÖN · ARKA · SAĞ · SOL sırasıyla dört görünümü yan yana gösteren birer
sayfa. `npm run textures` (`scripts/prepare-textures.mjs`) bunları otomatik olarak:

1. `public/textures/<aroma>/<görünüm>.jpg` — kutunun gövdesine sıkıca kırpılmış,
   stüdyo gölgelendirmesi düzleştirilmiş (3D'nin kendi ışığı zaten gölge katıyor).
   `canLabelTexture.ts` bunları silindire açar: her dokusu, yüzeyin o açıdaki
   gerçek görüntüsünden örneklenir, komşu görünümler yumuşak geçişle birleşir.
2. `public/products/<aroma>-<görünüm>.webp` — 2D kullanım için orijinal fotoğraflar.
3. `src/lib/photo-metrics.json` — ölçülen kutu oranı (yükseklik/genişlik) ve
   her aromanın baskı rengi; 3D kutunun siluetini ve `content/products.ts`'teki
   renkleri buradan besler.

Yeni bir aroma eklemek: sayfayı `media-source/`'a ekleyin, `content/products.ts`'e
girişini yazın (metinler kutudan birebir), `FLAVOR_ORDER`'a ekleyin, `npm run textures` çalıştırın.

## Yapı

| Dosya | Görevi |
| --- | --- |
| `src/content/products.ts` | Kutulardan transkript edilen tüm metin: isim, iddia, içindekiler, besin değeri, üretici. |
| `src/state/flavor.ts` | Hangi aromanın ekranda olduğu — 3D katman ve aroma seçici buradan okur/yazar. |
| `src/lib/scenes.ts` | Sahne sırası ve yükseklikleri. Hem sayfa hem 3D zaman çizelgesi buradan okur. |
| `src/lib/timeline.ts` | Scroll'a göre kamera, kutu dönüşü, ışık, glow, aroma, DOF keyframe'leri. **Koreografinin tamamı burada.** |
| `src/lib/canGeometry.ts` | Kutunun gerçek geometrisi (fotoğraflardan ölçülen oranla): taban, baskılı gövde, jant + kapak, açma halkası. |
| `src/lib/canLabelTexture.ts` | Aromanın 4 fotoğrafını silindire saran etiket dokusu + mürekkep/metal yüzey haritası. |
| `src/components/canvas/ProductScene.tsx` | Işık düzeni, responsive kadraj, açılış animasyonu, sönümleme (`SCENE` ayarları). |
| `src/components/canvas/ProductModel.tsx` | Kutu mesh'leri ve malzemeler (`CAN_MATERIAL`). |
| `src/components/canvas/AromaAccents.tsx` | Aroma sahnesindeki meyve dilimleri, yapraklar, parçacıklar (limon/şeftali). |
| `src/components/canvas/Effects.tsx` | Masaüstü: alan derinliği (DOF), vinyet, ton eşleme. |
| `src/components/SiteNav.tsx` | Sabit üst bar + hamburger menünün açtığı tam ekran gezinme. |
| `src/components/sections/SceneFlavors.tsx` | Aroma seçici — tıklanınca `state/flavor.ts`'i günceller. |
| `src/components/sections/SceneBrand.tsx` | Referans sitedeki kargo/sipariş akışının yerini alan özgün marka bölümü. |
| `src/hooks/useLenisScroll.ts` | Lenis + ScrollTrigger → tek bir 0..1 scroll ilerlemesi. |

Kolay ayarlanabilir değerler: kamera konumu/uzaklığı ve kutu dönüşü (`timeline.ts`),
ışık şiddetleri (`timeline.ts` + `ProductScene` içindeki ışıklar), sönümleme/intro (`SCENE`),
kutu ölçüleri (`canGeometry.ts`), malzeme (`CAN_MATERIAL`, `LABEL_FINISH`), DOF (`DOF`).

## Performans

- 3D katman ayrı chunk olarak yüklenir; metin ve menü önce görünür.
- Masaüstü: DPR ≤ 1.75, FPS düşerse otomatik 1'e iner; DOF ve contact shadow sadece burada.
- Mobil: DPR ≤ 1.5, düşük segment, gölge yerine hazır yumuşak gölge, post-processing indirilmez,
  sahne sadece scroll sırasında çizilir (`frameloop="demand"`), dokunmatik scroll native kalır.
- WebGL yoksa veya 3D hata verirse `StaticFallback` gösterilir; sayfa hiçbir zaman boş kalmaz.
- `prefers-reduced-motion`: açılış animasyonu ve süzülme kapanır, scroll yine çalışır.

## Test / kontrol

URL'ye `?snap` eklenirse kamera sönümlemesiz doğrudan hedef kareye gider (keyframe kontrolü ve ekran görüntüsü için).

## Yayına alma

Vercel'de yeni proje olarak içe aktarın, **Root Directory: `gada`** seçin; Vite otomatik algılanır
(build: `npm run build`, output: `dist`).
