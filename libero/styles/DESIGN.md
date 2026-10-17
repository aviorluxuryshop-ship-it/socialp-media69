# Libero tasarım sistemi (v2 · "stadyum gecesi")

Hedef: lüks, modern, profesyonel bir futbol performans platformu. Koyu zemin korunur; canlı ama
**kontrollü** bir vurgu sistemi, ağır ve dar başlık yazısı, katmanlı yüzeyler ve ölçülü hareket.
Her sayfa aynı belirteçleri kullanır; bu belge sonraki sayfa cilası için tek kaynaktır.

Dosyalar (hepsi `app/layout.tsx` içinden bir kez yüklenir):

| Dosya | Sorumluluk |
| --- | --- |
| `fonts.css` | `Libero Display` (Barlow Condensed 700/800 + italik 800, kendi sunucumuzdan) |
| `tokens.css` | renk rolleri, yüzeyler, gölgeler, yazı ölçeği, boşluk, hareket süreleri |
| `base.css` | sıfırlama, odak halkası, başlık sınıfları, eyebrow, yerleşim |
| `ui.css` | düğme, çip, rozet, kart, form, sekme, ilerleme, tablo, sayfa başlığı, bölüm desenleri |
| `shell.css` | üst çubuk, mega menü, mobil menü, arama paleti, alt bilgi |
| `motion.css` | görünürken yükselme, sayaç, giriş, çizgi çizme, mikro etkileşim (üstte kullanım kılavuzu) |
| `home.css` | yalnızca ana sayfa bölümleri |
| `players.css` | oyuncu analizi: dizin kartları (`.pcard`), oyuncu sayfası (`.pa*`, `.psec`, `.psrc`), video rayı (`.vrail`) ve yan panel (`.pvp`) |
| `video.css` | video kütüphanesi: çizim kapaklar (`vc-*`), kartlar (`.vcard`), süzgeç çubuğu (`.vl__*`), oynatıcı penceresi (`.vmodal*`) |

## 1. Renk rolleri

Her rengin **tek bir işi** vardır. Dekor için rastgele renk kullanılmaz.

