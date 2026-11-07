# Güneşli Garaj — Duvar Giydirme (600 × 420 cm)

## Dosyalar

| Dosya | Açıklama |
|---|---|
| `GunesliGaraj+ABSPlast_Duvar_600x420cm_OLCEK-1-10.pdf` | **Ana baskı dosyası.** Güneşli Garaj logosu + altta ABS Plast |
| `GunesliGaraj_Duvar_600x420cm_OLCEK-1-10.pdf` | Alternatif: sadece Güneşli Garaj logosu |
| `onizleme_*.jpg` | Onay ve paylaşım için önizleme (baskıya gönderilmez) |
| `olculu-sunum_*.jpg` | Ölçüleri gösteren sunum görseli |
| `kaynak/` | Orijinal logo dosyası ve dosyayı yeniden üreten script |

## Baskıcıya iletilecek bilgiler

- **Ölçek: 1:10.** PDF sayfası 610 × 430 mm. **%1000 (10 kat) büyütülerek** basılacak.
  (Illustrator'da çalışma alanı en fazla 577 cm olduğu için bu boyuttaki işler 1:10 ölçekte hazırlanır.)
- **Net ölçü:** 600 × 420 cm (PDF içinde TrimBox olarak tanımlı).
- **Taşma payı:** Her kenarda 5 cm (1:10 dosyada 5 mm). Taşma bölgesinde arka plan devam ediyor.
  Kesimden sonra duvara tam 600 × 420 cm kalır.
- **Renk modu:** CMYK.
  - Logo kırmızısı: C0 M100 Y100 K0 (orijinal logodaki değer)
  - ABS mavisi: C100 M20 Y0 K0 (orijinal logodaki değer)
  - Zemin: zengin siyah (en koyu bölgeler yaklaşık C50 M40 Y40 K100), toplam mürekkep en fazla %290
  - Logo yazıları: beyaz (mürekkepsiz, malzemenin beyazı)
- **Çözünürlük:**
  - Logo, yazılar, kırmızı çizgiler ve ayraçlar **vektörel**. Her boyutta keskin basılır.
  - Arka plan (degrade, karbon fiber doku, ışık efektleri) gerçek ölçüde **100 dpi**,
    1:10 dosyada 1000 dpi'ye karşılık gelir. Duvar giydirme için fazlasıyla yeterli.
- Dosyada font yok. Tüm yazılar eğriye çevrilmiş durumda.

## Yerleşim notları

- Logo duvarın üst-orta bölümünde. Yerden yükseklikler:
  - Ana dosya (ABS Plast'lı): "GÜNEŞLİ GARAJ" yazısı 2,27–2,75 m, amblemin üstü 3,14 m, ABS Plast 1,38–1,73 m.
    Logo genişliği 350 cm, ABS Plast genişliği 190 cm.
  - Alternatif (sadece Güneşli Garaj): yazı 1,97–2,48 m, amblemin üstü 2,89 m. Logo genişliği 370 cm.
- Alt 1,3 metrede önemli bir öğe yok, dolayısıyla duvar önüne mobilya ya da araç gelse de logo görünür kalır.
- Köşelerdeki kırmızı çizgiler ve karbon fiber paneller bilerek kenardan taşacak şekilde tasarlandı.
- Duvar şeritler halinde (ör. 1,26 / 1,37 / 1,52 m'lik rulolar) basılacaksa bindirme payını
  baskıcı kendi RIP programında ekler. Dosyada ayrıca bindirme payı yok.

## Yeniden üretmek / değiştirmek için

```bash
pip install pymupdf pikepdf numpy pillow
python3 kaynak/duvar_uret.py kaynak/GG_LOGO.pdf cikti 100 --variants=A,B --scales=10
# --scales=1 verilirse 1:1 (gerçek ölçü) PDF de üretilir
```
