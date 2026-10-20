# Alp Book

Günlük rutin takibi, takvim ve analiz uygulaması (Next.js, PWA). Veriler varsayılan olarak
yalnızca cihazın tarayıcısında (localStorage) saklanır. İsteğe bağlı olarak Google ile giriş yapıp
verileri hesaba eşitleyebilirsin.

## Geliştirme

```bash
npm install
npm run dev      # geliştirme
npm test         # mantık testleri
npm run build    # üretim derlemesi
```

## Google ile giriş ve bulut eşitleme (Firebase, ücretsiz)

Ortam değişkenleri tanımlı değilse uygulama yalnızca yerel depolamayla çalışır ve giriş düğmesi görünmez.

1. <https://console.firebase.google.com> → **Add project** (Analytics gerekmez).
2. **Build → Authentication → Get started → Sign-in method → Google → Enable** (destek e-postası seç, kaydet).
3. **Authentication → Settings → Authorized domains** → Vercel adresini ekle (ör. `alp-book.vercel.app`).
   `localhost` ve `*.firebaseapp.com` zaten ekli gelir.
4. **Build → Firestore Database → Create database** (production mode, bir bölge seç).
   **Rules** sekmesine bu depodaki [`firestore.rules`](./firestore.rules) içeriğini yapıştırıp **Publish** et.
5. **Project settings → General → Your apps → Web (`</>`)** ile bir web uygulaması ekle; çıkan
   `apiKey`, `projectId`, `appId` değerlerini al.
6. Vercel → proje → **Settings → Environment Variables**: `.env.example` içindeki
   `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`
   değişkenlerini ekle (Production, Preview, Development).
7. **Deployments → son dağıtım → Redeploy** (değişkenler derleme sırasında gömülür).

### Nasıl çalışır

- Bulutta düzen: `users/{uid}/meta/main` (ad, hedefler, planlar, sınavlar) ve `users/{uid}/months/{YYYY-AA}` (o ayın günlük kayıtları).
- İlk girişte bulut ve cihazdaki veri **birleştirilir**; hiçbir kayıt silinmez. Aynı gün ve rutinde çakışma olursa bu cihazdaki değer kazanır.
- Sonraki değişiklikler yaklaşık 1 saniye içinde buluta yazılır; başka cihazlardaki değişiklikler canlı gelir.
- Ses ve yürüyüş birimi gibi cihaz tercihleri eşitlenmez.
- Çıkış yapınca cihazdaki veri silinmez, yalnızca eşitleme durur.
- Sınırlama: iki cihazda aynı ay içinde aynı anda (özellikle çevrimdışıyken) yapılan düzenlemelerde son yazan kazanır.
