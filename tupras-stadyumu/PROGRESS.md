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
| STEP 02 – Every view camera locked | ✅ Tamamlandı — 7 kilitli görünüm, geometri özdeşliği testle kanıtlandı |
| STEP 03 – Clips start and end | ✅ Tamamlandı — 118 uçuş otomatik testten geçiyor |
| STEP 04 – Choice in post (maske/vurgu) | ✅ Tamamlandı — maske ↔ koltuk verisi otomatik doğrulandı |
| STEP 05 – Pick your seat, get the ticket | 🟡 Sıradaki |
| Gece–gündüz / güneş sistemi | 🟡 Temel hazır (güneş hesabı, gece ışıkları); ince ayar STEP 02 ile |
| Dinamik yükleme / performans | 🟡 Parça akışı + havuz + LOD çalışıyor; ölçüm/ayar bekliyor |

## Devam eden aşama

**STEP 05** — tribün → blok → sıra → koltuk seçim akışı, fare ile koltuk vurgusu + fiyat,
koltuğa uçuş, koltuktan görüş, dijital bilet (koltuğun gerçek görüş görüntüsüyle), VIP ve Loca
seçenekleri, mobil + masaüstü testleri.

## STEP 04 doğrulaması

- `src/selection/idpass.ts`: aynı sahne, aynı kamera; koltuklar `gl_InstanceID` ile kendi
  kimliğini, basamaklar blok kimliğini 24-bit RGB'ye yazar; geri kalan yalnızca örtücü.
  Aynı geçiş 1×1 pencereyle GPU seçimi için kullanılır.
- `src/selection/highlight.ts`: son işlemde (ton eşlemeden önce, doğrusal HDR) seçili bloğun
  koltukları turuncu. Piksel parlaklığı o koltuğun gerçek albedosuna bölünüp (siyah/beyaz/VIP)
  turuncu albedoyla çarpılır → ışık, gölge, örtülme korunur; yansımalar (speküler) üstte tutulur.
  Seçili blokta ince kontur; satılmış koltuklar (müsaitlik modu) gri kalır. Maske modu: seçili
  blok kırmızı.
- `scripts/verify-mask.mjs`: 4 görünüm × 17 blok: maske saflığı her durumda %100 (seçili bloğa
  atfedilen her maske pikseli o bloğun koltuğu); görünür koltuk merkezlerinde tam koltuk kimliği
  %96.5–100 (uzak sığ açılarda komşu koltuk), betona düşme < %6.
- Hatalar: ShaderPass uniform'ları klonladığı için render target dokusu `null` oluyordu (maske
  siyah) → dokular geçiş oluşturulduktan sonra bağlanıyor; GLSL3'te `gl_FragColor` yok → açık çıktı.
- Görseller: `docs/screens/step04-*.jpg`.

## STEP 03 doğrulaması

- `src/camera/clips.ts`: uçuş = anahtar kare zinciri. Kareler: Üstten → Yaklaşma (çatı açıklığı
  üstü) → Tribüne iniş → Bloğa yaklaşma → Dönüş (bakış tribün boyunca yana süpürülür, kameranın
  içinden geçmez) → Süzülme → Koltuğa varış. Bir klibin son karesi = sonrakinin ilk karesi.
- Konum/hedef: merkezcil Catmull-Rom; klip içi yay uzunluğu parametrizasyonu; zaman eşlemesi
  quintic Hermite (düğümlerde hız sürekli, ivme 0 → C2). Süreler mesafe, dönüş açısı, irtifaya
  bağlı hız sınırı ve klip ivme profiline göre yinelemeli çözülür.
- Rota kuralları: bowl'a giriş/çıkış yalnızca çatı açıklığından; üst kata giriş/çıkış iç kafesin
  altından; localardan önce üst kat çıkıntısının dışına; yakın koltuk değişimi sahaya bakarak kayma.
- `scripts/test-clips.ts` (`npm run test:clips`): 56 blok + 13 loca + 7 koltuk→koltuk + 42
  görünüm→görünüm = 118 uçuş, 60 fps örnekleme: başlangıç/bitiş tam, klip sınırları tam, çarpışma yok
  (çatı alt yüzeyi, tribün betonu, üst kat döşemesi, localar), hız ≤ irtifa sınırı, dönüş ≤ 2.6°/kare,
  ivme sıçraması ≤ 25 m/s²/kare. Sonuç: maks. 2.41°/kare, 11.4 m/s²/kare, süreler 2.7–14.7 s.
