# Kaynaklar ve doğrulama

Sitedeki her bilginin nereden geldiği. Kural: doğrulanamayan hiçbir bilgi
sitede yer almaz. Metinlerin tamamı `content/site.ts` dosyasındadır.

## Sitede kullanılan bilgiler

| Bilgi | Kaynak | Not |
| --- | --- | --- |
| Ürün adları, 330 ml, içindekiler, besin değerleri, alerjen bilgisi, saklama ve çalkalama notları | Ürün ambalajları (`media-source/`) | Etiketten olduğu gibi aktarıldı. |
| Üretici: AN Zentrum Gıda İçecek Üretim İthalat İhracat Ltd. Şti. | Ürün ambalajları | |
| Üretim adresi: Bayburt Organize Sanayi Bölgesi, Bayburt / Türkiye | Ürün ambalajları | Bağımsız bir kaynakta OSB tesisi bulunamadı; sitede “ambalajdaki üretici bilgisi” olarak sunulur. |
| Menşei: Türkiye | Ürün ambalajları | |
| GADA’nın AN Zentrum’un soğuk çay markası olduğu | AN Zentrum’un Facebook sayfasındaki “GADA soğuk çay üretim aşamasına doğru yaklaşıyoruz” başlıklı video; Instagram @gadatea (konum: Bayburt); ambalajdaki üretici | |
| Instagram: [@gadatea](https://www.instagram.com/gadatea/) | Instagram profili (arama sonucu, konum Bayburt) | |
| Facebook: [AN Zentrum](https://www.facebook.com/anzentrumtr/) | Şirketin Facebook sayfası | |
| AN Zentrum’u Bayburtlu girişimci Muhammet Karaoğlu’nun Köln’de kurduğu, Bayburt’ta (Akşar) merkez ofisi olduğu, ByBurt 69 enerji içeceğini ürettiği | T.C. Bayburt Valiliği, Sabah, Haberler.com, 61Saat ve Taka Gazete haberleri (2021 ve sonrası) | Birden çok bağımsız haber kaynağında aynı bilgi. |
| Telefon: +90 458 222 73 69 · Adres: Akşar, Esentepe Mevkii, Merkez / Bayburt | Yandex Haritalar, tikla.com.tr ve find.com.tr firma kayıtları | ⚠ Firma rehberi kaydıdır; yayından önce şirketle teyit edilmesi önerilir. |
| Bayburt koordinatları (40°15′ K, 40°13′ D) | Genel coğrafi veri | Harita çizgisi: Natural Earth 1:50m (`world-atlas`). |
| Renk kodları | Ambalaj fotoğraflarından piksel örneklemesi | |
| “Doğanın tazeliği her yudumda.” | Kutuların sol yüzündeki el yazısı | Resmî slogan olduğu doğrulanamadı; bu yüzden açılışta slogan olarak değil, “kutunun sol yüzünden” diye kaynağıyla alıntılanır. |

## Bilerek kullanılmayanlar

- **Kuruluş yılı, marka hikâyesi, ödül, sertifika:** GADA için doğrulanabilir kaynak bulunamadı.
- **Resmî web sitesi ve e-posta:** Bulunamadı; sitede gösterilmez.
- **Barkod:** İki kutuda da aynı numara yazıyor (aşağıya bakın).
- **“Doğal aroma”, “Gerçek meyve / Gerçek limon” ifadeleri:** Ambalajda var ancak içindekiler listesinde yalnızca “aroma” geçiyor. Sitede iddia olarak tekrarlanmaz; yalnızca kutunun görüntüsünde görünürler.
- **Online satış bilgisi:** GADA ürünleri araştırılan perakende sitelerinde listelenmiyor; içerik bilgisi bu yüzden internetten çapraz kontrol edilemedi, tek kaynak ambalajdır.

## Ambalajda fark edilen tutarsızlıklar

Bunlar referans görsellerde görülen durumlardır; tasarım ekibine bilgi olarak:

1. Limon kutusunda üretici **“AnZentrum … Beyburt Organize Sanayi Bölgesi, Beyburt”** yazıyor; şeftali kutusunda **“AN Zentrum … Bayburt”**. Sitede doğru yazım (AN Zentrum, Bayburt) kullanıldı.
2. Şeftali kutusunda **“çay aromass”** yazım hatası var; sitede “çay aroması” olarak düzeltildi.
3. İki farklı ürün aynı barkodu taşıyor: **8683984027310**. Her ürünün ayrı bir GTIN numarası olmalı.
4. Limon kutusundaki **E102 (tartrazin)** renklendiricisi için Türk Gıda Kodeksi etikette ek bir uyarı ifadesi öngörüyor (“çocuklarda aktivite ve dikkat üzerinde olumsuz etkileri olabilir”). Görselde bu ifade görünmüyor; kontrol edilmesi önerilir.
5. Dört görünüm geometrik olarak birbirini tutmuyor (örneğin SAĞ ve SOL görünümlerin ikisinde de logo sol kenarda). Bu yüzden sitede kesintisiz bir 360° doku uydurulmadı; kutu, gerçek fotoğraflardan 2.5D olarak çizilir (README’ye bakın).
