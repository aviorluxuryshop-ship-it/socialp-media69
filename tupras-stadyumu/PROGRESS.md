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
| STEP 05 – Pick your seat, get the ticket | ✅ Kullanıcı geri bildirimiyle yeniden kuruldu: tek buton → stadın içi → bölge → koltuk → görüş + fiyat |
| Gece–gündüz / güneş sistemi | ✅ Tamamlandı — gerçek güneş konumu, kesintisiz gün akışı doğrulandı |
| Dinamik yükleme / performans | ✅ Bakış yönü kırpma, koni akışı, havuz, LOD + çalışma anı kare süresi yöneticisi |

## Devam eden aşama

Kullanıcının yeni akışı gözden geçirmesi; ardından "gerisini sonra hallederiz" dediği ayrıntılar.

## Koltuk seçimi geri bildirimi (20 Kasım, 2. tur)

- **Yakınlaştırma:** bölge görünümünde bir koltuk ekranda ~7 px'ti. Tribüne ilk dokunuş o noktaya
  yakınlaştırıyor (`seatCloseFrame`, clips.ts): koltuk masaüstünde ~40 px, telefonda ~44 px oluyor;
  ikinci dokunuş koltuğu seçiyor. Tekerlek / iki parmakla görüş açısı (FOV 16–72°) değiştirilebiliyor.
  Kural: dokunulan koltuk ekranda 26 px'ten darsa önce yakınlaştır (`TAP_SEAT_PX`).
- **Adım çipleri tıklanabilir:** Bölge · Koltuk · Görüş artık butonlar; geri oku kaldırıldı.
  "Koltuk" bölge görünümüne (yakınlaştırmadan da) döner, "Görüş" son bakılan koltuğa (hâlâ boşsa).
- **Netlik:** piksel oranı tavanı yükseltildi (yüksek/orta: cihaz, en çok 2×; düşük: 1.75×), gölge
  haritası orta 4096 / düşük 2048. Kare süresi yöneticisi artık önce detay, gece parlaması ve gölgeyi
  düşürüyor; çözünürlüğü en son ve yüksek yoğunluklu ekranda 1.25×'in altına hiç indirmiyor; ancak
  ~35 fps'in altında devreye giriyor (`slowMs 28`).
- **Boş koltuklar:** seçim adımlarında boş koltuk parlak yeşil ve kendinden ışıklı (gölgede, çatı
  altında, gecede okunuyor), satılmış koltuk koyu antrasit. Siyah-beyaz maç günü deseniyle
  karışmasın diye yeşil seçildi. Koltuk seçerken blok turuncuya boyanmıyor; yalnızca imleçteki koltuk.
- **Canlı satış** (`src/net/liveSeats.ts`): bir koltuk alındığında diğer ziyaretçilerde anında koyu
  olur, 1.8 s kırmızı yanıp söner ve üstte "Az önce satıldı …" bildirimi çıkar. Bakılan koltuk başkası
  tarafından alınırsa panel uyarır, bilet butonu kapanır. Aynı koltuğu iki kişi aynı anda alamaz:
  ilk yazan kazanır, ikinciye "başka bir taraftar aldı" denir.
  - Aynı tarayıcının sekmeleri arasında BroadcastChannel ile şimdiden çalışıyor (test: iki sekme).
  - Cihazlar arası için Firebase Realtime Database (REST + SSE, SDK yok) hazır; `VITE_SEAT_DB_URL`
    ortam değişkeni (veya test için `?db=<url>`) verilince açılıyor. Kurallar:
    `{"rules":{"sales":{".read":true,"$seat":{".write":"!data.exists() && newData.exists()",".validate":"newData.hasChildren(['t']) && $seat.matches(/^s[0-9]{1,6}$/)"}}}}`
    **Açık:** kullanıcının ücretsiz bir Firebase projesi açıp veritabanı adresini vermesi gerekiyor.
- **Kompakt panel:** masaüstünde 320 px ve içerik kadar yüksek; telefonda en çok %46. Görüş adımı tek
  satır kart (bölge · blok, sıra · koltuk, fiyat, ‹ › komşu koltuk) + "Bileti Gör".
