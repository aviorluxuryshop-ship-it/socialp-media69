# PRIME KIDS — Çocuk Giyim Online Mağazası

Anne-babalar için güven veren, mobilde kusursuz çalışan çocuk giyim mağazası.
Next.js 16 (App Router), TypeScript, Tailwind CSS. Tüm sayfalar statik üretilir;
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
| `/` | Ana sayfa: hero, hızlı kategoriler, güvenceler, yeni sezon, yaşa göre alışveriş, renk vitrini, beden bulucu, hizmetler, galeri, SSS |
| `/urunler` | Tüm ürünler — kategori, yaş, kışlık filtresi, arama, sıralama (filtreler adrese yazılır, paylaşılabilir) |
| `/urun/[slug]` | Ürün detayı — renk/beden seçimi, beden rehberi penceresi, teslim tarihi tahmini, mobilde yapışkan “Sepete Ekle” |
| `/sepet` | Sepetim — adet/beden değiştirme, geri alınabilir silme, ücretsiz kargo çubuğu, ücretsiz hediye paketi + not |
| `/odeme` | Güvenli ödeme — üyeliksiz, adres formu (81 il), fatura adresi, sözleşme onayı, ödeme yöntemi |
| `/siparis-alindi` | Sipariş onayı — sipariş no, IBAN, siparişi WhatsApp’tan iletme |
| `/hizmetler` | Beden danışmanlığı, kolay değişim, aynı gün kargo, hediye paketi, kardeş kombini, toplu sipariş |
| `/galeri` | Filtrelenebilir galeri, kaydırılabilir büyük görüntüleyici, “Ürüne git” |
| `/beden-rehberi` | Boya göre beden bulucu, beden tablosu, ölçüm rehberi |
| `/iletisim` | WhatsApp, telefon, e-posta, çalışma saatleri, şirket bilgileri, iletişim formu |
| `/hakkimizda`, `/sss` | Marka hikâyesi, sıkça sorulan sorular |
| `/yasal/*` | Mesafeli Satış Sözleşmesi, Ön Bilgilendirme Formu, İade ve Değişim, Kargo ve Teslimat, KVKK Aydınlatma Metni, Gizlilik, Çerez Politikası, Güvenli Alışveriş, Kullanım Koşulları |

## Nereden ne değişir?

| Dosya | Ne için |
| --- | --- |
| `data/site.ts` | Marka, WhatsApp/telefon/e-posta, Instagram & Trendyol, **şirket (satıcı) bilgileri**, IBAN, kargo ücreti ve eşiği, iade süresi, Primo açık/kapalı |
| `data/products.ts` | Ürünler, fiyatlar, renkler, bedenler, kumaş ve bakım bilgileri, beden tablosu |
| `data/faq.ts` | Sıkça sorulan sorular |
| `data/legal.ts` | Yasal metinler (satıcı bilgileri otomatik doldurulur) |
| `public/images/products/` | Ürün fotoğrafları (`<model>-<renk>.jpg`) |

Yeni ürün: fotoğrafı `public/images/products/` içine koyun, `data/products.ts` dizisine
bir nesne ekleyin. Liste, filtreler, galeri, sitemap ve arama otomatik güncellenir.

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

## Primo (stil asistanı)

Logodaki sade siyah-beyaz dile uygun, tek renkli çizgisel bir karakter. Kullanıcı
sayfayı biraz kaydırdıktan sonra sağ altta belirip sayfaya özel bir ipucu verir
(kışlık ürünler, beden bulucu, WhatsApp desteği…). Oturum başına en fazla 3 kez çıkar,
15 sn sonra kendiliğinden kaybolur, “Bir daha gösterme” seçeneği vardır ve **sepet,
ödeme ve yasal sayfalarda hiç görünmez**. Kapatmak için `data/site.ts › mascot.enabled = false`.

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
