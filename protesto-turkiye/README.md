# Protesto Türkiye — kısa videolar

"Protesto Türkiye" kanalı için 12 dikey protesto videosu (1080x1920, 30 fps,
her biri 1 dakikanın altında). Hepsi barışçıl protesto çağrısıdır ve
**"Sen de bize katıl. Bize destek ol."** kapanışıyla biter.

| # | Dosya | Konu |
| --- | --- | --- |
| 1 | `videolar/01-enflasyon.mp4` | Türkiye'deki enflasyon artışı |
| 2 | `videolar/02-adaletsiz-maas.mp4` | Maaş düzeninin adaletsizliği |
| 3 | `videolar/03-okullarda-guvenlik.mp4` | Okullarda önlem alınmaması |
| 4 | `videolar/04-okul-saatleri-08-18.mp4` | 08:00–18:00 okul saatleri |
| 5 | `videolar/05-ic-savasa-hayir.mp4` | İç savaş, kutuplaşma |
| 6 | `videolar/06-plansiz-goc.mp4` | Mülteci / göç politikası |
| 7 | `videolar/07-siyasi-baski.mp4` | Siyasi baskılar |
| 8 | `videolar/08-yasaklar.mp4` | Gelen yasaklar |
| 9 | `videolar/09-gecim-derdi.mp4` | Mali geçim |
| 10 | `videolar/10-polis-ve-protesto.mp4` | Polisin protestoculara tavrı |
| 11 | `videolar/11-verilen-cezalar.mp4` | Verilen cezalar |
| 12 | `videolar/12-adalet-nerede.mp4` | Adaletin olmadığı bir ülke |

Her videonun kapak karesi `kapaklar/` içinde, paylaşım açıklamaları ve
etiketler `aciklamalar.md` içinde.

## Görsel dil

Referans videodaki (siyah-beyaz, gren, parlayan beyaz yazı, kelime kelime
gelen altyazı, glitch geçişleri) dil korunup tek vurgu rengi olarak bayrak
kırmızısı eklendi. Fotoğraf, logo ya da başkasına ait görüntü kullanılmadı:
her şey yazı ve basit çizimlerden üretiliyor, böylece telif ve "sahte
görüntü" riski yok.

## Ses