- **Giriş:** başlık ve metin kaldırıldı; yalnızca altta ortada küçük "Koltuk Seç" butonu.
- **Eski Açık kolonadı** ("stattan ayrık sur gibi"): OSM hilalinden çizilen çember yayı stadın ~15 m
  dışında duruyordu. Artık cephe eğrisinin (OUTER_CURVE) 1.6 m dışından onu sararak gidiyor; kuleler
  ve kapı da eğriye oturuyor.
- Doğrulama: `scripts/flow.mjs` masaüstü 960×540 Doğu Alt ve iPhone 13 Kuzey Alt: yakınlaştır → koltuk
  → bilet al → ikinci sekme koltuğu satılmış görüyor → aynı koltuğa ikinci alım "taken" → çipler;
  konsol hatası yok.

## Çatı grafikleri ve çevre (kullanıcı geri bildirimi, 20 Kasım — hava fotoğrafı referans)

- **Çatı:** gerçek hava fotoğrafındaki gibi Kuzey (Maçka) ucunda arma + "BEŞİKTAŞ", iki uzun kenarda
  sponsor işareti + "Tüpraş", Eski Açık ucunda kanatları açık siyah kartal (başı sahaya dönük).
  `src/stadium/roofDecal.ts`: grafikler **plan (üstten) koordinatında** bir dokuya çiziliyor ve
  membranın üst yüzüne dünya x/z'siyle basılıyor — membranın kendi UV'si halka boyunca gittiği için
  harfler iç kenara doğru sıkışırdı; böylece yukarıdan bakınca fotoğraftaki gibi düz okunuyor. Tüm
  yazılar (üstten bakınca) saat yönünde ve harflerin tepesi dışa dönük, gerçek çatıdaki gibi. Panel
  sıralarının halka dikişleri de dokuda. Gece membran ışıması yazıların üstünde kısılıyor.
  Sponsor: **resmî Tüpraş logosu** (kırmızı damla + "Tüpraş" yazısı) — tupras.com.tr'deki SVG
  sprite'tan alındı, `public/brand/tupras-logo.svg` (Wikimedia Commons'ta "public domain,
  trademarked"). Logo ince şeritlere bölünüp çatının kavisi boyunca diziliyor (24 m yükseklik).
  İlk sürümdeki elle çizilmiş kalp biçimli işaret kaldırıldı.
- **Çevre verisi genişletildi** ("araziler boş, yollar yarım kalıyor"): OSM alanı 3.9 × 2.7 km'den
  6.4 × 4.9 km'ye (Taksim/Harbiye/Cihangir → Yıldız → Üsküdar kıyısı → Tophane). Bina 5.479 → 21.089,
  yol 2.211 → 7.338, alan 344 → 1.367. Yoğun karolar API sınırını aşarsa dörde bölünerek indiriliyor
  (`scripts/fetch_osm.sh`); ham DEM yoksa `build_world.py` mevcut `terrain.bin`'i koruyor.
  Çizim yükü değişmedi (akış yarıçapıyla sınırlı): açılış 840 → 851 çağrı, 719 → 676 bin üçgen.
- **Boş gri araziler:** konut, kampüs/askeri/hastane, ticari, sanayi, kumsal alanları artık kendi
  renkleriyle; kampüs bahçelerine (İTÜ, kışlalar) bina ayak izlerinden kaçınan ağaçlar ekleniyor.
  Avlulu tarihi binalar (İTÜ Makina, Taşkışla, Maçka Silahhanesi, Atik Valide…) iç halkalarıyla
  çiziliyor; önce avluları çatıyla kapanıp açılış görüntüsünde dev gri levha oluyordu.
- **Yarım kalan yollar:** OSM tünele giren yolu çizmediği için yol havada bitiyordu (stadın
  hemen önündeki Bomonti–Dolmabahçe tüneli dahil 27 yer) → beton tünel ağızları. Veri alanının
  dışındaki uzak şehir daha sık ve kiremit/taş renkli; uzak zemin daha sıcak tonda.

## Yeni koltuk seçim akışı (kullanıcı geri bildirimi, 20 Kasım)

