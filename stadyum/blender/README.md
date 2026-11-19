# Tüpraş Stadyumu – Blender modeli

Beşiktaş Tüpraş Stadyumu'nun oyun için optimize edilmiş 3B modelini **Blender (headless, Python)** ile üretir ve
`stadyum/public/models/tupras.glb` olarak dışa aktarır. Model tamamen kodla üretilir; elle düzenlenmiş `.blend` yoktur.

## Yeniden üretmek

Gereken: Blender 4.2 LTS, sistem `python3` + `numpy` + `Pillow` (yalnızca doku üretimi için).

```bash
# 1) dokular  ->  stadyum/blender/build/tex/*.jpg   (çatı 4096², saha 1024x2048, koltuk/cam küçük)
python3 stadyum/blender/make_textures.py            # --roof-size 2048 ile daha küçük çatı dokusu

# 2) model + GLB
/opt/blender-dl/blender-4.2.3-linux-x64/blender -b --python stadyum/blender/build_tupras.py -- \
    --out stadyum/public/models/tupras.glb
```

`build_tupras.py` dokular yoksa `make_textures.py`'yi kendisi çalıştırır. Yazı tipi: Montserrat ExtraBold (OFL),
ilk çalıştırmada indirilir; indirilemezse DejaVu/Liberation Bold'a düşer.

Yararlı seçenekler (`--` sonrası):

| seçenek | anlamı |
| --- | --- |
| `--stage N` | yalnızca ilk N aşamayı kur (1 gövde, 2 çatı, 3 cephe + güney bina, 4 detaylar) |
| `--no-export` | GLB yazma |
| `--previews top,east,south,inside,under,...` | Cycles (CPU) ile önizleme PNG'leri (`--preview-dir`, `--samples`) |
| `--save-blend FILE` | `.blend` kaydet |

Doğrulama: `python3 stadyum/blender/validate_glb.py stadyum/public/models/tupras.glb` (düğümler, üçgen sayısı,
malzemeler, doku boyutları, accessor tabanlı sınır kutusu).

## Dosyalar

* `ringlib.py` – ortak yerleşim matematiği (yuvarlatılmış dikdörtgen "offset" eğrileri, çatı paneli düzeni). Blender'dan
  bağımsız; hem model hem doku üreticisi aynı geometriyi kullanır.
* `build_tupras.py` – Blender betiği (mesh üretimi, malzemeler, GLB dışa aktarım, önizleme).
* `make_textures.py` – çatı üstü dokusu (yastık paneller + yazılar + kartal + arma/Tüpraş logosu), saha, koltuk, cam.
* `assets/` – çatıya basılan logo görselleri (aşağıya bakın).
* `validate_glb.py` – GLB denetimi.

## Çatıdaki logolar (`assets/`)

Çatı dokusuna iki logo basılır; ikisi de saydam PNG'dir ve `make_textures.py` tarafından `stadyum/blender/assets/`
içinden **isteğe bağlı** okunur (dosya yoksa o logo atlanır, yazılar yine çizilir):

| dosya | nereye | boyut |
| --- | --- | --- |
| `besiktas-crest.png` | Beşiktaş arması: kuzey ucundaki "BEŞİKTAŞ" yazısının **solundaki** (batı) başlangıcına, yazıyla aynı halka teğetine yatık | yükseklik 15 m |
| `tupras-mark.png` | Kırmızı Tüpraş işareti (yazısız sembol): her "Tüpraş" yazısının **dış ucuna** — batı kenarda yazının güney ucuna, doğu kenarda kuzey ucuna (noktasal simetrik); yazıyla birlikte döner, üstü dışarı bakar | yükseklik 16 m (referans fotoğraftan ölçüldü; harf yüksekliğinin ~1.8 katı) |

Yerleşim `make_textures.py` başındaki `CREST_H_M`, `MARK_H_M`, `LOGO_GAP_M` sabitleriyle ayarlanır. Yazılar önceki gibi
ortalıdır; logolar yazının başlangıcının önüne (boşluk `LOGO_GAP_M`) konur.

