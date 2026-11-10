# Melopee Panel: kurulum ve düzenleme rehberi

Bu rehber paneli **kendi hesaplarınızda** yayınlamak ve Claude ile düzenlemek içindir. Kod bilgisi
gerekmez. Kurulum bir kez yapılır, yaklaşık 20 dakika sürer. **Bilgisayardan** yapın; dosya yükleme
adımı telefondan zor.

## Gerekenler (hepsi ücretsiz, Claude hariç)

| Hesap | Ne için | Adres |
| --- | --- | --- |
| GitHub | Kodun durduğu yer | github.com |
| Vercel | Sitenin yayınlandığı yer (ücretsiz plan yeterli) | vercel.com |
| Claude (Pro ya da üstü) | Kodu sizin yerinize düzenleyen asistan (Claude Code) | claude.ai/code |

## 1. Kodu GitHub'a yükleyin

1. Size gelen `melopee-panel.zip` dosyasını bilgisayarda açın (çift tıklayın). `melopee-panel` adlı bir
   klasör çıkar.
2. github.com'da hesap açın ya da giriş yapın. Sağ üstteki **+** → **New repository**.
3. Ad: `melopee-panel`. **Private** seçin. Başka hiçbir kutuyu işaretlemeyin (README eklemeyin).
   **Create repository**.
4. Açılan boş sayfada **uploading an existing file** bağlantısına tıklayın.
5. `melopee-panel` klasörünü açın, **içindeki her şeyi** seçip (klasörün kendisini değil) sayfaya
   sürükleyin. Mac'te gizli `.gitignore` dosyasını görmek için klasördeyken `Cmd + Shift + .` basın.
6. Yükleme bitince alttaki **Commit changes**.
7. Kontrol: deponun ana sayfasında `package.json`, `src`, `public`, `README.md` doğrudan görünmeli
   (bir `melopee-panel` klasörünün içinde değil).

## 2. Siteyi Vercel'de yayınlayın

1. vercel.com → **Continue with GitHub** ile giriş yapın.
2. **Add New… → Project** → listede `melopee-panel` deposunu bulun → **Import**.
   (Depo listede yoksa **Adjust GitHub App Permissions** ile Vercel'e bu depoya erişim verin.)
3. Ayarlara dokunmayın (Framework: Next.js, Root Directory: `./`). **Environment Variables** bölümünü
   açıp şu üçünü ekleyin:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_BACKEND` | `1` |
   | `SESSION_SECRET` | En az 32 karakterlik rastgele harf ve rakam. Kimseyle paylaşmayın; bir yere yazmanız gerekmez. |
   | `OWNER_PASSWORD` | Panele yönetici olarak gireceğiniz şifre (en az 6 karakter). Bunu not edin. |

4. **Deploy**. Bir iki dakika sonra site açılır, giriş ekranında "Veritabanı bağlı değil" yazar. Bu
   normal, sıradaki adımda bağlanacak.

## 3. Veritabanını bağlayın

1. Vercel'de projeyi açın → üstteki **Storage** sekmesi → **Create Database** → **Neon** → Continue.
   Kullanım şartlarını kabul edin.
2. Bölge: **Frankfurt (eu-central-1)**, plan: **Free** → **Create**.
3. **Connect Project** ekranında projeniz seçili olsun, **Production** ve **Preview** işaretli olsun.
   Diğer ayarlara (STORAGE / URL yazan kutu dahil) dokunmayın → **Connect**. **Bir kez** basın.
   "already has an existing environment variable" uyarısı görürseniz bağlantı zaten olmuştur,
   pencereyi kapatın.
4. Üstteki **Deployments** sekmesi → en üstteki yayının sağındaki **⋯** → **Redeploy** → **Redeploy**.
5. Siteyi açın (adres Vercel'de projenin ana sayfasında yazar, `….vercel.app`). **Yönetici** seçip
   2. adımda belirlediğiniz şifreyle girin. Panel boş açılır: yalnızca iki şube ve hizmet adları vardır.

İsterseniz **Settings → Domains** bölümünden kendi alan adınızı bağlayabilirsiniz.

## 4. Claude ile düzenleme

1. claude.ai/code adresine gidin. İlk seferde GitHub hesabınızı bağlamanızı ister; erişim verirken
   `melopee-panel` deposunu seçin.
2. Depo olarak `melopee-panel`'i seçip yeni bir oturum açın.
3. İlk mesaj olarak şunu yapıştırın, son satırı kendi isteğinizle değiştirin:

   > Bu depo Melopee Nail Art Studio'nun yönetim paneli (Next.js, Vercel'de yayında, veritabanı Neon).
   > Önce README.md ve KURULUM.md dosyalarını oku. İstediğim değişiklikleri yap; `npm install`,
   > `npm test`, `npm run typecheck` ve `npm run build` ile kontrol et, sonra değişiklik için bir pull
   > request aç ve bana linkini ver. Kod bilgim yok, bana sade Türkçeyle anlat.
   > İlk isteğim: …

4. İstek örnekleri:
   - "Giriş ekranındaki 'Stüdyonuzun ritmi, tek bir panelde.' yazısı yerine '…' yazsın."
   - "Ana renk terrakota (#B84C36). Bunu şu renk yap: …" (renk kodu ya da ekran görüntüsü verebilirsiniz)
   - "Logoyu bu görselle değiştir." (görseli mesaja ekleyin)
   - "Menüde 'Gelir & Gider' yerine 'Kasa' yazsın."

### Değişiklik siteye nasıl çıkar?

1. Claude işi bitirince bir **pull request** linki verir. Linki açın (GitHub).
2. Sayfada Vercel'in hazırladığı bir **önizleme** linki görünür (Vercel hesabınızla açılır). Değişikliği
   orada kontrol edin. Beğenmezseniz Claude'a ne değişsin yazın, aynı pull request güncellenir.
3. Beğendiyseniz GitHub'da **Merge pull request** → **Confirm merge**. Bir iki dakika içinde canlı
   siteye çıkar.

## Kod gerektirmeyen değişiklikler

Bunları panelin içinden kendiniz yapabilirsiniz, Claude'a gerek yok:

- Stüdyo adı, yönetici adı, yönetici şifresi: **Ayarlar**
- Şube adı, adresi, telefonu, çalışma saatleri: **Şubeler** sayfası
- Hizmetler, süreleri ve fiyatları: **Hizmetler**
- Personel, maaş, prim oranı, personel giriş PIN'i: **Personel**

**Ayarlar → Tanıtım verisi** paneli örnek kayıtlarla doldurur (nasıl göründüğünü denemek için).
**Ayarlar → Boş başla** örnek kayıtları siler. Gerçek kayıt girdikten sonra bu iki düğmeye basmayın:
ikisi de mevcut kayıtları siler. Ayarlar'daki **Yedek indir** ile düzenli olarak yedek alın.
