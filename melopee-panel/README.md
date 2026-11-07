# Melopée Panel

Melopée Nail Studio için CRM ve yönetim paneli (Next.js). İki şubeli yapıya göre tasarlandı: her ekranda
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

İlk açılışta örnek veri yüklenir (2 şube, 6 personel, ~500 müşteri, 4 aylık randevu ve gelir-gider).

- Yönetici PIN: `0000`
- Personel PIN'leri: Ece `1111`, Selin `2222`, Derya `3333`, Buse `4444`, İrem `5555`, Naz `6666`

Gerçek kullanıma geçerken: **Ayarlar → Boş başla** (şubeler ve hizmet listesi kalır), ardından şube
bilgilerini, personeli ve PIN'leri girin; yönetici PIN'ini değiştirin.

## Önemli: veri nerede saklanıyor?

Bu sürümde veriler **tarayıcının yerel deposunda** (localStorage) tutulur. Yani:

- Veriler yalnızca kullanılan cihazda/tarayıcıda durur; personelin kendi telefonundan gördüğü program,
  yöneticinin bilgisayarındaki kayıtlarla **otomatik eşitlenmez**.
- PIN girişi cihaz üzerinde yapılan basit bir ayrımdır, sunucu tarafı güvenlik değildir.
- Düzenli olarak **Ayarlar → Yedek indir** ile yedek alın.

Çok cihazlı gerçek kullanım için sonraki adım bir sunucu/veritabanı (ör. Firebase veya Supabase) ile
kimlik doğrulama ve rol tabanlı erişim eklemektir. Uygulamadaki tüm veri işlemleri `src/lib/store.ts`
içinde toplandığı için bu geçiş arayüzü değiştirmeden yapılabilir.

## Geliştirme

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # hesaplama ve tanıtım verisi testleri
npm run typecheck
npm run build
```

Vercel'de yayınlamak için yeni bir proje oluşturup **Root Directory** olarak `melopee-panel` seçin.

## Yapı

```
src/lib/        types, tarih/para biçimleri, istatistik hesapları (stats.ts), tanıtım verisi (seed.ts), store
src/components/ kabuk (menü, şube seçici), takvim, randevu formu, müşteri kartı, grafikler, ortak arayüz
src/app/panel/  yönetici sayfaları
src/app/personel/ personel paneli
```

Marka: sıcak fildişi zemin, gül kurusu vurgu (`#A3486A`), Cormorant Garamond başlıklar ve Manrope metin.
Grafik renkleri renk körlüğüne karşı doğrulanmış sabit bir sırayla atanır (`src/lib/constants.ts`).
