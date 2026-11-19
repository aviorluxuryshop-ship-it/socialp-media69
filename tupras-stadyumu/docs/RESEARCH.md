# Tüpraş Stadyumu — mimari araştırma notları

Bu belge 3D modelin hangi verilere dayandığını, hangi kaynaktan geldiğini ve
kaynaklar çeliştiğinde hangi değerin seçildiğini kaydeder. Modeldeki her ölçü
buraya geri izlenebilir olmalı.

## Konum ve yönlenme (OpenStreetMap, ölçülmüş)

| Veri | Değer | Kaynak |
| --- | --- | --- |
| Saha merkezi | 41.03944° K, 28.99441° D (yaklaşık) | OSM saha poligonu (way 440559216) |
| Saha uzun ekseni | 142° / 322° (KB–GD) | OSM saha poligonu, kenar yönleri |
| Saha (çizgiler dahil işaretli alan) | 110.6 × 69.4 m (OSM) / oyun alanı 105 × 68 m | OSM, tr/en Wikipedia |
| Tribün dış halkası | 212.8 × 161.2 m, köşeleri yuvarlatılmış | OSM grandstand ilişkisi 6554433 (outer) |
| Tribün iç halkası | 129.2 × 77.6 m | OSM grandstand ilişkisi 6554433 (inner) |
| Çatı ayak izi | ~215 × 160 m, oval | Bureau Greisch proje sayfası |
| Eski Açık (tarihî) | GD uçta, saha merkezinden 120–150 m, kavisli yapı | OSM way 489743779 |
| Yapı yüksekliği | 34 m (OSM), 41.5 m (NSS), "32 m altında" (en wiki özet) | çelişkili — model: dış basınç halkası 33–35 m |

Model ekseni: +X sahanın GD kalesine (Eski Açık / Dolmabahçe ucu), +Z GB uzun
tarafa (ana tribün), +Y yukarı. Kuzey vektörü bu eksene göre döndürülerek güneş
konumu hesaplanır.

## Yapı ve çatı

- Mimar: DB Architects — Bünyamin Derman; yerel mimar Metin Demir. 2013–2016.
- Çatı: hafif çelik, "cable spoke" sistemi: çevrede **basınç halkası**, merkezde
  **iki çekme halkası**; basınç halkası beton tribün yapısı üzerinde **82 çelik
  kolona** oturur; üzerinde metal kiriş ağı, örtü **PTFE tekstil membran**.
  (Greisch). Çatı alanı 33.000 m² (Bollinger+Grohmann). Şehir izni "çok düşük
  çatı eğimi ve yüksekliği" şartı koymuştur. 1000 t'luk çatı hidrolik olarak
  kaldırılmıştır.
- İki kat tribün. Eğimler: alt kat 23.4°, üst kat 38.7° (NSS) / 26° ve 38°
  (tr wiki). Model: alt kat 22°→28°, üst kat 33°→38° (artan C-değeri).
- Kale çizgisi–tribün mesafesi 7.95 m, taç çizgisi–tribün 6.15 m (tr wiki).
- "Dalga formu": tribün yüksekliği köşelerde en düşük; doğu tribünü Boğaz
  silüetini kapatmamak için bilerek alçak tutulmuş (en/tr wiki).
- 147 loca, 1.847 loca koltuğu, 186 basın koltuğu, 81+81 engelli koltuğu.
- Kapasite 42.684 (resmî; diğer kaynaklar 41.903–43.500 arası).
- Kolezyum/amfi tiyatro esinli cephe, uzun dikey beton/taş pilonlar, küfeki taşı.
- Eski Açık tribünü, iki kulesi ve kuleler arasındaki demir kapı tarihî eser
  olarak korunmuştur.
- Aydınlatma: plazma aydınlatma sistemi, 3500 lux (tr wiki); fotoğraflarda çatının
  iç kenarı boyunca kesintisiz projektör dizisi görülür.
- Skorbord: 12 × 8.3 m.

## Fotoğraflardan görsel doğrulama (Wikimedia Commons)

- *Vodafone Park Panorama.jpg*: alt kat ağırlıklı beyaz + dağınık siyah koltuk;
  üst kat ağırlıklı siyah + dağınık beyaz; katlar arasında kesintisiz cam loca
  bandı ve üzerinde LED şerit; alt ve üst katta kusma (vomitorium) açıklıkları;
  dalgalı beyaz membran, beyaz radyal çelik kirişler; iç kenarda derin kafes
  halka üzerinde projektör sırası; üst kat ile çatı arasında dışarıyı gösteren
  açık bant; iki köşede asılı dev ekran.