İstek: girişte yalnızca **tek buton ("Koltuk Seç")**; tıklayınca hızlıca (ama izlenebilir) stadın
içine girilsin, donmasın; içeride etrafta bölgeler görünsün (Doğu Alt/Üst, Kuzey Alt/Üst — kale
arkası …), bölge seçilsin, bölgeden koltuğa dokunulsun, koltuktan görüş + koltuk/sıra/bölge/fiyat
görünsün, sonra bilet. Liste üzerinden "bilmeden" blok/sıra/numara seçtirme kalktı.

Yapılanlar:
- **Giriş kartı:** tek "Koltuk Seç" butonu. Kilitli görünüm çubuğu (STEP 02) ziyaretçi akışından
  kaldırıldı; sunum/inceleme için `?views` ile açılıyor.
- **Stadın içi (`insideFrame`):** kamera çatıdan tek hamlede iniyor (`planEnter`: açılış pozu →
  çatı açıklığının üstü → sahanın üstünde Batı'ya yakın nokta, yüzü Doğu'ya), en fazla 3.8 s.
  Varınca yerinde yavaşça dönüyor (~4°/s, kullanıcı sürükleyince durur); sürükleyerek 360° bakılıyor.
- **Bölgeler (`src/ui/regions.ts`):** 4 tribün × alt/üst + VIP + Localar = 10 bölge, her satılık
  blok tam bir bölgede. Tribünlerin üzerinde 3D etiketler (ad + "₺…’den"), panelde 2 sütun bölge
  kartı (fiyat, boş koltuk). Bölgenin üzerine gelince (etiket, kart ya da stadın kendisi) tüm bölge
  turuncu yanıyor; tıklayınca o bölgeye uçuluyor.
- **Bölge kadrajı (`regionFrame`):** sahanın üstünden bölgenin ortasına bakış (Batı'da VIP / basın
  tribünü ortada). Üst katlar alçaktan ve uzaktan (arka sıraların görüş çizgisi çatının iç kafes
  kirişinin altından geçsin), alt katlar yakından (koltuklar dokunulacak büyüklükte). Bu adımda
  boş koltuklar beyaz, satılmışlar gri; sürükleyerek bölgede sağa sola bakılıyor.
- **Koltuk:** stadyumda koltuğa dokunmak o koltuğa uçuruyor (üzerine gelince ipucu: bölge · blok ·
  sıra · koltuk · fiyat). Satılmış koltuğa dokunulursa aynı bloktaki en yakın boş koltuk seçilip
  not düşülüyor. Koltukta panel: Bölge, Blok, Sıra, Koltuk, Kategori, **Fiyat**; sol/sağ koltuk,
  "Bileti Gör", "Başka koltuk seç". Koltukta vurgu kapalı (maç günü görüntüsü).
- **Uçuş süreleri (`PICKER_MAX`):** giriş 3.8 s, bölge 2.4 s, koltuk 4.2 s, geri 2.8 s, çıkış 4 s
  (eski akışta havadan koltuğa 14 s). `Flight(frames, 1, maxDuration)` süreyi kısaltırken önce yol
  kısımlarını sıkıştırıyor; dönüşler tepe noktasında 150°/s'yi geçmiyor. Arkaya dönüşlerde bakış
  noktası kameranın içinden geçiyordu (tek karede 43° savrulma) → bakış yana süpürülüyor
  (`sweepFrames`). `scripts/test-clips.ts`'e 164 seçim uçuşu eklendi (yatay + dikey ekran, her
  bölge, bölge uçları): çarpışma yok, en büyük dönüş 3.15°/kare, süreler 1.5–4.2 s.

Donma ölçümü (`scripts/hitch.mjs`, yükleme sonrası derlenen shader sayısı):
- Önce: girişte +2 program (çatının saydamlaşması malzemeyi yeniden derletiyordu), detaylı koltuklar,
  gölgeleri ve ID/vurgu geçişleri ilk kez stadın içinde çizildiği için orada derleniyor/yükleniyordu.
- Şimdi: çatı saydamlığı kullanılmıyor; yükleme ekranında `App.warmUp()` tüm koltuk LOD'larını,
  gölge vericilerini, ID ve vurgu geçişlerini bir kez çizerek bütün programları derliyor ve örnek
  tamponlarını GPU'ya yüklüyor. Akışın hiçbir adımında (giriş, bölge, koltuk, geri) **yeni program
  derlenmiyor (+0)**; kare başına en kötü CPU payı akış 10 ms, seçim 7 ms.
