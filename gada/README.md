# GADA — dijital marka deneyimi

GADA’nın iki kutusu (şeftali ve çay aromalı içecek, limon aromalı soğuk çay)
için tek sayfalık, sinematik bir vitrin. E-ticaret değildir: fiyat, sepet ya da
satın alma akışı yoktur. Bütün metinler Türkçedir; kaynakları
[KAYNAKLAR.md](KAYNAKLAR.md) dosyasındadır.

Next.js 16 (statik dışa aktarım), TypeScript, düz CSS ve tek bir küçük WebGL
çizicisi. Harici animasyon kütüphanesi kullanılmaz.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # statik site: out/
npm run lint
npm run typecheck
```

## Sayfa akışı

Tek bir kutu, tek bir sahnede sayfa boyunca yol alır:

| Bölüm | Kutu | Zemin |
| --- | --- | --- |
| Açılış | Şeftali, ön yüz, hafif dönük | Şeftali tonu |
| GADA hakkında | Sağda, küçülür | Sıcak nötre kayar |
| Ürün 01 · Hikâye · İçerik | ÖN → SOL → ARKA; hep aynı yöne döner | Şeftali |
| Tasarım (sabitlenir) | SAĞ yüzdeki meyveye, sonra logoya yaklaşır, sonra geri çekilir | |
| Ürün 02 | Aynı yerde şeftaliden limona dönüşür | Nötrden limona |
| Hikâye · İçerik · Tasarım | SAĞ → ARKA → SOL → ÖN; ters yöne döner | Limon |
| Üretim · İletişim | Kutu çekilir; Türkiye haritasında Bayburt | Sıcak nötr |

Anahtar kareler `lib/choreography.ts` içinde, her bölümdeki `[data-key]`
işaretçilerine bağlıdır. Kompakt ekranlarda (telefon, dikey tablet) kutu üst
yarıda durur ve metin üzerinden kayan bir sayfa olarak gelir.

## Kutu nasıl çiziliyor (2.5D)

Referans görsellerdeki dört görünüm birbirini geometrik olarak tutmuyor; bu
yüzden kesintisiz bir 360° doku “dikmek” ambalajı yeniden çizmeyi gerektirirdi.
Onun yerine:

1. `scripts/can_textures.py` sekiz görünümü aynı kutu formuna hizalar ve her
   görünümün stüdyo ışığını sütun sütun ölçer (`I = albedo · L(x) + beyaz · S(x)`).
2. `lib/can-renderer.ts` içindeki shader etiketi bir silindirin üzerinde
   kaydırır, ölçülen ışığı ekrana sabit tutar. Kameraya en yakın fotoğraf
   önceliklidir; kutu bir görünümde dururken çıktı fotoğrafın birebir aynısıdır.
   Büyük dönüşlerde komşu fotoğraflar yumuşakça karışır.
3. İmleç hafif bir parlama ve birkaç derecelik dönüş verir; kutu kendi başına
   çok yavaş salınır. `prefers-reduced-motion` açıkken bunların hiçbiri olmaz.

WebGL yoksa aynı koreografi, en yakın görünümün tek görseliyle sürer. JS yoksa
açılıştaki kutu görseli ve bütün metinler görünür kalır.

## Varlıklar

```
media-source/          Referans görseller (ÖN, ARKA, SAĞ, SOL) — tek doğru kaynak
public/can/            WebGL atlasları (hd ve sd) + ışık profili
public/img/            Tek görünümler (ilk kare ve WebGL'siz yedek)
scripts/can_textures.py   Atlasları ve lib/can-meta.ts dosyasını üretir (numpy, scipy, pillow)
scripts/og_image.py       app/opengraph-image.jpg
scripts/turkey-map.mjs    lib/turkey.ts (Natural Earth 1:50m)
```

Görseller değişirse: `npm run textures`, ardından `python3 scripts/og_image.py`.

## Yayın

Bu klasör depo içinde kendi kökü olan bağımsız bir projedir. Vercel’de yeni bir
proje açıp **Root Directory** alanını `gada` yapmak yeterlidir; `vercel.json`
gerisini tanımlar. Kanonik adres ve paylaşım görselleri için
`NEXT_PUBLIC_SITE_URL` tanımlayın (tanımlı değilse Vercel’in üretim adresi
kullanılır). Depodaki `web/` ve `bayburt-store/` ayrı projeler olarak kalır.
