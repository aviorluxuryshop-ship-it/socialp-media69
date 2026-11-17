# PRIME KIDS — Çocuk Giyim Online Mağazası

Anne-babalar için güven veren, mobilde kusursuz çalışan çocuk giyim mağazası.
Next.js 16 (App Router), TypeScript, Tailwind CSS. Yazı tipleri: Fredoka (başlık) + Nunito (metin). Tüm sayfalar statik üretilir;
sepet tarayıcıda tutulur, ödeme altyapısı tek bir noktadan bağlanacak şekilde hazırdır.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # üretim derlemesi
npm run lint       # ESLint
npm run typecheck  # TypeScript
```

## Sayfalar

| Adres | İçerik |
| --- | --- |
| `/` | Ana sayfa: karşılama, kayan “Öne çıkanlar” vitrini, Kız / Erkek / Bebek & Mini kutuları, tüm ürünler, güvenceler, Instagram/Trendyol |
| `/urunler` | Tüm ürünler — kategori, yaş, kışlık filtresi, arama, sıralama (filtreler adrese yazılır, paylaşılabilir) |
| `/urun/[slug]` | Ürün detayı — renk/beden seçimi, beden rehberi penceresi, teslim tarihi tahmini, mobilde yapışkan “Sepete Ekle” |
| `/sepet` | Sepetim — adet/beden değiştirme, geri alınabilir silme, ücretsiz kargo çubuğu, ücretsiz hediye paketi + not |
| `/odeme` | Güvenli ödeme — üyeliksiz, adres formu (81 il), fatura adresi, sözleşme onayı, ödeme yöntemi |
| `/siparis-alindi` | Sipariş onayı — sipariş no, IBAN, siparişi WhatsApp’tan iletme |
| `/hizmetler` | Beden danışmanlığı, kolay değişim, aynı gün kargo, hediye paketi, kardeş kombini, toplu sipariş |
| `/beden-rehberi` | Boya göre beden bulucu, beden tablosu, ölçüm rehberi |
| `/iletisim` | WhatsApp, telefon, e-posta, çalışma saatleri, şirket bilgileri, iletişim formu |
| `/hakkimizda`, `/sss` | Marka hikâyesi, sıkça sorulan sorular |
| `/yasal/*` | Mesafeli Satış Sözleşmesi, Ön Bilgilendirme Formu, İade ve Değişim, Kargo ve Teslimat, KVKK Aydınlatma Metni, Gizlilik, Çerez Politikası, Güvenli Alışveriş, Kullanım Koşulları |

## Nereden ne değişir?

| Dosya | Ne için |
| --- | --- |
| `data/site.ts` | Marka, WhatsApp/telefon/e-posta, Instagram & Trendyol, **şirket (satıcı) bilgileri**, IBAN, kargo ücreti ve eşiği, iade süresi |
| `data/products.ts` | Ürünler, fiyatlar, renkler, bedenler, kumaş ve bakım bilgileri, beden tablosu |
| `data/featured.ts` | Ana sayfadaki kayan vitrin: hangi ürün, hangi renk fotoğrafı, hangi etiket (“En Çok Sepete Eklenen”, “Kışın En İyisi”…) |
| `data/faq.ts` | Sıkça sorulan sorular |
| `data/legal.ts` | Yasal metinler (satıcı bilgileri otomatik doldurulur) |
| `public/images/products/` | Ürün fotoğrafları (`<model>-<renk>.jpg`) |

Yeni ürün: fotoğrafı `public/images/products/` içine koyun, `data/products.ts` dizisine
bir nesne ekleyin. Liste, filtreler ve sitemap otomatik güncellenir.

## Yayın öncesi kontrol listesi

Sitede `GÜNCELLENECEK` yazan her yer gerçek bilgiyle değiştirilmelidir:

- [ ] `data/site.ts › company` — ünvan, adres, vergi dairesi/no, MERSİS, KEP (Mesafeli Satış Sözleşmesi için yasal zorunluluk)
- [ ] `data/site.ts › contact` — gerçek WhatsApp hattı (`905XXXXXXXXX`), telefon, e-posta
- [ ] `data/site.ts › bank` — banka adı, hesap sahibi, IBAN
- [ ] `data/site.ts › social` — Instagram ve Trendyol adresleri (boşken sitede görünmez)
- [ ] `data/site.ts › shipping` — kargo firması, ücret, ücretsiz kargo eşiği, kargoya veriliş saati
- [ ] `data/products.ts` — gerçek fiyatlar, kumaş içerikleri (`// GÜNCELLENECEK` yorumlu satırlar), stoktaki bedenler
- [ ] Vercel’de `NEXT_PUBLIC_SITE_URL` = alan adınız (ör. `https://primekids.com.tr`)
- [ ] Yasal metinleri bir hukuk danışmanına kontrol ettirin; ETBİS kaydı yapın

## Ödeme altyapısını bağlamak (iyzico / PayTR)

Kart bilgisi bu projede **hiçbir yerde** istenmez; kart, lisanslı ödeme kuruluşunun
kendi güvenli sayfasında/iframe’inde girilir. Bağlantı noktası tek dosyadır:

1. `app/api/odeme/route.ts` oluşturun: siparişi sağlayıcıya gönderip ödeme sayfası adresini/iframe token’ını döndürsün (API anahtarları Vercel ortam değişkeni olarak).
2. `lib/payment.ts › startPayment` içindeki kart dalında bu route’u çağırıp `{ status: 'redirect', url }` döndürün.
3. `data/site.ts › payment.cardEnabled = true` yapın — ödeme ekranında kart seçeneği açılır.
4. Sağlayıcının başarı/geri dönüş adresini `/siparis-alindi` olarak tanımlayın; sunucu tarafı bildirim (callback) ile siparişi doğrulayın.

Bağlanana kadar siparişler **Havale/EFT** ile alınır: onay sayfası IBAN’ı gösterir ve
sipariş özeti tek dokunuşla mağazanın WhatsApp hattına gönderilir.

## Öne çıkanlar vitrini

Ana sayfada karşılamanın hemen altında. Her 2 saniyede bir sonraki ürüne kayar,
sondan sonra başa döner; parmakla ya da fareyle elle kaydırılabilir. Üzerine
gelince, dokununca veya klavyeyle odaklanınca durur, düğmeye basıldıktan sonra
4 sn bekler; “Durdur” düğmesiyle tamamen durdurulur. Telefonda “hareketi azalt”
açıksa kendiliğinden kaymaz.

Etiketler (`data/featured.ts`) şu an örnek olarak dağıtılmıştır; gerçek satış
verinize göre (ör. Trendyol’da en çok sepete eklenen ürün) değiştirin.

## Kenardan bakan çocuklar

`components/Peekers.tsx` içinde dört farklı küçük çocuk çizimi var: gözlüklü sarışın,
topuzlu kız, bereli çocuk ve kıvırcık saçlı kız. Sayfa açıldıktan ~5 sn sonra, sonra
da 20-38 sn arayla (sayfa başına en fazla 4 kez) ekranın sağından ya da solundan
"pencereden bakar gibi" başını uzatıp el sallar ve ~4 sn sonra kaybolur.

Mesaj vermezler, dokunmayı engellemezler (`pointer-events: none`), sepet ve
ödemede çıkmazlar, telefonda "hareketi azalt" açıksa hiç gösterilmezler.

## Önizleme modu

`data/site.ts` içindeki WhatsApp numarası ve şirket ünvanı deneme verisiyken
ödeme ve sipariş onay sayfalarında “Önizleme sürümü” notu görünür ve müşteri
Trendyol mağazasına yönlendirilir. Gerçek bilgiler girilince not kendiliğinden kalkar.

## Dağıtım (Vercel)

Bu klasör depo içinde bağımsız bir projedir. Vercel’de yeni proje oluşturup
**Root Directory** alanını `prime-kids` yapmanız yeterli. Depodaki diğer projeler
(`web/`, `bayburt-store/`) etkilenmez.

## Kalite

- Mobil öncelikli; 320 px’e kadar yatay kayma yok, dokunma alanları ≥ 44 px
- WCAG 2.1 AA (axe-core) kontrollerinden geçer; klavye ve ekran okuyucu ile kullanılabilir
- Yazı tipleri kendi sunucumuzdan (Google’a istek yok — KVKK dostu), görseller AVIF/WebP
- JavaScript yüklenmeden de ürün adı ve fiyat görünür; yavaş 3G’de ilk yük ≈ 520 KB
- “Hareketi azalt” tercihine uyar; animasyonlar yalnızca hafif kaydırma geçişleri
