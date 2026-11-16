# Prime Kids — Online Mağaza

Çocuk giyim markası Prime Kids'in online mağazası. Next.js 16 (App Router) + React 19 + Tailwind 3.

```bash
npm install
cp .env.example .env.local   # isteğe bağlı; deneme modunda zorunlu değil
npm run dev                  # http://localhost:3000
npm run build && npm start
npx tsc --noEmit             # tip denetimi
```

> **Şu an DENEME AŞAMASINDA.** Ödeme sağlayıcısı `mock` (gerçek ödeme almaz) ve aşağıda listelenen
> değerler örnektir. Yayına almadan önce "Yayın öncesi kontrol listesi"ni tamamlayın.

## Sayfalar

| Adres | İçerik |
| --- | --- |
| `/` | Ana sayfa: ne satıyoruz, ürünlere git, güvenceler, kategoriler, nasıl satın alınır, iletişim |
| `/urunler`, `/urunler?kategori=kiz\|erkek\|mini` | Ürün listesi, kategori ve fiyat sıralaması |
| `/urun/[slug]` | Ürün: renk, beden, stok uyarısı, kumaş, bakım, kargo/iade özeti, benzer ürünler |
| `/hizmetlerimiz` | Hizmetler + beden rehberi (`#beden-rehberi`) |
| `/galeri` | Serilere ayrılmış fotoğraflar, lightbox, ürüne geçiş |
| `/iletisim` | Telefon, WhatsApp, e-posta, adres, saatler, Instagram, Trendyol, form |
| `/sepet` → `/odeme` → (ödeme sağlayıcı) → `/siparis-onay` | Alışveriş akışı |
| `/odeme/deneme` | Yalnızca `mock` sağlayıcıda açılan deneme ödeme sayfası |
| `/yasal`, `/yasal/[slug]` | 8 yasal metin |
| `/teslimat-iade` | Eski adres → `/yasal/teslimat-kargo` (kalıcı yönlendirme, `next.config.mjs`) |

## Tek yerden yönetim