- **Seslendirme:** referans videodaki ses bir TikTok hesabına ait olduğu için
  kopyalanmadı. Yerine ücretsiz ve çevrimdışı çalışan
  [Piper TTS](https://github.com/rhasspy/piper)'in Türkçe erkek sesi
  (`tr_TR-dfki-medium`) kullanıldı; perdesi düşürülüp kalınlaştırıldı ve
  salon yankısı eklendi, böylece referanstaki gibi derin, dramatik bir
  anlatıcıya benziyor.
  Bu sesin eğitim verisi **CC BY-NC-SA 4.0** lisanslı: kanal para kazanmıyorsa
  sorun yok; para kazanmaya başlarsa sesi değiştirin (kendi sesiniz ya da
  ücretli bir ses).
- **Müzik:** hiçbir kayıt kullanılmadı; karanlık drone, bas vuruşları,
  geçiş efektleri ve kapanıştaki yükselme `audio.py` içinde sentezleniyor.
  Telif uyarısı almaz.

## Yeniden üretmek / metin değiştirmek

Metinler ve ekrandaki rakamlar `content.py` içinde. Bir satırı değiştirip
yeniden üretmek yeterli:

```bash
pip install piper-tts opencv-python-headless scipy numpy pillow
python3 build.py              # 12 videonun hepsi (Piper sesi ilk seferde indirilir)
python3 build.py 03 08        # yalnızca 03 ve 08
```

ffmpeg (rubberband filtresiyle) ve Inter yazı tipi sistemde kurulu olmalı;
Anton yazı tipi `fonts/` içinde (SIL Open Font License).

## Kaynaklar

Videolardaki her rakam aşağıdaki kaynaklardan alındı (Ekim 2026 itibarıyla).
Emin olunamayan iddialar videolara konmadı.

- **Enflasyon (TÜİK %29,73, ENAG %46,61, Eylül 2026):**
  [Euronews](https://tr.euronews.com/2026/10/05/eylulde-yillik-enflasyon-tuike-gore-yuzde-2973-enaga-gore-yuzde-4661)
- **Açlık sınırı 37.801 TL, yoksulluk sınırı 123.130 TL, bekâr yaşam maliyeti
  48.884 TL (Türk-İş, Eylül 2026):**
  [Kısa Dalga](https://kisadalga.net/haber/ekonomi/turk-is-eylul-2026-aclik-siniri-37-bin-801-yoksulluk-siniri-123-bin-130-tl-140652),
  [Yeni Ankara](https://www.yeniankara.com.tr/guncel/turk-is-eylul-2026-aclik-ve-yoksulluk-siniri-ne-kadar-oldu-184528)
- **Milletvekili maaşı ≈ asgari ücretin 10 katı:**
  [BirGün](https://www.birgun.net/haber/milletvekili-maasi-ne-kadar-milletvekili-maasi-2026-guncel-555359)
- **2026 okul saldırıları:**
  [EHA Medya kronolojisi](https://ehamedya.com.tr/haber/2026da-turkiyede-okul-saldirilari-kronolojik-surecte-neler-oldu),
  [Euronews – Başakşehir](https://tr.euronews.com/2026/10/07/basaksehirde-okul-saldirisi-15-yasindaki-fm-ile-anne-ve-babasi-tutuklandi),
  [A Haber – 30 bin güvenlik görevlisi önerisi](https://www.ahaber.com.tr/gundem/2026/10/10/okullara-guvenlik-kalkani)
- **Haftalık en çok 45 saat çalışma:** 4857 sayılı İş Kanunu md. 63
  ([mevzuat.gov.tr](https://www.mevzuat.gov.tr/mevzuatmetin/1.5.4857.pdf))
- **Geçici koruma altındaki Suriyeliler (2,2 milyon+):**
  [Göç İdaresi](https://www.goc.gov.tr/basin-aciklamasi2706),
  [Antakya Gazetesi](https://antakyagazetesi.com/hatayda-136-bin-suriyeli-gecici-koruma-kapsaminda/)
- **İBB davası (407 sanık), CHP "mutlak butlan" kararı, Halk TV'ye kayyum:**
  [24 Saat](https://www.24saatgazetesi.com/ibb-davasinin-takvimi-belli-oldu-imamoglunun-savunmasi-ne-zaman),
  [Euronews](https://tr.euronews.com/2026/05/21/chp-icin-mutlak-butlan-karari-cikti-simdi-ne-olacak),
  [Gazete Oksijen](https://gazeteoksijen.com/turkiye/halk-tvye-kayyim-atandi-yayin-durduruldu-polis-binaya-girislere-izin-vermiyor-292614)
- **Yasaklar:** Instagram'a 9 gün erişim engeli
  ([Gigazine](https://gigazine.net/gsc_news/en/20240814-turkey-restores-access-instagram)),
  Roblox ([Ensonhaber](https://www.ensonhaber.com/robloxa-erisim-engeli-getirildi-h1352776)),
  Discord ([BirGün](https://www.birgun.net/haber/bakan-tekin-erisim-engeli-kararlarini-savundu-dijital-fasizme-hep-birlikte-dur-demeliyiz-550892)),
  Mart 2025 İstanbul eylem yasağı ve bant daraltma
  ([sol](https://haber.sol.org.tr/haber/imamogluna-operasyon-istanbula-4-gun-eylem-yasagi-metrolar-iptal-sosyal-medya-yavaslatildi)),
  15 yaş altı sosyal medya yasağı
  ([Webtekno](https://www.webtekno.com/turkiye-15-yas-alti-sosyal-medya-yasagi-h226798.html))
- **Kira artış sınırı (%31+):**
  [Capital](https://www.capital.com.tr/haberler/tum-haberler/ekim-2026-kira-artis-orani-aciklandi-iste-konut-ve-is-yerleri-icin-yeni-kira-artis-hesaplamasi)
- **Anayasa md. 34:** [anayasa.gov.tr](https://www.anayasa.gov.tr/tr/mevzuat/anayasa/)
- **Mart 2025 protestoları:** 1.879 gözaltı, 260 tutuklama
  ([bianet](https://bianet.org/haber/yerlikaya-dan-protesto-aciklamasi-bin-879-gozalti-260-tutuklama-305893)),
  biber gazı ve plastik mermi
  ([Medyascope](https://medyascope.tv/2025/03/23/protestocular-ile-polis-arasinda-catisma-cikti-sarachaneden-video/)),
  kötü muamele iddiaları
  ([Uluslararası Af Örgütü](https://www.amnesty.org.tr/public/uploads/files/Rapor/T%C3%BCrkiye%20-%20allegations%20of%20torture%20and%20other%20ill-treatment%20must%20be%20investigated%20-%20May%202025-TR.pdf)),
  87 kişiye beraat
  ([bianet](https://bianet.org/haber/mahkeme-19-mart-sarachane-protestolarina-katilmak-anayasal-hak-315184))
- **Alican Uludağ'ın tutuklanması ve tahliyesi:**
  [RSF](https://rsf.org/en/t%C3%BCrkiye-deutsche-welle-journalist-alican-uludag-detained-following-scandalous-court-ruling),
  [NTV](https://www.ntv.com.tr/turkiye/gazeteci-alican-uludaga-tahliye-1725350)
- **WJP Hukukun Üstünlüğü Endeksi 2025 (118/143, 136., 134.):**
  [Turkish Minute](https://turkishminute.com/2025/10/29/turkey-remains-near-bottom-in-global-rule-of-law-ranking/),
  [World Justice Project](https://worldjusticeproject.org/rule-of-law-index/)

**Not:** "08:00–18:00" için resmi bir MEB kararı bulunamadı; video bu yüzden
bir yönetmelikten değil, okul + etüt + kursla 10 saate uzayan günden söz eder.
