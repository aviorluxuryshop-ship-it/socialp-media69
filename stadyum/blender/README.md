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
* `make_textures.py` – çatı üstü dokusu (yastık paneller + yazılar + kartal), saha, koltuk, cam.
* `validate_glb.py` – GLB denetimi.

## Koordinatlar / ölçek

Birim = metre. Eksenler siteyle aynı (three.js, Y yukarı): orijin saha merkezi, saha uzun ekseni **Z** (105 m),
genişlik **X** (68 m), Kuzey = −Z, Güney = +Z, Doğu = +X, Batı = −X, zemin y = 0, saha yüzeyi y = 0.45.
Betik Blender'da Z-yukarı çalışır ve `export_yup=True` ile dışa aktarır; GLB'nin sınır kutusu
x ±86, y 0…36.4, z −104.5…+119.6'dır. Tüm nesnelerin dönüşümü sıfırlanmış/uygulanmıştır (konum 0, ölçek 1).

## Düğümler (siteden aç/kapa için)

`pitch`, `stands_lower`, `concourse`, `stands_upper`, `podium`, `roof_top`, `roof_under`, `roof_lights`,
`facade`, `south_building`. Hepsi sahne kökünde, tek tek `visible` ile gizlenebilir.

## Siteye entegrasyon notları

* `sections.js` LAYOUT sayıları birebir kullanıldı (kase `a=34, b=52.5, r=12`; çatı `dIn=10 … dOut=47`, çatı üstü
  y≈26.4 → 36.0; cephe `d=46`). Kabuk (`stands_lower/concourse/stands_upper`) mevcut basamaklı tribün yüzeyinin
  **0.30 m altında** durur, yani prosedürel bölümler/koltuklar üstte z-fighting yapmadan kalabilir.
* Değiştirir: prosedürel cephe (`parts.facade`), çatı grubu (`roof`), çatı alt halkası/kablolar. Kalması gerekenler:
  bölümler (`sections`), koltuklar, reklam panosu, loca camı, gece ışıkları/spot ışıklar, çevre (`world.js`).
* `roof_lights` koyu gövde kutularıdır; sitenin emissive `floodlight-units` kutuları kalacaksa bu düğümü gizleyin.
* İç mod (`setInteriorVisibility`): `facade`, `south_building` ve `podium` gizlenir; `roof_top/roof_under` kalır.
  Çatı alt yüzü doğrusal `roofY(d)` eğrisinden en fazla ~1 m aşağıdadır (kamera sıkıştırması `roofY−2.2` geçerli kalır).
* Gece: `roof_top` malzemesinin `color` değeri (çarpan) kısılabilir (`topMat.color.setScalar(1-0.5*n)` gibi).
* Tek yüzlü (backface-culling) malzemeler kullanılır; yüzler doğru sarımlıdır.