- Görseller: `docs/screens/step03-*.jpg` (havadan koltuk 416'ya, koltuktan koltuğa film şeritleri).

## STEP 02 doğrulaması

- 7 kilitli görünüm (`src/camera/views.ts`): Üstten, Dış Cephe, Uzun Tribün (Batı Üst · 416),
  Kale Arkası (Kuzey Alt), VIP Loca (Batı ortası, Loca 74), Çatı, Boğaz. Koltuk görünümleri
  gerçek bir koltuğun göz noktasından (yerleşim verisinden) türetilir; kusma tüneli önündeki
  sıralar otomatik atlanır.
- **Geometri özdeşliği testi**: `?pass=normal` (yalnızca yüzey normalleri, ışıksız) ile her görünüm
  11:00 ve 22:00'de çizildi → 7/7 görünümde %0.000 fark, maks. piksel farkı 0
  (`node scripts/views.mjs <dir> "11:00,22:00" "q=high&pass=normal"` +
  `python3 -I scripts/compare_views.py <dir> 1100 2200`).
- Gerçekçilik: yansıtıcı malzemelere (cam, su) ayrı ortam haritası; dağınık gökyüzü ışığı güneşin
  ~1/4'ü; gölge kutusu bakılan yere odaklanıyor ve ışık uzayında dokuya hizalı (titremesiz);
  zeminde dünya-uzayı detay dokusu; bina pencereleri ekran-uzayında filtreli; gece stadyum içinde
  pozlama uyumu; yalnızca gerçek ışık kaynakları bloom alıyor; sokak lambası noktaları sınırlı.
- Görseller: `docs/screens/step02-*.jpg`.

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
- `src/app.ts` — uygulama kökü (sahne, dünya, atmosfer, son işlem, kamera, kare döngüsü)
- `src/core/post.ts` — son işlem: MSAA HDR hedef → bloom (gece, yüksek kademe) → ton eşleme
- `src/camera/{views,director}.ts` — kilitli görünümler, kamera yönetimi (serbest/kilitli)
- `src/ui/viewsBar.ts` — görünüm çubuğu
- `scripts/views.mjs`, `scripts/compare_views.py` — görünüm çıktıları ve geometri özdeşlik testi
- `src/camera/clips.ts` — uçuş planlayıcı + oynatıcı; `scripts/test-clips.ts`, `scripts/filmstrip.mjs`
- `src/selection/{idpass,highlight,selection}.ts` — maske/ID geçişi, vurgu birleştirme, seçim ve GPU seçimi;
  `scripts/verify-mask.mjs` (test parametreleri: `?block=416`, `?mask`, `?sold`)
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
- Bina gölgelendiricisinde `if` bloğu içindeki `cell` dışarıdan kullanılıyordu → derleme hatası,
  binalar çizilmiyordu (STEP 01 son gece ayarında girmişti). Düzeltildi; görünüm betiği artık
  konsol hatalarını basıyor.
- `scene.environmentIntensity`, kendi `envMap`'i olmayan malzemelerde `envMapIntensity`'yi ezer →
  cam/su için ortam haritası açıkça atanıyor.
- Gece iç görünümler bloom yüzünden beyaza patlıyordu → eşik 2.2 (HDR), stadyum içinde pozlama kısılıyor.

## Düzeltilmesi gerekenler / açık konular

- Kapasite modeli 41.154 (resmî 42.684, −%3.6). Resmî plan gelirse sıra sayıları ayarlanmalı.
- Overpass API bu ortamda çalışmıyor; OSM verisi doğrudan `api.openstreetmap.org/api/0.6/map` ile alındı.
- Wikimedia API'si oran sınırlı (429); fotoğraflar tek tek indirildi.

## Sıradaki işlem

STEP 05: `src/ui/picker.ts` (tribün/blok/sıra/koltuk paneli, mobil alt sayfa), `src/ui/ticket.ts`
(dijital bilet, koltuğun görüşü offscreen render), seçim akışını uçuşlara bağlama
(tribün → standFrame, blok → blockFrame, koltuk → seat), hover fiyat etiketi, VIP/Loca kısayolları.

Bilinen görsel eksikler (sonra ele alınabilir):
- Ağaçlar düşük poligon; yakında oyuncak gibi.
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
