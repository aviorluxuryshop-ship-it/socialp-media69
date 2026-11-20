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
| STEP 05 – Pick your seat, get the ticket | 🟡 Masaüstü + mobil uçtan uca akış hatasız; son görsel tur sürüyor |
| Gece–gündüz / güneş sistemi | 🟡 Temel hazır (güneş hesabı, gece ışıkları); ince ayar STEP 02 ile |
| Dinamik yükleme / performans | 🟡 Bakış yönüne göre kırpma + koni akışı eklendi ve ölçüldü; mobil bütçe ayarı bekliyor |

## Devam eden aşama

**STEP 05** — tribün → blok → sıra → koltuk seçim akışı, fare ile koltuk vurgusu + fiyat,
koltuğa uçuş, koltuktan görüş, dijital bilet (koltuğun gerçek görüş görüntüsüyle), VIP ve Loca
seçenekleri, mobil + masaüstü testleri.

## Bakış yönüne göre kırpma (kullanıcı isteği, "Subway Surfers" mantığı)

- Büyük statik stadyum ağları (basamaklar, membran, loca bandı, çatı çeliği, cephe, alt yüzey…)
  12 açısal sektöre bölündü (`src/core/split.ts`); uzak arazi ve uzak şehir 16 sektöre. Arkada
  kalan sektörler görüş konisi kırpmasıyla çizilmez, dönünce anında geri gelir.
- Şehir parçaları: kameraya 450 m içindekiler her yönde yüklü; ötesinde yalnızca bakış konisi
  (+0.6 rad pay) içindekiler yüklenir/önceliklenir; koninin dışında 2.5 s kalan parçalar boşaltılıp
  havuza iade edilir (stadyum çevresindeki sabit parçalar yalnızca ağaç/lambalarını bırakır).
- Koltuk LOD: yakın detaylı (~34 üçgen, kademeye göre 18–34 m), orta 10 üçgen, 150 m ötesi yalnızca
  sırtlık (2 üçgen). Koltuk gölgesi yalnızca 12 m içindeki bloklarda.
- Ölçüm (800×450, medium): Batı üst koltuktan sahaya bakış ana geçiş 898 bin + gölge 289 bin üçgen
  (önce 1.38 M + 1.21 M); aynı koltukta arkaya bakış 215 bin; havadan stadyuma bakış 454 bin,
  stadyuma sırtını dönünce 129 bin. Çizim çağrısı 480 → 180 (arkaya bakış).

## STEP 05 doğrulaması (uçtan uca akış, `scripts/flow.mjs`)

Gerçek DOM tıklamalarıyla tam akış (960×540, `?fast&q=medium&msaa=0`), konsol hatası: **yok**.
Giriş → "Koltuk Seç" → Batı tribünü (üzerine gelince tüm tribün turuncu) → Blok 416 → Sıra 12 →
koltuk üzerine gelme (fiyat ipucu) → koltuğa uçuş → koltuktan görünüm → dijital bilet (koltuğun
gerçek 3D görüntüsü) → "Bileti Al" → Onaylandı → sağ koltuk (kamera 0.47 m kaydı) → VIP → Localar.

Bu turda bulunup düzeltilenler:
- **Vurgu rengi koltuktan koltuğa değişiyordu.** Siyah koltuğun albedo'su çok küçük olduğundan
  parlama payı "ışık ÷ albedo" hesabını şişiriyor, siyah koltuklar parlak turuncu, beyazlar kiremit
  rengi çıkıyordu. Vurgulanan bloklar artık ana çizimde tek tip nötr (beyaz) albedo ile çiziliyor
  (`SeatSystem.setNeutralBlocks`), turuncu yeniden aydınlatma her koltukta aynı doğrulukta. Güneşe
  sırtı dönük tarafta da turuncu okunsun diye ışık/gölge sırası korunarak yumuşak bir eğri eklendi.
- **Açılış kamerası** Süzer Plaza'yı stadın önüne koyuyordu → Gümüşsuyu üstünden yeni açı; dikey
  ekranda stat giriş kartının üstünde kalacak ayrı çerçeve.
- **Bilet** 540 px yükseklikte üstten kesiliyordu → taşınca üstten kaydırılıyor; kısa yatay
  ekranlarda görüntü solda, bilgiler sağda geniş bilet düzeni.
