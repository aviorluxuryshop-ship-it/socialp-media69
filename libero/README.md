# Libero — Futbol Akademisi

Tamamen Türkçe, statik (sunucusuz) bir futbol gelişim platformu: teknik kütüphanesi, top kontrolü ve topsuz hareketler, taktik tahtası, Futbol IQ testleri, pozisyon rehberleri, fiziksel gelişim, kişisel antrenman programı, beslenme, performans/video/oyuncu analizi ve doğrulanmış video kütüphanesi.

> Bu klasör, depodaki mevcut projelerden (`web/` ajans sitesi ve `bayburt-store/` forma mağazası) **bağımsız yeni bir projedir**. Mevcut projelere dokunulmamıştır; kök `vercel.json` hâlâ `web/` için çalışır.

## Çalıştırma

Gereksinim: Node.js 20 ve üzeri.

```bash
cd libero
npm install
npm run build      # statik site → out/
npm start          # http://localhost:3100
```

Geliştirme sırasında: `npm run dev` (http://localhost:3000).

| Komut | Ne yapar |
| --- | --- |
| `npm run build` | Tüm sayfaları (≈250) statik olarak üretir (`out/`); veri doğrulayıcıları da bu sırada çalışır, hatalı veri derlemeyi durdurur |
| `npm start` | `out/` klasörünü 3100 portunda sunar |
| `npm run baslat` | Kur + derle (gerekirse) + sun + tarayıcıyı aç (`baslat-windows.cmd` bunu çağırır) |
| `npm run typecheck` | TypeScript denetimi |
| `npm run check:logic` | Mantık ve veri denetimi (tarayıcısız): doğrulayıcılar, program üretici değişmezleri (≈1850 program taraması), profil geçişi |
| `npm run check` | `typecheck` + `check:logic` |
| `npm run test:e2e` | Tarayıcı testleri (site `npm start` ile açık olmalı; Chromium gerekir) |
| `npm run videos:verify` | Video kütüphanesindeki her YouTube kimliğini yeniden doğrular |

Test için Chromium yolu `CHROME_PATH` ile verilebilir; site adresi `BASE` ile (`BASE=http://localhost:3100`). Video analizi testi için `ffmpeg` gerekir (yoksa o test başarısız sayılır).

## Windows'ta yerel çalıştırma (Vercel gerekmez)

Gereksinim: Node.js 20+ (`node -v`; yoksa https://nodejs.org LTS ya da `winget install OpenJS.NodeJS.LTS`).

1. Kaynağı indirin: `git clone --branch claude/model-opusplan-flh77p --single-branch https://github.com/aviorluxuryshop-ship-it/socialp-media69.git` (ya da GitHub’da dalı seçip *Code → Download ZIP*), sonra `libero` klasörünü kısa bir yola alın (örn. `C:\libero`).
2. `libero` içindeki **`baslat-windows.cmd`** dosyasına çift tıklayın. Bağımlılıkları kurar, siteyi derler, sunucuyu başlatır ve tarayıcıyı açar → **http://localhost:3100**
   (Komut satırından aynısı: `node scripts\baslat.mjs`; güncelleme çektikten sonra `node scripts\baslat.mjs --yeniden`.)
3. Kapatmak için pencerede `Ctrl + C`.

Port doluysa 3101, 3102… otomatik denenir. Sunucu yalnızca bu bilgisayardan (127.0.0.1) erişilebilir.

## Dağıtım

Statik çıktı verdiği için herhangi bir statik barındırıcıda çalışır. Vercel’de **ayrı bir proje** oluşturup *Root Directory* olarak `libero` seçin (Framework: Next.js; ayrı ayar gerekmez). Alan adı belirlendiğinde `NEXT_PUBLIC_SITE_URL` ortam değişkenini ayarlayın (site haritası ve sosyal önizleme için).

## Yapı

```
app/            sayfalar (App Router), arama/sahne/alıştırma JSON uç noktaları
components/     arayüz bileşenleri (pitch/ → saha çizimi ve taktik tahtası)
data/           içerik: teknikler (11 kategori, 127 teknik), vuruş öncesi vücut pozisyonu,
                taktikler, quiz, pozisyonlar, egzersizler (83; ortam ve ekipmana göre etiketli),
                beslenme, oyuncu analizleri, saha testleri, kaynaklar, videolar
lib/            saklama (store), sahne motoru, program üretici, ortam/ekipman kuralları
                (environments.ts), arama, güvenlik kuralları
styles/         tasarım belirteçleri ve bileşen/sayfa stilleri (Tailwind yok)
scripts/        statik sunucu, e2e testi (tarayıcı), mantık denetimi, video doğrulama
```

Teknolojiler: Next.js 16 (App Router, statik export), React 19, TypeScript, düz CSS. Yazı tipleri (Instrument Serif, Hanken Grotesk, JetBrains Mono) paketten yerel olarak gelir; dış servis yoktur. Ücretli API ya da anahtar gerekmez. Otomatik video analizi için **Google MediaPipe Pose Landmarker** (`@mediapipe/tasks-vision` ve `.task` modelleri, **Apache-2.0**) kullanılır; ayrıntı ve tam lisans metni: `public/third-party-notices.txt`, modellerin kaynağı ve SHA-256 değerleri: `public/models/README.txt`.

## Otomatik video analizi (aşama 1: motor)

`/analiz/video/` sayfasında video yüklendikten sonra “Otomatik analiz” bölümü çalışır. **Video cihazdan çıkmaz; analiz tarayıcıda yapılır.** MediaPipe wasm dosyaları (`public/mediapipe/wasm`, `npm run build` / `npm run dev` öncesi `scripts/prepare-assets.mjs` ile kopyalanır) ve modeller (`public/models`) siteyle birlikte sunulur; CDN yoktur, ağ çağrısı yoktur.

- **Motor** (`lib/pose/`): `engine.ts` (MediaPipe + `<video>`; tek örnek yükleyici, deterministik kare gezme, iptal), saf modüller `tracking.ts` (oyuncu seçimi/takip), `smoothing.ts` + `skeleton.ts` (düzleştirme, ≤3 kare boşluk doldurma), `metrics.ts` (eklem açıları, gövde eğimi, hız “gövde boyu/sn”, adım sıklığı), `events.ts` (vuruş/pas adayı, yön değiştirme, hızlanma/sprint, duruş, çömelme), `report.ts` (Türkçe rapor verisi). Tüm eşikler `thresholds.ts` içindedir.
- **Rapor üç katmanlıdır**: *ölçülen* (sayılar), *kural tabanlı yönlendirme* (“kural tabanlı — yapay zekâ değildir”; ölçülen sayıyı ve eşiği yazar, sağlık/sakatlık iddiası içermez) ve *yapay zekâ* (**devre dışı** yer tutucu; ağ çağrısı yapılmaz).
- **Dürüst sınırlar**: görüntü 2B’dir (açılar izdüşümdür); oyuncu kadrajın ~%15’inden küçükse güvenilmez; kamera hareketliyse hız/yön kameraya görelidir; **top izlenmez** (vuruş yalnızca bacak hareketinden çıkarılan adaydır); düşük örnekleme tepe hızı eksik ölçer; hızlar metre/sn’ye çevrilmez.
- **Kayıt**: yalnızca küçük bir özet (en çok 20 video) `videoAnalyses` altında saklanır ve yedeğe girer; ham iskelet saklanmaz.
- **Testler**: `scripts/logic-tests/pose.mjs` (sentetik iskeletler), `scripts/e2e-tests/video-analysis.mjs` (gerçek MediaPipe, başsız Chromium). Test görüntüsü kaynağı: `scripts/fixtures/README.md`.

## Antrenman programı: ortamlar, ekipman, fiziksel odak

- **Program fiziksel gelişim içindir**: kuvvet, denge, çeviklik, sürat, dayanıklılık ve toparlanma. Taktik ve topsuz oyun çalışmaları **Taktik** bölümünde, teknik alıştırmalar **Teknikler** bölümünde kalır; fiziksel programa karıştırılmaz. Sahada, seçilmişse tek başına yapılabilen kısa bir **bireysel top çalışması** eklenebilir.
- **Üç ortam, üç ayrı ekipman listesi.** Ev, spor salonu ve saha için ekipman ayrı seçilir; ev ekipmanı salon ekranında, salon aletleri ev ekranında görünmez (yalnızca seçili ortamların bölümleri çizilir).
  - **Ev**: ekipmansız ya da hafif ekipmanlı hareketler (direnç bandı, atlama ipi, basamak vb.). Evde dış ağırlık (dambıl) yalnızca 18 yaş ve üstü için; gençler için yüklü çalışma gözetimli ortama bırakılır.
  - **Spor salonu**: gerçek salon makineleri ve ağırlıkları (bacak presi, kablo istasyonu, halter ve raf, bench, dambıl, kardiyo aletleri…). Halter, makine, kablo ve bench 15 yaşından önce kullanılmaz; 12 yaş altı için yüklü çalışma yoktur.
  - **Saha**: sürat, çeviklik, dayanıklılık, iniş/sıçrama ve vücut ağırlığıyla kuvvet.
- **Seçilmemiş ya da yaşa uygun olmayan ekipman gerektiren hiçbir hareket programa girmez**; bu kural program üretici testlerinde binlerce kombinasyonla denetlenir (`npm run check:logic`). Seçime uygun yeterli hareket yoksa oturum kısa kalır ve programın notlarında yazılır.
- **Ayrıntılı antrenman sayfası**: takvimde ya da oturum listesinde bir oturuma tıklayınca `/program/antrenman/?oturum=…` açılır. Her hareket için hedef kaslar, set–tekrar–süre, dinlenme, nasıl yapılır, doğru yürütme ve sık yapılan hatalar bulunur; sayfadan antrenman başlatılıp setler işaretlenir. Statik dışa aktarımda çalışır (adres sorgu parametresiyle, dinamik rota yok).
- **Teknik sayfalarında "Vuruş öncesi vücut pozisyonu"**: topa yaklaşma, destek ayağı, gövde, kalça ve denge; yalnızca topa/kafayla vuran 48 teknik için ve her teknik için ayrı yazılmıştır (kopyalanmış ya da çok benzer metin derlemeyi durdurur). Top sürme, savunma, kalecilik ve topsuz hareketlerde bu bölüm yoktur çünkü "vuruş öncesi" bir duruş anlatılmaz.
- **İç yüzle kavisli pas ≠ trivela**: iç yüzle kavisli pasta temas ayağın iç yüzü ve ayak üstünün iç bölümüdür, top içe döner; trivela pasında (ve üst dış vuruşta) temas ayak üstünün dış bölümüdür ve top vuran ayağın tarafına döner. Teknik sayfalarında "Karıştırılmasın" notu ve temas yüzeyi haritası bunu ayırır.

## Kayıtlı veri ve sürüm geçişi

Depolama anahtarı **`libero:v1` olarak kalır**; içindeki şema sürümü 2'dir. v1 kayıtları okunurken otomatik dönüştürülür ve **hiçbir şey silinmez**: yıldız seviyeleri, antrenman geçmişi, eski programlar (teknik/saha oturumları dahil), favoriler, test ve quiz kayıtları aynen korunur. Değişen tek şey profil: tek ekipman listesi ortam başına ayrılır (`equipByEnv`) ve kaldırılan "teknik" hedefi "dengeli fiziksel gelişim"e çevrilir. v1 JSON yedekleri de aynı yolla geri yüklenir. Programı yeniden oluşturduğunuzda yeni, fiziksel odaklı program yazılır; eski oturumlar silinmez, program yenilenene kadar görüntülenir.

## Veri nerede saklanır? (önemli)

Hesap ve sunucu yoktur. Profil, yıldız seviyeleri, program, antrenman geçmişi, test sonuçları, taktik tahtası kayıtları ve video notları **yalnızca kullanıcının tarayıcısında (localStorage)** tutulur. Bu yüzden:

- Aynı cihaz **ve** aynı tarayıcı gerekir; başka cihazda görünmez.
- Tarayıcı verileri temizlenirse ya da gizli sekme kullanılırsa kayıtlar kaybolur.
- **Panelim** sayfasından JSON yedeği indirilebilir/yüklenebilir; depolama kullanılamıyorsa kullanıcıya uyarı gösterilir.
- Yüklenen videolar cihazdan çıkmaz ve saklanmaz; yalnızca notlar (dosya adı + boyut + tarih parmak iziyle) saklanır.

Çok cihazlı senkronizasyon istenirse bir hesap + veritabanı katmanı eklenmesi gerekir (bu sürümde yok).

## İçerik ilkeleri

- **Makas** (bisiklet vuruşu) teknik listesinde yoktur. **Üst dış vuruş (trivela)**, temas yüzeyi haritasıyla (ayağın dış yüzü, 4.–5. parmak hattı) ayrıca gösterilir.
- Her tekniğin Türkçe tanımı, adım adım uygulama, sık hatalar, maçta kullanım ve 1–5 yıldız seviyesine göre alıştırmalar vardır; tekrar eden kavram bırakılmamıştır (otomatik doğrulama).
- Çocuk/ergen güvenliği: yaş bandına göre egzersiz seçimi ve doz; 12 yaş altında kafa vuruşu tanıtılmaz, hiçbir yaşta maksimum yük denemesi yapılmaz (FA 2020, AAP 2020, NSCA 2009). Kaynaklar **Panelim → Kaynaklar** bölümünde.
- Gençler için egzersiz güvenliği metinleri doğrulanmış kaynaklara dayanır (Panelim → Kaynaklar): AAP 2020 klinik raporu, NSCA 2009, BJSM 2014 uzlaşı metni, FA kafa vuruşu yönergesi, WHO 2020. Ev ekipmanı ve ev ortamı için kuvvetli bir uzman kuruluş kaynağı yoktur; bu nedenle ev kuralları temkinli seçilmiş **genel uygulama** olarak etiketlidir.
- Beslenme sayfası genel bilgidir; diyetisyen hizmeti verilmediği açıkça yazılıdır. Süt/yumurta/gluten/fıstık vb. için alternatifler sunulur, aşırı kısıtlama önerilmez.
- Oyuncu analizleri **eğitim amaçlı yorumdur**; istatistik, kulüp ya da transfer bilgisi içermez.
- Performans analizi yaş “norm” tabloları göstermez; kullanıcıyı yalnızca kendi geçmişiyle karşılaştırır.

## Video kütüphanesi nasıl çalışır?

1. `data/videos/curated.json` — elle seçilmiş videolar (konu, seviye, pozisyon, ilgili teknikler, Türkçe özet).
2. `npm run videos:verify` — her kimlik YouTube’un herkese açık oEmbed uç noktasıyla (anahtarsız) doğrulanır: video var mı, sahibi gömmeye izin veriyor mu; başlık ve kanal bilgisi oradan alınır. İzleme sayfasından süre ve altyazı durumu da okunmaya çalışılır; ancak YouTube bazı ağlarda (ör. bulut/CI makineleri) “bot doğrulaması” istediği için bu bilgi her zaman alınamaz. Alınamazsa süre gösterilmez ve İngilizce videolarda Türkçe altyazı “doğrulanamadı” olarak etiketlenir (varsayım yapılmaz). Normal bir ev/ofis bağlantısından çalıştırıldığında bu alanlar dolar. Sonuç `data/videos/verified.json` dosyasına yazılır.
3. Siteye yalnızca doğrulanmış videolar girer. Hiçbir video kopyalanmaz/indirilmez; `youtube-nocookie.com` gömme oynatıcısıyla ve kanal bağlantısıyla gösterilir. Altyazı varsa Türkçe açılmaya çalışılır (`cc_lang_pref=tr`); yoksa Türkçe özet kullanılır.
4. Türkçe özetler başlık ve konuya göre bu site için yazılmıştır; videonun çevirisi değildir. Videoyu tam izleyip yazılmış özet olduğu iddia edilmez.

Videolar zamanla kaldırılabilir; doğrulamayı periyodik çalıştırın ve ardından yeniden derleyin.

## Video kütüphanesi ve oyuncu analizi

- **/videolar/**: kategori sekmeleri + konu çipleri (sayılarla), arama, dil/seviye/pozisyon süzgeçleri, sıralama ve derin bağlantılar (`?konu=pas&dil=tr`, `?grup=kaleci`). Süzgeç mantığı `lib/video-filter.ts` içindedir (mantık testleri: `scripts/logic-tests/video-library.mjs`).
- **Kapaklar**: her konunun çizim kapağı vardır (`components/VideoCover.tsx`). “Kapak görselleri YouTube’dan yüklensin” anahtarı açıkken YouTube’un küçük resmi üstüne biner; tercih yedeğe girmeyen ayrı anahtarda (`libero:ui`) saklanır ve kapalıyken `i.ytimg.com`’a istek gitmez.
- **Oynatıcı penceresi** (`components/VideoPlayerModal.tsx`): yalnızca resmî `youtube-nocookie` gömme oynatıcısı; odak tuzağı, Esc, odağı geri verme. Pencere açılınca YouTube’un resmî IFrame API betiği tembel yüklenir; yüklenemezse (çevrimdışı, engelleyici) dürüst bir mesaj ve “YouTube’da aç” bağlantısı gösterilir. Rozetler (`lib/video-honesty.ts`) yalnızca doğrulama verisinin desteklediğini söyler.
- **Kişisel zaman notları**: “Bu ana not ekle” notu `{t, text, at}` olarak `videoMoments` alanına yazar (şema sürümü değişmedi, alan isteğe bağlıdır; eski yedekler yüklenir; yedeğe girer). Süreler kullanıcıya aittir; yaratıcı bölümü (chapter) uydurulmaz.

- **Oyuncu analizi** (`/analiz/oyuncular/`): 24 oyuncu; dizinde konum/rol süzgeci, arama ve tipografik (fotoğrafsız) kartlar, en kapsamlı analiz (Messi) öne çıkarılır. Her oyuncu sayfasında 14 bölüm vardır: oyun tarzı özeti, pozisyon alma, topsuz hareket, pas tercihleri, top kontrolü ve ilk dokunuş, hücum, savunma ve top kazanma, karar verme, güçlü yanlar ve sınırlılıklar, kendi oyununa taşı (teknik bağlantıları), izlerken bak, videolar, benzer oyuncular, kaynaklar.
  - **Kaynaklar**: yalnızca yazım sırasında gerçekten açılıp okunmuş sayfalar (`{başlık, adres, okunma tarihi, ne alındığı}`) gösterilir; kaynak bulunamayan konuda daha az şey yazılır. Metinler yeniden anlatımdır; sayı, ödül, transfer ya da özel hayat bilgisi içermez (`data/player-check.ts` bunu derlemede denetler).
  - **Videolar**: her oyuncuya kütüphanedeki doğrulanmış videolardan 3–6 tane atanır (`data/player-deep/`); video penceresi yan panelde “Bu videoda bak” gösterir. Videolar çoğunlukla oyuncunun kendisi değil ilgili beceriyi anlatır; panel bunu açıkça söyler ve zaman kodu göstermez.
  - Veri: temel alanlar `data/players.ts` ve `data/player-new.ts`, derin bölümler `data/player-deep/*.ts`, şema `data/player-types.ts`. Testler: `scripts/logic-tests/players.mjs`, `scripts/e2e-tests/players.mjs`.

## Bilinen sınırlar

- Hesap/senkronizasyon yok (yukarıya bakın).
- Taktik tahtası kayıtları tarayıcıdadır; PNG ve JSON olarak dışa aktarılabilir, GIF/video dışa aktarma yoktur.
- Video analizinde kare adımı, seçilen kare hızına göre **yaklaşıktır**; gerçek kare sayısı okunmaz.
- Videoların Türkçe altyazısı YouTube’un otomatik çevirisine bağlıdır; kalite ve varlık garanti edilmez.
- Beslenme ve fiziksel içerik genel rehberdir; kişisel plan yerine geçmez.
- Oyuncu analizlerindeki betimlemeler yorumdur; yayımlanmış resmî veri değildir.
