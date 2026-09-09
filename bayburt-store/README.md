# Bayburt Store — Miras Koleksiyonu

Bayburtspor Miras Koleksiyonu için üretim kalitesinde vitrin sitesi.
Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS ve Framer Motion.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # üretim derlemesi
npm run lint     # ESLint (flat config; `next lint` Next 16’da kaldırıldı)
npm run typecheck
npm run assets   # forma görsellerini yeniden üret
```

## Rotalar

| Rota | İçerik |
| --- | --- |
| `/` | 3D eğimli forma seçici, imleç takipli spot ışığı |
| `/koleksiyon` | Hisar / Çoruh / Çinimaçın hikâye anlatımı, scroll paralaksı |
| `/forma/[slug]` | Ürün detayı, görsel değiştirici, beden seçimi, JSON-LD `Product` |
| `/hakkimizda` | Bayburtspor mirası ve zaman çizgisi |
| `/iletisim` | Telefon, web, Instagram ve flagship mağaza |

Tüm rotalar statik olarak üretilir. `sitemap.xml`, `robots.txt`, favicon ve
Open Graph / Twitter görselleri (`next/og` ile PNG) derleme sırasında oluşur.

## Klasör yapısı

```
app/           Rotalar, layout, metadata, sitemap, robots, OG görselleri
components/    ui/ · hero/ · product/ · collection/ · contact/ · providers/
data/          products.ts (üç forma) ve site.ts (marka, iletişim, menü)
lib/           utils.ts (cn, formatPrice) ve motion.ts (paylaşılan variant’lar)
public/        images/jerseys · images/motifs · videos
scripts/       generate-assets.mjs — forma SVG’lerini üretir
```

## Görselleri değiştirmek

Formalar `scripts/generate-assets.mjs` tarafından üretilen SVG’lerdir; kalıcı
dosyalar `public/images/jerseys/` altındadır. Fotoğrafa geçmek için:

1. Dosyaları `public/images/` (veya film için `public/videos/`) içine koyun.
2. `data/products.ts` içinde ilgili `media.views[].src` yolunu güncelleyin.
3. Ürün filmi eklemek isterseniz aynı üründe `media.video` alanını doldurun:
   `{ src: '/videos/hisar.mp4', poster: '/images/hisar-poster.jpg' }`.

`components/ui/JerseyImage.tsx` uzantıya bakar: SVG’ler olduğu gibi servis
edilir, raster görseller Next tarafından optimize edilir. Kod değişikliği
gerekmez.

## Yapılandırma

`NEXT_PUBLIC_SITE_URL` üretim alan adını belirler; metadata, kanonik
adresler, sitemap ve JSON-LD bu değeri kullanır. Ayarlanmazsa
`https://bayburtstore.com` varsayılır (`data/site.ts`).

## Dağıtım

Bu uygulama depo içinde kendi kökü olan bağımsız bir projedir. Vercel’de yeni
bir proje oluşturup **Root Directory** alanını `bayburt-store` yapmak
yeterlidir; `vercel.json` gerisini tanımlar. Depodaki `web/` uygulaması
(Socialp Media) ayrı bir proje olarak kalır.

## Notlar

- Ödeme akışı bilinçli olarak kapalıdır. “Sepete ekle” yalnızca vitrin
  animasyonudur; hiçbir sepet durumu saklanmaz.
- Scroll ile açılan bölümler `data-reveal` taşır; JavaScript kapalıyken
  `app/layout.tsx` içindeki `<noscript>` kuralı bunları görünür kılar.
- Tüm animasyonlar `MotionConfig reducedMotion="user"` altında çalışır ve
  işletim sistemindeki “hareketi azalt” tercihine uyar.
