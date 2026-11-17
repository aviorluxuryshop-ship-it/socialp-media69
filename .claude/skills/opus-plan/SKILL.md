---
name: opus-plan
description: "Opus planlar, Sonnet alt ajanları kodlar. Bu repoda kod değişikliği gerektiren HER istekte kullan: isteği plana ve görev kartlarına çevirir, kartları sonnet-coder alt ajanlarına dağıtır, sonucu inceler, doğrular ve teslim eder."
argument-hint: "[istek]"
---

# Opus planlar, Sonnet kodlar

Bu, ANA ajanın (Opus) izleyeceği oyun planıdır. İstek: $ARGUMENTS

## Rol ayrımı

| Rol | Sorumluluk |
| --- | --- |
| Ana ajan (Opus) | İsteği anlamak, keşif, plan, görev kartları, dağıtım, inceleme, doğrulama, git, kullanıcıyla iletişim |
| `sonnet-coder` (Sonnet) | Bütün uygulama kodu: yeni dosya, düzenleme, test yazma, refactor, stil |

Kural: Ana ajan uygulama kodunu kendisi yazmaz, küçük düzeltmeleri bile. Düzeltmeler de bir coder'a geri gider. Ana ajan yalnızca plan metni ve commit mesajı yazar, git işlemlerini yapar. İstisna: kullanıcı açıkça "kendin yaz" derse.

## Adım 1 — Anla ve keşfet

Yalnızca gereken kadar oku (Read/Grep/Glob; geniş aramalar için Explore ajanı). Yalnızca kullanıcının verebileceği bir karar ilerlemeyi engelliyorsa bir kez sor; aksi halde makul bir varsayılan seç ve planda belirt.

## Adım 2 — Plan

Kullanıcıya kısa bir Türkçe plan göster: hedef, görev kartları listesi, sıra/paralellik, riskler. Ardından onay beklemeden devam et; bu bir otomasyondur. Onayı yalnızca değişiklik riskli/geri döndürülemezse (veri silme, büyük yeniden yazım, deploy ayarları) ya da kullanıcı planı önce görmek istediyse bekle.

Görev kartı şablonu:

```
### Görev N — <kısa başlık>
Proje: web | alp-book | bayburt-store | diğer
Hedef: ...
Kapsam (dokunulacak dosyalar): ...
Dokunma: (paralel çalışan diğer kartların dosyaları)
Kabul kriterleri:
- ...
Kontrol komutu: `cd <proje> && ...`
Bağlam: ilgili mevcut kod, desenler, alınan kararlar
```

Kart yazma kuralları:
- Kart kendi başına yeterli olmalı: alt ajan konuşmayı göremez, gereken her ayrıntıyı, yolu ve kararı karta yaz.
- Somut dosya yolları ver.
- Bir kart = tek tutarlı iş birimi. Genelde 1–5 kart yeterlidir.
- Aynı dosyayı asla iki paralel karta bölme.

## Adım 3 — Dağıt

Agent aracını `subagent_type: "sonnet-coder"` ile çağır ve kartı prompt olarak ver.
- Bağımsız kartlar (ortak dosya yok) aynı mesajda birlikte başlatılır; paralel çalışırlar.
- Bağımlı kartlar sırayla çalışır; önceki kartın sonuç özetini sonraki kartın Bağlam alanına koy.
- Worktree izolasyonu kullanma; paralel kartlar yalnızca dosya paylaşmamalıdır.
- Yedek: oturumda `sonnet-coder` yoksa `subagent_type: "general-purpose"` ve `model: "sonnet"` kullan; önce `.claude/agents/sonnet-coder.md` dosyasını okuyup uymasını söyle.

## Adım 4 — İncele

`git status` ve `git diff` çalıştır. Her kabul kriterini tek tek kontrol et. Kapsam dışı değişiklik, hata, güvenlik sorunu, sızan sır, kalan debug kodu ve gerekiyorsa TR/EN içerik eşitliğinin bozulup bozulmadığına bak.

## Adım 5 — Doğrula

Etkilenen her proje için kontrol komutlarını kendin çalıştır (aşağıdaki tablo). Görünür UI değişikliklerinde istersen Playwright ile ekran görüntüsü al (bulut oturumlarında Chromium ve Playwright hazır gelir).

## Adım 6 — Düzeltme döngüsü

Kesin bir düzeltme listesini aynı ajana SendMessage ile gönder (bağlamı korunur) ya da yeni bir kart yaz. Kart başına en fazla 2 düzeltme turu; sonra dur ve kalanları raporla.

## Adım 7 — Teslim

- Repo stilinde kısa İngilizce bir mesajla commit et (ör. "Alp Book: ..."). Commit/PR/kod içine model adı yazma.
- Oturumun çalışma dalına push et. Kullanıcı istemedikçe PR açma.
- Kullanıcıya Türkçe raporla: ne değişti, hangi kart ne yaptı, kontrol sonuçları, açık konular. Alt ajan raporlarını kullanıcı görmez; önemli olanı sen aktar.

## Proje tablosu

| Proje | Ne | Kontrol komutu |
| --- | --- | --- |
| `web/` | Socialp Media ajans sitesi, Next.js static export (`web/out`), kök `vercel.json` yayınlar | `cd web && npm run lint && npm run build` |
| `alp-book/` | Alp Book alışkanlık takip PWA, Next.js + Firebase | `cd alp-book && npm run typecheck && npm test && npm run build` |
| `bayburt-store/` | Bayburt mağaza, Next.js + Tailwind | `cd bayburt-store && npm run lint && npm run typecheck && npm run build` |

Notlar:
- `node_modules` yoksa önce ilgili projede `npm install` çalıştır.
- Build yalnızca eksik env değişkenleri yüzünden kalıyorsa typecheck/test sonuçları yeterlidir; raporda bunu belirt.
