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
| `npm run build` | Tüm sayfaları (≈250) statik olarak üretir (`out/`) |
| `npm start` | `out/` klasörünü 3100 portunda sunar |
| `npm run typecheck` | TypeScript denetimi |
| `npm run test:e2e` | Tarayıcı testleri (site `npm start` ile açık olmalı; Chromium gerekir) |
| `npm run videos:verify` | Video kütüphanesindeki her YouTube kimliğini yeniden doğrular |

Test için Chromium yolu `CHROME_PATH` ile verilebilir; site adresi `BASE` ile (`BASE=http://localhost:3100`). Video analizi testi için `ffmpeg` gerekir (yoksa o test başarısız sayılır).

## Dağıtım

Statik çıktı verdiği için herhangi bir statik barındırıcıda çalışır. Vercel’de **ayrı bir proje** oluşturup *Root Directory* olarak `libero` seçin (Framework: Next.js; ayrı ayar gerekmez). Alan adı belirlendiğinde `NEXT_PUBLIC_SITE_URL` ortam değişkenini ayarlayın (site haritası ve sosyal önizleme için).

## Yapı

```
app/            sayfalar (App Router), arama/sahne/alıştırma JSON uç noktaları
components/     arayüz bileşenleri (pitch/ → saha çizimi ve taktik tahtası)
data/           içerik: teknikler (11 kategori, 126 teknik), taktikler, quiz, pozisyonlar,
                egzersizler, beslenme, oyuncu analizleri, saha testleri, kaynaklar, videolar
lib/            saklama (store), sahne motoru, program üretici, arama, güvenlik kuralları
styles/         tasarım belirteçleri ve bileşen/sayfa stilleri (Tailwind yok)
scripts/        statik sunucu, e2e testi, video doğrulama
```

Teknolojiler: Next.js 16 (App Router, statik export), React 19, TypeScript, düz CSS. Yazı tipleri (Instrument Serif, Hanken Grotesk, JetBrains Mono) paketten yerel olarak gelir; dış servis yoktur. Ücretli API ya da anahtar gerekmez.

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
- Çocuk/ergen güvenliği: yaş bandına göre egzersiz seçimi ve doz; 12 yaş altında kafa vuruşu ve maksimum yük yok (FA 2020, AAP 2008). Kaynaklar **Panelim → Kaynaklar** bölümünde.
- Beslenme sayfası genel bilgidir; diyetisyen hizmeti verilmediği açıkça yazılıdır. Süt/yumurta/gluten/fıstık vb. için alternatifler sunulur, aşırı kısıtlama önerilmez.
- Oyuncu analizleri **eğitim amaçlı yorumdur**; istatistik, kulüp ya da transfer bilgisi içermez.
- Performans analizi yaş “norm” tabloları göstermez; kullanıcıyı yalnızca kendi geçmişiyle karşılaştırır.

## Video kütüphanesi nasıl çalışır?

1. `data/videos/curated.json` — elle seçilmiş videolar (konu, seviye, pozisyon, ilgili teknikler, Türkçe özet).
2. `npm run videos:verify` — her kimlik YouTube’un herkese açık oEmbed uç noktasıyla (anahtarsız) doğrulanır: video var mı, sahibi gömmeye izin veriyor mu; başlık ve kanal bilgisi oradan alınır. İzleme sayfasından süre ve altyazı durumu da okunmaya çalışılır; ancak YouTube bazı ağlarda (ör. bulut/CI makineleri) “bot doğrulaması” istediği için bu bilgi her zaman alınamaz. Alınamazsa süre gösterilmez ve İngilizce videolarda Türkçe altyazı “doğrulanamadı” olarak etiketlenir (varsayım yapılmaz). Normal bir ev/ofis bağlantısından çalıştırıldığında bu alanlar dolar. Sonuç `data/videos/verified.json` dosyasına yazılır.
3. Siteye yalnızca doğrulanmış videolar girer. Hiçbir video kopyalanmaz/indirilmez; `youtube-nocookie.com` gömme oynatıcısıyla ve kanal bağlantısıyla gösterilir. Altyazı varsa Türkçe açılmaya çalışılır (`cc_lang_pref=tr`); yoksa Türkçe özet kullanılır.
4. Türkçe özetler başlık ve konuya göre bu site için yazılmıştır; videonun çevirisi değildir. Videoyu tam izleyip yazılmış özet olduğu iddia edilmez.

Videolar zamanla kaldırılabilir; doğrulamayı periyodik çalıştırın ve ardından yeniden derleyin.

## Bilinen sınırlar

- Hesap/senkronizasyon yok (yukarıya bakın).
- Taktik tahtası kayıtları tarayıcıdadır; PNG ve JSON olarak dışa aktarılabilir, GIF/video dışa aktarma yoktur.
- Video analizinde kare adımı, seçilen kare hızına göre **yaklaşıktır**; gerçek kare sayısı okunmaz.
- Videoların Türkçe altyazısı YouTube’un otomatik çevirisine bağlıdır; kalite ve varlık garanti edilmez.
- Beslenme ve fiziksel içerik genel rehberdir; kişisel plan yerine geçmez.
- Oyuncu analizlerindeki betimlemeler yorumdur; yayımlanmış resmî veri değildir.
