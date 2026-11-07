# Melopee Panel

Melopee Nail Art Studio için CRM ve yönetim paneli (Next.js). İki şubeli yapıya göre tasarlandı: her ekranda
**Tüm şubeler** ya da tek bir şube seçilerek çalışılır.

## Neler var

**Yönetici paneli** (`/panel`)

| Bölüm | İçerik |
| --- | --- |
| Genel Bakış | Bugünkü randevular ve akış, bugün tahsil edilen / beklenen ciro, bu ay ciro ve net kâr, şube karşılaştırması, son 14 gün ciro, popüler hizmetler, yaklaşan doğum günleri, geri kazanılacak müşteriler |
| Randevular | Şube seçenekli takvim (Tüm şubeler / Merkez / 2. Şube). **Gün** görünümünde personel sütunları, **Hafta** görünümünde gün sütunları, **Liste** görünümünde arama + durum filtresi + CSV. Boş aralığa tıklayınca o personel ve saat için randevu açılır; çakışan randevuya izin verilmez |
| Şubeler | Menüdeki **Şubeler** altından şube seçilir; seçilen şubenin bugünkü randevuları, personel doluluğu, aylık ciro/gider grafiği ve bilgileri. "Tüm şubeler"de iki şube yan yana kıyaslanır |
| Müşteriler | Arama, VIP / yeni / geri kazanım / doğum günü grupları, ziyaret ve harcama geçmişi, alerji ve notlar, WhatsApp'tan hatırlatma ve kutlama mesajı, CSV |
| Personel | Personel bazında randevu, ciro, prim, doluluk; prim ve hakediş tablosu (CSV); çalışma günleri, prim oranı, maaş ve giriş PIN'i |
| Gelir & Gider | Günlük / haftalık / aylık dönem; randevu gelirleri otomatik, ürün satışı ve giderler elle girilir; kategori ve ödeme yöntemi kırılımı |
| Raporlar | Günlük / haftalık / aylık rapor, önceki döneme göre değişim (devam eden dönemde önceki dönemin aynı günleriyle), personel ve hizmet performansı, şube kırılımı; **Yazdır / PDF** ve **CSV / Excel** |
| Hizmetler | Hizmet listesi, süre ve fiyat; son 30 günde kaç kez yapıldığı |
| Ayarlar | Stüdyo adı, yönetici PIN'i, takvim adımı, JSON yedek alma / geri yükleme, tanıtım verisini silip gerçek kullanıma başlama |

**Personel paneli** (`/personel`) — her personel kendi PIN'iyle girer ve yalnızca kendi programını görür:
hangi gün, hangi saatte, hangi müşteri, hangi hizmet; müşteri notu ve alerji uyarısı; arama ve WhatsApp
düğmeleri; randevuyu "Tamamlandı" (ödeme yöntemiyle) ya da "Gelmedi" olarak işaretleme; randevular arası
boşluklar; haftalık görünüm ve bu ayki prim tahmini. Finans ve diğer personelin verisi görünmez.

## Tanıtım modu

İlk açılışta örnek veri yüklenir: Ataşehir ve Emaar şubeleri, sitedeki 9 hizmet (fiyatlar örnektir), 6 örnek personel, ~500 örnek müşteri, 4 aylık randevu ve gelir-gider.

- Yönetici PIN: `0000`
- Personel PIN'leri: Ece `1111`, Selin `2222`, Derya `3333`, Buse `4444`, İrem `5555`, Naz `6666`

Gerçek kullanıma geçerken: **Ayarlar → Boş başla** (şubeler ve hizmet listesi kalır), ardından şube
bilgilerini, personeli ve PIN'leri girin; yönetici PIN'ini değiştirin.

## Veri nerede saklanıyor? İki çalışma modu

**Sunucu modu (yayındaki sürüm, `NEXT_PUBLIC_BACKEND=1`)**

- Veriler Neon Postgres veritabanında tutulur; yönetici, resepsiyon ve personel hangi cihazdan girerse
  girsin aynı veriyi görür. Açık ekranlar 30 saniyede bir (ve sekmeye dönünce) diğer cihazlardaki
  değişiklikleri çeker; aynı saate iki cihazdan randevu verilirse ikincisi reddedilir.
- Giriş sunucuda doğrulanır: yönetici **şifreyle**, personel kendi **PIN'iyle** girer. Oturum 30 gün
  geçerli, imzalı ve `httpOnly` bir çerezdir. Aynı hesapta 15 dakikada 8 hatalı denemeden sonra giriş
  15 dakika kilitlenir.
- Personel sunucudan yalnızca kendi randevularını ve o randevuların müşteri bilgisini alır; ciro,
  gider, maaş ve diğer personelin verisi tarayıcısına hiç gönderilmez. Personel yalnızca kendi
  randevusunu "Tamamlandı" ya da "Gelmedi" yapabilir.
- Müşteri verisi cihazda saklanmaz.

Gerekli ortam değişkenleri (Vercel → proje → Settings → Environment Variables):

| Değişken | Açıklama |
| --- | --- |
| `NEXT_PUBLIC_BACKEND` | `1` |
| `DATABASE_URL` | Neon bağlantısı; Vercel → Storage → Neon bağlanınca otomatik eklenir |
| `SESSION_SECRET` | En az 16 karakterlik rastgele metin |
| `OWNER_PASSWORD` | İlk yönetici şifresi; panelden değiştirilince veritabanındaki şifre geçerli olur |

Tablolar ilk istekte kendiliğinden oluşturulur ve tanıtım verisi yüklenir. Gerçek kullanıma geçerken
**Ayarlar → Boş başla**.

**Yerel mod (değişken yoksa)** — veriler yalnızca tarayıcıda tutulur; tek cihazlı deneme ve
önizleme içindir.

## Geliştirme

```bash
npm install
npm run dev        # http://localhost:3000 (yerel mod)
NEXT_PUBLIC_BACKEND=1 OWNER_PASSWORD=deneme123 npm run dev   # sunucu modu; DATABASE_URL yoksa .data/ altında geçici depo
npm test           # hesaplama ve tanıtım verisi testleri
npm run typecheck
npm run build
```

Vercel'de yayınlamak için yeni bir proje oluşturup **Root Directory** olarak `melopee-panel` seçin.

## Yapı

```
src/lib/        types, tarih/para biçimleri, istatistik hesapları (stats.ts), tanıtım verisi (seed.ts), store + eşitleme
src/lib/ops.ts  tüm veri değişiklikleri (tarayıcı ve sunucu aynı işlemleri uygular)
src/server/     veritabanı (Neon / geliştirme deposu), oturum ve şifre, yetki kontrollü işlem uygulama
src/app/api/    giriş, veri, değişiklikler, işlemler, sıfırlama ve yedek uçları
src/components/ kabuk (menü, şube seçici), takvim, randevu formu, müşteri kartı, grafikler, ortak arayüz
src/app/panel/  yönetici sayfaları
src/app/personel/ personel paneli
```

Marka: web sitesiyle aynı kimlik; kum tonlu zemin, terrakota vurgu (`#B84C36`), Bricolage Grotesque başlıklar, Figtree metin ve Marcellus logo yazısı.
Grafik renkleri renk körlüğüne karşı doğrulanmış sabit bir sırayla atanır (`src/lib/constants.ts`).
