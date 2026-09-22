# GAZA — sinematik 3D ürün deneyimi

Scroll'a bağlı, gerçek 3D GAZA kutusu olan tek sayfalık ürün tanıtım sitesi.
Vite + React + TypeScript + React Three Fiber + drei + GSAP ScrollTrigger + Lenis + Tailwind.

```bash
npm install
npm run dev        # geliştirme
npm run build      # üretim çıktısı: dist/
npm run preview    # üretim çıktısını yerelde aç
```

## Gerçek ambalaj görselleri

Şu an kutunun üzerindeki etiket **yer tutucudur**: yalnızca markanın kendi metni
(GAZA / Portakallı ve Çay Aromalı İçecek / 330 ml) ve turuncusu kullanılır;
uydurma logo, besin değeri veya içerik yazısı yoktur.

Gerçek ambalaj için `public/textures/` klasörüne 4 fotoğrafı ekleyin:

| Dosya | Açı |
| --- | --- |
| `onden.jpg` | Önden |
| `sagdan.jpg` | Sağdan (öne bakarken sağ taraf) |
| `arkadan.jpg` | Arkadan |
| `soldan.jpg` | Soldan |

Her fotoğrafı kutunun sağ–sol kenarlarından ve üst jant–alt taban hizasından sıkıca kırpın,
düz karşıdan çekilmiş olsun. Kod değişikliği gerekmez: dördü de bulunursa
`src/lib/canLabelTexture.ts` onları silindire açarak (her sütun, yüzeyin o açıdaki
görüntüsünden örneklenir) tek bir etiket dokusu hâlinde birleştirir, ek yerlerini yumuşak geçişle kapatır.

## Yapı

| Dosya | Görevi |
| --- | --- |
| `src/lib/scenes.ts` | Sahne sırası ve yükseklikleri. Hem sayfa hem 3D zaman çizelgesi buradan okur. |
| `src/lib/timeline.ts` | Scroll'a göre kamera, kutu dönüşü, ışık, glow, aroma, DOF keyframe'leri. **Koreografinin tamamı burada.** |
| `src/lib/canGeometry.ts` | Kutunun gerçek geometrisi: taban, baskılı gövde, jant + kapak, açma halkası. Oranlar isimli sabitler. |
| `src/lib/canLabelTexture.ts` | Etiket dokusu + mürekkep/metal yüzey haritası (beyaz mürekkep mat, turuncu metalik). |
| `src/components/canvas/ProductScene.tsx` | Işık düzeni, responsive kadraj, açılış animasyonu, sönümleme (`SCENE` ayarları). |
| `src/components/canvas/ProductModel.tsx` | Kutu mesh'leri ve malzemeler (`CAN_MATERIAL`). |
| `src/components/canvas/AromaAccents.tsx` | Aroma sahnesindeki portakal dilimleri, yapraklar, parçacıklar. |
| `src/components/canvas/Effects.tsx` | Masaüstü: alan derinliği (DOF), vinyet, ton eşleme. |
| `src/components/sections/` | Sayfadaki metin blokları (Hero, Keşfet, 360°, Yakın Plan, Aroma, Final). |
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

Vercel'de yeni proje olarak içe aktarın, **Root Directory: `gaza`** seçin; Vite otomatik algılanır
(build: `npm run build`, output: `dist`).
