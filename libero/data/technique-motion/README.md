# Teknik hareket gösterimleri ("Hareketi izle")

Teknik sayfasındaki **Hareketi izle** bölümü, bir tekniğin kısa (≈ 2–3,5 sn) **şematik** hareket gösterimidir:
sağ ayaklı bir oyuncu, sağdan (yandan) görünüm; üç evre (Hazırlık, Temas, Takip); temas anında topun değdiği krampon
bölgesi yanar. Gerçek video ya da hareket yakalama **değildir** (sayfada bu yazılıdır).

Yeni bir hareket eklemek için **yalnızca veri dosyası** yazılır; oynatıcı, sahne, doğrulayıcı, testler ve sayfa bölümü hazırdır.

| Dosya | Görev |
| --- | --- |
| `data/technique-motion/<teknik-id>.ts` | Bir `TechMotion` dışa aktarır (**sizin yazdığınız dosya**) |
| `data/technique-motion/index.ts` | `MOTIONS: Record<teknik-id, TechMotion>` kayıt defteri (kategori işaretli, küçük düzenleme) |
| `data/technique-motion/validate.ts` | Derleme sırasında bölge uyumu + yapı + kinematik denetim (hata varsa `npm run build` durur) |
| `lib/motion/rig.ts` | İskelet: FK/IK bacak, krampon geometrisi, temas bölgeleri (`ZONE_GEOM`), top yolu |
| `lib/motion/timeline.ts` | `TechMotion` tipi, evreler, vurgu (glow), kare üretimi (`frameAt`) |
| `lib/motion/author.ts` | Yazım yardımcıları: `poseKeys` (kısmi anahtar), `STAND`, `groundY` |
| `lib/motion/check.ts` | Kinematik denetimler ve eşikler (`checkMotion`, `LIMITS`) |
| `components/TechMotionPlayer.tsx` | Oynatıcı (oynat/duraklat, başa sar, 0,5×/1×, kaydırma, evre çubuğu, açıklama, şerit) |
| `components/tech-motion/*` | `Figure` (SVG oyuncu+top+vurgu+yakın çekim), `PlanView` (üstten bakış), `Stage` |
| `styles/tech-motion.css` | Oynatıcı stilleri |
| `scripts/motion-sheet.mjs` | Kontak şeridi: hareketi birkaç zamanda PNG'ye çizer (görsel inceleme **zorunlu**) |
| `scripts/logic-tests/tech-motion.mjs`, `scripts/e2e-tests/tech-motion.mjs` | Her kayıtlı hareketi otomatik denetleyen testler |

## Adımlar

1. `data/techniques/<kategori>.ts` içindeki tekniği okuyun: `foot[]`, `contact`, `steps`, `mistakes` — hareketiniz bunlarla **birebir uyumlu** olmalı.
2. `data/technique-motion/<teknik-id>.ts` yazın (aşağıdaki kurallar), `index.ts` içinde **kendi kategori işaretinizin altına** bir `import` ve bir kayıt satırı ekleyin
   (işaretler `// [pas]`, `// [sut]`, `// [kontrol]`, `// [surme]`, `// [kafa]`, `// [bitiricilik]`, `// [hucum]`, `// [savunma]`, `// [kalecilik]`, `// [duran]`, `// [topsuz]`; başka satıra dokunmayın → paralel dallar çakışmadan birleşir).
3. `node scripts/motion-sheet.mjs <id>` (varsayılan 12 kare, 1× ve 2×; `--times=0,0.6,1.5` `--scales=1,2` `--cols=4` `--width=480` `--out=/tmp/mo-shots`) ile PNG üretin ve **bakın**: ayak yerde mi, diz doğal mı, top tam o yüzeye mi değiyor, baş topa dönük mü. En az üç tur düzeltin.
4. `npx tsc --noEmit`, `npm run check:logic` (kayıtlı **tüm** hareketler için kinematik + bölge testleri), `npm run build` (doğrulayıcı), `E2E_ONLY="Hareketi izle" node scripts/e2e.mjs`.

## `TechMotion` yazım kuralları

