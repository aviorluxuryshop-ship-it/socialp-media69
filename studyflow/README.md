# StudyFlow

Lise 9–10. sınıf öğrencileri için yapay zekâ destekli çalışma platformu: kaynağa dayalı konu anlatımı (MEB ders kitapları), not, yükleme, özet, sınav, planlayıcı, doğrulanmış video kataloğu ve dürüst bir öğrenme hafızası.

- Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4
- Veri: tarayıcıda IndexedDB (hesapsız) veya Supabase (Postgres + RLS + Storage; hesapla)
- Yapay zekâ: yalnızca sunucuda, Anthropic SDK (`/api/ai/*`)

## Kurulum

```bash
npm install
cp .env.example .env.local   # değerleri doldur
npm run dev
```

### Ortam değişkenleri

| Değişken | Nerede | Açıklama |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | istemci | Hesap + bulut verisi. Tanımlı değilse uygulama hesapsız (yerel) çalışır. |
| `ANTHROPIC_API_KEY` | **yalnızca sunucu** | Yapay zekâ özellikleri. Tanımlı değilse AI ekranları kapalı görünür, geri kalanı çalışır. |
| `STUDYFLOW_MODEL_TUTOR` / `STUDYFLOW_MODEL_FAST` | sunucu | İsteğe bağlı model geçersiz kılma. |
| `STUDYFLOW_AI_DAILY_LIMIT` | sunucu | Kullanıcı başına günlük AI istek sınırı (bellek içi). |
| `STUDYFLOW_ALLOW_ANON_AI` | sunucu | `1` ise üretimde girişsiz AI'ya izin verir (varsayılan: giriş şart). |

### Supabase

1. Yeni bir Supabase projesi oluştur.
2. `supabase/migrations/0001_init.sql` dosyasını SQL editöründe çalıştır (tablo, RLS ilkeleri, özel `uploads` kovası).
3. Authentication → Providers: **Email** ve **Google**'ı etkinleştir. Redirect URL'lerine `https://<alan-adın>/auth/callback` ekle.
4. URL ve anon anahtarı Vercel ortam değişkenlerine yaz. `service_role` anahtarı bu uygulamada **kullanılmaz**.

## Kaynak katalogu

Ders kitapları MEB'in resmî `tymm.meb.gov.tr` portalından alınır; `scripts/fetch-textbooks.mjs` ve `scripts/build-catalog.mjs` PDF/kapak bağlantılarını gerçekten doğrular, içindekiler tablosundan ünite/konu/sayfa aralığı çıkarır ve `src/data/catalog.json` üretir. Kitap metni depolanmaz; yanıt anında ilgili sayfalar resmî PDF'den aralık isteğiyle okunur.

```bash
npm run catalog:fetch    # resmî API + HEAD doğrulaması
npm run catalog:build    # PDF_DIR=<yerel PDF klasörü> ile içindekiler → katalog
npm run videos:verify    # video kataloğunu oEmbed + meta ile doğrular
```

## Kontroller

```bash
npm run typecheck && npm run lint && npm test && npm run build
npm run test:e2e         # Playwright (önce `npm run build && npm start`)
```

## Sınırlar

- Resmî soru bankası olmadığı için tüm sorular yapay zekâ üretimidir ve öyle etiketlenir.
- Katalog yalnızca 9. ve 10. sınıf kitaplarını kapsar; MEB müfredatının tamamını kapsadığı iddia edilmez.
- Video kataloğunda "görsel", "eğlenceli", "hikâyeleştirilmiş" etiketleri için henüz doğrulanmış içerik yoktur (arayüzde devre dışı gösterilir).
