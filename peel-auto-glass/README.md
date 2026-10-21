# Peel Auto Glass

Peel Auto Glass (Mississauga, Ontario) için kurumsal web sitesi. İngilizce (Kanada İngilizcesi).
Next.js 16 (App Router), TypeScript, Tailwind CSS 4. Backend ve veritabanı yok: iletişim yalnızca telefon ve e-posta.

```bash
npm install
npm run dev         # http://localhost:3000
npm run build       # üretim derlemesi
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # zamanlama ve erişim kontrolü birim testleri
```

## Sayfalar

| Rota | İçerik |
| --- | --- |
| `/` | Hero, hizmetler, neden biz, nasıl çalışır, SSS önizlemesi, iletişim |
| `/about`, `/faq`, `/contact` | Hakkımızda, gruplanmış SSS (erişilebilir akordeon), iletişim |
| `/privacy-policy`, `/terms-of-service`, `/cookie-policy`, `/warranty-and-service-policy` | Yasal sayfalar (footer'dan bağlı) |
| `/image-credits` | Fotoğraf kaynakları ve lisanslar (`noindex`) |
| `/experiments/automotive-glass` | **Özel**, korumalı deney sayfası (aşağıya bakın). Menüde, footer'da, sitemap'te yok |

## İş bilgileri

Doğrulanmış bilgiler `src/data/business.ts` içinde (telefon, e-posta, adres). Çalışma saati, fiyat, sertifika,
hizmet yarıçapı, müşteri yorumu **kasıtlı olarak yok**: işletme doğrulayana kadar eklenmemeli.
SSS, hizmet ve yasal metinlerdeki ifadeler yalnızca onaylı hizmetlere dayanır. Pratiğe uymayan bir ifade varsa düzeltin.

## Deney sayfası ve erişim koruması

`/experiments/automotive-glass`, kaydırmayla ön camın, yan camların ve arka camın araçtan ayrıldığı three.js
çalışmasıdır (prosedürel, markasız araç modeli). Kod `src/experiments/automotive-glass/` altında izole;
`three` yalnızca bu rotada yüklenir.

Koruma **sunucu tarafında** (`src/proxy.ts`, Next.js 16 proxy) HTTP Basic kimlik doğrulamasıyla yapılır ve sayfa
ayrıca kendi içinde de kontrol eder (`src/lib/experiment-auth.ts`):

- Kimlik bilgileri yalnızca ortam değişkenlerinden okunur: `EXPERIMENTS_USER`, `EXPERIMENTS_PASSWORD`
  (en az 16 karakter). Kaynak koda ve istemci paketlerine girmez.
- Değişkenler tanımlı değilse veya parola kısaysa rota **404** verir (fail closed).
- Yanıtlar `noindex, nofollow, noarchive` ve `Cache-Control: private, no-store` taşır.
- Rota sitemap'te, robots.txt'te ve herhangi bir menüde geçmez.

Yayında bu iki değişkeni Vercel → Project → Settings → Environment Variables altında tanımlayın. Güçlü, rastgele bir parola
kullanın.

Hareketi azaltma tercihi açıksa kaydırmaya bağlı animasyon çalışmaz; sabit, ayrılmış bir kompozisyon gösterilir.
Küçük ekranlarda yüzen etiketler yerine alt başlık kartı kullanılır.

## Ortam değişkenleri

Bkz. `.env.example`. `NEXT_PUBLIC_SITE_URL` gerçek alan adı belli olunca verilmeli (canonical, sitemap, OG, yapılandırılmış veri).

## Çerezler ve izleme

Site çerez bırakmaz, `localStorage`/`sessionStorage` kullanmaz, analitik/reklam/üçüncü taraf yazı tipi veya gömme içermez.
Çerez Politikası buna göre yazılmıştır. Analitik eklenirse politika **ve** onay mekanizması güncellenmelidir.

## Yasal metinler

Yasal sayfalar sade dille yazılmış taslaklardır; hukuki tavsiye değildir ve bir avukat tarafından gözden geçirilmemiştir.
Yayından önce işletme bunları gerçek uygulamalarıyla karşılaştırmalı (ör. e-posta sağlayıcısı, veri saklama, garanti koşulları)
ve tercihen bir hukuk danışmanına göstermelidir.

## Görseller

Logo ve referans fotoğraflar işletme tarafından sağlandı (`brand/`, `src/assets/`). Ek fotoğraflar Pexels Lisansı altındadır
ve `/image-credits` sayfasında kaynak gösterilmiştir. İşletme tarafından sağlanan fotoğrafların kullanım haklarını işletme
doğrulamalıdır.

## Yapı

```
brand/                      Orijinal logo
src/app/                    Rotalar, (site) düzeni, sitemap, robots, ikonlar, OG görseli
src/components/             Header, Footer, ButtonLink, bölümler, SSS, yasal düzen
src/data/                   business.ts, services.ts, faq.ts, credits.ts
src/experiments/            Yalıtılmış üç boyutlu deney
src/lib/                    metadata, experiment-auth (+ testi)
src/proxy.ts                /experiments erişim kapısı
src/fonts/                  Inter ve Archivo (SIL OFL), yerel barındırma
```

## Yayın (Vercel)

Depodaki kök `vercel.json` başka bir siteyi (`web`) yayınlar. Bu site için ayrı bir Vercel projesi açıp
**Root Directory = `peel-auto-glass`** seçin. Çerçeve otomatik algılanır.