- *Vodafone Park, Istanbul (from outside).jpg*: krem renkli taş dikey pilonlar,
  üstte koyu gri ince basınç halkası, pilonlarla halka arasında ince çelik kolonlar
  ve görünür radyal çatı elemanları; giriş önünde dikdörtgen taş kule; arkada
  Süzer Plaza.

## Çevre (OpenStreetMap)

- Dolmabahçe Sarayı (doğu, kıyıda), Muayede Salonu, Saat Kulesi (27 m, 4 kat),
  Bezmialem Valide Sultan (Dolmabahçe) Camii, 10 Aralık Şehitleri Parkı (GB),
  Süzer Plaza / Ritz-Carlton (KB, 34 kat), Swissôtel The Bosphorus, Maçka parkları,
  Dolmabahçe Caddesi, Dolmabahçe Gazhane Caddesi, Kadırgalar Caddesi, İnönü
  Caddesi, Meclis-i Mebusan Caddesi.
- 15 Temmuz Şehitler Köprüsü: OSM güverte (way 227607788), kule 165 m, güverte 64 m.
- Arazi: SRTM 1" (30 m) — stadyum vadisi ~10–20 m, batıda Gümüşsuyu/Taksim
  sırtı 60–90 m, kıyı 0 m.

## Tribün ve blok adlandırması

Kaynaklar resmî blok planını vermiyor (bjk.com.tr erişime kapalı). Kamuya açık
ipuçları:

- Alt kat: 24 standart blok + 1 VIP blok; üst kat: 30 blok + basın tribünü
  (istanbul.com).
- En iyi görüş: alt 115–116, üst 415–416 (footballgroundguide) → uzun ana
  tribün merkezinde.
- Misafir taraftar: 404–406 (FGG); "güneydoğu köşesi" (worldstadia).
- Batı = ana tribün (VIP, basın); Doğu = Çarşı (FGG). Kuzey/Güney kale arkası.

Model şeması (tek dosyada değiştirilebilir: `src/stadium/config.ts`):

- Alt kat: Doğu merkezinden başlayıp Güney → Batı yönünde 101–112, Batı
  merkezinde VIP, devamında Kuzey → Doğu 113–124.
- Üst kat: 401–415, Batı merkezinde BASIN, 416–430.
- Bu şemada 404–406 güneydoğu köşesine, 415/416 basın tribününün iki yanına
  denk gelir — iki kaynakla tutarlıdır.

**Kulüpten resmî oturma planı alındığında yalnızca config dosyası güncellenmelidir.**

## Kurumsal kimlik

- Arma: Wikimedia Commons "BesiktasJK-Logo.svg" (üç yıldızlı güncel arma,
  "Besiktas JK Official Logo" başlıklı, PD-Turkey etiketli).
- Kurumsal yazı karakteri: kamuya açık bir dosya bulunamadı (2026-27 forma
  fontu duyuruldu, dosyası yayımlanmadı). Sahte font üretilmedi; arayüz
  Barlow Condensed + Inter ile hazırlandı, `--font-display` / `--font-text`
  CSS değişkenleriyle kulübün resmî fontu tek noktadan takılabilir.

## Kaynaklar

- https://en.wikipedia.org/wiki/Vodafone_Park
- https://tr.wikipedia.org/wiki/Tüpraş_Stadyumu
- https://www.greisch.com/?p=2067515
- https://www.bollinger-grohmann.com/en.projects.bjk-vodafone-arena.html
- https://www.nss-sports.com/en/long-form/45432/besiktas-park-2026-europa-league-final-stadium
- https://istanbul.com/tr/blog/sports-venues/besiktas-vodafone-park
- https://footballgroundguide.com/leagues/besiktas.html
- https://worldstadia.com/vodafone-park.html
- https://commons.wikimedia.org/wiki/Category:Vodafone_Park
- https://commons.wikimedia.org/wiki/File:BesiktasJK-Logo.svg
- OpenStreetMap (© OpenStreetMap katkıcıları, ODbL), api.openstreetmap.org
- SRTM GL1 (NASA/USGS) via api.opentopodata.org