| Belirteç | Değer | Rol |
| --- | --- | --- |
| `--accent` (`-hi`, `-lo`, `-wash`, `-ink`) | `#c2f53c` volt | birincil eylem, etkin durum, odak, eyebrow, ilerleme |
| `--gold` | `#e9b949` | **yalnızca** yıldız seviyesi, başarı, ödül |
| `--flare` | `#ff6142` | uyarı, rakip, "canlı" nokta, tehlike |
| `--sky` | `#4db8ff` | veri, bilgi, grafik, ikincil vurgu |
| `--grass` | `#2fc27c` | saha ve ilerleme yeşili (accent'ten ayrı bir yeşil) |
| `--ink-1000 … --ink-600` | `#030706 … #2c4a43` | zemin ölçeği (koyu mürekkep + çim/petrol tonu) |
| `--ivory … --ivory-4` | `#f3f0e5 … #8b9289` | metin ölçeği (en soluk `--ivory-4` bile ink-900 üzerinde ≥ 5.5:1) |

**Eski adlar çalışır:** `--brass*` → `--accent*`, `--terra*` → `--flare*`. Eski CSS değişmeden yeni görünümü alır.
`--accent-ink` (`#0a1403`) accent zemin üstündeki metindir (≈ 14:1). Accent metin olarak koyu zeminde 14:1 üstündedir.

Şeffaf varyantlar için `rgb(var(--accent-rgb) / .2)` yazılır (`--gold-rgb`, `--flare-rgb`, `--sky-rgb` de var).

## 2. Tipografi

* **Başlık:** `--font-display` = *Libero Display* (dar, ağır, atletik). `.display`, `.h1` BÜYÜK HARF; `.h2`, `.h3` cümle düzeni.
  İstenen ağırlık ne olursa olsun 700/800'e eşlenir; bu yüzden `font-family: var(--font-display)` yazan her eski kural otomatik yeni sese geçer.
* **Gövde:** Hanken Grotesk Variable. **Mikro etiket / sayı:** JetBrains Mono (`.mono`, `.eyebrow`).
* Ölçek: `--fs-hero` (≤ 9.4rem, yalnız ana sayfa), `--fs-display` (≤ 7.8rem), `--fs-h1` (≤ 4.7rem), `--fs-h2` (≤ 3.9rem), `--fs-h3`, `--fs-lead`, `--fs-body`, `--fs-small`, `--fs-label`, `--fs-numeral` (dekoratif dev sayılar).
* Vurgulu sözcük: başlık içinde `<em>` → eğik + volt (büyük başlıkta degrade). Bir başlıkta **en çok bir** vurgu.
* Marka adı büyük harfe çevrilirken Türkçe İ olmasın diye `lang="en"` verilir (`LIBERO`).

## 3. Yüzeyler ve derinlik

* Düz zemin: `--ink-900` (sayfa), `--ink-950` (derin bant), `--ink-850/800/750` (kart katmanları).
* `.card`: gerçek 1px kenarlık + üstte ince ışık + yumuşak gölge. Bağlantı kartı (`a.card`, `.card--hover`) üzerine gelince yükselir, kenarlık voltlaşır, imleci izleyen ışık yanar (`--mx/--my`, JS: `initCardSpot`).
* `.card--edge` / `.card--edge-accent`: gradyan kenarlık (öne çıkan paneller), `.card--accent` kalıcı parıltı, `.card--marks` köşe işaretleri, `.card--flat` gölgesiz.
* `--glow-accent`, `--glow-gold`, `--sh-1/2/3`: parıltı ve gölge belirteçleri. Aynı ekranda **bir** güçlü parıltı yeter.
* Cam: `--glass` yalnızca küçük, üst üste binen öğelerde (büyük alanlarda `backdrop-filter` yok).

## 4. Bileşenler

* **Düğme:** `.btn` + `--primary` (volt degrade, parlama süpürmesi, basınca iner) · `--ghost` · `--quiet` (alt çizgi çizilir) · `--danger` · `--dark` / `--outline-dark` (volt bant üstünde) · boyut `--sm` / `--lg` · yükleniyor: `data-loading="true"` ya da `.is-loading` · `:focus-visible` halkası her zaman var.
* **Çip / segment / sekme:** `.chip[aria-pressed]`, `.seg`, `.tabs` (etkin gösterge soldan açılan volt çizgi).
* **Etiket ve rozet:** `.tag` (+ `--accent|gold|flare|sky|grass`), `.badge` (dolgu).
* **Form:** `.input/.select/.textarea` (odakta volt halka), `.check`. Native kontroller `accent-color` ile volt.
* **Not:** `.note` (accent), `--warn` (flare), `--info` (sky). **Tablo:** `.table` (şeritli, satır hover'ı). **İlerleme:** `.bar > span`, `.bar-fill`, `.bar--gold|sky|flare`, `.ring`.
* **Sayfa başlığı:** `<PageHead index="03" …>` — volt/gök ışığı, saha merkezi çizimi, isteğe bağlı dev dizin sayısı.
* **Bölüm başlığı:** `.section-title` / ana sayfada `.section-head`. Eyebrow + `.h2` (+ `<em>`).

## 5. Bölüm desenleri (sayfa ritmi)

Aynı düz kartı tekrarlamayın; bölümleri değiştirin:

`.band` (tam genişlik) · `--deep` · `--lift` · `--pitch` (çim şeritleri) · `--volt` (kapanış çağrısı, sayfada **bir**) · `--diag` (çapraz) · `--arc` (kavisli üst kenar) ·
`.spotlight` / `.floodlit` (ışık) · `.grain` (CSS tane, mobilde kapalı) · `.numeral` (dev içi boş sayı) · `.rule-accent`.
Ana sayfadaki örnekler: bento vitrin, dizin listesi (`.index-list`), zaman çizgisi (`.how__steps`), ters hover ızgara (`.pos-strip`), dev sayı + kategori bulutu (`.lib`).

## 6. Hareket

Ayrıntılı kılavuz `motion.css` dosyasının başındadır. Özet:

* `data-reveal` / `<Reveal>`: görünürken 12–24 px yükselir (varyant: `fade|left|right|scale|heading`), aynı anda açılan kardeşler 70 ms arayla kademelenir; sayaç `<Count to={n}/>`.
* **İçerik asla görünmez kalmaz:** gizli ilk durum yalnızca `html.js` varken; JS çalışırsa `html.motion-live`; gözlemci yoksa/ateşlenmezse zamanlayıcı + kaydırma yedeği; hızlı kaydırmada üstte kalanlar açılır; JS hiç gelmezse 5 sn sonra CSS açar; `prefers-reduced-motion` ve JS'siz sayfada hemen görünür.
* Giriş (hero): `.enter` CSS animasyonu — JS'e bağlı değil.
* Paralaks yalnız hero ve vitrin: `[data-parallax] [data-depth]`, yalnız ince imleç + ≥ 1024 px + hareket azaltma kapalı; yalnız `transform`.
* Sayfa geçişi: `app/template.tsx` → `.page-enter` (opacity + 10 px). View Transitions API kullanılmaz.
* Kurallar: yalnız `transform`/`opacity` canlandır; kaydırma dinleyicisi React durumu yazmaz; `will-change` yok; mobilde etkiler azalır.

## 7. 3B top (yalnız ana sayfa)

`<HeroBall/>`: sunucuda SVG top (gerçek kesik ikosahedron, yer ayrılmış) → cihaz uygunsa boşta ve görünürken `three` (dinamik içe aktarma, ayrı parça) → hazır olunca yumuşak geçiş. WebGL yok / düşük güç / dar dokunmatik → SVG kalır. `prefers-reduced-motion` → tek sabit kare. Durum `data-mode` / `data-state` ile izlenir. Ayrıntı: `lib/motion-ball-scene.ts`.

## 8. Yapılır / yapılmaz

**Yapılır**
* Bir ekranda tek birincil eylem (volt), tek vurgulu başlık sözcüğü, tek güçlü parıltı.
* Renk rolünü koru: yıldız altın, uyarı kor, veri gök mavisi.
* Büyük başlık + küçük mono etiket + bol boşluk; bölümleri bant/ayırıcıyla ayır.
* Her etkileşimli öğeye görünür odak halkası; metin kontrastı AA.
* Yeni animasyon eklemeden önce `motion.css` yardımcılarına bak.

**Yapılmaz**
* Ham renk kodu yazma; belirteç kullan. `--gold`'u dekor için kullanma.
* Her bölüme aynı düz kartı koyma; her yere gölge/parıltı/animasyon serpme.
* Düzen özelliği (width/height/top/left) canlandırma; kaydırmada React durumu güncelleme.
* Büyük alanda `backdrop-filter`, mobilde ağır katman/paralaks.
* Doğrulanmamış bir özelliği gerçek gibi gösterme: önizlemeler "Örnek" diye etiketlenir, sayılar veriden hesaplanır.