- Varıştan sonra görüntü yavaşça kayıyordu: OrbitControls'un sönümlü dönüş artığı (otomatik dönüşten
  ya da sürüklemeden) uçuş sırasında bekleyip inişten sonra uygulanıyordu (~1°; yazılım GPU'sunda
  dokunulan koltuğun komşusunu seçtirecek kadar). Uçuş başında ve bakma moduna geçerken sıfırlanıyor.
- Koltuk görüntüsü (bilet) tam çözünürlükte eş zamanlı JPEG kodlanıyordu (telefonda 100–300 ms
  donma) → 1280 px'e küçültülüp `toBlob` ile arka planda kodlanıyor.

## Bakış yönüne göre kırpma (kullanıcı isteği, "Subway Surfers" mantığı)

- Büyük statik stadyum ağları (basamaklar, membran, loca bandı, çatı çeliği, cephe, alt yüzey…)
  12 açısal sektöre bölündü (`src/core/split.ts`); uzak arazi ve uzak şehir 16 sektöre. Arkada
  kalan sektörler görüş konisi kırpmasıyla çizilmez, dönünce anında geri gelir.
- Şehir parçaları: kameraya 450 m içindekiler her yönde yüklü; ötesinde yalnızca bakış konisi
  (+0.6 rad pay) içindekiler yüklenir/önceliklenir; koninin dışında 2.5 s kalan parçalar boşaltılıp
  havuza iade edilir (stadyum çevresindeki sabit parçalar yalnızca ağaç/lambalarını bırakır).
- Koltuk LOD: yakın detaylı (~34 üçgen, kademeye göre 18–34 m), orta 10 üçgen, 150 m ötesi tek
  eğik dörtgen (2 üçgen). Koltuk gölgesi yalnızca 12 m içindeki bloklarda.
- Ölçüm (800×450, medium): Batı üst koltuktan sahaya bakış ana geçiş 898 bin + gölge 289 bin üçgen
  (önce 1.38 M + 1.21 M); aynı koltukta arkaya bakış 215 bin; havadan stadyuma bakış 454 bin,
  stadyuma sırtını dönünce 129 bin. Çizim çağrısı 480 → 180 (arkaya bakış).

## STEP 05 doğrulaması (ilk akış — 20 Kasım'da yukarıdaki yeni akışla değiştirildi)

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
  Uzak koltuk LOD'u dik bir sırtlık dörtgeniydi, tepeden bakınca bıçak gibi kayboluyordu → oturak
  önünden sırtlık tepesine 45° eğik tek dörtgen: önden sırtlık, tepeden oturak izi gibi görünüyor.

## Gece–gündüz doğrulaması (`scripts/daynight.mjs`)

- Güneş hesabı İstanbul için gerçek değerlerle uyuşuyor: 21 Haziran doğuş/batış 05:33/20:40
  (öğle 13:06, 72.4°), 20 Kasım 07:58/17:43, 20 Mart 07:09/19:16.
- Dış cephe görünümü 06:00 → 22:30 arası 10 saatte tarandı, konsol hatası yok. Bulunan ve düzeltilen:
  alacakaranlıkta (güneş 0…−6°) sahne gece yarısından karanlıktı — pozlama ve şehir ışıkları yalnızca
  "tam gece" katsayısına bağlıydı. Pozlama artık güneşin ufkun ne kadar altında olduğuna göre sürekli
  açılıyor; pencereler/sokak lambaları güneş doğana kadar yanık (+3°'de sönmüş), gökyüzü sivil
  alacakaranlıkta gece tonunun bir kısmını alıyor.
- Saat atlatıldığında (12:00 → 21:00) güneş ve tüm ışık parametreleri ~1.5 s içinde süzülerek geçiyor;
  canlı modda duvar saati zaten dakikadan dakikaya yumuşak ilerliyor.

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
  atfedilen her maske pikseli o bloğun koltuğu). Görünür koltuklarda tam koltuk kimliği normal
  açılarda %93–100; sığ açıyla karşı uçtaki blokta (kale → 106) %85 (sonda komşu koltuğun
  sırtlığına düşüyor) ve 470 m'den üstten bakışta %55 (koltuk pikselden küçük). Sonda noktası
  koltuğun o an çizildiği LOD'a göre seçiliyor (son tur, uzak LOD eğik dörtgene geçtikten sonra).
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
- `public/brand/tupras-logo.svg` — resmî Tüpraş logosu (tupras.com.tr; Commons: public domain, trademarked)
- `src/ui/picker.ts`, `src/ui/regions.ts`, `src/ui/ticket.ts` — seçim akışı, bölgeler, dijital bilet
- `src/stadium/roofDecal.ts` — çatı grafikleri (plan koordinatında doku, membran üstüne baskı)
- `scripts/flow.mjs` — uçtan uca akış (gerçek tıklama/dokunma), `scripts/regions.mjs` — tüm bölge
  kadrajları, `scripts/hitch.mjs` — adım başına derlenen shader ve en yavaş CPU parçaları
