# Peel Auto Glass

Peel Auto Glass için ön yüz sitesi (İngilizce, Peel Region / Ontario müşterilerine yönelik).
Next.js 16 (App Router), TypeScript ve Tailwind CSS 4. Tek sayfa, tamamen statik.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # üretim derlemesi
npm run typecheck
```

## Yayına almadan önce DEĞİŞTİRİN

Tüm işletme bilgisi tek dosyada: `src/data/site.ts`

| Alan | Şu an | Not |
| --- | --- | --- |
| `phone` | `(905) 555-0100` | Uydurma yer tutucu. Gerçek numarayla değiştirin. |
| `email` | `info@example.com` | Yer tutucu. Teklif formu bu adrese gider. |
| `hours` | `Mon–Sat · 8 AM – 6 PM` | Yer tutucu. |
| `services`, `faqs`, `areas`, `reasons` | Tipik oto cam hizmetleri | **Gerçek işletmenize uymayanı silin** (ör. mobil servis, ADAS kalibrasyonu, hizmet bölgesi). |

Telefon hâlâ yer tutucu iken site arama motorlarına kapalıdır
(`noindex` + `robots.txt` → `Disallow: /`). Gerçek numarayı yazınca otomatik açılır.
Yapılandırılmış veri (JSON-LD) de telefonu ancak gerçek olunca yayınlar.

## Teklif formu

Şimdilik arka uç yok: form, ziyaretçinin e-posta uygulamasını bilgiler doldurulmuş
şekilde açar (`mailto:`). Üst düzey çözüm için ileride bir form servisi
(Formspree, Resend vb.) veya Vercel fonksiyonu bağlanabilir — `src/components/QuoteForm.tsx`.

## Yapı

```
brand/            Orijinal logo (beyaz arka planlı JPEG)
public/logo.webp  Arka planı şeffaflaştırılmış logo
src/app/          layout, sayfa, sitemap, robots, icon / apple-icon / OG görseli
src/components/   Header, Hero, Services, Process, WhyUs, ServiceArea, Faq, QuoteForm, Footer, MobileBar
src/data/site.ts  Marka, iletişim ve tüm içerik
```

## Yayın (Vercel)

Vercel'de yeni proje açıp **Root Directory** olarak `peel-auto-glass` seçin
(depodaki kök `vercel.json` başka bir siteyi yayınlar). İsteğe bağlı:
`NEXT_PUBLIC_SITE_URL` ortam değişkeniyle gerçek alan adını verin (`.env.example`).