```ts
export const ORNEK: TechMotion = {
  id: 'teknik-id',            // data/techniques/*.ts ile AYNI; kayıt anahtarı da bu
  label: 'Kısa ad: ne gösteriliyor',     // 8–90 karakter, erişilebilir ad
  dur: 2.6,                   // sn, 1,8–3,5
  tc: 1.2,                    // temas anı (sn); hazırlığa ≥ 0,4 sn, takibe ≥ 0,5 sn yer bırakın
  win: [0.12, 0.3],           // temas penceresi: temastan [önce, sonra] sn (faz çubuğundaki "Temas" bölmesi + vurgu)
  legs: ['ik', 'ik'],         // [yakın (sağ, vuran) bacak, uzak (sol, basma) bacak] kipi; her ikisi de çoğunlukla 'ik'
  cam: -0.8,                  // görünümün sol kenarının dünya x'i (m); görünüm ≈ 4,9 m genişliğinde
  top: 2.2,                   // (isteğe bağlı) sahnenin üst sınırı, zeminden m; sıçrama/kafa vuruşunda 2,8–3 yapın
  zones: ['ic', 'dis', 'ustTam'],  // = tekniğin foot[] KÜMESİ (sıra önemsiz); kafa tekniklerinde 'alin'
  contact: 'ic',              // topun gerçekten değdiği bölge; zones içinden; ÖNERİ: foot[0] (BootMap'te topun durduğu bölge)
  carry: [1.2, 1.5],          // (isteğe bağlı) top temas yüzeyine yapışık: ilk temas amortisi, durdurma, süzme
  curve: 'sol',               // (isteğe bağlı) kavis yönü, aşağıya bakın
  plan: { press: [2.3, 0.95] },  // (isteğe bağlı) üstten bakış kutusunda baskı (rakip) işareti: [x, z] m
  airborne: false,            // true: temas sırasında havada (sıçrama, kafa); basma ayağı kontrolü yapılmaz
  note: '…',                  // (isteğe bağlı) açıklamanın altında küçük not, 10–220 karakter
  caps: ['Hazırlık …', 'Temas …', 'Takip …'],   // üç evre açıklaması, 30–260 karakter
  keys: poseKeys([...]),      // poz anahtarları
  ball: [...],                // top anahtarları
};
```

### Bölge ve teknik uyumu (doğrulayıcı zorlar)

* `zones` kümesi **tekniğin `foot[]` kümesiyle aynıdır**; ad olarak `lib/boot.ts` `ZONES` etiketleri (BootMap ile aynı) kullanılır, oynatıcı bunları çip olarak yazar.
* `contact ∈ zones`. Testler, temas anında topun **bildirilen bölgeye diğer tüm bölgelerden daha yakın** olduğunu ve ≤ 3 cm uzaklıkta durduğunu kanıtlar.
* Birden fazla yüzey listeleyen tekniklerde (örn. ilk temas: iç yüz, dış kenar, ayak üstü) **birini** gösterin ve `note` ile "yüzey duruma göre değişir" deyin; diğer bölgeler temas anında sönük çizgiyle işaretlenir.
* **Kafa teknikleri** (`cat: 'kafa'`): `zones: 'alin'`, `contact: 'alin'`; temas noktası `foreheadContact`.
* **İç yüz ↔ dış yüz karışmaz.** Sağ ayak fiziği: iç yüz (`ic`, `ustIc`) topu oyuncunun **soluna** büker (yukarıdan saat yönünün tersi) → `curve: 'sol'`; dış yüz / üst dış = trivela (`dis`, `ustDis`) topu oyuncunun **sağına** büker (saat yönü) → `curve: 'sag'`. Testler bunu çapraz denetler.
  Sitenin kendi sahne verisi/metni bununla çelişirse **sessizce seçmeyin**: yazılı teknik içeriğe uyun ve çelişkiyi raporlayın.

### Koordinatlar ve poz kanalları

Dünya metredir: **x ileri** (ekranda sağa), **y yukarı**, **z oyuncunun sağı** (kameraya doğru). Oyuncu **sağ ayaklıdır**, kamera oyuncunun sağındadır:
yakın (near) bacak = vuran sağ bacak, uzak (far) bacak = basma (sol) bacak. Zemin y = 0; top yerdeyken merkezi **y = 0,11**; düz basan ayağın bileği **y = 0,099**.

`poseKeys([...])` ile yalnızca **değişen** kanalları yazın; yazılmayan kanal önceki anahtardaki değeri korur (ilk anahtar `STAND` üzerine kurulur). Böylece "iki anahtar arasında değer aynı" → eğri **tam sabit** (basma ayağı kaymaz).