Kaynaklar (Wikimedia Commons; ikisi de "Public domain" olarak işaretli, ancak tescilli markadır): arma
`besiktas-crest-source.svg` ← "File:Logo of Beşiktaş JK.svg"; Tüpraş `tupras-logo-source.png` ← "File:Tüpraş logo.svg"
(Commons'un 3840 px PNG önizlemesi, saydam zemin). PNG'ler şöyle türetildi: arma SVG'si cairosvg ile ~2400 px yükseklikte
rasterlandı, **üstteki üç yıldız kırpıldı** (referans çatı fotoğrafında yalnızca kalkan görünür) ve kenarlara sıkıştırıldı;
Tüpraş görselinden yalnızca soldaki kırmızı sembol (yazı olmadan) kırpıldı. İkisi de 1024+ px, saydam zeminli.
Logolar ilgili kurumların tescilli markalarıdır; bu demo sitede kullanım izni proje sahibince verilmiştir.

## Koordinatlar / ölçek

Birim = metre. Eksenler siteyle aynı (three.js, Y yukarı): orijin saha merkezi, saha uzun ekseni **Z** (105 m),
genişlik **X** (68 m), Kuzey = −Z, Güney = +Z, Doğu = +X, Batı = −X, zemin y = 0, saha yüzeyi y = 0.45.
Betik Blender'da Z-yukarı çalışır ve `export_yup=True` ile dışa aktarır; GLB'nin sınır kutusu
x ±86, y 0…36.4, z −104.5…+119.6'dır. Tüm nesnelerin dönüşümü sıfırlanmış/uygulanmıştır (konum 0, ölçek 1).

## Düğümler (siteden aç/kapa için)

`pitch`, `stands_lower`, `concourse`, `stands_upper`, `podium`, `roof_top`, `roof_under`, `roof_lights`,
`facade`, `south_building`. Hepsi sahne kökünde, tek tek `visible` ile gizlenebilir.

## Siteye entegrasyon notları

Entegrasyon `src/scene/shell.js` (yükleme, malzeme, gece, çatı dokusu) + `src/scene/stadium.js` + `src/flow.js` içindedir; ayrıntılar
`stadyum/README.md` → "Stadyum modeli (GLB)".

* `sections.js` LAYOUT sayıları birebir kullanıldı (kase `a=34, b=52.5, r=12`; çatı `dIn=10 … dOut=47`, çatı üstü
  y≈26.4 → 36.0; cephe `d=46`). Kabuk (`stands_lower/concourse/stands_upper`) mevcut basamaklı tribün yüzeyinin
  **0.30 m altında** durur, yani prosedürel bölümler/koltuklar üstte z-fighting yapmadan kalır.
* Siteden kaldırılan prosedürel parçalar: cephe (`parts.facade`), çatı grubu, çatı alt halkası/kablolar, koridor bandı
  (`koridor-*`), saha yüzeyi/çevre çimi. Kalanlar: bölümler (`sections`), koltuklar, reklam panosu, loca camı, gece
  ışıkları/spot ışıklar, kaleler (GLB'de yok), çevre (`world.js`).
* `roof_lights` koyu gövde kutularıdır; site emissive `floodlight-units` kutularını kullandığı için bu düğüm yüklemede atılır.
* İç mod: `facade`, `south_building`, `podium` gizlenir; `roof_top/roof_under`, `stands_*`, `concourse`, `pitch` kalır.
  Çatı alt yüzü doğrusal `roofY(d)` eğrisinden en fazla ~1.6 m aşağıdadır; kamera sıkıştırması `roofY−2.2` bu yüzden
  GLB köşelerine ≥ 1.05 m boşluk bırakır.
* Gece: `roof_top` malzemesinin `color` değeri `1−0.5·n` ile kısılır; saha/çim/cam hafif emissive olur.
* Tek yüzlü (backface-culling) malzemeler kullanılır; yüzler doğru sarımlıdır. İçeriden alçak açıyla bakınca karşı çatının
  üst yüzü görünür (çatı eğimi 14.5°, bakış açısı daha düşük) — bu doğrudur, hata değildir.
