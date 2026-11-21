# Çoruh Lokantası — Bayburt

Çoruh Lokantası için tek sayfalık, hızlı, mobil öncelikli tanıtım sitesi.
Saf HTML/CSS/JS'den oluşur; derleme adımı yoktur.

```
index.html     İçerik (menü, yorumlar, iletişim, SEO / JSON-LD)
styles.css     Tasarım (Çoruh yeşili · bakır · krem)
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

## İşletmeyle teyit edilmesi gerekenler

Bilgiler Google İşletme kaydı ve herkese açık dizinlerden alındı:

- Adres: Şeyh Hayran Mah., Cumhuriyet Cd. No:33, Bayburt (Google Haritalar kaydıyla doğrulandı)
- Telefon: (0458) 222 22 21
- Çalışma saatleri: Dizinde "her gün" görünüyor, kesin saatler sitede "Haftanın her günü açığız" olarak yazılı
- Menü: Yorumlarda geçen yemekler (kavurma, döner, pilav, çorbalar, güveç,
  sulu yemekler, kesme çorbası) ve klasik lokanta yemekleriyle hazırlanmış
  **taslak**. Gerçek menü ve isterseniz fiyatlar `index.html` içindeki
  `menu-list` bloklarına yazılmalı.
- Paket servis ve toplu sipariş hizmeti varsayıldı; yoksa metinden çıkarın.
- Yorumlar Google'daki gerçek yorumlardan kısa alıntılardır.

## Fotoğraflar

Şu anki fotoğraflar Wikimedia Commons'tan, **CC BY-SA 4.0** lisanslı
(atıf sayfa altında). Lokantanın kendi fotoğrafları çekildiğinde aynı adla
`images/` içine koymanız yeterli:

| Dosya          | Önerilen çekim                         | Oran |
| -------------- | -------------------------------------- | ---- |
| `hero.jpg`     | Dükkân cephesi / nehir manzarası        | 16:7 – 16:9 |
| `bayburt.jpg`  | İç mekân veya usta tezgâh başında       | 4:5 dikey |
| `kavurma.jpg`  | Bakır sahanda kavurma                   | 4:3 |
| `doner.jpg`    | Porsiyon döner                          | 4:3 |
| `pilav.jpg`    | Pilav üstü                              | 4:3 |
| `corba.jpg`    | Çorba                                   | 4:3 |
| `og.jpg`       | WhatsApp/sosyal medya önizleme görseli  | 1200×630 |

Kendi fotoğraflarınıza geçince sayfa altındaki "Fotoğraflar: …" atfını
silebilirsiniz.

Kaynaklar:
- [Coruh nehri bayburt 4 2022](https://commons.wikimedia.org/wiki/File:Coruh_nehri_bayburt_4_2022.jpg), [Coruh nehri bayburt 2 2022](https://commons.wikimedia.org/wiki/File:Coruh_nehri_bayburt_2_2022.jpg) — Özgür Esen
- [Kavurma in a sahan](https://commons.wikimedia.org/wiki/File:Kavurma_in_a_sahan.jpg), [Kavurma (veal)](https://commons.wikimedia.org/wiki/File:Kavurma_(veal).jpg), [Döner kebab in Ankara, Turkey](https://commons.wikimedia.org/wiki/File:D%C3%B6ner_kebab_in_Ankara,_Turkey.jpg), [Mercimek çorbası in Ankara, Turkey](https://commons.wikimedia.org/wiki/File:Mercimek_%C3%A7orbas%C4%B1_in_Ankara,_Turkey.jpg) — E4024
