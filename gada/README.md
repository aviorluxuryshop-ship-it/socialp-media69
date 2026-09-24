# GADA — ürün kataloğu ve marka deneyimi

GADA soğuk çayları için tanıtım sitesi: fiyat, sepet, sipariş ya da ödeme yok.
Ziyaretçi ürünü, içeriğini, ambalajını ve arkasındaki şirketi keşfeder.

Next.js 16 (App Router, statik export), TypeScript, Tailwind CSS, three.js,
Framer Motion ve Lenis.

```bash
npm install
npm run dev        # http://localhost:3001
npm run build      # statik çıktı: out/
npm run lint
npm run typecheck
```

`vercel.json` bu klasörü kendi başına bir proje olarak yayınlar (Root Directory: `gada`).

## Sayfa akışı

| Bölüm | Kutu (3D) | İçerik |
| --- | --- | --- |
| Ana sayfa | Ön yüz | “Doğanın tazeliği, her yudumda.” |
| GADA nedir? | Sağ yüz | Marka, hacim, menşei, üretici |
| İçindekiler | Arka yüz | Etiketteki içindekiler sırası, 100 ml besin değerleri |
| Kutunun sol yüzü | Sol yüz | Ambalajdaki üç not |
| İçeceklerimiz | Limon → Şeftali | Her ürünün kısa hikâyesi, ürün sayfası bağlantısı |
| Yan yana | İki kutu | Ortak temel ve farklar |
| Kutuyu kendiniz çevirin | Seçilen kutu | Sürükleme, ok tuşları, yüz ve aroma seçimi |
| Ambalaj tasarımı | — | Etiketin düz açılımı ve dört yüzün notları |
| GADA hakkında / Hikâye / İletişim | — | Doğrulanmış şirket bilgileri, kaynaklı zaman çizelgesi |

`/icecekler/limon/` ve `/icecekler/seftali/` ürün sayfalarıdır: elle döndürülen 3D
kutu, künye, içindekiler, besin tablosu, saklama ve ambalajın dört yüzü.

Header hiçbir kaydırma konumunda zemin almaz; koyu bölümlerin üstünde yalnızca
yazı rengi açılır. Menü, sayfayla aynı kâğıt tonunda yarı saydam bir katmandır.

## 3D kutu nasıl yapıldı

Eski denemelerdeki sorun, düz bir görselin şişirilerek ya da döndürülerek “3D”
gösterilmesiydi. Burada kutu gerçek bir silindir modelidir ve etiketi dört
referans görünümden çıkarılmıştır:

1. **Geometri** (`lib/can/profile.ts`): Ön görünümdeki siluet satır satır
   ölçüldü; jant, boyun, omuz ve alt halka bu ölçülerden bir torna (lathe)
   profiline dönüştü. Yükseklik/genişlik oranı fotoğraftakiyle aynı.
2. **Işığın temizlenmesi** (`scripts/label/delight.py`): Her görünümdeki stüdyo
   gölgesi ve parlaması, düz zemin renginden sütun sütun modellenip çıkarıldı.
   Böylece dokuda pişmiş ışık kalmaz; ışığı 3D sahne verir, kutu “plastik” durmaz.
3. **Açılım** (`build_texture.py`): Her görünüm silindir projeksiyonu tersine
   çevrilerek (x = r·sin θ) düz etikete açıldı. Dört görünüm birbiriyle
   geometrik olarak tutarlı değil (bkz. bulgular), bu yüzden yalnızca her
   görünümün kendi paneli alındı.
4. **Yerleşim** (`pack.py`): Paneller, çizimleri 2D’de çakışmayacak şekilde
   silindirin çevresine dizildi. Hiçbir panel sıkıştırılmadı; logo gerçek
   oranında.
5. **Onarım ve temizlik** (`repair_peach.py`, `despeckle.py`): Kaynak
   render’da harfleri bozuk çıkan şeftali ön yazısı (“ŞEFTALİ VE ÇAY / AROMALI
   İÇECEK”) aynı kelimelerle, aynı konum, boy ve gümüş tonda yeniden dizildi;
   panel kenarlarından kalan soluk lekeler dolduruldu.

Hattı yeniden çalıştırmak (çıktı bayt bayt aynıdır):

```bash
bash scripts/label/run.sh   # python3 + pillow, numpy, scipy
```

Sahne yalnızca bir şey değiştiğinde çizilir, görünmezken hiç çalışmaz, three.js
sayfa okunur hâle geldikten sonra yüklenir. WebGL yoksa her bölümde kutunun
render edilmiş bir fotoğrafı gösterilir; `prefers-reduced-motion` açıkken kutu
bölümler arasında kaymadan yer değiştirir ve yumuşak kaydırma kapanır.

## Yeni ürün eklemek

1. Ürünün ön/arka/sağ/sol görünümlerini `media-source/` içine koyun.
2. `scripts/label/` içindeki görünüm koordinatlarını (`delight.py` → `CANS`,
   `build_texture.py` → `WINDOWS`) yeni görsele göre girin ve `run.sh`’ı çalıştırın.
3. Çıktıdaki `frontU` ve yüz açılarıyla `data/products.ts` dosyasına bir kayıt
   ekleyin. Ana sayfa, ürün sayfası, menü ve footer bu listeden beslenir.

## Kaynaklar ve doğrulama

Bütün şirket bilgileri `data/company.ts` içinde kaynağıyla birlikte durur:
ticaret sicili kaydı (kuruluş 12.07.2017), Bayburt Valiliği ve Bayburt
Belediyesi haberleri (Haziran 2021), İHA, şirketin kendi B2B tanıtımı (Köln,
2013 / Ocak 2017) ve GADA’nın ürün kayıtları (satıcı AN Zentrum, Bayburt,
kategori soğuk çay, menşei TR). Ürün içerikleri ve besin değerleri ambalajın
arka yüzünden alındı.

Bulunamayan ve bu yüzden sitede olmayanlar: GADA’ya ait ayrı bir web sitesi
veya sosyal medya hesabı, GADA’nın çıkış tarihi, markanın adının hikâyesi.

## Bulgular

- Dört referans görünüm aynı kutunun gerçek 90° çekimleri değil: sağ ve sol
  görünümün ikisinde de ön logonun sağ ucu sol kenarda görünüyor, sağ
  görünümün sağ kenarında arka yüzde olmayan ikinci bir büyük logo var.
- Limonlu kutunun arka etiketinde “Beyburt” ve “AnZentrum” yazıyor; şeftalide
  doğrusu, “Bayburt” ve “AN Zentrum”. Etiket olduğu gibi bırakıldı, sitenin
  metinlerinde doğru yazımlar kullanıldı.
- Etiketteki üretici adresi “Bayburt Organize Sanayi Bölgesi”; kamuya açık
  kayıtlardaki adres Akşar Köyü, Esentepe Mevkii. İletişimde kayıtlardaki
  adres kullanıldı.
- Türkiye telefonu ve e-posta (+90 458 222 73 69, info@byburt69.com),
  şirketin byburt69.com künye sayfasından alındı; bu alan adı şu an yanıt
  vermiyor. Yayından önce bir kez teyit edilmeli.