- Masaüstünde görünüm çubuğu koltuk panelinin altına giriyordu → panelin solundaki alana ortalanıyor.
- Tamamen satılmış localar/bloklar listede tıklanabiliyordu → "satıldı"/"dolu" olarak kapalı.
- **Mobil (iPhone 13 emülasyonu) akış da hatasız.** Bulunanlar: alt panel ekranın yarısını
  kapladığı için koltuktan görünümde saha panelin altında kalıyordu → kamera pozu değişmeden
  "lens kaydırma" (off-axis projeksiyon, `Engine.setLensShift`): görüntünün merkezi panelin boş
  bıraktığı alana taşınıyor (masaüstünde yan panelin solu, telefonda alt panelin üstü). GPU seçimi
  ve maske kaydırmayla birlikte çalışıyor; bilet görüntüsü kaydırmasız, ortalı çekiliyor.
  Üst bardaki marka yazısı alt satıra kırılıyordu → dar ekran boyutları; kısa telefonlarda giriş
  kartı sadeleşti, dikey açılış açısı stadı kartın üstüne alıyor.
- **Tribün seçimi artık stadyum planı gibi:** "Koltuk Seç" kamerayı kuşbakışına uçuruyor, çatı
  membranı yarı saydam oluyor (gölgesi kalır; ID geçişi saydam malzemeyi atladığı için koltuklar
  çatının altından da seçilebiliyor). Böylece dört tribün de görünüyor ve kartın üzerine gelince
  tribün stadyumda turuncu yanıyor. Bloğa inerken çatı yeniden katılaşıyor.

## Kare süresi yöneticisi (performans bütçesi, `src/core/governor.ts`)

- Gerçek kare aralığını (rAF → rAF, GPU'nun yetişemediği kareler dahil) 90 karelik pencerelerle
  ölçer; ortalama 20 ms'yi (≈50 fps) aşarsa kaliteyi tek tek düşürür: piksel oranı (2 → 1.6 → 1),
  gece bloom'u, gölge haritası (yarıya), detay yarıçapları (koltuk/şehir), son çare piksel oranı 0.8.
- Adım işe yaramıyorsa (ör. 30 Hz'e kilitli düşük güç modu) ardışık 3 adım sonra hepsini geri alır
  ve düşürmeyi bırakır; kareler rahat hızlıysa adımları tek tek geri verir, bekleme süresi her
  seferinde ikiye katlanır, 3 başarısız denemeden sonra yükseltme kalıcı olarak durur.
- Stadyum ve koltuk verisine dokunmaz; yalnızca çizim kalitesini değiştirir. Otomatik testlerde
  (`?q=`, `?fast`, webdriver) kapalıdır; `?gov` ile zorla açılır.
- `scripts/test-governor.ts`: sentetik cihazlar (yavaş 2× GPU, 1× yavaş GPU, 30 Hz ekran, hızlı
  cihaz, sınırda cihaz) — hepsi geçiyor.

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

STEP 05 durumu: `src/ui/picker.ts` (giriş kartı, tribün/blok/sıra/koltuk paneli, mobilde alt sayfa,
VIP ve Loca yolları, 3D üzerine gelme ipucu + fiyat, 3D tıklama ile seçim, sol/sağ koltuk),
`src/ui/ticket.ts` (koltuğun gerçek görüşüyle dijital bilet, PNG indirme, örnek "Bileti Al"),
`src/ui/format.ts`, sıra vurgusu ve tribün grubu vurgusu (`setHoverSet`), koltukta etrafa bakma
(`director.seatLook`). Tip denetimi, `npm test` ve üretim derlemesi geçiyor.

**Yapılacak (sıradaki oturum):**
1. `node scripts/flow.mjs <dir> 960 540` ile uçtan uca akış testini tamamla (yarıda kaldı); hataları düzelt.
2. Mobil test: `node scripts/flow.mjs <dir> 0 0 mobile` (iPhone 13 emülasyonu).
3. Gece–gündüz son kontrolü, performans bütçeleri (kademe başına çizim çağrısı/üçgen, gölge boyutu).
4. PROGRESS.md son hali.

Not: bu ortamda tarayıcı yazılım GPU'su (SwiftShader) kullanıyor; kare başına 1–2 s sürüyor
(ana iş parçacığı 6–12 ms). Gerçek GPU performansını göstermez. Test parametreleri:
`?fast` (uçuşlar 5× hızlı), `?msaa=0`, `?nopost` (teşhis).

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
