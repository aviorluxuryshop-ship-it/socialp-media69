# Prime Kids — Online Mağaza

Next.js (App Router) + Tailwind. Sepet tarayıcıda tutulur; sipariş WhatsApp mesajı olarak gönderilir.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Yayına almadan önce değiştirilecekler

Hepsi iki dosyada:

- `src/data/site.ts` — WhatsApp numarası, Instagram, e-posta, alan adı, ücretsiz kargo limiti, kargo ücreti
- `src/data/products.ts` — fiyatlar, bedenler, ürün içerikleri/özellikleri (şu an **örnek** değerler)

Yeni ürün: `public/products/` altına görseli koyun, `products.ts` içine bir kayıt ekleyin.

## Sonraki adım: gerçek ödeme

Şu an ödeme yok (WhatsApp siparişi). Kartla ödeme için iyzico / PayTR gibi bir sanal pos
hesabı gerekir; sepet verisi `src/lib/cart.tsx` içinde hazır.

## Vercel

Bu klasör ayrı bir projedir: Vercel'de **Root Directory = `prime-kids`** seçin.
