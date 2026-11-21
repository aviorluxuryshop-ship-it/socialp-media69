# Berber Web Sitesi + CRM — Tanıtım Videosu

Dikey (1080×1920, 30 fps, 43 sn) Reels / TikTok / Shorts videosu.

**Hazır dosyalar**

- `out/berber-crm-tanitim.mp4`: video, müzik ve efektlerle birlikte
- `out/kapak.jpg`: kapak görseli

## Akış

| Süre | Sahne |
| --- | --- |
| 0–4 sn | Kanca: "Hâlâ telefonla mı randevu alıyorsun?" Cevapsız aramalar ve mesajlar |
| 4–7 sn | Dert: kaçan aramalar, karışan defter, gelmeyen müşteri |
| 7–10 sn | Çözüm: Web Sitesi + CRM. Tek sistem, sıfır karmaşa |
| 10–19 sn | Web sitesinde randevu: hizmet → tarih/saat → bilgiler → onay |
| 19–25 sn | Randevu anında CRM takvimine düşer, bildirim gelir |
| 25–33 sn | Panel özellikleri: takvim, müşteri kartı, hatırlatma, gelir raporu |
| 33–37 sn | 7/24 online randevu · 0 çakışma · 1 panel |
| 37–43 sn | Socialp Media, WhatsApp demo çağrısı, iletişim |

"Makas & Co." ve videodaki müşteri isimleri örnek olarak uyduruldu. İletişim bilgileri `web/src/content/site.ts` dosyasından alındı.

## Yeniden üretmek

Gerekenler: Node + Playwright (Chromium), Python 3 + numpy, ffmpeg.

```bash
cd promo/berber-crm
python3 audio.py out/soundtrack.wav   # müzik + ses efektleri (tamamen sentez, telifsiz)
node render.mjs                       # out/berber-crm-tanitim.mp4 + out/kapak.jpg
```

- Önizleme: `index.html` dosyasını tarayıcıda aç. Animasyon döngüde oynar, tıklayınca sesle birlikte baştan başlar. Belirli bir anı görmek için adrese `?t=21.5` ekle.
- Tek sahneyi hızlıca render etmek için: `node render.mjs --from 10 --to 19 --out out/test.mp4`
- Birkaç anın görüntüsünü almak için: `node stills.mjs <klasör> 3 11.5 21.4`
- Metin, fiyat ya da isim değiştirmek için `index.html` dosyasını düzenle. Zamanlamalar dosyanın sonundaki `<script>` içinde, saniye cinsinden. Bir zamanı değiştirirsen `audio.py` içindeki aynı ipucunu da güncelle.