- `scripts/promo.mjs` — tanıtım videosu kaydedici (`?capture` modu, sanal saat, kare kare ekran görüntüsü)

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

Yeni akış masaüstü (1280×720 Batı Alt, 960×540 Doğu Alt) ve mobil (iPhone 13, Kuzey Alt) uçtan uca
konsol hatası olmadan geçiyor; dokunulan koltuk birebir seçiliyor. Canlı: https://tupras-stadyumu-iota.vercel.app
(`scripts/with-server.sh node scripts/flow.mjs <dir> 960 540 '' DOGU-lower` / `… 390 664 mobile`).

**Yapılacak:**
1. Cihazlar arası canlı satış için Firebase veritabanı adresi (kullanıcıdan) → `VITE_SEAT_DB_URL`.
2. Canlı link: Vercel hesabında aynı repoya bağlı 10 proje var; her push 10 deploy başlatıyor ve
   günlük 100 sınırı hızla doluyor. Kullanıcı ilgisiz projelerin Git bağlantısını kesmeli.
   `tupras-stadyumu` projesinin önizlemeleri Vercel girişi ister (Deployment Protection).
3. İsteğe bağlı görsel iyileştirmeler (aşağıda).

Not: bu ortamda tarayıcı yazılım GPU'su (SwiftShader) kullanıyor; kare başına 1–2 s sürüyor
(ana iş parçacığı 6–12 ms). Gerçek GPU performansını göstermez — bu yüzden kare süresi yöneticisi
gerçek cihazda ölçüp karar veriyor. Test parametreleri: `?fast` (uçuşlar 5× hızlı), `?msaa=0`,
`?nopost` (teşhis), `?gov` (yöneticiyi testte zorla aç), `?debug` (HUD).

Bilinen görsel eksikler (sonra ele alınabilir):
- Ağaçlar düşük poligon; yakında oyuncak gibi.
- Batı tarafı gerçekte istinat duvarlarıyla ~30 m yüksek; modelde 60 m'lik eğimli geçiş var.
- Bazı koltukların önünde kusma (vomitoryum) duvarı görüşü kısıtlıyor — gerçekte de öyle; istenirse
  bu koltuklara "kısıtlı görüş" etiketi eklenebilir.

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

Tanıtım videosu (49 sn; açılış → bölge → canlı satış → koltuk → görüş → bilet → gece kapanışı):

```bash
npm run dev &                                   # 127.0.0.1:5173 açık olmalı
node scripts/promo.mjs /tmp/promo 1280 720 1.5 30   # 1920×1080, 30 fps (~1 sa 50 dk, yazılım GPU)
ffmpeg -i /tmp/promo/promo.mp4 -i muzik.mp3 -filter_complex \
  "[1:a]atrim=0:49,afade=t=in:d=0.4,afade=t=out:st=46.5:d=2.5[a]" \
  -map 0:v -map "[a]" -c:v libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 192k -shortest tanitim.mp4
```

`?capture` ile uygulama kendi döngüsünü çalıştırmaz; kaydedici `App.step(1/fps)` ile zamanı
ilerletir, `setTimeout` ve CSS animasyonlarını da aynı sanal saate bağlar (takılma olmaz).
Müzik ElevenLabs ile üretildi (enstrümantal, 50 sn); video ve kareler repoya eklenmez.