| Ne değişecek? | Dosya |
| --- | --- |
| Şirket bilgileri, telefon, WhatsApp, e-posta, adres, çalışma saatleri, Instagram/Trendyol, kargo ücreti ve süreleri, iade süresi/politikası, ödeme sağlayıcısı, ana menü, beden rehberi | `src/data/site.ts` |
| Ürünler: ad, fiyat, beden, renk, fotoğraf, kumaş, bakım, stok, rozet, öne çıkanlar | `src/data/products.ts` |
| Hizmetler sayfası, galeri serileri, "nasıl satın alırım" adımları | `src/data/content.ts` |
| Yasal metinler (şirket bilgileri `site.ts`'den otomatik dolar) | `src/content/legal.ts` |

**Yeni ürün:** fotoğrafı `public/products/` altına koyun (dikey, 2:3, tercihen 1024×1536 `.webp`),
`products.ts` içindeki listeye bir kayıt ekleyin. Ürün sayfası, liste, site haritası ve sunucu
tarafı fiyat hesabı otomatik güncellenir. Galeriye eklemek için `content.ts → gallerySeries`.

**Fiyat değişikliği:** `products.ts → price`. Sepet, ödeme tutarı ve JSON-LD aynı değeri okur.

**Stok:** `products.ts → stock`. Yalnızca istisnalar yazılır: `stock: { siyah: { "8 yaş": 2 } }`.
`0` = tükendi (seçilemez), `1–3` = "son X adet" uyarısı, yazılmayan = stokta.
Gerçek zamanlı stok takibi yoktur; satış oldukça elle güncellenir.

## Örnek (yer tutucu) değerler

Kodda `ÖRNEK` yorumuyla işaretlidir (`grep -rn "ÖRNEK" src`). Sitede "örnek" diye görünmezler;
**yayından önce gerçekleriyle değiştirilmelidir:**

`src/data/site.ts`
- `url` (alan adı), `company.*` (ticari unvan, MERSİS, vergi dairesi/no, adres, KEP)
- `contact.*` — **telefon, WhatsApp numarası ve e-posta gerçek değildir**; başka birine ait olabilir, ilk iş değiştirin
- `contact.hours` (çalışma saatleri)
- `shipping.*` — ücretsiz kargo limiti (1.500 ₺), kargo ücreti (79 ₺), kargo firması, kargoya verme ve teslim süreleri, iade adresi
- `shipping.returnShippingPolicy` — cayma iadesinde iade kargosunu kimin ödediği (İade ve Değişim metnine aynen girer)
- `shipping.giftWrap` — ücretsiz hediye paketi sunuluyor mu
- `payment.legalName` — yasal metinlerde geçen ödeme kuruluşu adı (deneme/`mock` modunda metinlerde ad geçmez, "anlaşmalı ödeme kuruluşu" yazılır)
- `sizeGuide` — yaş / boy / kilo tablosu

`src/data/products.ts`
- Tüm fiyatlar, beden aralıkları, kumaş/kompozisyon (`fabric`), bakım önerileri (`care`), stok adetleri (`stock`)

`src/data/content.ts`
- Hizmet açıklamaları (hediye paketi, toplu sipariş vb. gerçekten sunulanlara göre düzenleyin)

Doğru olanlar: marka adı, Instagram (`@primeekids`), Trendyol mağaza bağlantısı, ürün fotoğrafları.

## Ödeme

### Şu anki durum: deneme modu

`site.ts → payment.provider = "mock"`. Akış uçtan uca çalışır ama **gerçek ödeme alınmaz**:
`/odeme` → `POST /api/checkout` → `/odeme/deneme` (kart istemeyen deneme sayfası) →
`POST /api/payment/callback` → `/siparis-onay`. Kullanıcıya ödeme adımında, deneme sayfasında ve
onay sayfasında bunun deneme olduğu açıkça yazılır; müşteri bilgileri hiçbir yere kaydedilmez.
Deneme süresince gerçek sipariş kanalı WhatsApp'tır (uyarı kutusundaki bağlantı sepeti mesaja döker).

### Mimari

```
src/lib/pricing.ts          sepet → fiyat (istemci ve sunucu aynı fonksiyon; kaynak products.ts)
src/lib/checkout.ts         müşteri formu tipi + doğrulama (istemci ve sunucu ortak)
src/lib/orders.ts           sipariş numarası + HMAC imzalı sipariş özeti (token)
src/lib/payment/types.ts    PaymentProvider arayüzü, Order, PaymentSession, PaymentResult
src/lib/payment/mock.ts     deneme sağlayıcısı
src/lib/payment/index.ts    sağlayıcı kaydı (getPaymentProvider)
src/app/api/checkout/route.ts          doğrular, fiyatı YENİDEN hesaplar, ödemeyi başlatır
src/app/api/payment/callback/route.ts  sağlayıcı sonucunu doğrular, onaya yönlendirir
```

- İstemciden yalnızca ürün/renk/beden/adet alınır; fiyat, kargo ve toplam sunucuda `products.ts`
  ve `site.ts` üzerinden hesaplanır. Stokta olmayan ya da değişmiş sepet reddedilir.
- `PaymentSession` üç biçimi destekler; `/odeme` sayfası üçünü de açabilir:
  `redirect` (ortak ödeme sayfası), `iframe` (PayTR iFrame), `form` (gizli form POST / 3D).
- Onay sayfası yalnızca imzalı ve "ödendi" durumundaki belirteçle açılır.

### Gerçek ödeme sağlayıcısını bağlama (iyzico / PayTR / Param …)

1. **Hesap ve anahtarlar.** Sağlayıcıdan test (sandbox) anahtarlarını alın. `.env.example`'ı
   `.env.local` olarak kopyalayıp doldurun; Vercel'de Project → Settings → Environment Variables'a
   ekleyin. `ORDER_SIGNING_SECRET` zorunludur (`openssl rand -base64 32`). Anahtarları koda ya da
   `NEXT_PUBLIC_` değişkenlerine yazmayın.
2. **Sağlayıcı dosyası.** `src/lib/payment/iyzico.ts` (ya da `paytr.ts`) oluşturup `PaymentProvider`
   arayüzünü uygulayın:
   - `createPayment(order, ctx)`: `order.total`, `order.items`, `order.customer` ile sağlayıcının
     "ödeme başlat" API'sini çağırın; dönüş adresi olarak `ctx.callbackUrl` verin.
     - iyzico Checkout Form: `paymentPageUrl` → `{ kind: "redirect", url }`
     - PayTR iFrame: token → `{ kind: "iframe", url: "https://www.paytr.com/odeme/guvenli/<token>" }`
     - Klasik 3D sanal POS: `{ kind: "form", action, fields }`
   - `verifyCallback({ fields })`: sonucu **mutlaka doğrulayın** (iyzico: dönen `token` ile sonuç
     sorgusu; PayTR: `hash` karşılaştırması). Doğrulanamayan her sonuç `failed` olmalı.
     PayTR bildirimi sunucudan sunucuya gelir ve düz `OK` bekler: `{ status, reply: "OK" }` döndürün;
     kullanıcı dönüşü için PayTR'ye `merchant_ok_url`/`merchant_fail_url` verin.
3. **Kaydı güncelleyin.** `src/lib/payment/index.ts` içindeki `providers` listesine ekleyin,
   `site.ts → payment.provider` değerini değiştirin (gerekirse `PaymentProviderId` tipine yeni ad ekleyin).
4. **Siparişi kalıcı kaydedin.** Şu an veritabanı yok. `api/checkout/route.ts` ve
   `api/payment/callback/route.ts` içindeki `YAYIN NOTU` satırlarına: siparişi (müşteri + adres dahil)
   veritabanına yazma, callback'te `orderId` ile okuyup durumunu güncelleme, stok düşme ve
   müşteriye/mağazaya sipariş e-postası gönderme adımlarını ekleyin. Onay sayfasındaki "sipariş özetiniz
   e-posta ile gönderilecek" cümlesi bu adıma bağlıdır.
5. **Test.** `payment.sandbox = true` iken sağlayıcının test kartlarıyla başarılı / başarısız /
   3D iptal senaryolarını deneyin (deneme modu uyarısı görünmeye devam eder).
6. **Canlı.** Canlı anahtarları girin, `payment.sandbox = false` yapın, `payment.legalName`'i
   sağlayıcının adıyla güncelleyin, küçük tutarlı gerçek bir sipariş verip iade edin.

Notlar: iyzico alıcı için TCKN ister (bireyselde alan eklemeniz ya da sağlayıcının önerdiği yöntemi
kullanmanız gerekir). Taksit, kapıda ödeme ve havale şu an yoktur.

## Yasal metinler

`src/content/legal.ts` içindeki 8 belge (KVKK aydınlatma, gizlilik, çerez, mesafeli satış, ön
bilgilendirme, iade-değişim, teslimat-kargo, güvenli alışveriş) **şablondur; hukuki danışmanlık
yerine geçmez.** Her sayfada bu not görünür. Yayından önce bir hukukçuya inceletin; şirket bilgileri
`site.ts`'den otomatik dolduğu için önce oradaki örnek değerleri düzeltin.

Ödeme adımında Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi onayı zorunludur (sunucuda da
denetlenir). Onayın kaydı (tarih, IP, metin sürümü) henüz saklanmıyor; sipariş kaydıyla birlikte eklenmelidir.

### Çerezler ve analitik

Site şu anda **çerez, analitik ya da reklam pikseli kullanmıyor**; yalnızca tarayıcı depolaması var:
`localStorage` (sepet) ve `sessionStorage` (ödeme formu taslağı, sekme kapanınca silinir). Bu yüzden
çerez onay penceresi yoktur ve Çerez Politikası bunu böyle anlatır. **Google Analytics, Meta Pixel
vb. eklenirse** onay (rıza) penceresi eklemek ve Çerez Politikası'nı güncellemek gerekir.

## Tasarım notları

- Palet: sıcak kâğıt zemin, mürekkep siyahı, tek vurgu koyu çam yeşili (`tailwind.config.js`).
  Logo monokrom olduğu için birincil düğmeler siyahtır; yeşil yalnızca bağlantı ve onaylarda kullanılır.
- Fotoğraflar her yerde 2:3 oranında gösterilir: takımın üstü ve altı birlikte kadrajda kalır.
- Hareket: hover, çekmece/pencere açılışı, sepet sayacı. `prefers-reduced-motion` desteklenir.
- Menü, mini sepet ve galeri görüntüleyici yerel `<dialog>` kullanır (odak hapsi, ESC ile kapanma).

## Yayın öncesi kontrol listesi

- [ ] `site.ts`, `products.ts`, `content.ts` içindeki tüm `ÖRNEK` değerler gerçekleriyle değişti
- [ ] Gerçek ödeme sağlayıcısı bağlandı, sipariş kaydı ve sipariş e-postası eklendi
- [ ] `ORDER_SIGNING_SECRET` ve `NEXT_PUBLIC_SITE_URL` ortam değişkenleri tanımlandı
- [ ] Yasal metinler hukukçu tarafından gözden geçirildi
- [ ] ETBİS kaydı ve gerekiyorsa İYS (ticari ileti) yükümlülükleri kontrol edildi

## Vercel

Bu klasör depoda ayrı bir projedir: Vercel'de **Root Directory = `prime-kids`** seçin
(Framework: Next.js, varsayılan build ayarları). Kökteki `vercel.json` başka projelere aittir.