| Kanal | Anlam |
| --- | --- |
| `px`, `py` | pelvis (kalça merkezi) konumu, m. Ayakta `py` ≈ 0,945; basma dizi bükülüyken 0,91–0,93 (diz bükülmesi sert artar: 0,90 ≈ 43°) |
| `tr`, `hd` | gövde eğimi (dikeyden, + öne; −12…40° içinde) ve baş eğimi (gövdeye göre, + öne/aşağı). Baş eğimi toplamı `tr+hd` |
| `as`,`ae` / `bs`,`be` | YAKIN / UZAK kol: omuzdan sarkma açısı (+ ileri) ve dirsek bükülmesi (≥ 0) |
| `n0`,`n1`,`n2` | YAKIN bacak, **IK**: bilek x (m), bilek y (m), ayak eğimi (derece, + parmak yukarı, − topuk kalkık) |
| `ny` | yakın ayağın dışa dönüşü: 0–10 düz yürüyüş; **iç yüz konumu için 55–65°** (tam dışa dönük 90°) |
| `f0`,`f1`,`f2`, `fy` | UZAK bacak, aynı anlam |

* IK bacak bileği dünyada sabit bir noktaya basar; **ulaşılamayan** hedef (`bilek–kalça > 0,86 m`) hata verir (`over`). Bacağı kısa tutmak için pelvisi öne/aşağı alın ya da ayağı yaklaştırın.
* Topuk kalkarken/vururken ayağın yere oturması için bilek yüksekliğini elle tahmin etmeyin: `n1: groundY(-24)` (topuk kalkık) ya da `groundY(15)` (topuk vuruşu); düz ayakta 0,099.
* Adım geometrisi: ayak, pelvisin ≈ 0,2 m önüne basar, adım uzunluğu ≈ 0,35–0,45 m, yürüyüş hızı ≈ 0,5–0,8 m/sn. Basma ayağı **temas penceresi boyunca** düz (`pitch 0, y 0,099`) ve aynı x'te kalır.
* Kollar bacaklara ters sallanır; dirsekler 0–140°. Baş: temasa doğru topa bakar (en çok 60° sapma), takipte kalkar (bir sonraki karar için çevre).
* Top yerdeyken yalnızca `x`/`z` değişir, `y = 0,11`.

### Top anahtarları (`ball`)

* `{ t, x, y, z?, vx?, vy?, r?, cut? }`: `vx`/`vy` o anahtardaki hızı (m/sn) zorlar (yoksa yumuşak hesaplanır, aşım yok). `z` (m) topun yanal konumudur: **+ oyuncunun sağı**, **− sol**; yalnızca üstten bakış kutusunu etkiler.
* `cut: true` yeni bir parça başlatır (vuruş/bırakış anı gibi hızın aniden değiştiği yer).
* `carry: [a, b]`: bu aralıkta top her kare **temas yüzeyine yapışık** hesaplanır (`zoneContact`); aralık **temas anından başlar**. Aralığın başındaki ve sonundaki top anahtarlarını yüzeyle aynı konuma koyun (≤ 3 cm sıçrama kabul edilir). İlk temas, durdurma, süzme için kullanın; vuruşlarda (şut, pas) kullanmayın: topu `cut` ile hızlı bir anahtarla yola çıkarın.
* Temas anındaki top konumu yüzey konumuyla aynı olmalı: bunu bulmak için küçük bir betik yazıp `zoneContact(frame.sk.near.foot, zone).ball` yazdırın (ilk temas dosyasındaki `n1` değerleri bu yolla, top yerde kalsın diye çözülmüştür).
* Dönüş `r` verilmezse yatay yer değiştirmeden türetilir (ileri giden top saat yönünde döner).
* `curve` verip `z` girmezseniz, temastan sonraki top yolu şematik olarak üretilir (ters yöne açılıp kavis yönüne döner). Gerçek bir yön istiyorsanız `z` anahtarlarını kendiniz girin.

### Açıklamalar (`caps`) ve etiketler

* `[Hazırlık, Temas, Takip]` — antrenör dili, tekniğin `steps` / `mistakes` metniyle **aynı çizgide**; tekniğin kendi yazımındaki "siz" kipini (örn. "edin", "alın") kullanın. Sağlık, sakatlık, tıbbi ya da sonuç garantisi iddiası **yok** (test yasak ifadeleri reddeder).
* Oynatıcı sayfada "Şematik hareket gösterimi; gerçek oyuncu videosu ya da hareket yakalama değildir." satırını her zaman gösterir.
* Hareketi azalt tercihinde (ve JS yokken) canlı oynatıcı yerine üç sabit kare gösterilir: Hazırlık başı (t = 0), temas anı (`tc`), Takip başı.

## Kinematik denetimler (`lib/motion/check.ts`, 60 Hz örnekleme)

