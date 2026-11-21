# Çoruh Lokantası — Bayburt

Çoruh Lokantası için tek sayfalık, hızlı, mobil öncelikli tanıtım sitesi.
Saf HTML/CSS/JS'den oluşur; derleme adımı yoktur.

```
index.html     İçerik (menü, yorumlar, iletişim, SEO / JSON-LD)
styles.css     Tasarım (logo renkleri: siyah · ateş turuncusu · kırmızı · beyaz)
script.js      Mobil menü, menü sekmeleri, kaydırma animasyonları
images/        Fotoğraflar, favicon, paylaşım görseli (og.jpg)
vercel.json    Vercel ayarları
```

## Yerelde açmak

```bash
cd coruh-lokantasi
python3 -m http.server 8000   # http://localhost:8000
```

## Yayına almak (Vercel)

Vercel'de yeni proje oluşturun → bu depoyu seçin → **Root Directory:
`coruh-lokantasi`**, Framework: **Other**. Derleme komutu gerekmez.
Şu an yayında: https://coruh-lokantasi.vercel.app
Alan adı alındığında `index.html` içindeki `https://coruh-lokantasi.vercel.app`
adreslerini (canonical, og:image, JSON-LD) gerçek adresle değiştirin.

## İçerik kaynağı

Bilgiler lokantanın Google İşletme Profili'nden alındı (Kasım 2026):
işletme açıklaması, çalışma saatleri (her gün 06:00–00:00), hizmetler
(teras, paket servis, adrese teslim, rezervasyon, Wi-Fi, kredi kartı),
menü tabelası fotoğrafı ve yorumlar.

- **Menü** profildeki menü tabelasından aktarıldı. Tabelada el yazısıyla
  fiyatlar var ama tarihi belli olmadığı için sitede fiyat gösterilmiyor.
  Fiyat eklenecekse `index.html` içindeki `menu-list` maddelerine yazılabilir.
- **Yorum alıntıları** Google'daki gerçek yorumlardan kısaltıldı.
- **Fotoğraflar** Google profilindeki fotoğraflardan seçildi. Bir kısmı
  müşteriler tarafından yüklenmiş olabilir; yayından önce işletme sahibinin
  onayı alınmalı ya da sahibin kendi çektiği fotoğraflarla değiştirilmeli.

## Fotoğrafları değiştirmek

Aynı adla `images/` içine koymanız yeterli:

| Dosya                    | İçerik                          | Oran |
| ------------------------ | ------------------------------- | ---- |
| `hero.jpg`               | Terastan nehir ve kale manzarası | 4:3 |
| `teras.jpg`              | Teras                           | 4:5 dikey |
| `doner-ates.jpg`         | Odun ateşinde döner             | 1:1 |
| `pilav-ustu-doner.jpg`   | Pilav üstü döner                | 4:3 |
| `corba.jpg`              | Çorba                           | 4:3 |
| `sutlac.jpg`             | Fırın sütlaç                    | 4:3 |
| `galeri-*.jpg`           | Mekân galerisi                  | 4:3 |
| `og.jpg`                 | WhatsApp/sosyal medya önizlemesi | 1200×630 |
| `logo.png`, `logo-sm.png`, `favicon.png` | Logo (şeffaf arka planlı) | — |
