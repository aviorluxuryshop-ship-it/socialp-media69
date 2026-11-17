# Socialp Media monorepo

## Otomatik çalışma düzeni: Opus planlar, Sonnet kodlar

Kod değişikliği gerektiren HER istekte (yeni özellik, hata düzeltme, refactor, test, kodda stil/tasarım değişikliği) önce `opus-plan` skill'ini çağır ve adımlarını izle.

- Ana ajan planlar, görev kartlarını dağıtır, inceler, doğrular ve commit eder.
- Uygulama kodunu yalnızca `sonnet-coder` alt ajanları yazar (`.claude/agents/sonnet-coder.md`, model: sonnet).
- Ana oturum başka bir modelde çalışsa da aynı akışı uygula.
- Gerekmez: soru/açıklama, yalnızca kod okuma, yalnızca git işlemleri, kod dışı işler (ör. bağlayıcılarla tasarım üretmek).
- İstisna: kullanıcı açıkça "kendin yaz" derse.

## Projeler

- `web/` — Socialp Media ajans sitesi (Next.js, static export `web/out`, kök `vercel.json` yayınlar). Kontrol: `cd web && npm run lint && npm run build`
- `alp-book/` — Alp Book alışkanlık takip PWA (Next.js + Firebase). Kontrol: `cd alp-book && npm run typecheck && npm test && npm run build`
- `bayburt-store/` — Bayburt mağaza (Next.js + Tailwind). Kontrol: `cd bayburt-store && npm run lint && npm run typecheck && npm run build`
- `SOCİALP GALERİ/` ve `SOCİALP LOGO/` — marka görselleri ve logolar (kaynak malzeme).

## Kurallar

- Kullanıcıyla Türkçe konuş.
- Commit mesajları kısa İngilizce olsun, repo stilinde ("Alp Book: ...").
- Model adları commit, PR veya koda yazılmaz.
- `.env*` dosyaları commit edilmez (`.env.example` hariç).
- `web/public/media` dosyaları `web/media-src` kaynaklarından üretilir (`npm run media`); `web/media-src` gitignored.
- PR yalnızca kullanıcı isterse açılır.