NaN/∞ yok · segment uzunlukları sabit · diz ters bükülmez (≥ −0,5°) · bilek hedefi ulaşılabilir (`over ≤ 4 mm`) · ayak yerin altına ≤ 6 mm girer ·
basma ayağı temas penceresinde yerden ≤ 4 mm kopuk ve ≤ 8 mm kayar (`airborne` hariç) · kütle merkezi basma ayağına yakın · gövde eğimi −12…40° ·
top yerin altına inmez, karelerarası hız ≤ 45 m/sn, pelvis ≤ 5 m/sn · temas anında top bildirilen bölgeden ≤ 3 cm · `carry` uçlarında sıçrama ≤ 3 cm ·
baş temastan 0,3 sn önceye kadar topa ≤ 60° dönük · süre 1,8–3,5 sn · sıralı ve kapsayan anahtarlar.

## Parmak ucu aşağı bakan vuran ayak (FK) ve havada giden top

IK bacakta negatif ayak eğimi, ön ayağı otomatik yukarı büker (topuk kalkık yürüyüş: parmak yerde kalır). Ayak üstü, iç ayak üstü, dış ayak üstü gibi
parmak ucu aşağı bakan **sert** ayak için vuran bacak FK olmalıdır (`legs: ['fk', 'ik']`). FK değerlerini elle hesaplamayın:

* Vuran bacağı yine bilek konumuyla yazın (`n0` = x, `n1` = y, `n2` = ayak eğimi) ve `keys: nearIkToFk(poseKeys([...]))` ile çevirin
  (`lib/motion/author-fk.ts`; 1/30 sn'lik örnekler ekler, ulaşılamayan hedefte yazım anında hata verir). Yerdeki sert ayakta bilek yüksekliği: `groundYRigid(eğim)`.
* Yerdeki topa ayak üstü yüzeyiyle ancak ayak parmak ucu neredeyse yere bakarken (eğim ≈ −85…−92°, bilek ≈ 0,21–0,25 m) değilebilir; daha yatık ayak yere batar.
  Taban eğme (`baldır açısı − ayak eğimi`) ≤ ~55° kalsın diye baldır geriye bakar (≈ −30…−40°); testler taban eğmeyi −40…62° içinde denetler.
* Temas anı bileğini `zoneContact` ile çözün: ayağın yönelimi sabitken top merkezi = bilek + sabit bir ofset olduğundan, bilek "top merkezi − ofset"tir (birkaç yinelemeyle baldır açısı oturur).
* Havada giden top için `flightKeys({ t0, x0, y0, z0, vx, vy, g, bend, tEnd, spin })` (`lib/motion/flight.ts`): yatayda sabit hız, dikeyde yavaşlatılmış parabol, yanalda kavis.
  `bend > 0` oyuncunun sağına şişkin yol (sola kavis, sağ ayak iç yüz), `bend < 0` soluna şişkin yol (sağa kavis, trivela). Top, sahnenin sağ üstündeki "Üstten bakış" kutusunun altından geçecek kadar alçak tutulur (tepe ≈ 0,6–0,9 m).

### Kavisli pas ↔ trivela (pas kategorisi)

| | iç yüzle kavisli pas | trivela pası |
| --- | --- | --- |
| Temas bölgesi (`foot[]`) | `ic`, `ustIc` (parlayan: `ustIc`) | `ustDis` |
| Vuran ayak (`ny`, temasta) | dışa ≈ +58° | içe ≈ −22° |
| Kavis (`curve`) | `'sol'`: top oyuncunun soluna döner | `'sag'`: top oyuncunun sağına döner |
| Üstten bakış yolu | önce sağa açılır, sola döner | önce sola açılır, sağa döner |
| Gövde / takip | hafif geriye yaslı, yüksek ve çapraz takip | dik, kısa ve alçak takip |

Oynatıcı, `curve` verilen hareketlerde üstten bakış notuna "Top oyuncunun soluna/sağına kavis çizer" ipucunu yazar (`data-curve-hint`) ve üstten bakış kutusunun adına ekler.
`plan.press` kavisli harekette "pas yolundaki rakip" olarak okunur (topun düz yolundaki çarpı işareti; top rakibin dışından geçer).

## Bilinen kısıtlar

* Rig tek düzlemli (yan görünüm) iskelettir; gövde dönüşü, omuz üstü bakış, kalça yaylanması görünmez. Yönler **üstten bakış kutusuyla** (`curve`, `z`, `plan.press`) anlatılır.
* Çizim şematiktir: oyuncu bir manken, kramponlar BootMap paletindedir; ölçekler gerçekçidir (1,75 m oyuncu, 0,11 m top yarıçapı) ama hızlar anlatım için yavaşlatılmıştır.
