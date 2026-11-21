# Socialp Media — "İşletmenize özel web sitesi" Reels

**Format:** Instagram Reels · 1080×1920 · 60 fps · 20 sn
**Hedef:** İşletme sahipleri (kafe, restoran, salon, klinik, mağaza, inşaat, kurumsal…) — web sitesi talebi toplamak
**Stil:** Koyu, premium, parlayan cam (glass) arayüzler, kırmızı ipek ışık şeritleri (marka kırmızısı #C2151F / #FF5A5F),
Archivo + Instrument Serif tipografi (sitedeki fontlarla aynı), gerçek Socialp logosu.
**Seslendirme:** ElevenLabs v4 — "Atakan" (derin, güven veren Türkçe erkek sesi)
**Müzik:** ElevenLabs Music — vokalsiz sinematik tech; 8. saniyedeki "drop" logo açılışına denk getirildi.
**Ses efektleri:** Kodla sentezlendi (sayaç tıkırtısı, saat tik-takı, darbe, whoosh, glitch, bildirim, klik).

## Seslendirme metni

> Yıl olmuş 2026… Hâlâ işletmenizin bir web sitesi yok mu?
> Müşterileriniz sizi arıyor… ama bulamıyor.
> Biz, tam da bunun için varız.
> İşletmenize özel; modern, mobil uyumlu ve hızlı web siteleri tasarlıyoruz.
> Dijital vitrininizi birlikte kuralım. Hemen bize yazın!

## Storyboard

| Süre | Sahne | Görsel | Ses |
|---|---|---|---|
| 0.0 – 2.6 | **Kanca** | Dev "1990 → 2026" kilometre sayacı gibi döner, 2026'da darbeyle oturur, kırmızı şok dalgası | "Yıl olmuş 2026…" · sayaç tıkırtısı + darbe |
| 2.6 – 5.6 | **Sorun** | 2026 yukarı kayar; "Hâlâ işletmenizin bir *web sitesi* yok mu?" kelime kelime; tarayıcıda `www.isletmeniz.com` yazılır → "Bu siteye ulaşılamıyor" glitch | saat tik-takı, klavye, glitch |
| 5.6 – 8.6 | **Kayıp müşteri** | Telefonda "yakınımdaki en iyi kafe" araması; rakipler web siteleriyle listelenir, "Sizin işletmeniz — Sonuç bulunamadı" kırmızı titrer | "Müşterileriniz sizi arıyor… ama bulamıyor." |
| 8.6 – 10.8 | **Çözüm / Marka** | Işık çizgisinden SOCIALP MEDIA logosu açılır, müzik drop | "Biz, tam da bunun için varız." |
| 10.8 – 15.4 | **İşletmenize özel** | Cam tarayıcıda site kendini kurar; Restoran → Güzellik Salonu → İnşaat Firması temaları değişir (her işletmeye özel); telefon girer (mobil uyum); hız çizgileri; ✓ Modern Tasarım · Mobil Uyumlu · Hızlı & Güvenli · SEO Altyapısı | "İşletmenize özel; modern, mobil uyumlu ve hızlı web siteleri tasarlıyoruz." |
| 15.4 – 17.6 | **Sonuç: talep** | Telefona bildirimler yağar: yeni mesaj, rezervasyon, sipariş, iletişim formu; ziyaretçi grafiği yükselir | "Dijital vitrininizi birlikte kuralım." · bildirim sesleri |
| 17.6 – 20.0 | **Harekete geçirici** | Logo, "Hemen bize *yazın!*", "Web sitenizi konuşalım →" butonuna imleç tıklar; WhatsApp +90 540 034 69 69 · @socialp.media · socialpmedia.com | "Hemen bize yazın!" |

Not: Reels arayüzü (açıklama, butonlar) ekranın alt ~350 px'ini ve sağ kenarını kapattığı için önemli öğeler o alanın dışında tutuldu.

## Dosyalar

- `src/index.html`, `src/anim.js` — animasyon (her kare zamanın saf fonksiyonu: `window.__render(t)`)
- `src/render.js` — Playwright ile kare kare render, ffmpeg'e aktarım (`stills` modu ile tek kare önizleme)
- `audio/mix.py` — ses efekti sentezi, seslendirme/müzik miksi, ducking
- `audio/vo_a.mp3`, `audio/music_v2b.mp3` — ElevenLabs çıktıları (kullanılan)
- `build.sh` — hepsini baştan üretir → `final/socialp-web-sitesi-reels.mp4`

Canlı önizleme: `src/index.html?play` (tıklayınca sesle oynar, önce `build.sh` çalışmış olmalı).
